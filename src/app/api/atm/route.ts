import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'

export const dynamic = 'force-dynamic'

/**
 * GET /api/atm
 * Mendapatkan daftar mesin ATM dengan pencarian opsional (hanya data aktif, isDeleted: false)
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const atmList = await prisma.atm.findMany({
      where: {
        isDeleted: false,
        ...(search
          ? {
              OR: [
                { kodeAtm: { contains: search, mode: 'insensitive' } },
                { kodeAtmLama: { contains: search, mode: 'insensitive' } },
                { lokasi: { contains: search, mode: 'insensitive' } },
                { jenisMesin: { contains: search, mode: 'insensitive' } },
                { cabangPengelola: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { nama: true },
        },
      },
    })

    return NextResponse.json({ data: atmList })
  } catch (error: unknown) {
    console.error('[API ATM GET] Gagal mengambil data:', error)
    return NextResponse.json({ error: 'Gagal mengambil data ATM.' }, { status: 500 })
  }
}

const parseCoord = (val: unknown): number | null => {
  if (val === undefined || val === null || val === '') return null
  const num = Number(val)
  return isNaN(num) ? null : num
}

/**
 * POST /api/atm
 * Menambahkan mesin ATM baru
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { kodeAtm, kodeAtmLama, lokasi, jenisMesin, cabangPengelola, branch, latitude, longitude } = body

    if (!kodeAtm || !lokasi || !jenisMesin || !cabangPengelola || branch === undefined) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    const newAtm = await prisma.atm.create({
      data: {
        userId: user.id,
        kodeAtm,
        kodeAtmLama: kodeAtmLama || null,
        lokasi,
        jenisMesin,
        cabangPengelola,
        branch: Boolean(branch),
        latitude: parseCoord(latitude),
        longitude: parseCoord(longitude),
        isDeleted: false,
      },
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'ATM',
      aksi: 'TAMBAH',
      dataSetelah: newAtm as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ data: newAtm, message: 'Data ATM berhasil ditambahkan.' })
  } catch (error: unknown) {
    console.error('[API ATM POST] Gagal membuat ATM:', error)
    const errorMsg = error instanceof Error ? error.message : 'Gagal menambahkan ATM baru.'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}