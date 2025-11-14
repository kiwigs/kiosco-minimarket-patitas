"use client";

import { useEffect, useState } from "react";

type Order = {
  id: number;
  code: string;
  total: string | number;
  status: string;
  created_at: string;
  items: Record<string, number>;
};

export default function PanelPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?status=PENDIENTE_DE_PAGO", {
        cache: "no-store",
      });
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        console.error("Error actualizando estado");
        return;
      }
      await fetchOrders();
    } catch (err) {
      console.error(err);
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
          <span className="text-sm font-semibold">
            Minimarket Patitas · Caja
          </span>
        </div>
      </div>

      {/* contenido */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Órdenes pendientes de pago
          </h2>
          <button
            onClick={fetchOrders}
            className="rounded-2xl bg-gray-800 px-4 py-2 text-xs font-semibold text-white shadow hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
          >
            Actualizar
          </button>
        </div>

        {loading && orders.length === 0 ? (
          <p className="text-sm text-gray-600">Cargando órdenes...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-600">
            No hay órdenes pendientes de pago en este momento.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Orden
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Hora
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t last:border-b">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      #{o.code}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      S/ {Number(o.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(o.created_at).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
