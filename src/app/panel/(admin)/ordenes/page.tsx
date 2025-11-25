"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/* ---- Tipos ---- */
type CategoriaBase = "Grooming" | "Alimentos" | "Premios" | "Recetados";

type Order = {
  id: number;
  code: string;
  total: string | number;
  status: string;
  created_at: string;
  items: Record<string, number>;
};

type ProductoMini = {
  id: string;
  nombre: string;
  sub: string;
  categoria: CategoriaBase;
};

/* ---- Catálogo mínimo para mostrar DETALLE + CATEGORÍA ---- */
const CATALOGO_MINI: ProductoMini[] = [
  {
    id: "dogchow-15",
    nombre: "Dog Chow",
    sub: "Adultos Grandes 15kg",
    categoria: "Alimentos",
  },
  {
    id: "ricocan-cordero-15",
    nombre: "Ricocan",
    sub: "Adultos Medianos Cordero 15kg",
    categoria: "Alimentos",
  },
  {
    id: "thor-25",
    nombre: "Thor",
    sub: "Adultos Carne + Cereales 25kg",
    categoria: "Alimentos",
  },
  {
    id: "catchow-8",
    nombre: "Cat Chow",
    sub: "Gatos Adultos Esterilizados 8kg",
    categoria: "Alimentos",
  },
  {
    id: "ricocat-9",
    nombre: "Ricocat",
    sub: "Gatos Esterilizados Pescado 9kg",
    categoria: "Alimentos",
  },
  {
    id: "origens-lata",
    nombre: "Origens",
    sub: "Trozos de Cordero Adulto 170g 4u",
    categoria: "Alimentos",
  },
  {
    id: "premio-galleta",
    nombre: "Galletas Caninas",
    sub: "Sabor Pollo 500g",
    categoria: "Premios",
  },
  {
    id: "premio-snack",
    nombre: "Snack Masticable",
    sub: "Cuero prensado 3u",
    categoria: "Premios",
  },
  {
    id: "bano-perro",
    nombre: "Baño Canino",
    sub: "Shampoo hipoalergénico",
    categoria: "Grooming",
  },
  {
    id: "anti-rece",
    nombre: "Antiparasitario",
    sub: "Uso con receta",
    categoria: "Recetados",
  },
];

/* ---- Helpers de presentación ---- */

type DetailItem = { label: string; qty: number };

// Genera una lista de {label, qty} para cada producto
function getOrderDetailItems(items: Record<string, number>): DetailItem[] {
  const partes: DetailItem[] = Object.entries(items).map(([id, qty]) => {
    const prod = CATALOGO_MINI.find((p) => p.id === id);
    if (prod) {
      return {
        label: `${prod.nombre} ${prod.sub}`,
        qty: Number(qty),
      };
    }
    return {
      label: id,
      qty: Number(qty),
    };
  });

  if (partes.length === 0) return [{ label: "—", qty: 0 }];
  return partes;
}

// Categoría principal de la orden (según TODAS las categorías presentes)
function getOrderCategory(
  items: Record<string, number>
): CategoriaBase | "Mixtos" | "Otros" {
  const ids = Object.keys(items);
  if (ids.length === 0) return "Otros";

  const categorias = new Set<CategoriaBase>();

  for (const id of ids) {
    const prod = CATALOGO_MINI.find((p) => p.id === id);
    if (prod) {
      categorias.add(prod.categoria);
    }
  }

  if (categorias.size === 0) return "Otros";
  if (categorias.size === 1) return [...categorias][0];
  return "Mixtos";
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

function statusClasses(status: string): string {
  switch (status) {
    case "PENDIENTE_DE_PAGO":
      return "bg-yellow-100 text-yellow-800";
    case "PAGADO":
      return "bg-blue-100 text-blue-800";
    case "ENTREGADO":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/* ---- Página ---- */

type CategoryFilter = "TODAS" | CategoriaBase | "Mixtos";

export default function PanelOrdenesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("TODAS");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data: Order[] = await res.json();

      // Filtro robusto de estados "eliminados" a nivel backend
      const cleaned = data.filter((o) => {
        const s = (o.status || "").toLowerCase();
        return s !== "eliminada" && s !== "eliminado" && s !== "anulada";
      });

      setOrders(cleaned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      try {
        // 1) Verificar si el admin está autenticado
        const res = await fetch("/api/panel-auth", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          // No hay cookie válida → mandar al login del panel
          router.replace("/panel/login");
          return;
        }

        // 2) Si está autenticado, recién ahí traemos órdenes
        await fetchOrders();
        interval = setInterval(fetchOrders, 5000);
      } catch (err) {
        console.error("Error verificando auth del panel:", err);
        // En caso de duda, mejor sacarlo
        router.replace("/panel/login");
      }
    };

    init();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [router]);


  // ¿La orden coincide con el filtro por categoría?
  const orderMatchesCategory = (items: Record<string, number>): boolean => {
    if (categoryFilter === "TODAS") return true;

    const cat = getOrderCategory(items);

    if (categoryFilter === "Mixtos") {
      return cat === "Mixtos";
    }

    // Filtros por categoría base
    if (cat === "Mixtos" || cat === "Otros") return false;
    return cat === categoryFilter;
  };

  // Órdenes realmente visibles en la tabla
  const visibleOrders = orders.filter(
    (o) => !hiddenIds.includes(o.id) && orderMatchesCategory(o.items)
  );

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        console.warn("No se pudo actualizar el estado de la orden");
        return;
      }
      await fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteOrder = async (id: number) => {
    const ok = window.confirm("¿Eliminar esta orden del panel?");
    if (!ok) return;

    // oculta inmediatamente en UI
    setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ELIMINADA" }),
      });
      if (!res.ok) {
        console.warn("No se pudo marcar la orden como ELIMINADA");
      } else {
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/panel-logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    } finally {
      router.replace("/panel/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* barra superior */}
      <div className="w-full bg-[#f2c200] px-6 py-3 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-wide">
            Panel de Órdenes
          </h1>
          <div className="flex items-center gap-4">
            <button
  onClick={() => router.back()}
  className="rounded-xl bg-black/30 px-3 py-1 text-xs font-semibold shadow hover:bg-black/40 transition active:translate-y-[1px]"
>
Atrás
</button>

          </div>
        </div>
      </div>

      {/* contenido */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-gray-800">Órdenes</h2>
            {/* Filtros por categoría */}
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { key: "TODAS", label: "Todas" },
                { key: "Alimentos", label: "Alimentos" },
                { key: "Premios", label: "Premios" },
                { key: "Grooming", label: "Grooming" },
                { key: "Recetados", label: "Recetados" },
                { key: "Mixtos", label: "Mixtos" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() =>
                    setCategoryFilter(opt.key as CategoryFilter)
                  }
                  className={[
                    "rounded-full border px-3 py-1 font-semibold transition",
                    categoryFilter === opt.key
                      ? "bg-[#f2c200] border-[#f2c200] text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={fetchOrders}
            className="rounded-2xl bg-gray-800 px-4 py-2 text-xs font-semibold text-white shadow hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
          >
            Actualizar
          </button>
        </div>

        {/* Caja de tabla SIEMPRE visible */}
        <div className="overflow-hidden rounded-2xl bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {/* 1) NÚMERO */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Número
                </th>
                {/* 2) CATEGORÍA */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Categoría
                </th>
                {/* 3) DETALLE */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Detalle
                </th>
                {/* 4) ESTADO */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Estado
                </th>
                {/* 5) FECHA Y HORA */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 ">
                  Fecha y hora
                </th>
                {/* 6) TOTAL */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Total
                </th>
                {/* 7) ACCIONES */}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && visibleOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-gray-600"
                  >
                    Cargando órdenes...
                  </td>
                </tr>
              )}

              {!loading && visibleOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No hay órdenes registradas en este momento.
                  </td>
                </tr>
              )}

              {visibleOrders.map((o) => {
                const created = new Date(o.created_at);
                const fecha = created.toLocaleDateString("es-PE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
                const hora = created.toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const cat = getOrderCategory(o.items);
                const detailItems = getOrderDetailItems(o.items);

                return (
                  <tr key={o.id} className="border-t last:border-b align-top">
                    {/* Número */}
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      #{o.code}
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-3 text-gray-800">
                      {cat === "Otros" ? "—" : cat}
                    </td>

                    {/* Detalle en lista con pastilla de cantidad */}
                    <td className="px-4 py-3 text-gray-700">
                      <ul className="space-y-3">
                        {detailItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            {/* Viñeta */}
                            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-gray-700 shrink-0" />

                            {/* Contenedor del texto + pastilla SIN wrap */}
                            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap">
                              <span className="text-gray-900">
                                {item.label}
                              </span>

                              {item.qty > 0 && (
                                <span
                                  className="
                                    inline-flex items-center
                                    rounded-full bg-gray-100
                                    px-2 py-0.5 text-xs font-semibold text-gray-800
                                  "
                                >
                                  x{item.qty}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold " +
                          statusClasses(o.status)
                        }
                      >
                        {formatStatusLabel(o.status)}
                      </span>
                    </td>

                    {/* Fecha y hora */}
                    <td className="px-4 py-3 text-gray-700">
                      <div>{fecha}</div>
                      <div className="text-xs text-gray-500">{hora}</div>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-gray-800">
                      S/ {Number(o.total).toFixed(2)}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(o.id, "PAGADO")}
                          className="rounded-2xl bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
                        >
                          Pagado
                        </button>
                        <button
                          onClick={() => updateStatus(o.id, "ENTREGADO")}
                          className="rounded-2xl bg-gray-700 px-3 py-2 text-xs font-semibold text-white shadow hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
                        >
                          Entregado
                        </button>
                        <button
                          onClick={() => deleteOrder(o.id)}
                          className="text-[#b71c1c] hover:text-[#7f0f0f] text-2xl font-extrabold px-2 leading-none transition"
                          aria-label="Eliminar orden"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Use este panel en la caja: el kiosco genera órdenes con estado{" "}
          <strong>PENDIENTE DE PAGO</strong>, y aquí se marcan como{" "}
          <strong>PAGADO</strong> o <strong>ENTREGADO</strong> después del
          cobro.
        </p>
      </div>
    </div>
  );
}
