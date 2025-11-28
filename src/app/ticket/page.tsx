"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Tipos de producto para el ticket */
type Producto = {
  id: string;
  nombre: string;
  sub: string;
  precio: number;
};

type ProductoDB = {
  id: string;
  nombre: string;
  sub: string;
  precio: number;
  activo: boolean;
  imageUrl?: string;
};

type Order = {
  id: number;
  code: string;
  total: string | number;
  status: string;
  created_at: string;
  items?: Record<string, number>;
};

export default function TicketPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // saber si el ticket ya pasó por el flujo de impresión
  const [printed, setPrinted] = useState(false);

  // catálogo real desde Neon
  const [catalogo, setCatalogo] = useState<Producto[]>([]);

  // Cargar orden desde sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("kiosk-last-order");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setOrder(parsed);
    } catch {
      setOrder(null);
    }

    // importante: borrar para que NO se pueda reusar la misma orden al recargar
    sessionStorage.removeItem("kiosk-last-order");
    sessionStorage.removeItem("kiosk-cart");
  }, []);

  // Cargar catálogo desde /api/products (Neon)
  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) {
          console.error("Error cargando catálogo para ticket");
          return;
        }

        const data: ProductoDB[] = await res.json();
        const activos = data.filter((p) => p.activo);

        const mapped: Producto[] = activos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          sub: p.sub,
          precio: p.precio,
        }));

        setCatalogo(mapped);
      } catch (err) {
        console.error("Error al traer catálogo en ticket:", err);
      }
    };

    fetchCatalogo();
  }, []);

  // Escuchar el evento afterprint: se dispara cuando se cierra el diálogo de impresión
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAfterPrint = () => {
      setPrinted(true);
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const handlePrint = () => {
    if (printed) return; // por si acaso
    window.print();
    // `printed` se pone en true en handleAfterPrint
  };

  const handleRequestExit = () => {
    if (!printed) return; // no permitir ni siquiera abrir el modal si no ha impreso
    setShowExitConfirm(true);
  };

  if (!order) {
    return (
      <div className="flex h-[100dvh] flex-col bg-white">
        {/* banner superior (aquí NO hace falta ticket-banner) */}
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src="/banner.png"
            alt="Banner"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="max-w-md text-center">
            <h2 className="mb-3 text-2xl font-extrabold text-gray-900">
              No hay orden para mostrar
            </h2>
            <p className="text-sm text-gray-600">
              Regrese a la pantalla principal para iniciar un nuevo pedido.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 rounded-2xl bg-[#f2c200] px-6 py-3 text-[16px] font-semibold text-white shadow-md hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
            >
              Ir a pantalla de inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalNumber = Number(order.total || 0);

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      {/* banner superior del ticket → este SÍ se oculta al imprimir */}
      <div className="ticket-banner relative h-40 w-full overflow-hidden">
        <img
          src="/banner.png"
          alt="Banner"
          className="h-full w-full object-cover"
        />
      </div>

      {/* contenido */}
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6">
        {/* título centrado */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-wide text-[#f2c200]">
            ¡Orden confirmada!
          </h2>
        </div>

        {/* tarjeta central (ticket) */}
        <div
          id="ticket"
          className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white px-8 py-6 shadow-md"
        >
          {/* número de orden */}
          <p className="text-sm font-semibold text-gray-600">Orden Nº</p>
          <p className="mt-1 text-3xl font-extrabold tracking-[0.2em] text-gray-900 text-center">
            {order.code}
          </p>

          {/* detalle de productos */}
          <div className="mt-6 border-t border-dashed pt-4 space-y-3">
            {order.items &&
              Object.entries(order.items).map(([id, qty]) => {
                const prod = catalogo.find((p) => p.id === id);
                const nombre = prod?.nombre ?? id;
                const sub = prod?.sub ?? "";
                const precio = prod?.precio ?? 0;
                const subtotal = precio * Number(qty);

                return (
                  <div
                    key={id}
                    className="flex items-start justify-between text-sm text-gray-800"
                  >
                    <div className="pr-4">
                      <div className="font-semibold">{nombre}</div>
                      {sub && (
                        <div className="text-xs text-gray-500">{sub}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">x{qty}</div>
                      <div className="text-xs text-gray-600">
                        S/ {subtotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* total */}
          <div className="mt-4 border-t border-dashed pt-4">
            <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
              <span>Total</span>
              <span>S/ {totalNumber.toFixed(2)}</span>
            </div>
          </div>

          {/* mensaje inferior */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Por favor, acérquese a caja con su ticket para realizar el pago.
          </p>
        </div>

        {/* botones inferiores → se ocultan al imprimir */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            onClick={handlePrint}
            disabled={printed}
            className={[
              "w-full max-w-xs rounded-2xl px-6 py-3 text-[16px] font-semibold whitespace-nowrap shadow-md transition",
              printed
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#f2c200] text-white hover:brightness-110 active:translate-y-[1px] active:shadow-inner",
            ].join(" ")}
          >
            {printed ? "Ticket impreso" : "Imprimir ticket"}
          </button>

          <button
            onClick={handleRequestExit}
            disabled={!printed}
            className={[
              "w-full max-w-xs rounded-2xl px-6 py-3 text-[16px] font-semibold shadow-md transition",
              !printed
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#b71c1c] text-white hover:brightness-110 active:translate-y-[1px] active:shadow-inner",
            ].join(" ")}
          >
            Salir
          </button>
        </div>

        {!printed && (
          <p className="mt-4 text-xs text-gray-500">
            Para continuar, primero imprima su ticket.
          </p>
        )}
      </div>

      {/* Pop-up de confirmación para "Salir" */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-6 text-center text-lg font-semibold text-gray-800">
              ¿Está seguro de querer salir?
            </p>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  router.push("/"); // pantalla de reposo
                }}
                className="min-w-[150px] rounded-2xl bg-[#f2c200] px-6 py-3 text-[16px] font-semibold text-white shadow-md hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
              >
                Sí
              </button>

              <button
                onClick={() => setShowExitConfirm(false)}
                className="min-w-[150px] rounded-2xl bg-[#b71c1c] px-6 py-3 text-[16px] font-semibold text-white shadow-md hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
