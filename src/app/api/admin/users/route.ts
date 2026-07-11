import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users
 * Mendapatkan daftar user (hanya untuk Admin)
 */
export async function GET() {
  try {
    const adminUser = await getCurrentUserProfile()
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Akses ditolak.' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: users })
  } catch (error: unknown) {
    console.error('[API ADMIN USERS GET] Gagal mengambil data:', error)
    return NextResponse.json({ error: 'Gagal mengambil data user.' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users
 * Menambahkan user baru ke database local
 * Catatan: User juga harus ditambahkan di Supabase Auth. Di project riil, ini 
 * memicu pembuatan akun auth. Di sini kita catat profil database-nya.
 */
export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentUserProfile()
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Akses ditolak.' }, { status: 403 })
    }

    const body = await request.json()
    const { nama, email, role, password } = body

    if (!nama || !email || !role) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    // Cek duplikasi email
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 })
    }

    // Buat user di database
    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        role: role as Role,
        password: password || 'DefaultBNI2026', // Default fallback password
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: adminUser.id,
      modul: 'MANAJEMEN_USER',
      aksi: 'TAMBAH_USER',
      dataSetelah: newUser as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ data: newUser, message: 'User berhasil ditambahkan.' })
  } catch (error: unknown) {
    console.error('[API ADMIN USERS POST] Gagal membuat user:', error)
    return NextResponse.json({ error: 'Gagal membuat user baru.' }, { status: 500 })
  }
}
