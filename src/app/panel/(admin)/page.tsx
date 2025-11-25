"use client";

import { useRouter } from "next/navigation";

export default function AdminPanelPage() {
  const router = useRouter();

  const goToOrdenes = () => router.push("/panel/ordenes");
  const goToCatalogo = () => router.push("/panel/catalogo");

  const handleLogoutAdmin = async () => {
    try {
      await fetch("/api/panel-logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error al cerrar sesión del admin:", error);
    } finally {
      router.replace("/panel/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      {/* Barra superior */}
      <header className="w-full bg-[#f2c200] text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-wide">
              Panel de Administración
            </h1>
            <p className="text-xs font-semibold opacity-90">
              Minimarket Patitas
            </p>
          </div>

          <button
            onClick={handleLogoutAdmin}
            className="rounded-xl bg-black/30 px-3 py-1 text-xs font-semibold shadow hover:bg-black/40 transition active:translate-y-[1px]"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Accesos rápidos
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Elija el módulo que desea administrar.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Órdenes */}
              <button
                onClick={goToOrdenes}
                className="flex h-full flex-col rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-gray-200/80 hover:shadow-md transition active:translate-y-[1px]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f2c200]/15 text-xl">
                    💳
                  </span>
                </div>

                <h3 className="text-[15px] font-semibold text-gray-900">
                  Órdenes de caja
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Ver y gestionar órdenes generadas por el kiosco.
                </p>
              </button>

              {/* Catálogo */}
              <button
                onClick={goToCatalogo}
                className="flex h-full flex-col rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-gray-200/80 hover:shadow-md transition active:translate-y-[1px]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f2c200]/15 text-xl">
                    📦
                  </span>
                </div>

                <h3 className="text-[15px] font-semibold text-gray-900">
                  Catálogo de productos
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Añadir, modificar o eliminar productos del kiosco.
                </p>
              </button>

              {/* luego aquí puedes sumar Categorías, Descuentos, etc. */}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
