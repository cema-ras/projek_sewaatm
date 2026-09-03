import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'
import { saveUploadedPdf } from '@/lib/file-upload'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pks
 * Mendapatkan daftar PKS dengan pencarian opsional (hanya data aktif, isDeleted: false)
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
      where: {
        isDeleted: false,
        ...(search
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
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        atm: {
          select: {
            id: true,
            kodeAtm: true,
            lokasi: true,
            branch: true,
            isDeleted: true,
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
 * Menambahkan data PKS baru (Mendukung JSON & FormData untuk upload file PDF)
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''

    let atmId = ''
    let nomorPks = ''
    let tanggalPks = ''
    let filePdfPath: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      atmId = (formData.get('atmId') as string) || ''
      nomorPks = (formData.get('nomorPks') as string) || ''
      tanggalPks = (formData.get('tanggalPks') as string) || ''

      const file = formData.get('filePdf') as File | null
      if (file && file.size > 0) {
        filePdfPath = await saveUploadedPdf(file)
      }
    } else {
      const body = await request.json()
      atmId = body.atmId
      nomorPks = body.nomorPks
      tanggalPks = body.tanggalPks
    }

    if (!atmId || !nomorPks || !tanggalPks) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    // Buat data PKS baru
    const newPks = await prisma.pks.create({
      data: {
        atmId,
        nomorPks,
        tanggalPks: new Date(tanggalPks),
        filePdf: filePdfPath,
        isDeleted: false,
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
    const errorMessage = error instanceof Error ? error.message : 'Gagal menambahkan PKS baru.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
