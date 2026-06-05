export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 12_000_000; // ~12MB (foto de ECG em alta resolucao)

export function blobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
