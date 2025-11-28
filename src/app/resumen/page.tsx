"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";

/** --- Tipos --- */
type Categoria = "Grooming" | "Alimentos" | "Premios" | "Recetados";

type Producto = {
  id: string;
  nombre: string;
  sub: string;
  precio: number;
  img?: string;
  categoria: Categoria;
};

type ProductoDB = {
  id: string;
  nombre: string;
  sub: string;
  categoria: Categoria;
  precio: number;
  activo: boolean;
  imageUrl?: string;
};

export default function ResumenPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [totalBump, setTotalBump] = useState(false);
  const prevTotalRef = useRef(0);

  /** ----------------------------------------
   *  CARGAR CATALOGO DESDE NEON
   * ---------------------------------------- */
  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) return;

        const data: ProductoDB[] = await res.json();
        const activos = data.filter((p) => p.activo);

        const mapped = activos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          sub: p.sub,
          precio: p.precio,
          categoria: p.categoria,
          img: p.imageUrl ?? undefined,
        }));

        setCatalogo(mapped);
      } catch (err) {
        console.error("Error cargando catálogo:", err);
      }
    };

    fetchCatalogo();
  }, []);

  /** ----------------------------------------
   *  CARGAR CARRITO
   * ---------------------------------------- */
  useEffect(() => {
    const raw = sessionStorage.getItem("kiosk-cart");
    if (!raw) return;
    try {
      setCart(JSON.parse(raw));
    } catch {
      setCart({});
    }
  }, []);

  /** ----------------------------------------
   *  ITEMS = carrito + catálogo neon
   * ---------------------------------------- */
  const items = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const prod = catalogo.find((p) => p.id === id);
          return prod ? { prod, qty } : null;
        })
        .filter(Boolean) as { prod: Producto; qty: number }[],
    [cart, catalogo]
  );

  const isEmpty = items.length === 0;

  /** TOTAL */
  const total = useMemo(
    () => items.reduce((sum, { prod, qty }) => sum + prod.precio * qty, 0),
    [items]
  );

  /** SUGERENCIAS: 3 productos que NO estén en el carrito */
  const suggested = useMemo(
    () => catalogo.filter((p) => !cart[p.id]).slice(0, 3),
    [catalogo, cart]
  );

  /** ANIMACIÓN DEL TOTAL */
  useEffect(() => {
    if (total !== prevTotalRef.current) {
      setTotalBump(true);
      setTimeout(() => setTotalBump(false), 180);
      prevTotalRef.current = total;
    }
  }, [total]);

  /** CONFIRMAR ORDEN */
  const handleConfirm = async () => {
    if (isEmpty) return;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, total }),
      });

      if (!res.ok) return;

      const order = await res.json();
      sessionStorage.setItem("kiosk-last-order", JSON.stringify(order));
      sessionStorage.removeItem("kiosk-cart");
      router.push("/ticket");
    } catch (err) {
      console.error(err);
    }
  };

  const addSuggested = (id: string) => {
    const next = { ...cart, [id]: (cart[id] ?? 0) + 1 };
    setCart(next);
    sessionStorage.setItem("kiosk-cart", JSON.stringify(next));
  };

  /** ----------------------------------------
   *  RENDER — TU DISEÑO ORIGINAL
   * ---------------------------------------- */
  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      {/* BANNER */}
      <div className="relative h-40 w-full overflow-hidden">
        <img src="/banner.png" alt="Banner" className="h-full w-full object-cover" />
      </div>

      {/* CONTENIDO */}
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-4 min-h-0">
        <div className="flex flex-col flex-1 pt-10 min-h-0">
          <h1 className="mb-6 text-3xl font-extrabold tracking-wide text-[#f2c200]">
            Mi orden
          </h1>

          {/* LISTA */}
          {isEmpty ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-lg text-black">No hay productos en la orden.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
              <ul className="flex flex-col gap-4">
                {items.map(({ prod, qty }, index) => (
                  <li
                    key={prod.id}
                    className="flex items-center gap-6 rounded-2xl bg-white py-4 px-4 shadow-sm border"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black text-lg font-bold text-black">
                      {index + 1}
                    </div>

                    <div className="h-20 w-20 flex items-center justify-center overflow-hidden rounded-xl border bg-white">
                      <img src={prod.img} className="h-full w-full object-contain p-1" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[15px] font-semibold text-black">
                        {prod.nombre}
                      </div>
                      <div className="truncate text-sm text-black">{prod.sub}</div>

                      <div className="mt-2 flex items-center gap-3">
                        {/* - */}
                        <button
                          onClick={() => {
                            const copy = { ...cart };
                            if (qty <= 1) delete copy[prod.id];
                            else copy[prod.id] = qty - 1;
                            setCart(copy);
                            sessionStorage.setItem("kiosk-cart", JSON.stringify(copy));
                          }}
                          className="rounded-xl bg-[#b71c1c] text-white w-8 h-8 flex items-center justify-center"
                        >
                          –
                        </button>

                        <div className="min-w-[24px] text-center font-bold text-lg text-black">{qty}</div>

                        {/* + */}
                        <button
                          onClick={() => {
                            const copy = { ...cart, [prod.id]: qty + 1 };
                            setCart(copy);
                            sessionStorage.setItem("kiosk-cart", JSON.stringify(copy));
                          }}
                          className="rounded-xl bg-[#f2c200] text-black font-semibold w-8 h-8 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right mr-2">
                      <div className="text-sm text-black">Subtotal</div>
                      <div className="text-lg font-bold text-black">
                        S/ {(prod.precio * qty).toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const copy = { ...cart };
                        delete copy[prod.id];
                        setCart(copy);
                        sessionStorage.setItem("kiosk-cart", JSON.stringify(copy));
                      }}
                      className="text-[#b71c1c] text-2xl font-extrabold px-3"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* SUGERENCIAS */}
      {!isEmpty && suggested.length > 0 && (
        <div className="mx-auto w-full max-w-5xl px-6 pb-4">
          <div className="rounded-2xl border bg-[#fafafa] px-4 py-3">
            <h2 className="mb-3 text-lg font-semibold text-black">
              ¿Quiere añadir algo más?
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {suggested.map((prod) => (
                <div key={prod.id} className="flex flex-col items-center bg-white rounded-xl p-3 shadow-sm">
                  <div className="h-20 w-20 flex items-center justify-center mb-2">
                    <img src={prod.img} alt={prod.nombre} className="h-full w-full object-contain" />
                  </div>

                  <div className="text-center text-sm font-medium text-black w-full">{prod.nombre}</div>
                  <div className="mt-1 text-center text-xs text-black w-full">{prod.sub}</div>
                  <div className="mt-1 text-sm font-semibold text-black">S/ {prod.precio.toFixed(2)}</div>

                  <button
                    onClick={() => addSuggested(prod.id)}
                    className="mt-2 rounded-2xl bg-[#f2c200] px-4 py-2 text-xs font-semibold text-black"
                  >
                    Añadir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOTAL */}
      <div className="mt-auto w-full bg-white">
        <div className="border-t">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
            <span className="text-lg font-semibold text-black">Total</span>

            <span
              className={[
                "text-2xl font-bold text-black inline-block transition-transform duration-200",
                totalBump ? "scale-110" : "scale-100",
              ].join(" ")}
            >
              S/ {total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="border-t">
          <div className="mx-auto flex w-full max-w-5xl gap-4 px-6 py-4">
            <button
              onClick={() => router.push("/menu")}
              className="w-full rounded-2xl bg-[#b71c1c] px-8 py-4 text-[18px] font-semibold text-white"
            >
              Regresar
            </button>

            <button
              onClick={handleConfirm}
              disabled={isEmpty}
              className={[
                "w-full rounded-2xl px-8 py-4 text-[18px] font-semibold",
                isEmpty
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#f2c200] text-white",
              ].join(" ")}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
