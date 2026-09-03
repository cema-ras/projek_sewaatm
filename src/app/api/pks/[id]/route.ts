import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'
import { saveUploadedPdf, deleteUploadedFile } from '@/lib/file-upload'

/**
 * PUT /api/pks/[id]
 * Mengubah data PKS yang ada (Mendukung JSON & FormData untuk update/hapus file PDF)
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

    // Ambil data sebelum diubah untuk log
    const oldPks = await prisma.pks.findFirst({
      where: { id, isDeleted: false },
    })

    if (!oldPks) {
      return NextResponse.json({ error: 'Data PKS tidak ditemukan.' }, { status: 404 })
    }

    const contentType = request.headers.get('content-type') || ''

    let atmId = oldPks.atmId
    let nomorPks = oldPks.nomorPks
    let tanggalPks = oldPks.tanggalPks.toISOString()
    let finalFilePdf: string | null = oldPks.filePdf

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      atmId = (formData.get('atmId') as string) || atmId
      nomorPks = (formData.get('nomorPks') as string) || nomorPks
      tanggalPks = (formData.get('tanggalPks') as string) || tanggalPks

      const removePdf = formData.get('removePdf') === 'true'
      const file = formData.get('filePdf') as File | null

      if (file && file.size > 0) {
        if (oldPks.filePdf) {
          await deleteUploadedFile(oldPks.filePdf)
        }
        finalFilePdf = await saveUploadedPdf(file)
      } else if (removePdf) {
        if (oldPks.filePdf) {
          await deleteUploadedFile(oldPks.filePdf)
        }
        finalFilePdf = null
      }
    } else {
      const body = await request.json()
      atmId = body.atmId ?? atmId
      nomorPks = body.nomorPks ?? nomorPks
      tanggalPks = body.tanggalPks ?? tanggalPks
      if (body.removePdf) {
        if (oldPks.filePdf) {
          await deleteUploadedFile(oldPks.filePdf)
        }
        finalFilePdf = null
      }
    }

    if (!atmId || !nomorPks || !tanggalPks) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    // Lakukan update
    const updatedPks = await prisma.pks.update({
      where: { id },
      data: {
        atmId,
        nomorPks,
        tanggalPks: new Date(tanggalPks),
        filePdf: finalFilePdf,
      },
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'PKS',
      aksi: 'UBAH',
      dataSebelum: oldPks as unknown as Record<string, unknown>,
      dataSetelah: updatedPks as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ data: updatedPks, message: 'Data PKS berhasil diubah.' })
  } catch (error: unknown) {
    console.error('[API PKS PUT] Gagal mengubah PKS:', error)
    const errorMessage = error instanceof Error ? error.message : 'Gagal mengubah data PKS.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * DELETE /api/pks/[id]
 * Soft delete data PKS (mengubah isDeleted menjadi true)
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

    // Ambil data sebelum dihapus untuk log
    const oldPks = await prisma.pks.findUnique({
      where: { id },
    })

    if (!oldPks || oldPks.isDeleted) {
      return NextResponse.json({ error: 'Data PKS tidak ditemukan.' }, { status: 404 })
    }

    // Lakukan Soft Delete
    const softDeletedPks = await prisma.pks.update({
      where: { id },
      data: { isDeleted: true },
    })

    // Catat ke Activity Log
    await createActivityLog({
      userId: user.id,
      modul: 'PKS',
      aksi: 'HAPUS',
      dataSebelum: oldPks as unknown as Record<string, unknown>,
      dataSetelah: softDeletedPks as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ message: 'Data PKS berhasil dihapus.' })
  } catch (error: unknown) {
    console.error('[API PKS DELETE] Gagal menghapus PKS:', error)
    return NextResponse.json({ error: 'Gagal menghapus data PKS.' }, { status: 500 })
  }
}
