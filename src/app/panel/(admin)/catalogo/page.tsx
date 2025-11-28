"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CategoriaBase = "Alimentos" | "Premios" | "Grooming" | "Recetados";

type Producto = {
  id: string;
  nombre: string;
  sub: string;
  categoria: CategoriaBase;
  precio: number;
  activo: boolean;
  imageUrl?: string;
};

type FormProducto = {
  nombre: string;
  sub: string;
  categoria: CategoriaBase;
  precio: number;
  activo: boolean;
};

export default function CatalogoPage() {
  const router = useRouter();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormProducto>({
    nombre: "",
    sub: "",
    categoria: "Alimentos",
    precio: 0,
    activo: true,
  });

  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  // ---------------------------
  // Helpers
  // ---------------------------

  const resetForm = () => {
    setForm({
      nombre: "",
      sub: "",
      categoria: "Alimentos",
      precio: 0,
      activo: true,
    });
    setImageData(null);
    setImagePreview(null);
    setEditingId(null);
  };

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) {
        throw new Error("No se pudo cargar el catálogo");
      }
      const data: Producto[] = await res.json();
      setProductos(data);
    } catch (err) {
      console.error(err);
      setError("Error cargando productos.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Efectos
  // ---------------------------

  useEffect(() => {
    fetchProductos();
  }, []);

  // ---------------------------
  // Handlers formulario
  // ---------------------------

const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const target = e.target;

  // Checkbox
  if (target instanceof HTMLInputElement && target.type === "checkbox") {
    setForm((prev) => ({
      ...prev,
      [target.name]: target.checked,
    }));
    return;
  }

  // Inputs normales y selects
  if (target.name === "precio") {
    setForm((prev) => ({
      ...prev,
      precio: Number(target.value),
    }));
    return;
  }

  setForm((prev) => ({
    ...prev,
    [target.name]: target.value,
  }));
};

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageData(null);
      setImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string; // data:image/...;base64,...
      setImageData(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleCrearOActualizar = async () => {
    if (!form.nombre.trim() || !form.sub.trim()) {
      alert("Completa el nombre y la presentación del producto.");
      return;
    }

    if (form.precio <= 0) {
      if (!confirm("El precio es 0. ¿Deseas continuar?")) {
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        nombre: form.nombre.trim(),
        sub: form.sub.trim(),
        categoria: form.categoria,
        precio: form.precio,
        activo: form.activo,
        imageUrl: imageData ?? undefined,
      };

      if (!editingId) {
        // CREAR
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error(await res.text());
          alert("No se pudo guardar el producto.");
          return;
        }

        const creado: Producto = await res.json();
        setProductos((prev) => [...prev, creado]);
      } else {
        // EDITAR
        const res = await fetch(`/api/products/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error(await res.text());
          alert("No se pudo actualizar el producto.");
          return;
        }

        const actualizado: Producto = await res.json();
        setProductos((prev) =>
          prev.map((p) => (p.id === actualizado.id ? actualizado : p))
        );
      }

      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error guardando el producto.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (producto: Producto) => {
    setEditingId(producto.id);
    setForm({
      nombre: producto.nombre,
      sub: producto.sub,
      categoria: producto.categoria,
      precio: producto.precio,
      activo: producto.activo,
    });
    setImagePreview(producto.imageUrl ?? null);
    setImageData(producto.imageUrl ?? null); // reutilizamos lo que ya hay
  };

  const handleEliminar = async (producto: Producto) => {
    if (
      !confirm(
        `¿Seguro que deseas eliminar el producto "${producto.nombre}"?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${producto.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error(await res.text());
        alert("No se pudo eliminar el producto.");
        return;
      }

      setProductos((prev) => prev.filter((p) => p.id !== producto.id));

      if (editingId === producto.id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      alert("Error eliminando el producto.");
    }
  };

  const handleVolver = () => {
    router.push("/panel");
  };

  // ---------------------------
  // Render
  // ---------------------------

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          Catálogo de Productos
        </h1>
        <button
          onClick={handleVolver}
          className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-yellow-300"
        >
          Atrás
        </button>
      </div>

      {/* Nuevo / Editar producto */}
      <section className="mb-8 rounded-3xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          {editingId ? "Editar producto" : "Nuevo producto"}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleInputChange}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              placeholder="Dog Chow"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              Detalle / Presentación
            </label>
            <input
              type="text"
              name="sub"
              value={form.sub}
              onChange={handleInputChange}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              placeholder="Adultos Grandes 15kg"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              Categoría
            </label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleInputChange}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            >
              <option value="Alimentos">Alimentos</option>
              <option value="Premios">Premios</option>
              <option value="Grooming">Grooming</option>
              <option value="Recetados">Recetados</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              Precio (S/)
            </label>
            <input
              type="number"
              name="precio"
              min={0}
              step={0.01}
              value={form.precio}
              onChange={handleInputChange}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            />
          </div>
        </div>

        {/* Imagen */}
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">
            Imagen del producto
          </label>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleImageChange}
              className="text-sm"
            />
            <span className="text-xs text-slate-500">JPG o PNG</span>
          </div>

          {imagePreview && (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={imagePreview}
                alt="Vista previa"
                className="h-16 w-16 rounded-md object-cover"
              />
              <span className="text-xs text-slate-500">
                Vista previa de la imagen seleccionada
              </span>
            </div>
          )}
        </div>

        {/* Activo + acciones */}
        <div className="mt-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="activo"
              checked={form.activo}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400"
            />
            <span>Producto activo en el catálogo</span>
          </label>

          <div className="flex gap-3">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                disabled={saving}
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              onClick={handleCrearOActualizar}
              disabled={saving}
              className="rounded-full bg-yellow-400 px-6 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? editingId
                  ? "Guardando..."
                  : "Creando..."
                : editingId
                  ? "Guardar cambios"
                  : "Crear producto"}
            </button>
          </div>
        </div>
      </section>

      {/* Lista de productos */}
      <section className="rounded-3xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Productos registrados
          </h2>
          <button
            onClick={fetchProductos}
            className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Actualizar
          </button>
        </div>

        {error && (
          <p className="mb-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-slate-600">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="text-sm text-slate-600">
            No hay productos registrados todavía.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Imagen</th>
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Detalle</th>
                  <th className="py-2 pr-4">Categoría</th>
                  <th className="py-2 pr-4">Precio</th>
                  <th className="py-2 pr-4">Activo</th>
                  <th className="py-2 pr-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-2 pr-4">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.nombre}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                          Sin imagen
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-semibold text-slate-800">
                      {p.nombre}
                    </td>
                    <td className="py-2 pr-4 text-slate-700">{p.sub}</td>
                    <td className="py-2 pr-4 text-slate-700">{p.categoria}</td>
                    <td className="py-2 pr-4 text-slate-800">
                      S/ {p.precio.toFixed(2)}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          p.activo
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditar(p)}
                          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(p)}
                          className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
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
  );
}
