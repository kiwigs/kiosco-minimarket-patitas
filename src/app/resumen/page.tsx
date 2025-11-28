"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";

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

  /* -------------------------------
      Cargar catálogo desde Neon
     ------------------------------- */
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
        console.error("Error trayendo catálogo:", err);
      }
    };

    fetchCatalogo();
  }, []);

  /* -------------------------------
      Cargar carrito desde sessionStorage
     ------------------------------- */
  useEffect(() => {
    const raw = sessionStorage.getItem("kiosk-cart");
    if (!raw) return;

    try {
      setCart(JSON.parse(raw));
    } catch {
      setCart({});
    }
  }, []);

  /* -------------------------------
      Combinar carrito + catálogo
     ------------------------------- */
  const items = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const p = catalogo.find((x) => x.id === id);
        return p ? { prod: p, qty } : null;
      })
      .filter(Boolean) as { prod: Producto; qty: number }[];
  }, [cart, catalogo]);

  const isEmpty = items.length === 0;

  const total = useMemo(
    () => items.reduce((sum, { prod, qty }) => sum + prod.precio * qty, 0),
    [items]
  );

  /* -------------------------------
      Animación del total
     ------------------------------- */
  useEffect(() => {
    if (total !== prevTotalRef.current) {
      setTotalBump(true);
      setTimeout(() => setTotalBump(false), 180);
      prevTotalRef.current = total;
    }
  }, [total]);

  /* -------------------------------
      Confirmar pedido
     ------------------------------- */
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

  /* -------------------------------
      Sugerencias (3 productos que NO estén en el carrito)
     ------------------------------- */
  const suggested = useMemo(
    () => catalogo.filter((p) => !cart[p.id]).slice(0, 3),
    [catalogo, cart]
  );

  const addSuggested = (id: string) => {
    const next = { ...cart, [id]: (cart[id] ?? 0) + 1 };
    setCart(next);
    sessionStorage.setItem("kiosk-cart", JSON.stringify(next));
  };

  const handleBack = () => router.push("/menu");

  /* -------------------------------
      Render
     ------------------------------- */
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* HEADER */}
      <header className="w-full bg-[#f2c200] text-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-extrabold tracking-wide">
              Resumen de tu pedido
            </h1>
            <p className="text-xs text-black/90">
              Revisa los productos antes de confirmar
            </p>
          </div>

          <button
            onClick={handleBack}
            className="rounded-xl bg-black/20 px-3 py-1 text-xs font-semibold shadow hover:bg-black/30"
          >
            Volver
          </button>
        </div>
      </header>

      {/* LISTA */}
      <main className="mx-auto max-w-3xl px-4 py-4 pb-24">
        <section className="rounded-2xl bg-white shadow">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Productos en tu pedido
            </h2>
          </div>

          {isEmpty ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              Tu carrito está vacío.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map(({ prod, qty }) => (
                <li key={prod.id} className="flex gap-3 px-4 py-3">
                  {/* Imagen */}
                  <div className="flex-shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border bg-white">
                      {prod.img ? (
                        <img
                          src={prod.img}
                          alt={prod.nombre}
                          className="h-full w-full object-cover p-1"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                          <span className="text-xs text-gray-400">
                            Sin imagen
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="text-sm font-semibold text-black">
                        {prod.nombre}
                      </div>
                      <div className="text-xs text-gray-600">{prod.sub}</div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs text-gray-700">Cantidad: {qty}</div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500">Subtotal</div>
                        <div className="text-lg font-bold text-black">
                          S/ {(prod.precio * qty).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* SUGERENCIAS */}
        {suggested.length > 0 && (
          <section className="rounded-2xl bg-white shadow mt-4">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">
                Tal vez quieras agregar...
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto px-4 py-3">
              {suggested.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addSuggested(p.id)}
                  className="flex w-52 flex-shrink-0 flex-col rounded-2xl border bg-white shadow-sm"
                >
                  <div className="h-24 flex items-center justify-center overflow-hidden rounded-t-2xl">
                    {p.img ? (
                      <img
                        src={p.img}
                        alt={p.nombre}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <span className="text-xs text-gray-400">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  <div className="px-3 py-2 text-left">
                    <div className="text-xs font-semibold text-gray-900">
                      {p.nombre}
                    </div>
                    <div className="text-[11px] text-gray-600">{p.sub}</div>
                    <div className="mt-1 text-xs font-bold text-gray-900">
                      S/ {p.precio.toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* TOTAL */}
        <section className="sticky bottom-0 z-10 mt-4 rounded-2xl bg-white shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-xs text-gray-500">Total a pagar</div>

              <div
                className={`text-2xl font-extrabold text-black ${
                  totalBump ? "scale-110" : "scale-100"
                }`}
              >
                S/ {total.toFixed(2)}
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={isEmpty}
              className={`rounded-full px-6 py-2 text-sm font-semibold shadow ${
                isEmpty
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[#2e7d32] text-white hover:brightness-110"
              }`}
            >
              Confirmar pedido
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
