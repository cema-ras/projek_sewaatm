import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/logs
 * Mendapatkan seluruh logs aktivitas sistem (hanya untuk Admin)
 */
export async function GET() {
  try {
    const adminUser = await getCurrentUserProfile()
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Akses ditolak.' }, { status: 403 })
    }

    const logs = await prisma.monitoringAktivitas.findMany({
      orderBy: { tanggal: 'desc' },
      include: {
        user: {
          select: {
            nama: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ data: logs })
  } catch (error: unknown) {
    console.error('[API ADMIN LOGS GET] Gagal mengambil logs:', error)
    return NextResponse.json({ error: 'Gagal mengambil data logs aktivitas.' }, { status: 500 })
  }
}
