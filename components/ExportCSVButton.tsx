'use client'

interface Member {
  id: string
  first_name: string | null
  last_name: string | null
  role: string | null
  created_at?: string
}

export default function ExportCSVButton({ members }: { members: Member[] }) {
  const handleExport = () => {
    if (!members || members.length === 0) return

    // En-têtes CSV
    const headers = ['ID', 'Prenom', 'Nom', 'Role']
    
    // Contenu des lignes
    const rows = members.map((m) => [
      `"${m.id}"`,
      `"${m.first_name ?? ''}"`,
      `"${m.last_name ?? ''}"`,
      `"${m.role ?? 'parent'}"`
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `membres_ape_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button
      onClick={handleExport}
      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition flex items-center gap-2"
    >
      <span>📥</span> Exporter la liste (CSV)
    </button>
  )
}