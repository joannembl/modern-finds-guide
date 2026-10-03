import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const backend = url && key ? createClient(url, key) : null;
export async function listProducts() {
  const { data, error } = await backend
    .from("products")
    .select("*")
    .order("sort_order")
    .order("title");
  if (error) throw error;
  return data;
}
export async function saveProduct(product) {
  const { id, created_at, updated_at, ...fields } = product;
  const request = id
    ? backend.from("products").update(fields).eq("id", id)
    : backend.from("products").insert(fields);
  const { data, error } = await request.select().single();
  if (error) throw error;
  return data;
}
export async function removeProduct(id) {
  const { data, error } = await backend
    .from("products")
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
  return data;
}
