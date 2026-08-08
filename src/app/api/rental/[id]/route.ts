import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'
import { StatusKontrak } from '@prisma/client'
import { saveUploadedPdf, deleteUploadedFile } from '@/lib/file-upload'
import { hitungTotalNilaiSewa } from '@/lib/utils'

/**
 * PUT /api/rental/[id]
 * Mengubah data sewa dan monitoring kontrak
 * Mendukung JSON & FormData (untuk update file PDF)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const oldSewa = await prisma.sewa.findFirst({
      where: { id, isDeleted: false },
      include: { monitoringKontrak: true }
    })

    if (!oldSewa) {
      return NextResponse.json({ error: 'Kontrak sewa tidak ditemukan.' }, { status: 404 })
    }

    const contentType = request.headers.get('content-type') || ''

    let pksId = oldSewa.pksId
    let nilaiSewa: number | string = Number(oldSewa.nilaiSewa)
    let tglMulai = oldSewa.tglMulai.toISOString()
    let tglBerakhir = oldSewa.tglBerakhir.toISOString()
    let keterangan = oldSewa.keterangan
    let status: StatusKontrak | undefined = undefined
    let finalFilePdf: string | null = oldSewa.filePdf

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      pksId = (formData.get('pksId') as string) || pksId
      nilaiSewa = (formData.get('nilaiSewa') as string) || nilaiSewa
      tglMulai = (formData.get('tglMulai') as string) || tglMulai
      tglBerakhir = (formData.get('tglBerakhir') as string) || tglBerakhir
      keterangan = formData.has('keterangan') ? (formData.get('keterangan') as string) : keterangan
      if (formData.has('status')) {
        status = formData.get('status') as StatusKontrak
      }

      const removePdf = formData.get('removePdf') === 'true'
      const file = formData.get('filePdf') as File | null

      if (file && file.size > 0) {
        if (oldSewa.filePdf) {
          await deleteUploadedFile(oldSewa.filePdf)
        }
        finalFilePdf = await saveUploadedPdf(file)
      } else if (removePdf) {
        if (oldSewa.filePdf) {
          await deleteUploadedFile(oldSewa.filePdf)
        }
        finalFilePdf = null
      }
    } else {
      const body = await request.json()
      pksId = body.pksId ?? pksId
      nilaiSewa = body.nilaiSewa ?? nilaiSewa
      tglMulai = body.tglMulai ?? tglMulai
      tglBerakhir = body.tglBerakhir ?? tglBerakhir
      keterangan = body.keterangan !== undefined ? body.keterangan : keterangan
      status = body.status
      if (body.removePdf) {
        if (oldSewa.filePdf) {
          await deleteUploadedFile(oldSewa.filePdf)
        }
        finalFilePdf = null
      }
    }

    if (!pksId || !nilaiSewa || !tglMulai || !tglBerakhir) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    const computedTotal = hitungTotalNilaiSewa(Number(nilaiSewa), tglMulai, tglBerakhir)

    // Update Sewa & MonitoringKontrak dalam transaksi
    const updatedSewa = await prisma.$transaction(async (tx) => {
      const sewa = await tx.sewa.update({
        where: { id },
        data: {
          pksId,
          nilaiSewa: Number(nilaiSewa),
          totalNilaiSewa: computedTotal,
          tglMulai: new Date(tglMulai),
          tglBerakhir: new Date(tglBerakhir),
          keterangan: keterangan || null,
          filePdf: finalFilePdf,
        },
      })

      if (status) {
        await tx.monitoringKontrak.upsert({
          where: { sewaId: id },
          update: { status: status as StatusKontrak },
          create: { sewaId: id, status: status as StatusKontrak }
        })
      }

      return sewa
    })

    // Fetch updated data dengan status baru untuk log
    const fullUpdatedSewa = await prisma.sewa.findUnique({
      where: { id },
      include: { monitoringKontrak: true }
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'RENTAL',
      aksi: 'UBAH',
      dataSebelum: oldSewa as unknown as Record<string, unknown>,
      dataSetelah: fullUpdatedSewa as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ data: updatedSewa, message: 'Kontrak sewa berhasil diubah.' })
  } catch (error: unknown) {
    console.error('[API RENTAL PUT] Gagal mengubah Sewa:', error)
    const errorMessage = error instanceof Error ? error.message : 'Gagal mengubah kontrak sewa.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * DELETE /api/rental/[id]
 * Soft delete data Sewa (mengubah isDeleted menjadi true)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserProfile()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const oldSewa = await prisma.sewa.findUnique({
      where: { id },
      include: { monitoringKontrak: true }
    })

    if (!oldSewa || oldSewa.isDeleted) {
      return NextResponse.json({ error: 'Kontrak sewa tidak ditemukan.' }, { status: 404 })
    }

    // Lakukan Soft Delete (ubah isDeleted: true)
    const softDeletedSewa = await prisma.sewa.update({
      where: { id },
      data: { isDeleted: true },
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'RENTAL',
      aksi: 'HAPUS',
      dataSebelum: oldSewa as unknown as Record<string, unknown>,
      dataSetelah: softDeletedSewa as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ message: 'Kontrak sewa berhasil dihapus.' })
  } catch (error: unknown) {
    console.error('[API RENTAL DELETE] Gagal menghapus Sewa:', error)
    return NextResponse.json({ error: 'Gagal menghapus kontrak sewa.' }, { status: 500 })
  }
}
