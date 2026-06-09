type StorageProvider = "local" | "s3" | "r2"

interface UploadOptions {
  folder?: string
  maxSizeBytes?: number
  allowedTypes?: string[]
}

interface UploadResult {
  url: string
  key: string
  provider: StorageProvider
}

const SAFE_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

export function getSafeImageExtension(mimeType: string): string | null {
  return SAFE_IMAGE_EXTENSIONS[mimeType] ?? null
}

const FILE_LIMITS: Record<string, number> = {
  logo: 2 * 1024 * 1024,
  cover: 5 * 1024 * 1024,
  gallery: 5 * 1024 * 1024,
  marketplace: 5 * 1024 * 1024,
}

const provider: StorageProvider =
  (process.env.STORAGE_PROVIDER as StorageProvider) ||
  (process.env.NODE_ENV === "production" ? "s3" : "local")
const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3100"
const strictRemoteStorage = process.env.NODE_ENV === "production"

function validateFile(file: File, options: UploadOptions): void {
  const maxSize = options.maxSizeBytes ?? FILE_LIMITS[options.folder ?? "general"] ?? 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error(`File ${file.name} exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`)
  }
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`)
  }
}

async function uploadLocal(file: File, folder: string): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = getSafeImageExtension(file.type) || "bin"
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const fs = await import("fs/promises")
  const path = await import("path")
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder)
  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(path.join(uploadDir, path.basename(key)), buffer)
  return { url: `${baseUrl}/uploads/${key}`, key, provider: "local" }
}

export async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  validateFile(file, options)
  const folder = options.folder || "general"

  if (process.env.NODE_ENV === "production" && provider === "local") {
    throw new Error("STORAGE_PROVIDER must be configured for production")
  }

  if (provider === "local") return uploadLocal(file, folder)

  const bucket = process.env.S3_BUCKET || "guiazmg"
  try {
    // Supabase storage removed — use Cloudflare R2 (S3-compatible) instead
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3")
    const client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      },
    })
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = getSafeImageExtension(file.type) || "bin"
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: file.type }))
    const publicUrl = process.env.S3_PUBLIC_URL || `https://${bucket}.s3.amazonaws.com`
    return { url: `${publicUrl}/${key}`, key, provider: provider as "s3" | "r2" }
  } catch (error) {
    if (strictRemoteStorage) {
      throw error instanceof Error ? error : new Error("Remote upload failed")
    }

    console.error("[STORAGE] Remote upload failed, falling back to local:", error)
    return uploadLocal(file, folder)
  }
}

export async function deleteFile(urlOrKey: string): Promise<void> {
  if (provider === "local") {
    const fs = await import("fs/promises")
    const path = await import("path")
    const localPath = urlOrKey.replace(baseUrl, "").replace("/uploads/", "")
    await fs.unlink(path.join(process.cwd(), "public", "uploads", localPath)).catch(() => {})
  }
}

export const storage = { upload: uploadFile, delete: deleteFile, provider }
