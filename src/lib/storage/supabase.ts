import { createClient } from '@supabase/supabase-js'
import type { StorageAdapter, UploadResult } from './adapter'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'nexora-files'

export const supabaseStorageAdapter: StorageAdapter = {
  async upload({ file, fileName, mimeType, folder }): Promise<UploadResult> {
    const supabase = getSupabaseAdmin()
    const ext = fileName.split('.').pop()
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const storageKey = `${folder}/${uniqueName}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storageKey, file, { contentType: mimeType, upsert: false })

    if (error) throw new Error(`Storage upload failed: ${error.message}`)

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey)

    return {
      storageKey,
      publicUrl: data.publicUrl,
      fileName,
      fileSize: file.length,
      mimeType,
    }
  },

  async delete(storageKey: string): Promise<void> {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.storage.from(BUCKET).remove([storageKey])
    if (error) throw new Error(`Storage delete failed: ${error.message}`)
  },

  async getSignedUrl(storageKey: string, expiresInSeconds = 3600): Promise<string> {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storageKey, expiresInSeconds)
    if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`)
    return data.signedUrl
  },

  getPublicUrl(storageKey: string): string {
    const supabase = getSupabaseAdmin()
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey)
    return data.publicUrl
  },
}
