"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export default function PantallaDeReposo() {
  const router = useRouter();

  const irAlMenu = useCallback(() => {
    router.push("/menu"); // ajusta si tu ruta del menú es diferente
  }, [router]);

  // También permite activar con cualquier clic o toque
  useEffect(() => {
    const handleClick = () => irAlMenu();
    window.addEventListener("pointerdown", handleClick, { once: true });
    return () => window.removeEventListener("pointerdown", handleClick);
  }, [irAlMenu]);

  return (
    <main className="relative h-screen w-screen overflow-hidden select-none">
      <Image
        src="/reposo.png"
        alt="Pantalla de reposo"
        fill
        priority
        className="object-cover"
      />
      {/* Botón invisible de fallback */}
      <button
        aria-label="Entrar al menú"
        onClick={irAlMenu}
        className="absolute inset-0"
      />
    </main>
  );
}
