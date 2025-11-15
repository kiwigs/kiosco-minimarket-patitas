"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PanelLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pin.trim()) {
      setError("Ingrese el PIN de caja.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/caja-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "PIN incorrecto.");
        setLoading(false);
        return;
      }

      // Marca de sesión en el cliente (además de la cookie httpOnly)
      if (typeof window !== "undefined") {
        sessionStorage.setItem("panel-auth", "1");
      }

      router.replace("/panel"); // replace para que no haya "back" directo al login
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al intentar iniciar sesión.");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[#f5f5f5]">
      <div className="flex h-16 items-center justify-between bg-[#f2c200] px-8 shadow">
        <h1 className="text-xl font-extrabold text-white">
          Panel de Órdenes • Caja
        </h1>
        <span className="text-sm font-semibold text-white">
          Minimarket Patitas
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md border border-gray-200">
          <h2 className="mb-2 text-2xl font-extrabold text-gray-900 text-center">
            Ingreso a caja
          </h2>
          <p className="mb-6 text-center text-sm text-gray-600">
            Ingrese el PIN autorizado para acceder al panel de órdenes.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                PIN de caja
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-[15px] outline-none focus:border-[#f2c200] focus:ring-2 focus:ring-[#f2c200]/40"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={[
                "mt-2 w-full rounded-2xl px-4 py-3 text-[16px] font-semibold shadow-md transition",
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#f2c200] text-white hover:brightness-110 active:translate-y-[1px] active:shadow-inner",
              ].join(" ")}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
