import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'
import { hitungMasaSewa, hitungTotalNilaiSewa } from '@/lib/utils'
import { saveUploadedPdf } from '@/lib/file-upload'
import { StatusKontrak } from '@prisma/client'

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

    // Map data untuk menyertakan computed fields, totalNilaiSewa, & filePdf
    const dataWithComputed = rentalList.map((item) => {
      const computedTotal = item.totalNilaiSewa
        ? Number(item.totalNilaiSewa)
        : hitungTotalNilaiSewa(Number(item.nilaiSewa), item.tglMulai, item.tglBerakhir)

      return {
        id: item.id,
        pksId: item.pksId,
        nilaiSewa: Number(item.nilaiSewa),
        totalNilaiSewa: computedTotal,
        tglMulai: item.tglMulai,
        tglBerakhir: item.tglBerakhir,
        keterangan: item.keterangan,
        filePdf: item.filePdf,
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
 * Mendukung JSON & FormData (untuk upload file PDF)
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''

    let pksId = ''
    let nilaiSewa: number | string = 0
    let tglMulai = ''
    let tglBerakhir = ''
    let keterangan: string | null = null
    let status: StatusKontrak = 'aktif'
    let filePdfPath: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      pksId = (formData.get('pksId') as string) || ''
      nilaiSewa = (formData.get('nilaiSewa') as string) || 0
      tglMulai = (formData.get('tglMulai') as string) || ''
      tglBerakhir = (formData.get('tglBerakhir') as string) || ''
      keterangan = (formData.get('keterangan') as string) || null
      status = ((formData.get('status') as string) || 'aktif') as StatusKontrak

      const file = formData.get('filePdf') as File | null
      if (file && file.size > 0) {
        filePdfPath = await saveUploadedPdf(file)
      }
    } else {
      const body = await request.json()
      pksId = body.pksId
      nilaiSewa = body.nilaiSewa
      tglMulai = body.tglMulai
      tglBerakhir = body.tglBerakhir
      keterangan = body.keterangan || null
      status = (body.status || 'aktif') as StatusKontrak
    }

    if (!pksId || !nilaiSewa || !tglMulai || !tglBerakhir) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    const computedTotal = hitungTotalNilaiSewa(Number(nilaiSewa), tglMulai, tglBerakhir)

    // Gunakan transaction untuk memastikan sewa dan monitoring_kontrak keduanya terbuat
    const newRental = await prisma.$transaction(async (tx) => {
      // Buat Sewa
      const sewa = await tx.sewa.create({
        data: {
          pksId,
          nilaiSewa: Number(nilaiSewa),
          totalNilaiSewa: computedTotal,
          tglMulai: new Date(tglMulai),
          tglBerakhir: new Date(tglBerakhir),
          keterangan: keterangan || null,
          filePdf: filePdfPath,
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
    const errorMessage = error instanceof Error ? error.message : 'Gagal menambahkan kontrak sewa baru.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
