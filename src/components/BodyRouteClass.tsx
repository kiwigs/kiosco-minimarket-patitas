// src/components/BodyRouteClass.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const CLASS_NAME = "chatbase-visible";

export default function BodyRouteClass() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const body = document.body;

    if (pathname === "/menu") {
      body.classList.add(CLASS_NAME);
    } else {
      body.classList.remove(CLASS_NAME);
    }
  }, [pathname]);

  return null;
}
