// StorageAdapter — decoupled from any specific storage provider
// Swap Supabase for S3/R2 by providing a different implementation

export interface UploadResult {
  storageKey: string
  publicUrl: string | null
  fileName: string
  fileSize: number
  mimeType: string
}

export interface StorageAdapter {
  upload(params: {
    file: Buffer
    fileName: string
    mimeType: string
    folder: string
  }): Promise<UploadResult>

  delete(storageKey: string): Promise<void>
  getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>
  getPublicUrl(storageKey: string): string
}

// Allowed file types
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export function validateFile(file: { size: number; type: string }): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo supera el tamaño máximo permitido (25MB)`)
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido`)
  }
}

export function getFileCategory(mimeType: string): 'image' | 'document' | 'spreadsheet' | 'other' {
  if (mimeType.startsWith('image/')) return 'image'
  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('word') ||
    mimeType === 'text/plain'
  )
    return 'document'
  if (mimeType.includes('excel') || mimeType === 'text/csv') return 'spreadsheet'
  return 'other'
}
