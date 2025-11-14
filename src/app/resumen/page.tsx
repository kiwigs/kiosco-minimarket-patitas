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

/** --- Catálogo --- */
const CATALOGO: Producto[] = [
  {
    id: "dogchow-15",
    nombre: "Dog Chow",
    sub: "Adultos Grandes 15kg",
    precio: 137.9,
    img: "/productos/dogchow-adultos-grandes-15kg.png",
    categoria: "Alimentos",
  },
  {
    id: "ricocan-cordero-15",
    nombre: "Ricocan",
    sub: "Adultos Medianos Cordero 15kg",
    precio: 96.9,
    img: "/productos/ricocan-adultos-medianos-cordero-15kg.png",
    categoria: "Alimentos",
  },
  {
    id: "thor-25",
    nombre: "Thor",
    sub: "Adultos Carne + Cereales 25kg",
    precio: 121.0,
    img: "/productos/thor-adultos-carne-cereales-25kg.png",
    categoria: "Alimentos",
  },
  {
    id: "catchow-8",
    nombre: "Cat Chow",
    sub: "Gatos Adultos Esterilizados 8kg",
    precio: 104.9,
    img: "/productos/catchow-gatos-adultos-esterilizados-8kg.png",
    categoria: "Alimentos",
  },
  {
    id: "ricocat-9",
    nombre: "Ricocat",
    sub: "Gatos Esterilizados Pescado 9kg",
    precio: 88.9,
    img: "/productos/ricocat-gatos-esterilizados-pescado-9kg.png",
    categoria: "Alimentos",
  },
  {
    id: "origens-lata",
    nombre: "Origens",
    sub: "Trozos de Cordero Adulto 170g 4u",
    precio: 32.7,
    img: "/productos/origens-trozos-cordero-adulto-170g.png",
    categoria: "Alimentos",
  },
  {
    id: "premio-galleta",
    nombre: "Galletas Caninas",
    sub: "Sabor Pollo 500g",
    precio: 19.9,
    img: "/productos/premios-galleta.png",
    categoria: "Premios",
  },
  {
    id: "premio-snack",
    nombre: "Snack Masticable",
    sub: "Cuero prensado 3u",
    precio: 14.5,
    img: "/productos/premios-snack.png",
    categoria: "Premios",
  },
  {
    id: "bano-perro",
    nombre: "Baño Canino",
    sub: "Shampoo hipoalergénico",
    precio: 35,
    img: "/productos/grooming-bano.png",
    categoria: "Grooming",
  },
  {
    id: "anti-rece",
    nombre: "Antiparasitario",
    sub: "Uso con receta",
    precio: 49.9,
    img: "/productos/recetado-antiparasitario.png",
    categoria: "Recetados",
  },
];

export default function ResumenPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [totalBump, setTotalBump] = useState(false);
  const prevTotalRef = useRef(0);

  /** CARGAR CARRITO */
  useEffect(() => {
    const raw = sessionStorage.getItem("kiosk-cart");
    if (!raw) return;
    try {
      setCart(JSON.parse(raw));
    } catch {
      setCart({});
    }
  }, []);

  /** ITEMS */
  const items = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const prod = CATALOGO.find((p) => p.id === id);
          return prod ? { prod, qty } : null;
        })
        .filter(Boolean) as { prod: Producto; qty: number }[],
    [cart]
  );

  const isEmpty = items.length === 0;

  /** TOTAL */
  const total = useMemo(
    () => items.reduce((sum, { prod, qty }) => sum + prod.precio * qty, 0),
    [items]
  );

  /** SUGERENCIAS SOLO 3 (3x1) */
  const suggested = useMemo(
    () => CATALOGO.filter((p) => !cart[p.id]).slice(0, 3),
    [cart]
  );

  /** ANIMACIÓN TOTAL */
  useEffect(() => {
    if (total !== prevTotalRef.current) {
      setTotalBump(true);
      setTimeout(() => setTotalBump(false), 180);
      prevTotalRef.current = total;
    }
  }, [total]);

  /** CONFIRMAR */
  const handleConfirm = async () => {
    // Blindaje: no crear orden vacía
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
    const copy = { ...cart, [id]: (cart[id] ?? 0) + 1 };
    setCart(copy);
    sessionStorage.setItem("kiosk-cart", JSON.stringify(copy));
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      {/* BANNER */}
      <div className="relative h-40 w-full overflow-hidden">
        <img src="/banner.png" alt="Banner" className="h-full w-full object-cover" />
      </div>

      {/* CONTENIDO: TÍTULO + LISTA CON SCROLL */}
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-4 min-h-0">
        <div className="flex flex-col flex-1 pt-10 min-h-0">
          {/* TÍTULO */}
          <h1 className="mb-6 text-3xl font-extrabold tracking-wide text-[#f2c200]">
            Mi orden
          </h1>

          {/* CARRITO VACÍO / LISTA */}
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
                      <img
                        src={prod.img}
                        className="h-full w-full object-contain p-1"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[15px] font-semibold text-black">
                        {prod.nombre}
                      </div>
                      <div className="truncate text-sm text-black">
                        {prod.sub}
                      </div>

                      {/* CONTROLES */}
                      <div className="mt-2 flex items-center gap-3">
                        {/* – */}
                        <button
                          onClick={() => {
                            const copy = { ...cart };
                            if (qty <= 1) delete copy[prod.id];
                            else copy[prod.id] = qty - 1;
                            setCart(copy);
                            sessionStorage.setItem(
                              "kiosk-cart",
                              JSON.stringify(copy)
                            );
                          }}
                          className="rounded-xl bg-[#b71c1c] text-white w-8 h-8 flex items-center justify-center"
                        >
                          –
                        </button>

                        <div className="min-w-[24px] text-center font-bold text-lg text-black">
                          {qty}
                        </div>

                        {/* + */}
                        <button
                          onClick={() => {
                            const copy = { ...cart, [prod.id]: qty + 1 };
                            setCart(copy);
                            sessionStorage.setItem(
                              "kiosk-cart",
                              JSON.stringify(copy)
                            );
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
                        sessionStorage.setItem(
                          "kiosk-cart",
                          JSON.stringify(copy)
                        );
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

      {/* SUGERENCIAS: FIJAS JUSTO ENCIMA DEL TOTAL */}
      {!isEmpty && suggested.length > 0 && (
        <div className="mx-auto w-full max-w-5xl px-6 pb-4">
          <div className="rounded-2xl border bg-[#fafafa] px-4 py-3">
            <h2 className="mb-3 text-lg font-semibold text-black">
              ¿Quiere añadir algo más?
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {suggested.map((prod) => (
                <div
                  key={prod.id}
                  className="flex flex-col items-center bg-white rounded-xl p-3 shadow-sm"
                >
                  <div className="h-20 w-20 flex items-center justify-center mb-2">
                    <img
                      src={prod.img}
                      alt={prod.nombre}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="text-center text-sm font-medium text-black w-full">
                    {prod.nombre}
                  </div>

                  <div className="mt-1 text-center text-xs text-black w-full">
                    {prod.sub}
                  </div>

                  <div className="mt-1 text-sm font-semibold text-black">
                    S/ {prod.precio.toFixed(2)}
                  </div>

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

      {/* TOTAL + BOTONES ABAJO */}
      <div className="mt-auto w-full bg-white">
        {/* Línea + TOTAL justo encima de los botones */}
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

        {/* Línea + BOTONES */}
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
