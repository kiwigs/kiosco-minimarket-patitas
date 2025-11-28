"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, FormEvent } from "react";
import { type CategoriaBase } from "@/lib/productsStore";
import { useRouter } from "next/navigation";

type Producto = {
  id: string;
  nombre: string;
  sub: string;
  categoria: CategoriaBase;
  precio: number;
  activo: boolean;
  imageUrl?: string;
};

const CATEGORIAS: CategoriaBase[] = [
  "Alimentos",
  "Premios",
  "Grooming",
  "Recetados",
];

export default function CatalogoAdminPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    nombre: string;
    sub: string;
    categoria: CategoriaBase;
    precio: string;
    activo: boolean;
    imageUrl: string;
    imageName: string;
  }>({
    nombre: "",
    sub: "",
    categoria: "Alimentos",
    precio: "",
    activo: true,
    imageUrl: "",
    imageName: "",
  });

  // -----------------------------
  // FETCH PRODUCTS
  // -----------------------------
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error cargando productos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // -----------------------------
  // RESET FORM
  // -----------------------------
  const resetForm = () => {
    setEditingId(null);
    setForm({
      nombre: "",
      sub: "",
      categoria: "Alimentos",
      precio: "",
      activo: true,
      imageUrl: "",
      imageName: "",
    });
  };

  // -----------------------------
  // IMAGE UPLOAD
  // -----------------------------
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.url) {
      setForm((f) => ({
        ...f,
        imageUrl: data.url,
        imageName: file.name,
      }));
    }
  };

  // -----------------------------
  // SUBMIT
  // -----------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        nombre: form.nombre.trim(),
        sub: form.sub.trim(),
        categoria: form.categoria,
        precio: Number(form.precio),
        activo: form.activo,
        imageUrl: form.imageUrl,
      };

      if (!payload.nombre || !payload.sub || Number.isNaN(payload.precio)) {
        alert("Complete nombre, detalle y precio válido.");
        setSaving(false);
        return;
      }

      const url = editingId
        ? `/api/products/${editingId}`
        : "/api/products";

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("No se pudo guardar el producto.");
        setSaving(false);
        return;
      }

      await fetchProducts();
      resetForm();
    } catch (err) {
      console.error("Error guardando producto:", err);
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // EDIT PRODUCT
  // -----------------------------
  const handleEdit = (p: Producto) => {
    setEditingId(p.id);
    setForm({
      nombre: p.nombre,
      sub: p.sub,
      categoria: p.categoria,
      precio: p.precio.toString(),
      activo: p.activo,
      imageUrl: p.imageUrl ?? "",
      imageName: "",
    });
  };

  // -----------------------------
  // DELETE PRODUCT
  // -----------------------------
  const handleDelete = async (id: string) => {
    const ok = window.confirm("¿Eliminar este producto del catálogo?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("No se pudo eliminar el producto.");
        return;
      }

      await fetchProducts();
    } catch (err) {
      console.error("Error eliminando producto:", err);
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* HEADER */}
      <header className="w-full bg-[#f2c200] text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-wide">
              Catálogo de Productos
            </h1>
          </div>

          <button
            onClick={() => router.push("/panel")}
            className="rounded-xl bg-black/30 px-3 py-1 text-xs font-semibold shadow hover:bg-black/40"
          >
            Atrás
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {/* FORMULARIO */}
        <section className="rounded-2xl bg-white p-4 shadow">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">
            {editingId ? "Editar producto" : "Nuevo producto"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid gap-3 sm:grid-cols-2"
          >
            {/* Nombre */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                Nombre
              </label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder="Dog Chow"
              />
            </div>

            {/* Sub */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                Detalle / Presentación
              </label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={form.sub}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sub: e.target.value }))
                }
                placeholder="Adultos Grandes 15kg"
              />
            </div>

            {/* Categoría */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                Categoría
              </label>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white text-gray-900"
                value={form.categoria}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    categoria: e.target.value as CategoriaBase,
                  }))
                }
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                Precio (S/)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={form.precio}
                onChange={(e) =>
                  setForm((f) => ({ ...f, precio: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>

            {/* Imagen */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">
                Imagen del producto
              </label>

              {/* input real oculto */}
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* “botón” visual */}
              <label
                htmlFor="imageUpload"
                className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm bg_white cursor-pointer hover:bg-gray-50"
              >
                <span
                  className={
                    form.imageUrl ? "text-gray-900" : "text-gray-400"
                  }
                >
                  {form.imageUrl
                    ? "Cambiar imagen del producto"
                    : "Seleccionar imagen del producto"}
                </span>
                <span className="text-[11px] text-gray-500">
                  JPG o PNG
                </span>
              </label>

              {/* info y preview */}
              <div className="mt-2 flex items-center gap-3">
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    className="h-16 w-16 rounded-xl object-cover border"
                  />
                )}
                {form.imageName && (
                  <span className="text-[11px] text-gray-600 truncate max-w-xs">
                    {form.imageName}
                  </span>
                )}
              </div>
            </div>

            {/* Activo */}
            <div className="flex items-center gap-2">
              <input
                id="activo"
                type="checkbox"
                checked={form.activo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, activo: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="activo"
                className="text-xs font-semibold text-gray-700"
              >
                Producto activo en el catálogo
              </label>
            </div>

            {/* BOTONES */}
            <div className="flex items-center justify-end gap-2 sm:col-span-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar edición
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#f2c200] px-4 py-2 text-xs font-semibold text-white shadow hover:brightness-105 disabled:opacity-60"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                  ? "Guardar cambios"
                  : "Crear producto"}
              </button>
            </div>
          </form>
        </section>

        {/* TABLA */}
        <section className="rounded-2xl bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">
              Productos registrados
            </h2>
            <button
              onClick={fetchProducts} 
              className="rounded-2xl bg-gray-800 px-3 py-1 text-xs font-semibold text-white shadow hover:brightness-110"
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-gray-500">Cargando catálogo...</p>
          ) : products.length === 0 ? (
            <p className="text-xs text-gray-500">
              No hay productos registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-left text-gray-600">
                      Imagen
                    </th>
                    <th className="px-3 py-2 font-semibold text-left text-gray-600">
                      Nombre
                    </th>
                    <th className="px-3 py-2 font-semibold text-left text-gray-600">
                      Detalle
                    </th>
                    <th className="px-3 py-2 font-semibold text-left text-gray-600">
                      Categoría
                    </th>
                    <th className="px-3 py-2 font-semibold text-right text-gray-600">
                      Precio
                    </th>
                    <th className="px-3 py-2 font-semibold text-center text-gray-600">
                      Activo
                    </th>
                    <th className="px-3 py-2 font-semibold text-right text-gray-600">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border_t">
                      {/* Imagen */}
                      <td className="px-3 py-2">
                        {p.imageUrl ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={p.imageUrl}
                              className="h-10 w-10 rounded-xl object-cover border"
                              alt={p.nombre}
                            />
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                              Imagen cargada
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                            Sin imagen
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 font-semibold text-gray-900">
                        {p.nombre}
                      </td>

                      <td className="px-3 py-2 text-gray-700">
                        {p.sub}
                      </td>

                      <td className="px-3 py-2 text-gray-700">
                        {p.categoria}
                      </td>

                      <td className="px-3 py-2 text-right text-gray-800">
                        S/ {p.precio.toFixed(2)}
                      </td>

                      <td className="px-3 py-2 text-center">
                        <span
                          className={
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                            (p.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-500")
                          }
                        >
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="rounded-xl border border-gray-300 px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => handleDelete(p.id)}
                            className="rounded-xl bg-red-600 px-2 py-1 text-[10px] font-semibold text-white hover:brightness-110"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
