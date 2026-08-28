import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 3 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "items");
const PUBLIC_PREFIX = "/uploads/items/";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function asImageFile(value: FormDataEntryValue | null) {
  if (value instanceof File && value.size > 0) return value;
  return null;
}

export async function saveItemImage(file: File) {
  const ext = TYPES[file.type.toLowerCase()];
  if (!ext) throw new Error("Use a JPEG, PNG, WebP, or GIF photo.");
  if (file.size > MAX_BYTES) throw new Error("Photos must be 3 MB or smaller.");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
  return `${PUBLIC_PREFIX}${filename}`;
}

export async function removeItemImageFile(imageUrl: string) {
  if (!imageUrl.startsWith(PUBLIC_PREFIX)) return;
  const filename = path.basename(imageUrl);
  if (filename !== imageUrl.slice(PUBLIC_PREFIX.length)) return;
  await unlink(path.join(UPLOAD_DIR, filename)).catch(() => undefined);
}
