import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Menyimpan file PDF ke folder public/uploads/pdf
 * Returns relative path untuk disimpan di database (misal: /uploads/pdf/172345678-file.pdf)
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

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pdf')
  await fs.mkdir(uploadDir, { recursive: true })

  // Bersihkan nama file dari karakter berbahaya
  const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${Date.now()}-${sanitizedOriginalName}`
  const filePath = path.join(uploadDir, fileName)

  await fs.writeFile(filePath, buffer)

  return `/uploads/pdf/${fileName}`
}

/**
 * Menghapus file fisik dari disk berdasarkan relative path (misal: /uploads/pdf/172345678-file.pdf)
 */
export async function deleteUploadedFile(relativePath?: string | null): Promise<void> {
  if (!relativePath || !relativePath.startsWith('/uploads/')) return

  try {
    const fullPath = path.join(process.cwd(), 'public', relativePath)
    await fs.unlink(fullPath)
  } catch (error: unknown) {
    // Abaikan jika file memang sudah tidak ada
    console.warn(`[FILE UPLOAD] Gagal menghapus file ${relativePath}:`, error)
  }
}
