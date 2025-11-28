"use client";

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
  imageUrl?: string | null;
};

export default function Catalogo() {
  const router = useRouter();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    sub: "",
    categoria: "Alimentos" as CategoriaBase,
    precio: 0,
    activo: true,
  });

  // ESTO ES LO NUEVO ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

  const cargarProductos = async () => {
    try {
      const res = await fetch("/api/products");
      const data: Producto[] = await res.json();
      setProductos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // HANDLER DE INPUT (CORREGIDO)
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;

    // checkbox
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setNuevoProducto((prev) => ({
        ...prev,
        [target.name]: target.checked,
      }));
      return;
    }

    // precio numérico
    if (target.name === "precio") {
      setNuevoProducto((prev) => ({
        ...prev,
        precio: Number(target.value),
      }));
      return;
    }

    // inputs normales y selects
    setNuevoProducto((prev) => ({
      ...prev,
      [target.name]: target.value,
    }));
  };

  // HANDLER PARA IMAGEN (NUEVO)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageData(null);
      setImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageData(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  // CREAR PRODUCTO (CORREGIDO)
  const crearProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.sub) {
      alert("Completa todos los campos.");
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoProducto,
          imageUrl: imageData ?? null, // 👈 MÁGIA
        }),
      });

      if (!res.ok) {
        alert("No se pudo guardar el producto.");
        return;
      }

      await cargarProductos();

      setNuevoProducto({
        nombre: "",
        sub: "",
        categoria: "Alimentos",
        precio: 0,
        activo: true,
      });

      setImageData(null);
      setImagePreview(null);

    } catch (e) {
      console.error(e);
      alert("Error guardando producto.");
    }
  };

  // ELIMINAR (igual que tu código)
  const eliminarProducto = async (id: string) => {
    if (!confirm("¿Eliminar producto?")) return;

    await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });

    cargarProductos();
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Catálogo de Productos</h1>

      {/* NUEVO PRODUCTO */}
      <div className="bg-white shadow p-6 rounded-2xl mb-8">
        <h2 className="text-lg font-semibold mb-4">Nuevo producto</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="font-medium text-sm">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={nuevoProducto.nombre}
              onChange={handleInputChange}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>

          {/* Sub */}
          <div>
            <label className="font-medium text-sm">Detalle / Presentación</label>
            <input
              type="text"
              name="sub"
              value={nuevoProducto.sub}
              onChange={handleInputChange}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="font-medium text-sm">Categoría</label>
            <select
              name="categoria"
              value={nuevoProducto.categoria}
              onChange={handleInputChange}
              className="w-full border rounded-xl px-3 py-2"
            >
              <option value="Alimentos">Alimentos</option>
              <option value="Premios">Premios</option>
              <option value="Grooming">Grooming</option>
              <option value="Recetados">Recetados</option>
            </select>
          </div>

          {/* Precio */}
          <div>
            <label className="font-medium text-sm">Precio (S/)</label>
            <input
              type="number"
              name="precio"
              min={0}
              value={nuevoProducto.precio}
              onChange={handleInputChange}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
        </div>

        {/* Imagen */}
        <div className="mt-4">
          <label className="font-medium text-sm">Imagen del producto</label>
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleImageChange}
            className="mt-2"
          />

          {imagePreview && (
            <img
              src={imagePreview}
              alt="preview"
              className="mt-3 h-20 w-20 object-cover rounded-md border"
            />
          )}
        </div>

        {/* Activo */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            name="activo"
            checked={nuevoProducto.activo}
            onChange={handleInputChange}
          />
          <span className="text-sm">Producto activo en el catálogo</span>
        </div>

        <button
          onClick={crearProducto}
          className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-full font-semibold"
        >
          Crear producto
        </button>
      </div>

      {/* LISTA */}
      <div className="bg-white shadow p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Productos registrados</h2>
          <button
            onClick={cargarProductos}
            className="px-4 py-1 bg-slate-900 text-white rounded-full"
          >
            Actualizar
          </button>
        </div>

        {cargando ? (
          <p>Cargando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Imagen</th>
                <th>Nombre</th>
                <th>Detalle</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Activo</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.nombre}
                        className="h-12 w-12 object-cover rounded-md"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">Sin imagen</span>
                    )}
                  </td>

                  <td>{p.nombre}</td>
                  <td>{p.sub}</td>
                  <td>{p.categoria}</td>
                  <td>S/ {p.precio.toFixed(2)}</td>
                  <td>
                    {p.activo ? (
                      <span className="text-green-600 font-semibold">Activo</span>
                    ) : (
                      <span className="text-slate-500">Inactivo</span>
                    )}
                  </td>

                  <td>
                    <button
                      onClick={() => eliminarProducto(p.id)}
                      className="text-red-600 font-semibold"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </main>
  );
}
