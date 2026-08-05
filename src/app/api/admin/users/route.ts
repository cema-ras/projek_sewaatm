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

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * POST /api/admin/users
 * Menambahkan user baru ke database local & Supabase Auth (jika SERVICE_ROLE_KEY terkonfigurasi)
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

    // 1. Dapatkan Supabase Auth ID jika Service Role Key tersedia
    let supabaseAuthId: string | undefined = undefined

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: password || 'DefaultBNI2026',
          email_confirm: true,
          user_metadata: { nama },
        })

        if (authError) {
          console.warn('[Supabase Auth Admin] Info:', authError.message)
        } else if (authData.user) {
          supabaseAuthId = authData.user.id
        }
      } catch (err) {
        console.warn('[Supabase Auth Admin] Client Warning:', err)
      }
    }

    // 2. Buat user di database Prisma
    const newUser = await prisma.user.create({
      data: {
        ...(supabaseAuthId ? { id: supabaseAuthId } : {}),
        nama,
        email,
        role: role as Role,
        password: password || 'DefaultBNI2026',
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
    const errorMsg = error instanceof Error ? error.message : 'Gagal membuat user baru.'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
