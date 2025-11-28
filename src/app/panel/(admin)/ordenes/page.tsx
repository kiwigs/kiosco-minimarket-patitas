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

type ProductoDB = {
  id: string;
  nombre: string;
  sub: string;
  categoria: CategoriaBase;
  precio: number;
  activo: boolean;
  imageUrl?: string;
};

/* Catálogo ahora viene desde Neon en el componente, ya no se usa CATALOGO_MINI fijo. */

/* ---- Helpers de presentación ---- */

type DetailItem = { label: string; qty: number };

// búsqueda tolerante dentro del catálogo
function findProductTolerant(idRaw: string, catalogo: ProductoMini[]) {
  const id = String(idRaw).trim();
  if (!id) return undefined;

  // 1) exact match
  let prod = catalogo.find((p) => String(p.id) === id);
  if (prod) return prod;

  // 2) match by id included in raw (por ejemplo raw contiene slug+id)
  prod = catalogo.find((p) => id.includes(String(p.id)));
  if (prod) return prod;

  // 3) match by catalog id contains raw (short ids)
  prod = catalogo.find((p) => String(p.id).includes(id));
  if (prod) return prod;

  // 4) match by slug-like normalization: remove non-alphanum and compare
  const normalize = (s: string) =>
    String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const nid = normalize(id);
  if (nid) {
    prod = catalogo.find((p) => normalize(p.id) === nid);
    if (prod) return prod;
    prod = catalogo.find((p) => normalize(p.nombre + " " + p.sub) === nid);
    if (prod) return prod;
  }

  return undefined;
}

// Genera una lista de {label, qty} para cada producto
function getOrderDetailItems(
  items: Record<string, number>,
  catalogo: ProductoMini[]
): DetailItem[] {
  const partes: DetailItem[] = Object.entries(items).map(([idRaw, qty]) => {
    const prod = findProductTolerant(idRaw, catalogo);
    if (prod) {
      return {
        label: `${prod.nombre} ${prod.sub}`,
        qty: Number(qty),
      };
    }

    // si no se encuentra, devolver el id tal cual (y loguear para depuración)
    console.debug("[PanelOrdenes] producto no encontrado para id:", idRaw);
    return {
      label: String(idRaw),
      qty: Number(qty),
    };
  });

  if (partes.length === 0) return [{ label: "—", qty: 0 }];
  return partes;
}

// Categoría principal de la orden (según TODAS las categorías presentes)
function getOrderCategory(
  items: Record<string, number>,
  catalogo: ProductoMini[]
): CategoriaBase | "Mixtos" | "Otros" {
  const ids = Object.keys(items).map((x) => String(x).trim());
  if (ids.length === 0) return "Otros";

  const categorias = new Set<CategoriaBase>();

  for (const id of ids) {
    const prod = findProductTolerant(id, catalogo);
    if (prod) {
      categorias.add(prod.categoria);
    } else {
      // opcional: debug para ver qué ids fallan
      console.debug("[PanelOrdenes] getOrderCategory id sin match:", id);
    }
  }

  if (categorias.size === 0) return "Otros";
  if (categorias.size === 1) return [...categorias][0];
  return "Mixtos";
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").toUpperCase();
}

function getStatusBadgeClass(status: string): string {
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
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("TODAS");

  const [catalogo, setCatalogo] = useState<ProductoMini[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);

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
    const fetchCatalogo = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) return;
        const data: ProductoDB[] = await res.json();
        const activos = data.filter((p) => p.activo);

        const mapped: ProductoMini[] = activos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          sub: p.sub,
          categoria: p.categoria,
        }));

        setCatalogo(mapped);
      } catch (err) {
        console.error("Error cargando catálogo en PanelOrdenes:", err);
      } finally {
        setLoadingCatalogo(false);
      }
    };

    fetchCatalogo();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        console.error("No se pudo actualizar el estado");
        return;
      }

      await fetchOrders();
    } catch (err) {
      console.error("Error actualizando estado:", err);
    }
  };

  const deleteOrder = async (id: number) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("No se pudo eliminar la orden");
        return;
      }

      setHiddenIds((prev) => [...prev, id]);
    } catch (err) {
      console.error("Error eliminando orden:", err);
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

    const cat = getOrderCategory(items, catalogo);

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* header panel */}
      <div className="w-full bg-[#f2c200] shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-extrabold text-white">Panel de Órdenes</h1>
          </div>

          <div>
            <button
              onClick={() => router.push("/panel")}
              className="rounded-xl bg-black/30 px-3 py-1 text-xs font-semibold shadow hover:bg-black/40"
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
        </div>

        {/* tabla */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-[11px] uppercase">
              <tr>
                {/* 1) NÚMERO */}
                <th className="px-4 py-3 font-semibold tracking-wide text-gray-600 align-top">
                  Número
                </th>
                {/* 2) CATEGORÍA */}
                <th className="px-4 py-3 font-semibold tracking-wide text-gray-600 align-top">
                  Categoría
                </th>
                {/* 3) DETALLE */}
                <th className="px-4 py-3 align-top text-left font-semibold tracking-wide text-gray-600">
                  Detalle
                </th>
                {/* 4) ESTADO */}
                <th className="px-4 py-3 font-semibold tracking-wide text-gray-600 align-top">
                  Estado
                </th>
                {/* 5) FECHA */}
                <th className="px-4 py-3 font-semibold tracking-wide text-gray-600 align-top whitespace-nowrap">
                  Fecha y hora
                </th>
                {/* 6) TOTAL */}
                <th className="px-4 py-3 font-semibold tracking-wide text-gray-600 align-top">
                  Total
                </th>
                {/* 7) ACCIONES */}
                <th className="px-4 py-3 text-right font-semibold tracking-wide text-gray-600 align-top">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {(loading || loadingCatalogo) &&
                visibleOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-gray-600"
                    >
                      Cargando órdenes...
                    </td>
                  </tr>
                )}

              {!loading &&
                !loadingCatalogo &&
                visibleOrders.length === 0 && (
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
                const cat = getOrderCategory(o.items, catalogo);
                const detailItems = getOrderDetailItems(o.items, catalogo);

                return (
                  <tr key={o.id} className="border-t last:border-b align-top">
                    {/* Número */}
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-800">
                      #{o.code}
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {cat === "Mixtos" || cat === "Otros" ? "—" : cat}
                    </td>

                    {/* Detalle */}
                    <td className="px-4 py-3 text-sm text-gray-700 align-top">
                      <ul className="list-disc pl-6 space-y-1">
                        {detailItems.map((d, idx) => (
                          <li key={idx}>
                            <div className="flex items-center gap-3">
                              <span className="flex-1 leading-tight">
                                {d.label}
                              </span>
                              <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                                x{d.qty}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 text-sm text-gray-700 align-top">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          getStatusBadgeClass(o.status || ""),
                        ].join(" ")}
                      >
                        {formatStatusLabel(o.status || "")}
                      </span>
                    </td>

                    {/* Fecha y hora */}
                    <td className="px-4 py-3 text-sm text-gray-700 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{fecha}</span>
                        <span className="text-xs text-gray-500">{hora}</span>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                      S/ {Number(o.total).toFixed(2)}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(o.id, "PAGADO")}
                          className="rounded-2xl bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
                        >
                          Pagado
                        </button>
                        <button
                          onClick={() => updateStatus(o.id, "ENTREGADO")}
                          className="rounded-2xl bg-gray-700 px-4 py-2 text-xs font-semibold text-white shadow hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
                        >
                          Entregado
                        </button>
                        <button
                          onClick={() => deleteOrder(o.id)}
                          className="px-2 text-2xl font-extrabold leading-none text-[#b71c1c] transition hover:text-[#7f0f0f]"
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
          <strong>PAGADO</strong> o <strong>ENTREGADO</strong> después
          del cobro.
        </p>
      </div>
    </div>
  );
}