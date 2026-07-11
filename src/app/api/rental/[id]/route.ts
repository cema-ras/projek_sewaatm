import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'
import { StatusKontrak } from '@prisma/client'

/**
 * PUT /api/rental/[id]
 * Mengubah data sewa dan monitoring kontrak
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { pksId, nilaiSewa, tglMulai, tglBerakhir, keterangan, status } = body

    if (!pksId || !nilaiSewa || !tglMulai || !tglBerakhir) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    // Ambil data lama untuk logging
    const oldSewa = await prisma.sewa.findUnique({
      where: { id },
      include: { monitoringKontrak: true }
    })

    if (!oldSewa) {
      return NextResponse.json({ error: 'Kontrak sewa tidak ditemukan.' }, { status: 404 })
    }

    // Update Sewa & MonitoringKontrak dalam transaksi
    const updatedSewa = await prisma.$transaction(async (tx) => {
      const sewa = await tx.sewa.update({
        where: { id },
        data: {
          pksId,
          nilaiSewa,
          tglMulai: new Date(tglMulai),
          tglBerakhir: new Date(tglBerakhir),
          keterangan: keterangan || null,
        },
      })

      if (status) {
        await tx.monitoringKontrak.upsert({
          where: { sewaId: id },
          update: { status: status as StatusKontrak },
          create: { sewaId: id, status: status as StatusKontrak }
        })
      }

      return sewa
    })

    // Fetch updated data dengan status baru untuk log
    const fullUpdatedSewa = await prisma.sewa.findUnique({
      where: { id },
      include: { monitoringKontrak: true }
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'RENTAL',
      aksi: 'UBAH',
      dataSebelum: oldSewa as unknown as Record<string, unknown>,
      dataSetelah: fullUpdatedSewa as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ data: updatedSewa, message: 'Kontrak sewa berhasil diubah.' })
  } catch (error: unknown) {
    console.error('[API RENTAL PUT] Gagal mengubah Sewa:', error)
    return NextResponse.json({ error: 'Gagal mengubah kontrak sewa.' }, { status: 500 })
  }
}

/**
 * DELETE /api/rental/[id]
 * Menghapus data sewa dan monitoring kontrak terkait
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const oldSewa = await prisma.sewa.findUnique({
      where: { id },
      include: { monitoringKontrak: true }
    })

    if (!oldSewa) {
      return NextResponse.json({ error: 'Kontrak sewa tidak ditemukan.' }, { status: 404 })
    }

    // Hapus Sewa dan MonitoringKontrak (Prisma cascading / transaction)
    await prisma.$transaction(async (tx) => {
      // Hapus monitoring kontrak dulu karena foreign key dependency
      await tx.monitoringKontrak.deleteMany({
        where: { sewaId: id }
      })
      
      // Hapus sewa
      await tx.sewa.delete({
        where: { id }
      })
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'RENTAL',
      aksi: 'HAPUS',
      dataSebelum: oldSewa as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ message: 'Kontrak sewa berhasil dihapus.' })
  } catch (error: unknown) {
    console.error('[API RENTAL DELETE] Gagal menghapus Sewa:', error)
    return NextResponse.json({ error: 'Gagal menghapus kontrak sewa.' }, { status: 500 })
  }
}
