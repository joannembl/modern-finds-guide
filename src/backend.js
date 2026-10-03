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
export async function studioRows(table) {
  const { data, error } = await backend
    .from(table)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function studioSave(table, row) {
  const { created_at, updated_at, ...fields } = row;
  const { data, error } = await backend
    .from(table)
    .upsert(fields)
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function createPack(productIds, pack, assets) {
  const { data, error } = await backend.rpc("create_content_pack", {
    product_ids: productIds,
    pack,
    assets,
  });
  if (error) throw error;
  return data;
}
export async function publishQueue(id) {
  const { error } = await backend.rpc("approve_site_content", { queue_id: id });
  if (error) throw error;
}
