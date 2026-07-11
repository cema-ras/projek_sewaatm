import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Hitung masa sewa dari tgl_mulai ke tgl_berakhir
 * Computed — tidak disimpan di DB
 */
export function hitungMasaSewa(tglMulai: Date | string, tglBerakhir: Date | string): string {
  const mulai = new Date(tglMulai)
  const berakhir = new Date(tglBerakhir)

  const diffMs = berakhir.getTime() - mulai.getTime()
  const diffHari = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffBulan = Math.floor(diffHari / 30)
  const diffTahun = Math.floor(diffBulan / 12)

  if (diffTahun >= 1) {
    const sisaBulan = diffBulan % 12
    return sisaBulan > 0 ? `${diffTahun} tahun ${sisaBulan} bulan` : `${diffTahun} tahun`
  }
  if (diffBulan >= 1) return `${diffBulan} bulan`
  return `${diffHari} hari`
}

/**
 * Hitung sisa hari kontrak dari hari ini ke tgl_berakhir
 * Computed — tidak disimpan di DB
 */
export function hitungSisaHari(tglBerakhir: Date | string): number {
  const berakhir = new Date(tglBerakhir)
  berakhir.setHours(0, 0, 0, 0)
  const hari_ini = new Date()
  hari_ini.setHours(0, 0, 0, 0)

  const diffMs = berakhir.getTime() - hari_ini.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/** Format tanggal ke format Indonesia: 11 Juli 2026 */
export function formatTanggal(date: Date | string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Format mata uang Rupiah */
export function formatRupiah(nilai: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(nilai)
}

/** Label status kontrak dalam Bahasa Indonesia */
export const STATUS_KONTRAK_LABEL: Record<string, string> = {
  aktif: 'Aktif',
  tidak_aktif: 'Tidak Aktif',
  dalam_pemeliharaan: 'Dalam Pemeliharaan',
  dipindahkan: 'Dipindahkan',
  dihentikan: 'Dihentikan',
}

/** Warna badge per status kontrak */
export const STATUS_KONTRAK_COLOR: Record<string, string> = {
  aktif: 'bg-green-100 text-green-800',
  tidak_aktif: 'bg-gray-100 text-gray-700',
  dalam_pemeliharaan: 'bg-yellow-100 text-yellow-800',
  dipindahkan: 'bg-blue-100 text-blue-800',
  dihentikan: 'bg-red-100 text-red-800',
}
