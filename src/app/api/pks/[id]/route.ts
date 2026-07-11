import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'

/**
 * PUT /api/pks/[id]
 * Mengubah data PKS yang ada
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
    const { atmId, nomorPks, tanggalPks } = body

    if (!atmId || !nomorPks || !tanggalPks) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    // Ambil data sebelum diubah untuk log
    const oldPks = await prisma.pks.findUnique({
      where: { id },
    })

    if (!oldPks) {
      return NextResponse.json({ error: 'Data PKS tidak ditemukan.' }, { status: 404 })
    }

    // Lakukan update
    const updatedPks = await prisma.pks.update({
      where: { id },
      data: {
        atmId,
        nomorPks,
        tanggalPks: new Date(tanggalPks),
      },
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'PKS',
      aksi: 'UBAH',
      dataSebelum: oldPks as unknown as Record<string, unknown>,
      dataSetelah: updatedPks as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ data: updatedPks, message: 'Data PKS berhasil diubah.' })
  } catch (error: unknown) {
    console.error('[API PKS PUT] Gagal mengubah PKS:', error)
    return NextResponse.json({ error: 'Gagal mengubah data PKS.' }, { status: 500 })
  }
}

/**
 * DELETE /api/pks/[id]
 * Menghapus data PKS
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

    // Ambil data sebelum dihapus untuk log
    const oldPks = await prisma.pks.findUnique({
      where: { id },
    })

    if (!oldPks) {
      return NextResponse.json({ error: 'Data PKS tidak ditemukan.' }, { status: 404 })
    }

    // Lakukan penghapusan
    await prisma.pks.delete({
      where: { id },
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'PKS',
      aksi: 'HAPUS',
      dataSebelum: oldPks as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ message: 'Data PKS berhasil dihapus.' })
  } catch (error: unknown) {
    console.error('[API PKS DELETE] Gagal menghapus PKS:', error)
    return NextResponse.json({ error: 'Gagal menghapus data PKS. Pastikan tidak ada data Sewa yang terikat dengan PKS ini.' }, { status: 500 })
  }
}
