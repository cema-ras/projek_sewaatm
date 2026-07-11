// ─────────────────────────────────────────
// Enums
// ─────────────────────────────────────────

export type Role = 'admin' | 'user'

export type StatusKontrak =
  | 'aktif'
  | 'tidak_aktif'
  | 'dalam_pemeliharaan'
  | 'dipindahkan'
  | 'dihentikan'

// ─────────────────────────────────────────
// Entity Types (mirroring Prisma models)
// ─────────────────────────────────────────

export interface User {
  id: string
  nama: string
  email: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface Atm {
  id: string
  userId: string
  kodeAtm: string
  kodeAtmLama?: string | null
  lokasi: string
  jenisMesin: string
  branch: string
  createdAt: Date
  updatedAt: Date
  user?: User
  pks?: Pks[]
}

export interface Pks {
  id: string
  atmId: string
  nomorPks: string
  tanggalPks: Date
  createdAt: Date
  updatedAt: Date
  atm?: Atm
  sewa?: Sewa
}

export interface Sewa {
  id: string
  pksId: string
  nilaiSewa: number
  tglMulai: Date
  tglBerakhir: Date
  keterangan?: string | null
  createdAt: Date
  updatedAt: Date
  // Computed fields (tidak dari DB):
  masaSewa?: string   // dihitung dari tglBerakhir - tglMulai
  status?: StatusKontrak
  pks?: Pks
  monitoringKontrak?: MonitoringKontrak
}

export interface MonitoringKontrak {
  id: string
  sewaId: string
  status: StatusKontrak
  createdAt: Date
  updatedAt: Date
  // Computed field (tidak dari DB):
  sisaHari?: number  // dihitung dari tglBerakhir - today()
  sewa?: Sewa
}

export interface MonitoringAktivitas {
  id: string
  userId: string
  modul: string
  aksi: string
  dataSebelum?: Record<string, unknown> | null
  dataSetelah?: Record<string, unknown> | null
  tanggal: Date
  status: string
  createdAt: Date
  user?: User
}

// ─────────────────────────────────────────
// Utility Types
// ─────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
