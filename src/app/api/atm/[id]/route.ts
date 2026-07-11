import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'

/**
 * PUT /api/atm/[id]
 * Mengubah data ATM yang ada
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
    const { kodeAtm, kodeAtmLama, lokasi, jenisMesin, branch } = body

    if (!kodeAtm || !lokasi || !jenisMesin || !branch) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    // Ambil data sebelum diubah untuk log
    const oldAtm = await prisma.atm.findUnique({
      where: { id },
    })

    if (!oldAtm) {
      return NextResponse.json({ error: 'Data ATM tidak ditemukan.' }, { status: 404 })
    }

    // Lakukan update
    const updatedAtm = await prisma.atm.update({
      where: { id },
      data: {
        kodeAtm,
        kodeAtmLama: kodeAtmLama || null,
        lokasi,
        jenisMesin,
        branch,
      },
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'ATM',
      aksi: 'UBAH',
      dataSebelum: oldAtm as unknown as Record<string, unknown>,
      dataSetelah: updatedAtm as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ data: updatedAtm, message: 'Data ATM berhasil diubah.' })
  } catch (error: unknown) {
    console.error('[API ATM PUT] Gagal mengubah ATM:', error)
    return NextResponse.json({ error: 'Gagal mengubah data ATM.' }, { status: 500 })
  }
}

/**
 * DELETE /api/atm/[id]
 * Menghapus data ATM
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
    const oldAtm = await prisma.atm.findUnique({
      where: { id },
    })

    if (!oldAtm) {
      return NextResponse.json({ error: 'Data ATM tidak ditemukan.' }, { status: 404 })
    }

    // Lakukan penghapusan
    await prisma.atm.delete({
      where: { id },
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'ATM',
      aksi: 'HAPUS',
      dataSebelum: oldAtm as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ message: 'Data ATM berhasil dihapus.' })
  } catch (error: unknown) {
    console.error('[API ATM DELETE] Gagal menghapus ATM:', error)
    return NextResponse.json({ error: 'Gagal menghapus data ATM. Pastikan tidak ada data PKS yang terikat dengan ATM ini.' }, { status: 500 })
  }
}
