import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'
import { Role } from '@prisma/client'

/**
 * PUT /api/admin/users/[id]
 * Mengubah data/role user (hanya untuk Admin)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentUserProfile()
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Akses ditolak.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { nama, email, role } = body

    if (!nama || !email || !role) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    // Ambil data sebelum diubah untuk log
    const oldUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, nama: true, email: true, role: true }
    })

    if (!oldUser) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
    }

    // Lakukan update
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        nama,
        email,
        role: role as Role,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: adminUser.id,
      modul: 'MANAJEMEN_USER',
      aksi: 'UBAH_USER',
      dataSebelum: oldUser as unknown as Record<string, unknown>,
      dataSetelah: updatedUser as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ data: updatedUser, message: 'Data user berhasil diperbarui.' })
  } catch (error: unknown) {
    console.error('[API ADMIN USERS PUT] Gagal mengubah user:', error)
    return NextResponse.json({ error: 'Gagal memperbarui data user.' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Menghapus user (hanya untuk Admin)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentUserProfile()
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Akses ditolak.' }, { status: 403 })
    }

    const { id } = await params

    if (id === adminUser.id) {
      return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' }, { status: 400 })
    }

    // Ambil data sebelum dihapus untuk log
    const oldUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, nama: true, email: true, role: true }
    })

    if (!oldUser) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
    }

    // Hapus user
    await prisma.user.delete({
      where: { id },
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: adminUser.id,
      modul: 'MANAJEMEN_USER',
      aksi: 'HAPUS_USER',
      dataSebelum: oldUser as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ message: 'User berhasil dihapus.' })
  } catch (error: unknown) {
    console.error('[API ADMIN USERS DELETE] Gagal menghapus user:', error)
    return NextResponse.json({ error: 'Gagal menghapus user. Pastikan user tidak memiliki data ATM/Aktivitas yang bergantung padanya.' }, { status: 500 })
  }
}
