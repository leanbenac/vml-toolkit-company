import React from "react";
import { supabase } from "@/lib/supabase";
import HomeClient, { Tool } from "./HomeClient";

// Activar caché inteligente Stale-While-Revalidate (ISR) de Next.js.
// La página principal se pre-renderiza y se sirve de inmediato (50ms) desde caché.
// Se revalida de forma asíncrona en segundo plano cada 10 segundos.
// Esto elimina completamente la espera de carga y los "cold starts" de la base de datos para el usuario final.
export const revalidate = 10;

export default async function HomePage() {
  let initialTools: Tool[] = [];

  try {
    const { data, error } = await supabase
      .from("tools")
      .select("id, name, description, category, image_url, file_url, author, team, created_at, is_approved, downloads")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tools on server:", error);
    } else if (data) {
      initialTools = data.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        imageUrl: t.image_url,
        fileUrl: t.file_url,
        downloads: t.downloads || 0,
        author: t.author || "",
        team: t.team || "",
      }));
    }
  } catch (err) {
    console.error("Critical error in server component data fetching:", err);
  }

  return <HomeClient initialTools={initialTools} />;
}
