/**
 * Customer artwork upload (App Router route handler, Next.js 16).
 *
 * The winkelmand posts a single file (multipart/form-data, field `file`). We
 * store it in the PUBLIC `order-artwork` Storage bucket under an unguessable
 * UUID path and return its public URL. That URL is later handed to Probo as
 * `products[].files[].uri` (the "supply files for an order request" flow), so
 * the bucket must be public and Probo-fetchable.
 *
 * Writes go through the service-role admin client (bypasses RLS), never the
 * browser. `runtime = "nodejs"` — Storage upload uses Node APIs.
 */

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "order-artwork";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB, mirrors the bucket limit
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export async function POST(request: Request): Promise<NextResponse> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ongeldige upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Geen bestand ontvangen." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Bestand te groot (max 50 MB)." }, { status: 413 });
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Alleen PDF, JPG of PNG toegestaan." },
      { status: 415 },
    );
  }

  // Unguessable path; keep a sanitised original name only as a suffix hint.
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60);
  const path = `${crypto.randomUUID()}-${safeName || `artwork.${ext}`}`;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[artwork] upload failed:", error.message);
    return NextResponse.json({ error: "Uploaden mislukt. Probeer opnieuw." }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, name: file.name });
}
