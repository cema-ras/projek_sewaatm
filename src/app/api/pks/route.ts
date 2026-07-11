import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pks
 * Mendapatkan daftar PKS dengan pencarian opsional
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const pksList = await prisma.pks.findMany({
      where: search
        ? {
            OR: [
              { nomorPks: { contains: search, mode: 'insensitive' } },
              {
                atm: {
                  OR: [
                    { kodeAtm: { contains: search, mode: 'insensitive' } },
                    { lokasi: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      include: {
        atm: {
          select: {
            kodeAtm: true,
            lokasi: true,
          },
        },
      },
    })

    return NextResponse.json({ data: pksList })
  } catch (error: unknown) {
    console.error('[API PKS GET] Gagal mengambil data:', error)
    return NextResponse.json({ error: 'Gagal mengambil data PKS.' }, { status: 500 })
  }
}

/**
 * POST /api/pks
 * Menambahkan data PKS baru
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { atmId, nomorPks, tanggalPks } = body

    if (!atmId || !nomorPks || !tanggalPks) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    // Buat data PKS baru
    const newPks = await prisma.pks.create({
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
      aksi: 'TAMBAH',
      dataSetelah: newPks as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ data: newPks, message: 'Data PKS berhasil ditambahkan.' })
  } catch (error: unknown) {
    console.error('[API PKS POST] Gagal membuat PKS:', error)
    return NextResponse.json({ error: 'Gagal menambahkan PKS baru.' }, { status: 500 })
  }
}
