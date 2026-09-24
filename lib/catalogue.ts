import { supabase } from "./supabase";

/**
 * Récupère toutes les catégories
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("ordre");

  if (error) throw error;

  return data;
}

/**
 * Récupère toutes les familles d'une catégorie
 */
export async function getFamille(categorie: string) {
  const { data, error } = await supabase
    .from("famille")
    .select("*")
    .eq("categorie", categorie.toUpperCase())
    .order("ordre");

   if (error) throw error;

    return data;
  }

/**
 * Récupère tous les articles d'une famille
 */
export async function getArticles(
  categorie: string,
  famille: string
) {
  const { data, error } = await supabase
    .from("catalogue")
    .select("*")
    .eq("categorie", categorie.toUpperCase())
    .eq("famille", famille.toUpperCase());

    if (error) throw error;

    const articles = (data ?? []).map((article) => {
      if (article.photo) {
        const { data: photo } = supabase.storage
          .from("photos")
          .getPublicUrl(article.photo);
    
        return {
          ...article,
          photo: photo.publicUrl,
        };
      }
    
      return article;
    });
    
    return articles;
}
