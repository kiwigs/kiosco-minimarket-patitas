"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PanelLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pin.trim()) {
      setError("Ingrese el PIN.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/panel-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo iniciar sesión.");
        setLoading(false);
        return;
      }

      // Login OK → ir al panel
      router.replace("/panel");
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow p-6 w-full max-w-sm space-y-4"
      >
        <h1 className="text-lg font-semibold text-gray-900">
          Acceso administrador
        </h1>

        <p className="text-xs text-gray-500">
          Ingrese el PIN del panel para continuar.
        </p>

        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="PIN"
        />

        {error && (
          <p className="text-xs text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#f2c200] text-xs font-semibold py-2 shadow hover:brightness-95 disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
