import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface LogOptions {
  userId: string
  modul: string
  aksi: string
  dataSebelum?: Record<string, unknown> | null
  dataSetelah?: Record<string, unknown> | null
  status?: string
}

/**
 * Mencatat aktivitas CRUD ke tabel monitoring_aktivitas
 * Dipanggil otomatis di setiap API route setelah operasi berhasil
 */
export async function createActivityLog({
  userId,
  modul,
  aksi,
  dataSebelum = null,
  dataSetelah = null,
  status = 'success',
}: LogOptions): Promise<void> {
  try {
    await prisma.monitoringAktivitas.create({
      data: {
        userId,
        modul,
        aksi,
        dataSebelum: dataSebelum ? (dataSebelum as Prisma.InputJsonValue) : Prisma.DbNull,
        dataSetelah: dataSetelah ? (dataSetelah as Prisma.InputJsonValue) : Prisma.DbNull,
        status,
        tanggal: new Date(),
      },
    })
  } catch (error) {
    // Log error tidak boleh menggagalkan operasi utama
    console.error('[ActivityLog] Gagal mencatat log:', error)
  }
}
