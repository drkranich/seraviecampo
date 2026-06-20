import type { SupabaseClient } from "@supabase/supabase-js";

// Faz upload da imagem (campo `${field}_file`) ao bucket `media` usando a
// sessão autenticada do servidor. Se não houver novo arquivo, mantém o valor
// atual (hidden input `field`). Retorna a URL pública a salvar.
export async function resolveImageUrl(
  supabase: SupabaseClient,
  userId: string,
  formData: FormData,
  field: string,
  folder: string
): Promise<string | null> {
  const file = formData.get(`${field}_file`);
  const isFile =
    file &&
    typeof file !== "string" &&
    typeof (file as Blob).arrayBuffer === "function" &&
    (file as File).size > 0;

  if (isFile) {
    const f = file as File;
    if (f.size > 5 * 1024 * 1024) {
      throw new Error("Imagem muito grande (máx. 5MB).");
    }
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, f, {
      upsert: true,
      contentType: f.type || "image/jpeg",
    });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  }

  const keep = formData.get(field);
  return typeof keep === "string" && keep ? keep : null;
}
