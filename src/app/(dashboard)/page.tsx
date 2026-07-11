import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { Building2, FileSpreadsheet, MonitorPlay, AlertTriangle, Coins, History, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Fetch real-time metrics
  const totalAtm = await prisma.atm.count()
  
  const totalPks = await prisma.pks.count()
  
  const totalKontrakAktif = await prisma.monitoringKontrak.count({
    where: { status: 'aktif' }
  })

  const today = new Date()
  const threshold30Days = new Date()
  threshold30Days.setDate(today.getDate() + 30)

  const kontrakAkanBerakhir = await prisma.sewa.count({
    where: {
      tglBerakhir: {
        gte: today,
        lte: threshold30Days,
      },
      monitoringKontrak: {
        status: 'aktif',
      },
    },
  })

  const sumNilaiSewa = await prisma.sewa.aggregate({
    _sum: {
      nilaiSewa: true,
    },
    where: {
      monitoringKontrak: {
        status: 'aktif',
      },
    },
  })
  
  const totalNilaiSewa = Number(sumNilaiSewa._sum.nilaiSewa || 0)

  const aktivitasTerbaru = await prisma.monitoringAktivitas.findMany({
    take: 5,
    orderBy: {
      tanggal: 'desc',
    },
    include: {
      user: {
        select: {
          nama: true,
        },
      },
    },
  })

  const cards = [
    {
      title: 'Total ATM',
      value: totalAtm,
      description: 'Mesin ATM terdaftar',
      icon: Building2,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      title: 'Total PKS',
      value: totalPks,
      description: 'Perjanjian Kerja Sama',
      icon: FileSpreadsheet,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      title: 'Kontrak Aktif',
      value: totalKontrakAktif,
      description: 'Sewa sedang berjalan',
      icon: MonitorPlay,
      color: 'text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-400',
    },
    {
      title: 'Akan Berakhir',
      value: kontrakAkanBerakhir,
      description: 'Berakhir dlm waktu < 30 hari',
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400',
      highlight: kontrakAkanBerakhir > 0,
    },
    {
      title: 'Total Nilai Sewa',
      value: formatRupiah(totalNilaiSewa),
      description: 'Total nilai sewa kontrak aktif',
      icon: Coins,
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400',
      className: 'md:col-span-2 lg:col-span-1',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Ringkasan Dashboard
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tinjauan metrik utama dan aktivitas pengelolaan sewa ATM.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card, idx) => (
          <Card 
            key={idx} 
            className={`border-slate-200 shadow-sm dark:border-slate-850 hover:shadow-md transition-shadow ${card.className || ''} ${
              card.highlight ? 'border-orange-200 bg-orange-50/20 dark:border-orange-900/30' : ''
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {card.value}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Logs & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Activity Logs */}
        <Card className="col-span-2 border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <History className="h-4 w-4 text-teal-600" />
                Aktivitas Terbaru
              </CardTitle>
              <CardDescription>Log tindakan CRUD yang dilakukan pengguna.</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            {aktivitasTerbaru.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-center text-slate-400">
                <p className="text-sm">Belum ada catatan aktivitas.</p>
              </div>
            ) : (
              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-5 space-y-6">
                {aktivitasTerbaru.map((log) => (
                  <div key={log.id} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-7.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 border-teal-500 shadow-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        {formatTanggal(log.tanggal)}
                      </span>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {log.aksi} - <span className="text-teal-600 font-medium">{log.modul}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Oleh: <span className="font-medium">{log.user.nama}</span> | Status: {log.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Help / Info card */}
        <Card className="border-slate-200 shadow-sm dark:border-slate-800 bg-gradient-to-br from-teal-950 to-emerald-950 text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold text-orange-400">Pemberitahuan</CardTitle>
            <CardDescription className="text-slate-300">Tips monitoring kontrak sewa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-200">
            <p>
              Sistem akan otomatis menghitung <strong>Sisa Hari</strong> dan <strong>Masa Sewa</strong> secara real-time berdasarkan tanggal mulai dan tanggal berakhir kontrak.
            </p>
            <p>
              Gunakan menu <strong>Monitoring Kontrak</strong> untuk melihat visualisasi status kontrak dan memfilter data berdasarkan status aktif atau pemeliharaan.
            </p>
            <div className="rounded-lg bg-white/10 p-3">
              <span className="font-bold text-orange-300">Status Tersedia:</span>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-300">
                <li>Aktif</li>
                <li>Tidak Aktif</li>
                <li>Dalam Pemeliharaan</li>
                <li>Dipindahkan</li>
                <li>Dihentikan</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
