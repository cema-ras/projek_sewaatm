import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { User } from '@/types'

/**
 * Mendapatkan profile user yang saat ini sedang login dari database.
 * Jika profile belum ada di database (misal baru sign up lewat Supabase), 
 * kita buat user baru secara otomatis di database.
 */
export async function getCurrentUserProfile(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()

    if (!supabaseUser || !supabaseUser.email) {
      return null
    }

    // Cari user di database lokal (Prisma) berdasarkan email
    let dbUser = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    })

    // Jika tidak ditemukan, buat user baru di database local
    if (!dbUser) {
      // Dapatkan nama dari user metadata atau default dari email
      const nama = supabaseUser.user_metadata?.nama || supabaseUser.email.split('@')[0]
      
      // Default role admin jika email mengandung 'admin' atau project baru, user lainnya 'user'
      const isFirstUser = (await prisma.user.count()) === 0
      const role = isFirstUser || supabaseUser.email.includes('admin') ? 'admin' : 'user'

      dbUser = await prisma.user.create({
        data: {
          id: supabaseUser.id, // Gunakan ID Supabase Auth agar sinkron
          email: supabaseUser.email,
          nama,
          role,
          password: '', // Password dikelola oleh Supabase Auth, jadi dikosongkan di local DB
        },
      })
    }

    return {
      id: dbUser.id,
      nama: dbUser.nama,
      email: dbUser.email,
      role: dbUser.role as 'admin' | 'user',
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    }
  } catch (error) {
    console.error('[AuthUser] Gagal mendapatkan profile user:', error)
    return null
  }
}
