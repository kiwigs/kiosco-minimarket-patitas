"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Añade la clase .chatbase-visible al <body> SOLO cuando la ruta es /menu.
 * Así podemos mostrar/ocultar el widget de Chatbase por CSS.
 */
export default function ChatbaseRouteClass() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;

    if (pathname === "/menu") {
      body.classList.add("chatbase-visible");
    } else {
      body.classList.remove("chatbase-visible");
    }
  }, [pathname]);

  return null;
}
