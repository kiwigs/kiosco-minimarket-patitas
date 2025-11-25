import fs from "fs/promises";
import path from "path";

export type CategoriaBase = "Grooming" | "Alimentos" | "Premios" | "Recetados";

export type Producto = {
  id: string;
  nombre: string;
  sub: string;
  categoria: CategoriaBase;
  precio: number;
  activo: boolean;
};

const DATA_PATH = path.join(process.cwd(), "src", "data", "products.json");

async function readProductsFile(): Promise<Producto[]> {
  try {
    const data = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(data) as Producto[];
  } catch (err) {
    console.error("Error leyendo products.json:", err);
    return [];
  }
}

async function writeProductsFile(products: Producto[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(products, null, 2), "utf-8");
}

export async function getAllProducts(): Promise<Producto[]> {
  return readProductsFile();
}

export async function createProduct(
  input: Omit<Producto, "id">
): Promise<Producto> {
  const products = await readProductsFile();
  const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const nuevo: Producto = { id, ...input };
  products.push(nuevo);
  await writeProductsFile(products);
  return nuevo;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Producto, "id">>
): Promise<Producto | null> {
  const products = await readProductsFile();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated: Producto = { ...products[index], ...updates };
  products[index] = updated;
  await writeProductsFile(products);
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await readProductsFile();
  const newProducts = products.filter((p) => p.id !== id);
  if (newProducts.length === products.length) return false;
  await writeProductsFile(newProducts);
  return true;
}
