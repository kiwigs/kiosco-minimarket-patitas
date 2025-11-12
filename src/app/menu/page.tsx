"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/** ---- Tipos ---- */
type Categoria = "Grooming" | "Alimentos" | "Premios" | "Recetados";
type Producto = {
  id: string;
  nombre: string;
  sub: string;
  precio: number; // S/
  img?: string;   // ruta en /public
  categoria: Categoria;
};

/** ---- Catálogo (ajusta rutas a tus archivos en /public) ---- */
const CATALOGO: Producto[] = [
  // Alimentos
  { id: "dogchow-15", nombre: "Dog Chow", sub: "Adultos Grandes 15kg", precio: 137.9, img: "/productos/dogchow-15kg.png", categoria: "Alimentos" },
  { id: "ricocan-cordero-15", nombre: "Ricocan", sub: "Adultos Medianos Cordero 15kg", precio: 96.9, img: "/productos/ricocan-cordero-15kg.png", categoria: "Alimentos" },
  { id: "thor-25", nombre: "Thor", sub: "Adultos Carne + Cereales 25kg", precio: 121.0, img: "/productos/thor-25kg.png", categoria: "Alimentos" },
  { id: "catchow-8", nombre: "Cat Chow", sub: "Gatos Adultos Esterilizados 8kg", precio: 104.9, img: "/productos/catchow-8kg.png", categoria: "Alimentos" },
  { id: "ricocat-9", nombre: "Ricocat", sub: "Gatos Esterilizados Pescado 9kg", precio: 88.9, img: "/productos/ricocat-9kg.png", categoria: "Alimentos" },
  { id: "origens-lata", nombre: "Origens", sub: "Trozos de Cordero Adulto 170g x 4und", precio: 32.7, img: "/productos/origens-lata.png", categoria: "Alimentos" },
  // Premios
  { id: "premio-galleta", nombre: "Galletas Caninas", sub: "Sabor Pollo 500g", precio: 19.9, img: "/productos/premios-galleta.png", categoria: "Premios" },
  { id: "premio-snack", nombre: "Snack Masticable", sub: "Cuero prensado 3und", precio: 14.5, img: "/productos/premios-snack.png", categoria: "Premios" },
  // Grooming
  { id: "bano-perro", nombre: "Baño Canino", sub: "Shampoo hipoalergénico", precio: 35, img: "/productos/grooming-bano.png", categoria: "Grooming" },
  // Recetados
  { id: "anti-rece", nombre: "Antiparasitario", sub: "Uso con receta", precio: 49.9, img: "/productos/recetado-antiparasitario.png", categoria: "Recetados" },
];

function CategoriaBtn({
  active,
  icon,
  label,
  size = "md",
  onClick,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  size?: "lg" | "md" | "sm";
  onClick: () => void;
}) {
  const sizeClasses =
    size === "lg"
      ? "h-24 w-28 text-base"
      : size === "sm"
      ? "h-16 w-20 text-xs"
      : "h-20 w-24 text-sm";

  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-col items-center justify-center rounded-xl border shadow-sm transition-all",
        sizeClasses,
        active
          ? "bg-white border-gray-300 shadow-md scale-100"
          : "bg-white/80 border-gray-200 hover:bg-white scale-95 opacity-80",
      ].join(" ")}
      style={{ willChange: "transform" }}
    >
      <span className={size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl"}>
        {icon}
      </span>
      <span className="mt-1 text-black">{label}</span>
    </button>
  );
}


/** ---- Tarjeta de Producto ---- */
function ProductCard({ p, onAdd }: { p: Producto; onAdd: (prod: Producto) => void }) {
  return (
    <button onClick={() => onAdd(p)} className="group flex w-full max-w-[220px] flex-col">
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border bg-white shadow-sm">
        {p.img ? (
          <img src={p.img} alt={p.nombre} className="h-full w-full object-contain p-2" draggable={false} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <span className="text-gray-400">Sin imagen</span>
          </div>
        )}
      </div>
      <div className="mt-3 text-left">
        <div className="text-[15px] font-semibold text-gray-900 leading-tight">{p.nombre}</div>
        <div className="text-sm text-gray-600">{p.sub}</div>
        <div className="mt-1 text-[15px] font-semibold text-gray-800">S/ {p.precio.toFixed(2)}</div>
      </div>
    </button>
  );
}

/** ---- Página ---- */
export default function MenuPage() {
  const router = useRouter();

  const [cat, setCat] = useState<Categoria>("Alimentos");
  const [cart, setCart] = useState<Record<string, number>>({}); // id -> qty

  const productos = useMemo(() => CATALOGO.filter((p) => p.categoria === cat), [cat]);

  const total = useMemo(() => {
    return Object.entries(cart).reduce((acc, [id, qty]) => {
      const prod = CATALOGO.find((p) => p.id === id);
      return acc + (prod ? prod.precio * qty : 0);
    }, 0);
  }, [cart]);

  const addToCart = (p: Producto) => setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }));
  const clearCart = () => setCart({});
  const itemsCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      {/* Franja superior (imagen de cabecera) */}
      <div className="relative h-40 w-full overflow-hidden">
        <img src="/banner.png" alt="Banner superior" className="h-full w-full object-cover" draggable={false} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      {/* Contenido principal */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-6 pt-4">
        {/* Columna izquierda: logo fijo arriba + carrusel centrado sin colisión */}
<div className="flex w-[140px] flex-col items-center pt-6 pb-8">
  {/* Logo arriba */}
  <img
    src="/logo.png"
    alt="Logo"
    className="h-24 w-24 object-contain mb-6"
    draggable={false}
  />

  {/* Espacio flexible que centra las categorías sin chocar */}
  <div className="flex flex-1 flex-col items-center justify-center gap-4 translate-y-[-10%]">
    {["Grooming", "Alimentos", "Premios", "Recetados"].map((label, i) => {
      const order: Categoria[] = ["Grooming", "Alimentos", "Premios", "Recetados"];
      const activeIndex = order.indexOf(cat);
      const d = Math.abs(i - activeIndex);

      const size = d === 0 ? "lg" : d === 1 ? "md" : "sm";
      const opacity = d === 0 ? 1 : d === 1 ? 0.9 : 0.75;
      const icon =
        label === "Grooming"
          ? "🧴"
          : label === "Alimentos"
          ? "🦴"
          : label === "Premios"
          ? "🍪"
          : "🧾";

      return (
        <div key={label} className="transition-transform" style={{ opacity }}>
          <CategoriaBtn
            label={label}
            icon={icon}
            size={size as "lg" | "md" | "sm"}
            active={label === cat}
            onClick={() => setCat(label as Categoria)}
          />
        </div>
      );
    })}
  </div>
</div>

        {/* Columna derecha */}
        <div className="flex min-w-0 flex-1 flex-col">
{/* Header: título centrado visualmente + botón atrás */}
<div className="relative mb-6 flex items-center justify-end">
  <h2
    className="absolute left-1/2 -translate-x-[65%] text-3xl font-extrabold tracking-wide text-[#f2c200] whitespace-nowrap"
    style={{ lineHeight: "1" }}
  >
    MENÚ PRINCIPAL
  </h2>

  <button
    onClick={() => router.back()}
    className="rounded-2xl border border-gray-300 bg-white px-5 py-2 text-[17px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
  >
    Atrás
  </button>
</div>

          {/* Grilla de productos */}
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 mt-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">

            {productos.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={addToCart} />
            ))}
          </div>
        </div>
      </div>

      {/* Barra inferior de Orden */}
<div className="mt-4 w-full border-t border-gray-200 bg-white">
  {/* Franja amarilla: ahora con texto BLANCO */}
  <div className="w-full bg-[#f2c200] px-6 py-2 text-sm font-bold text-white">
    <div className="mx-auto max-w-6xl">Mi Orden</div>
  </div>

  {/* Contenido de la orden: texto centrado y botones debajo */}
  <div className="mx-auto w-full max-w-6xl px-6 py-8">
    <div className="text-center">
      {itemsCount === 0 ? (
        <p className="text-lg text-gray-700">Su orden está vacía</p>
      ) : (
        <div className="text-gray-800">
          <span className="font-semibold">
            {itemsCount} {itemsCount === 1 ? "ítem" : "ítems"}
          </span>
          <span className="mx-2">•</span>
          <span className="font-semibold">Total: S/ {total.toFixed(2)}</span>
        </div>
      )}
    </div>

    {/* Botones abajo, centrados */}
    <div className="mt-6 flex w-full items-center justify-center gap-6">
      <button
        onClick={clearCart}
        className="w-full max-w-xs rounded-2xl bg-[#b71c1c] px-8 py-4 text-[16px] font-semibold text-white shadow-md hover:brightness-110"
      >
        Cancelar orden
      </button>
      <button
        onClick={() => {
          // router.push("/checkout"); // cuando tengas la pantalla
          console.log("Siguiente →", { cart });
        }}
        className="w-full max-w-xs rounded-2xl bg-[#f2c200] px-8 py-4 text-[16px] font-semibold text-gray-900 shadow-md hover:brightness-110"
      >
        Siguiente
      </button>
    </div>
  </div>
</div>
    </div>
  );
}
