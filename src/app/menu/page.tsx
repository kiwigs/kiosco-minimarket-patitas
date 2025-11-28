"use client";

/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

/** ---- Tipos ---- */
type Categoria = "Grooming" | "Alimentos" | "Premios" | "Recetados";

type Producto = {
  id: string;
  nombre: string;
  sub: string;
  precio: number; // S/
  img?: string; // ruta en /public o URL
  categoria: Categoria;
};

type ProductoDB = {
  id: string;
  nombre: string;
  sub: string;
  categoria: Categoria;
  precio: number;
  activo: boolean;
  imageUrl?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** ---- Botón de categoría ---- */
function CategoriaBtn({
  active,
  icon,
  label,
  size = "md",
  onClick,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  size?: "lg" | "md" | "sm";
  onClick: () => void;
}) {
  const sizeClasses =
    size === "lg"
      ? "h-24 w-28 text-base"
      : size === "sm"
      ? "h-16 w-20 text-xs"
      : "h-20 w-24 text-sm";

  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-col items-center justify-center rounded-xl border shadow-sm transition-all",
        sizeClasses,
        active
          ? "bg-white border-gray-300 shadow-md scale-100"
          : "bg-white/80 border-gray-200 hover:bg-white scale-95 opacity-80",
      ].join(" ")}
      style={{ willChange: "transform" }}
    >
      <span
        className={size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl"}
      >
        {icon}
      </span>
      <span className="mt-1 text-black">{label}</span>
    </button>
  );
}

/** ---- Tarjeta de Producto ---- */
function ProductCard({
  p,
  onSelect,
}: {
  p: Producto;
  onSelect: (p: Producto, rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);

  return (
    <button
      ref={ref}
      onClick={() => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          onSelect(p, rect);
        }
      }}
      className="
        group flex w-full max-w-[220px] flex-col
        active:translate-y-[1px] active:shadow-inner
        transition
      "
    >
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border bg-white shadow-sm">
        {p.img ? (
          <img
            src={p.img}
            alt={p.nombre}
            className="h-full w-full object-contain p-2"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <span className="text-gray-400">Sin imagen</span>
          </div>
        )}
      </div>
      <div className="mt-3 text-left">
        <div className="text-[15px] font-semibold text-gray-900 leading-tight">
          {p.nombre}
        </div>
        <div className="text-sm text-gray-600">{p.sub}</div>
        <div className="mt-1 text-[15px] font-semibold text-gray-800">
          S/ {p.precio.toFixed(2)}
        </div>
      </div>
    </button>
  );
}

/** ---- Página ---- */
export default function MenuPage() {
  const router = useRouter();

  const [cat, setCat] = useState<Categoria>("Alimentos");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const hydratedRef = useRef(false);

  // catálogo desde la BD
  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // estado de la barrita flotante sobre el producto
  const [pendingProduct, setPendingProduct] = useState<Producto | null>(null);
  const [pendingQty, setPendingQty] = useState(1);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [pendingTimer, setPendingTimer] =
    useState<ReturnType<typeof setTimeout> | null>(null);

  // animaciones carrito
  const [lastChangedId, setLastChangedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [totalBump, setTotalBump] = useState(false);
  const prevTotalRef = useRef(0);

  // --- Chat de IA veterinaria (solo menú) ---
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  /** ---- Carga catálogo desde /api/products ---- */
  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) {
          setCatalogError("No se pudo cargar el catálogo.");
          return;
        }

        const data: ProductoDB[] = await res.json();
        const activos = data.filter((p) => p.activo);

        const mapeados: Producto[] = activos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          sub: p.sub,
          precio: p.precio,
          categoria: p.categoria,
          img: p.imageUrl ?? undefined,
        }));

        setCatalogo(mapeados);
      } catch (err) {
        console.error("Error trayendo catálogo:", err);
        setCatalogError("Error de conexión con el catálogo.");
      } finally {
        setLoadingCatalogo(false);
      }
    };

    fetchCatalogo();
  }, []);

  useEffect(() => {
    if (!lastChangedId) return;

    const t = setTimeout(() => {
      setLastChangedId(null); // vuelve al estado "normal"
    }, 220);

    return () => clearTimeout(t);
  }, [lastChangedId]);

  const productos = useMemo(
    () => catalogo.filter((p) => p.categoria === cat),
    [catalogo, cat]
  );

  const total = useMemo(() => {
    return Object.entries(cart).reduce((acc, [id, qty]) => {
      const prod = catalogo.find((p) => p.id === id);
      return acc + (prod ? prod.precio * qty : 0);
    }, 0);
  }, [cart, catalogo]);

  useEffect(() => {
    if (total !== prevTotalRef.current) {
      setTotalBump(true);
      const t = setTimeout(() => setTotalBump(false), 180);
      prevTotalRef.current = total;
      return () => clearTimeout(t);
    }
  }, [total]);

  const clearCart = () => {
    setCart({});
    if (typeof window !== "undefined") {
      sessionStorage.setItem("kiosk-cart", JSON.stringify({}));
    }
  };

  const handleNext = () => {
    if (Object.keys(cart).length === 0) return; // blindaje extra

    if (typeof window !== "undefined") {
      sessionStorage.setItem("kiosk-cart", JSON.stringify(cart));
    }

    router.push("/resumen");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("kiosk-cart");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setCart(parsed || {});
    } catch {
      setCart({});
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Primer render: marcar como hidratado y NO escribir
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    // Después del primer render sí sincronizamos al storage
    sessionStorage.setItem("kiosk-cart", JSON.stringify(cart));
  }, [cart]);

  /** ---- helpers de la barrita flotante ---- */

  // ref con la "verdad" de lo pendiente
  const pendingRef = useRef<{ product: Producto | null; qty: number }>({
    product: null,
    qty: 1,
  });

  // función para resetear la UI
  const resetPendingUi = () => {
    setPendingProduct(null);
    setPendingQty(1);
    setPendingPos(null);
  };

  // programa el timer de 3 segundos que agrega lo pendiente del ref
  const schedulePendingTimer = () => {
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      setPendingTimer(null);
    }

    const t = setTimeout(() => {
      const { product, qty } = pendingRef.current;
      if (product && qty > 0) {
        setCart((c) => ({
          ...c,
          [product.id]: (c[product.id] ?? 0) + qty,
        }));
        setLastChangedId(product.id);
      }

      pendingRef.current = { product: null, qty: 1 };
      resetPendingUi();
      setPendingTimer(null);
    }, 3000);

    setPendingTimer(t);
  };

  // click en tarjeta de producto
  const startPending = (p: Producto, rect: DOMRect) => {
    const { product: oldProd, qty: oldQty } = pendingRef.current;

    if (oldProd && oldProd.id !== p.id && oldQty > 0) {
      setCart((c) => ({
        ...c,
        [oldProd.id]: (c[oldProd.id] ?? 0) + oldQty,
      }));
      setLastChangedId(oldProd.id);
    }

    let newQty = 1;
    if (oldProd && oldProd.id === p.id) {
      newQty = oldQty + 1;
    }

    pendingRef.current = { product: p, qty: newQty };
    setPendingProduct(p);
    setPendingQty(newQty);
    setPendingPos({
      x: rect.right,
      y: rect.top,
    });

    schedulePendingTimer();
  };

  const incPending = () => {
    if (!pendingRef.current.product) return;

    setPendingQty((q) => {
      const newQty = q + 1;
      pendingRef.current = {
        ...pendingRef.current,
        qty: newQty,
      };
      return newQty;
    });

    schedulePendingTimer();
  };

  const decPending = () => {
    if (!pendingRef.current.product) return;

    setPendingQty((q) => {
      const newQty = Math.max(0, q - 1);
      pendingRef.current = {
        ...pendingRef.current,
        qty: newQty,
      };
      return newQty;
    });

    schedulePendingTimer();
  };

  /** ---- Lógica del chat ---- */
  const handleSendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: msg },
    ];

    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/kiosk-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      let data: { reply?: string; error?: string } | undefined;
      try {
        data = (await res.json()) as { reply?: string; error?: string };
      } catch {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "El servidor de chat devolvió una respuesta inválida. Consulta al administrador del sistema.",
          },
        ]);
        return;
      }

      if (data?.error && !data?.reply) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: String(data.error) },
        ]);
        return;
      }

      const reply: string =
        data?.reply ??
        (typeof data?.error === "string"
          ? data.error
          : "No pude obtener respuesta del modelo de IA.");

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    } catch (err) {
      console.error("Error llamando a /api/kiosk-chat:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "No se pudo contactar con el servidor de chat. Verifica tu conexión o la configuración del backend.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      {/* Franja superior (banner) */}
      <div className="relative h-40 w-full overflow-hidden">
        <img src="/banner.png" alt="Banner" className="h-full w-full object-cover" />
      </div>

      {/* Contenido principal */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-6 pt-4">
        {/* Columna izquierda */}
        <div className="flex w-[140px] flex-col items-center pt-6 pb-8">
          <img src="/logo.png" className="h-24 w-24 object-contain mb-6" />

          <div className="flex flex-1 flex-col items-center justify-center gap-4 translate-y-[-10%]">
            {["Grooming", "Alimentos", "Premios", "Recetados"].map((label) => {
              const order: Categoria[] = [
                "Grooming",
                "Alimentos",
                "Premios",
                "Recetados",
              ];
              const activeIndex = order.indexOf(cat);
              const i = order.indexOf(label as Categoria);
              const d = Math.abs(i - activeIndex);
              const size = d === 0 ? "lg" : d === 1 ? "md" : "sm";
              const icon =
                label === "Grooming"
                  ? "🧴"
                  : label === "Alimentos"
                  ? "🦴"
                  : label === "Premios"
                  ? "🍪"
                  : "🧾";

              return (
                <div key={label} style={{ opacity: d === 0 ? 1 : 0.8 }}>
                  <CategoriaBtn
                    label={label}
                    icon={icon}
                    size={size as "lg" | "md" | "sm"}
                    active={label === cat}
                    onClick={() => setCat(label as Categoria)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <div className="relative mb-6 flex items-center justify-end">
            <h2 className="absolute left-1/2 -translate-x-[65%] text-3xl font-extrabold tracking-wide text-[#f2c200] whitespace-nowrap">
              MENÚ PRINCIPAL
            </h2>

            <button
              onClick={() => setShowBackConfirm(true)}
              className="rounded-2xl border border-gray-300 bg-white px-5 py-2 text-[17px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:translate-y-[1px] active:shadow-inner transition"
            >
              Atrás
            </button>
          </div>

          {/* Grilla productos */}
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 mt-6 sm:grid-cols-2 md:grid-cols-3">
            {productos.map((p) => (
              <ProductCard key={p.id} p={p} onSelect={startPending} />
            ))}
          </div>

          {/* Estados de carga / error */}
          {loadingCatalogo && (
            <p className="mt-4 text-gray-500 text-sm">Cargando catálogo...</p>
          )}

          {catalogError && (
            <p className="mt-4 text-red-600 font-semibold">{catalogError}</p>
          )}

          {!loadingCatalogo && !catalogError && productos.length === 0 && (
            <p className="mt-4 text-gray-500 text-sm">
              No hay productos disponibles en esta categoría.
            </p>
          )}
        </div>
      </div>

      {/* Botón flotante del chat (justo sobre "Mi Orden") */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        className="fixed bottom-32 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2c200] shadow-xl border border-black/10 active:translate-y-[1px] active:shadow-inner"
      >
        <span className="text-2xl">🐾</span>
      </button>

      {/* Ventana de chat */}
      {chatOpen && (
        <div className="fixed bottom-52 right-6 z-50 w-[320px] max-h-[70vh] rounded-2xl bg-white shadow-2xl border border-black/10 flex flex-col text-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b border-black/10 bg-[#f9f9f9] rounded-t-2xl">
            <div className="flex flex-col">
              <span className="font-semibold text-[13px]">
                Asistente veterinario
              </span>
              <span className="text-[11px] text-gray-500">
                Orientación básica. No reemplaza consulta presencial.
              </span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-xs text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {chatMessages.length === 0 && (
              <p className="text-[11px] text-gray-500">
                Ejemplos: “mi perro tiene diarrea”, “¿qué alimento recomiendas
                para gato esterilizado?”.
              </p>
            )}

            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={[
                    "max-w-[80%] rounded-2xl px-3 py-2 text-[12px] leading-snug",
                    m.role === "user"
                      ? "bg-[#f2c200] text-black rounded-br-sm"
                      : "bg-[#f1f1f1] text-gray-800 rounded-bl-sm",
                  ].join(" ")}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#f1f1f1] text-gray-600 rounded-2xl rounded-bl-sm px-3 py-2 text-[12px]">
                  Pensando...
                </div>
              </div>
            )}
          </div>

          <form
            className="border-t border-black/10 px-2 py-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Describe el problema de tu mascota..."
              className="flex-1 rounded-xl border border-black/20 px-2 py-1 text-[12px] outline-none focus:ring-1 focus:ring-[#f2c200]"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="rounded-xl bg-[#f2c200] px-3 py-1 text-[12px] font-medium disabled:opacity-60"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      {/* Barra inferior de Orden */}
      <div className="mt-4 w-full border-t bg-white">
        <div className="w-full bg-[#f2c200] px-6 py-2 text-sm font-bold text-white">
          <div className="mx-auto max-w-6xl">Mi Orden</div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8">
          {Object.keys(cart).length === 0 ? (
            <>
              <p className="text-center text-lg text-gray-700">
                Su orden está vacía
              </p>

              <div className="mt-6 flex justify-center gap-6">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full max-w-xs rounded-2xl bg-[#b71c1c] px-8 py-4 text-white font-semibold shadow-md hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
                >
                  Cancelar orden
                </button>
                {/* Siguiente – deshabilitado con carrito vacío */}
                <button
                  onClick={handleNext}
                  disabled={Object.keys(cart).length === 0}
                  className={[
                    "w-full max-w-xs rounded-2xl px-8 py-4 font-semibold shadow-md transition",
                    Object.keys(cart).length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#f2c200] text-white hover:brightness-110 active:translate-y-[1px] active:shadow-inner",
                  ].join(" ")}
                >
                  Siguiente
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Lista de productos del carrito - DESLIZABLE */}
              <div className="max-h-64 overflow-y-auto overflow-x-hidden pr-2">
                <ul className="flex flex-col gap-4">
                  {Object.entries(cart).map(([id, qty]) => {
                    const p = catalogo.find((x) => x.id === id);
                    if (!p) return null;

                    return (
                      <li
                        key={id}
                        className={[
                          "flex items-center gap-4 py-2 px-3 rounded-xl transition-all duration-200",
                          removingId === id
                            ? "opacity-0 -translate-x-4"
                            : "opacity-100 translate-x-0",
                          lastChangedId === id
                            ? "scale-105 bg-yellow-50 shadow-md"
                            : "scale-100 bg-white",
                        ].join(" ")}
                      >
                        {/* imagen */}
                        <div className="h-14 w-14 rounded-lg border overflow-hidden">
                          <img
                            src={p.img ?? "/producto.png"}
                            className="h-full w-full object-contain p-1"
                          />
                        </div>

                        {/* info + barrita */}
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-semibold text-gray-900">
                            {p.nombre}
                          </div>
                          <div className="truncate text-sm text-gray-600">
                            {p.sub}
                          </div>

                          {/* barrita +/– dentro del carrito */}
                          <div className="mt-2 flex items-center gap-3">
                            {/* – */}
                            <button
                              onClick={() => {
                                if (qty <= 1) {
                                  setRemovingId(id);
                                  setTimeout(() => {
                                    setCart((c) => {
                                      const copy = { ...c };
                                      delete copy[id];
                                      return copy;
                                    });
                                    setRemovingId(null);
                                  }, 180);
                                } else {
                                  setCart((c) => ({
                                    ...c,
                                    [id]: qty - 1,
                                  }));
                                  setLastChangedId(id);
                                }
                              }}
                              className="rounded-xl bg-[#b71c1c] text-white w-8 h-8 flex items-center justify-center active:translate-y-[1px] active:shadow-inner transition"
                            >
                              –
                            </button>

                            {/* cantidad */}
                            <div className="min-w-[24px] text-center font-bold text-lg text-black">
                              {qty}
                            </div>

                            {/* + */}
                            <button
                              onClick={() => {
                                setCart((c) => ({
                                  ...c,
                                  [id]: qty + 1,
                                }));
                                setLastChangedId(id);
                              }}
                              className="rounded-xl bg-[#f2c200] w-8 h-8 flex items-center justify-center font-semibold text-gray-900 active:translate-y-[1px] active:shadow-inner transition"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* subtotal */}
                        <div className="text-right mr-2">
                          <div className="font-semibold text-gray-900">
                            S/ {(p.precio * qty).toFixed(2)}
                          </div>
                        </div>

                        {/* eliminar */}
                        <button
                          onClick={() => {
                            setRemovingId(id);
                            setTimeout(() => {
                              setCart((c) => {
                                const copy = { ...c };
                                delete copy[id];
                                return copy;
                              });
                              setRemovingId(null);
                            }, 180);
                          }}
                          className="
                            text-[#b71c1c] hover:text-[#7f0f0f]
                            text-2xl font-extrabold
                            px-3
                            transition
                          "
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Total con animación */}
              <div className="mt-4 border-t pt-4 text-right text-lg font-bold text-gray-900">
                <span>Total:&nbsp;</span>
                <span
                  className={[
                    "inline-block transition-transform duration-200",
                    totalBump ? "scale-110" : "scale-100",
                  ].join(" ")}
                >
                  S/ {total.toFixed(2)}
                </span>
              </div>

              {/* Vaciar carrito */}
              <div className="mt-3 flex justify-end">
                <button
                  onClick={clearCart}
                  className="
                    rounded-2xl bg-[#b71c1c]
                    px-6 py-2 text-[14px] font-semibold text-white
                    shadow-md hover:brightness-110
                    active:translate-y-[1px] active:shadow-inner
                    transition
                  "
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Botones finales */}
              <div className="mt-6 flex w-full items-center justify-center gap-6">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full max-w-xs rounded-2xl bg-[#b71c1c] px-8 py-4 text-[16px] font-semibold text-white shadow-md hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
                >
                  Cancelar orden
                </button>
                {/* Siguiente – mismo patrón de estilos, pero aquí siempre habilitado porque hay productos */}
                <button
                  onClick={handleNext}
                  disabled={Object.keys(cart).length === 0}
                  className={[
                    "w-full max-w-xs rounded-2xl px-8 py-4 text-[16px] font-semibold shadow-md transition",
                    Object.keys(cart).length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#f2c200] text-white hover:brightness-110 active:translate-y-[1px] active:shadow-inner",
                  ].join(" ")}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Barrita de + / – sobre el producto seleccionado */}
      {pendingProduct && pendingPos && (
        <div
          className="fixed z-[60] rounded-2xl bg-white shadow-xl border px-4 py-3 flex items-center gap-4"
          style={{
            top: pendingPos.y - 10,
            left: pendingPos.x - 140,
          }}
        >
          <button
            onClick={decPending}
            className="
              rounded-xl w-8 h-8 flex items-center justify-center
              bg-[#b71c1c] text-white
              active:translate-y-[1px] active:shadow-inner transition
            "
          >
            –
          </button>

          <div className="min-w-[24px] text-center font-bold text-lg text-black">
            {pendingQty}
          </div>

          <button
            onClick={incPending}
            className="rounded-xl bg-[#f2c200] w-8 h-8 flex items-center justify-center font-semibold text-black active:translate-y-[1px] active:shadow-inner transition"
          >
            +
          </button>
        </div>
      )}

      {/* Pop-up de confirmación para "Atrás" */}
      {showBackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-6 text-center text-lg font-semibold text-gray-800">
              ¿Está seguro de querer regresar?
            </p>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => {
                  setShowBackConfirm(false);
                  router.back();
                }}
                className="min-w-[150px] rounded-2xl bg-[#f2c200] px-6 py-3 text-[16px] font-semibold text-white shadow-md hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
              >
                Sí
              </button>

              <button
                onClick={() => setShowBackConfirm(false)}
                className="min-w-[150px] rounded-2xl bg-[#b71c1c] px-6 py-3 text-[16px] font-semibold text-white shadow-md hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up de confirmación para "Cancelar orden" */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-6 text-center text-lg font-semibold text-gray-800">
              ¿Está seguro de querer cancelar la orden?
            </p>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => {
                  clearCart();
                  setShowCancelConfirm(false);
                  router.push("/");
                }}
                className="min-w-[150px] rounded-2xl bg-[#f2c200] px-6 py-3 text-[16px] font-semibold text-white shadow-md hover:brightness-110 active:translate-y-[1px] active:shadow-inner transition"
              >
                Sí
              </button>

              <button
                onClick={() => setShowCancelConfirm(false)}
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
