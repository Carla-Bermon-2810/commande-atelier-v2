import { createClient } from "@supabase/supabase-js";

export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (url && secretKey) {
    return createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  // Le poste local existant peut continuer à fonctionner pendant la préparation.
  // Une mise en production sans clé serveur est volontairement refusée.
  const developmentKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.NODE_ENV !== "production" && url && developmentKey) {
    return createClient(url, developmentKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  if (!url || !secretKey) {
    throw new Error("SUPABASE_SECRET_KEY doit être configurée côté serveur.");
  }
  throw new Error("Configuration Supabase invalide.");
}
