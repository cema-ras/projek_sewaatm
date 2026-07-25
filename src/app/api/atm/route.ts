import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/services/auth-user'
import { createActivityLog } from '@/services/activity-log'

export const dynamic = 'force-dynamic'

/**
 * GET /api/atm
 * Mendapatkan daftar mesin ATM dengan pencarian opsional
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
      where: search
        ? {
            OR: [
              { kodeAtm: { contains: search, mode: 'insensitive' } },
              { kodeAtmLama: { contains: search, mode: 'insensitive' } },
              { lokasi: { contains: search, mode: 'insensitive' } },
              { jenisMesin: { contains: search, mode: 'insensitive' } },
              { cabangPengelola: { contains: search, mode: 'insensitive' } },
              
              // HAPUS { branch: { contains: search } } 
              // Karena branch sekarang Boolean, fungsi contains() akan membuat Prisma error.
            ],
          }
        : {},
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
    
    // 1. TAMBAHKAN cabangPengelola di sini
    const { kodeAtm, kodeAtmLama, lokasi, jenisMesin, cabangPengelola, branch } = body

    // 2. PERBAIKI validasi boolean. Jangan gunakan !branch, tapi cek apakah undefined
    if (!kodeAtm || !lokasi || !jenisMesin || !cabangPengelola || branch === undefined) {
      return NextResponse.json({ error: 'Field penting tidak boleh kosong.' }, { status: 400 })
    }

    // 3. Masukkan cabangPengelola ke data Prisma
    const newAtm = await prisma.atm.create({
      data: {
        userId: user.id,
        kodeAtm,
        kodeAtmLama: kodeAtmLama || null,
        lokasi,
        jenisMesin,
        cabangPengelola, // Field baru ditambahkan
        
        // PENTING: Jika di schema.prisma field 'branch' masih bertipe String,
        // ubah kode di bawah ini menjadi -> branch: String(branch)
        branch, 
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
    return NextResponse.json({ error: 'Gagal menambahkan ATM baru.' }, { status: 500 })
  }
}