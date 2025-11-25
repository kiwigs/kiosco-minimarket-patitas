// src/app/panel/(admin)/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 👇 Aquí usamos await porque TS lo tipa como Promise<ReadonlyRequestCookies>
  const cookieStore = await cookies();
  const auth = cookieStore.get("panel_auth")?.value;

  if (auth !== "1") {
    redirect("/panel/login");
  }

  return <>{children}</>;
}
