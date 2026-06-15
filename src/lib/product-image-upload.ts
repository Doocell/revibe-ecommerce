import { supabase } from "@/integrations/supabase/client";

const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

export async function uploadProductImages({
  sellerId,
  files,
}: {
  sellerId: string;
  files: File[];
}) {
  const cleanSellerId = String(sellerId ?? "").trim();

  if (!cleanSellerId || cleanSellerId === "undefined") {
    throw new Error("ID seller tidak valid.");
  }

  const safeFiles = Array.from(files ?? []);

  if (safeFiles.length === 0) {
    return [];
  }

  if (safeFiles.length > MAX_FILES) {
    throw new Error(`Maksimal upload ${MAX_FILES} foto produk.`);
  }

  validateImageFiles(safeFiles);

  const uploadedUrls: string[] = [];

  for (const [index, file] of safeFiles.entries()) {
    const fileExt = getFileExtension(file.name);
    const fileName = `${Date.now()}-${index}-${randomText()}.${fileExt}`;
    const filePath = `${cleanSellerId}/${fileName}`;

    const { error } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("Gagal mengambil URL foto produk.");
    }

    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}

export function validateImageFiles(files: File[]) {
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`File ${file.name} bukan gambar.`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File ${file.name} melebihi 5 MB.`);
    }
  }
}

function getFileExtension(fileName: string) {
  const ext = String(fileName).split(".").pop()?.toLowerCase();

  if (!ext) return "jpg";

  if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return ext;
  }

  return "jpg";
}

function randomText() {
  return Math.random().toString(36).slice(2, 10);
}