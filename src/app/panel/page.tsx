"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/* ---- Tipos ---- */
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
};

/* ---- Catálogo mínimo para mostrar DETALLE de la orden ---- */
const CATALOGO_MINI: ProductoMini[] = [
  {
    id: "dogchow-15",
    nombre: "Dog Chow",
    sub: "Adultos Grandes 15kg",
  },
  {
    id: "ricocan-cordero-15",
    nombre: "Ricocan",
    sub: "Adultos Medianos Cordero 15kg",
  },
  {
    id: "thor-25",
    nombre: "Thor",
    sub: "Adultos Carne + Cereales 25kg",
  },
  {
    id: "catchow-8",
    nombre: "Cat Chow",
    sub: "Gatos Adultos Esterilizados 8kg",
  },
  {
    id: "ricocat-9",
    nombre: "Ricocat",
    sub: "Gatos Esterilizados Pescado 9kg",
  },
  {
    id: "origens-lata",
    nombre: "Origens",
    sub: "Trozos de Cordero Adulto 170g 4u",
  },
  {
    id: "premio-galleta",
    nombre: "Galletas Caninas",
    sub: "Sabor Pollo 500g",
  },
  {
    id: "premio-snack",
    nombre: "Snack Masticable",
    sub: "Cuero prensado 3u",
  },
  {
    id: "bano-perro",
    nombre: "Baño Canino",
    sub: "Shampoo hipoalergénico",
  },
  {
    id: "anti-rece",
    nombre: "Antiparasitario",
    sub: "Uso con receta",
  },
];

/* ---- Helpers de presentación ---- */

function getOrderDetail(items: Record<string, number>): string {
  const partes = Object.entries(items).map(([id, qty]) => {
    const prod = CATALOGO_MINI.find((p) => p.id === id);
    if (prod) {
      return `${prod.nombre} ${prod.sub} x${qty}`;
    }
    return `${id} x${qty}`;
  });

  if (partes.length === 0) return "—";
  return partes.join(", ");
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

export default function PanelPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]); // 👈 órdenes ocultas en la vista

  /* Guardia cliente: solo deja ver panel si pasó por login */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = sessionStorage.getItem("panel-auth");
    if (!token) {
      router.replace("/panel/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

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
    if (!authChecked) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [authChecked]);

  // Órdenes realmente visibles en la tabla (aplica hiddenIds)
  const visibleOrders = orders.filter((o) => !hiddenIds.includes(o.id));

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

  // Marcamos como eliminada en backend y la ocultamos en la vista
  const deleteOrder = async (id: number) => {
    const ok = window.confirm("¿Eliminar esta orden del panel?");
    if (!ok) return;

    // 👇 Ocultar inmediatamente en la vista (evita el efecto de rebote)
    setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ELIMINADA" }),
      });
      if (!res.ok) {
        console.warn("No se pudo marcar la orden como ELIMINADA");
        // Si quisieras “deshacer” el ocultado en caso de error, aquí se podría revertir
      } else {
        // Opcional: refrescar datos para que, si el backend sí cambia el estado,
        // ya no vuelva a aparecer ni tras recargar la página.
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/caja-logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error(err);
    } finally {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("panel-auth");
      }
      router.replace("/panel/login");
    }
  };

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-600">Verificando acceso a caja…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* barra superior */}
      <div className="w-full bg-[#f2c200] px-6 py-3 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-wide">
            Panel de Órdenes
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">
              Minimarket Patitas · Caja
            </span>
            <button
              onClick={handleLogout}
              className="rounded-2xl bg-black/30 px-3 py-1 text-xs font-semibold shadow hover:bg-black/40 active:translate-y-[1px] active:shadow-inner transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* contenido */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Órdenes</h2>
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
                {/* 2) DETALLE */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Detalle
                </th>
                {/* 3) ESTADO */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Estado
                </th>
                {/* 4) FECHA Y HORA */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Fecha y hora
                </th>
                {/* 5) TOTAL */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Total
                </th>
                {/* 6) ACCIONES */}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && visibleOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-gray-600"
                  >
                    Cargando órdenes...
                  </td>
                </tr>
              )}

              {!loading && visibleOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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

                return (
                  <tr key={o.id} className="border-t last:border-b">
                    {/* Número */}
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      #{o.code}
                    </td>

                    {/* Detalle */}
                    <td className="px-4 py-3 text-gray-700 max-w-md">
                      <span className="line-clamp-2">
                        {getOrderDetail(o.items)}
                      </span>
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
          <strong>PENDIENTE_DE_PAGO</strong>, y aquí se marcan como{" "}
          <strong>PAGADO</strong> o <strong>ENTREGADO</strong> después del
          cobro.
        </p>
      </div>
    </div>
  );
}
