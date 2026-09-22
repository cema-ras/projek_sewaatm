import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi Supabase client untuk storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Pastikan bucket 'uploads' dibuat di Supabase Storage Anda dan diset sebagai Public
const BUCKET_NAME = 'uploads'

/**
 * Menyimpan file PDF ke Supabase Storage
 * Returns public URL untuk disimpan di database
 */
export async function saveUploadedPdf(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error('File tidak valid atau kosong.')
  }

  // Validasi tipe file
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Hanya file dengan format PDF yang diperbolehkan.')
  }

  // Batas ukuran file 10MB
  const maxSizeBytes = 10 * 1024 * 1024
  if (file.size > maxSizeBytes) {
    throw new Error('Ukuran file PDF melebihi batas maksimum 10MB.')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Bersihkan nama file dari karakter berbahaya
  const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `pdf/${Date.now()}-${sanitizedOriginalName}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (error) {
    console.error('[SUPABASE UPLOAD ERROR]', error)
    throw new Error('Gagal mengupload file ke Storage.')
  }

  // Dapatkan URL publik dari file yang baru diupload
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName)

  return publicUrlData.publicUrl
}

/**
 * Menghapus file dari Supabase Storage (atau lokal jika path lama)
 */
export async function deleteUploadedFile(fileUrl?: string | null): Promise<void> {
  if (!fileUrl) return

  // Fallback untuk file lama yang tersimpan di disk lokal (saat development)
  if (fileUrl.startsWith('/uploads/')) {
    try {
      const fullPath = path.join(process.cwd(), 'public', fileUrl)
      await fs.unlink(fullPath)
    } catch (error: unknown) {
      console.warn(`[FILE UPLOAD] Gagal menghapus file lokal ${fileUrl}:`, error)
    }
    return
  }

  try {
    // Hapus dari Supabase Storage
    const urlParts = fileUrl.split(`/storage/v1/object/public/${BUCKET_NAME}/`)
    if (urlParts.length === 2) {
      const filePath = urlParts[1]
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])
      
      if (error) {
        console.warn(`[SUPABASE DELETE ERROR] Gagal menghapus file ${filePath}:`, error)
      }
    }
  } catch (error: unknown) {
    console.warn(`[FILE UPLOAD] Gagal menghapus file ${fileUrl}:`, error)
  }
}
