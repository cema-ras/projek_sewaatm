import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'
import { hitungMasaSewa } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/rental
 * Mendapatkan daftar Sewa dengan pencarian opsional
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const rentalList = await prisma.sewa.findMany({
      where: search
        ? {
            OR: [
              { keterangan: { contains: search, mode: 'insensitive' } },
              {
                pks: {
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
                },
              },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      include: {
        monitoringKontrak: {
          select: {
            status: true,
          },
        },
        pks: {
          include: {
            atm: {
              select: {
                kodeAtm: true,
                lokasi: true,
                branch: true,
              },
            },
          },
        },
      },
    })

    // Map data untuk menyertakan computed fields
    const dataWithComputed = rentalList.map((item) => {
      return {
        id: item.id,
        pksId: item.pksId,
        nilaiSewa: Number(item.nilaiSewa),
        tglMulai: item.tglMulai,
        tglBerakhir: item.tglBerakhir,
        keterangan: item.keterangan,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        masaSewa: hitungMasaSewa(item.tglMulai, item.tglBerakhir), // Computed field
        status: item.monitoringKontrak?.status || 'aktif',
        pks: item.pks,
      }
    })

    return NextResponse.json({ data: dataWithComputed })
  } catch (error: unknown) {
    console.error('[API RENTAL GET] Gagal mengambil data:', error)
    return NextResponse.json({ error: 'Gagal mengambil data rental.' }, { status: 500 })
  }
}

/**
 * POST /api/rental
 * Menambahkan kontrak sewa baru dan membuat monitoring kontrak awal
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { pksId, nilaiSewa, tglMulai, tglBerakhir, keterangan, status = 'aktif' } = body

    if (!pksId || !nilaiSewa || !tglMulai || !tglBerakhir) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    // Gunakan transaction untuk memastikan sewa dan monitoring_kontrak keduanya terbuat
    const newRental = await prisma.$transaction(async (tx) => {
      // Buat Sewa
      const sewa = await tx.sewa.create({
        data: {
          pksId,
          nilaiSewa,
          tglMulai: new Date(tglMulai),
          tglBerakhir: new Date(tglBerakhir),
          keterangan: keterangan || null,
        },
      })

      // Buat Monitoring Kontrak dengan status default
      await tx.monitoringKontrak.create({
        data: {
          sewaId: sewa.id,
          status: status,
        },
      })

      return sewa
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'RENTAL',
      aksi: 'TAMBAH',
      dataSetelah: newRental as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ data: newRental, message: 'Kontrak sewa berhasil dibuat.' })
  } catch (error: unknown) {
    console.error('[API RENTAL POST] Gagal membuat Sewa:', error)
    return NextResponse.json({ error: 'Gagal menambahkan kontrak sewa baru.' }, { status: 500 })
  }
}
