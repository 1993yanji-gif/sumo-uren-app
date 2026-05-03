import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { TimeEntry } from '@/lib/supabase-hours'

export type ExportRow = {
  medewerker: string
  datum: string
  begintijd: string
  eindtijd: string
  pauzeMinuten: number
  totaalUren: number
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function mapEntriesForExport(entries: TimeEntry[]): ExportRow[] {
  return entries.map((entry) => ({
    medewerker: entry.employeeName,
    datum: formatDate(entry.workDate),
    begintijd: entry.startTime,
    eindtijd: entry.endTime,
    pauzeMinuten: entry.breakMinutes,
    totaalUren: Number(entry.totalHours.toFixed(2)),
  }))
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportToCsv(rows: ExportRow[], filename: string) {
  const totalHours = rows.reduce((sum, row) => sum + row.totaalUren, 0)
  const headers = ['Medewerker', 'Datum', 'Begintijd', 'Eindtijd', 'Pauze (min)', 'Totaal uren']
  const csvRows = rows.map((row) => [
    row.medewerker,
    row.datum,
    row.begintijd,
    row.eindtijd,
    String(row.pauzeMinuten),
    row.totaalUren.toFixed(2),
  ])

  const csvContent = [headers, ...csvRows, ['', '', '', '', 'Maandtotaal', totalHours.toFixed(2)]]
    .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  triggerDownload(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), filename)
}

export function exportToExcel(rows: ExportRow[], filename: string) {
  const totalHours = rows.reduce((sum, row) => sum + row.totaalUren, 0)
  const worksheet = XLSX.utils.json_to_sheet([
    ...rows.map((row) => ({
      Medewerker: row.medewerker,
      Datum: row.datum,
      Begintijd: row.begintijd,
      Eindtijd: row.eindtijd,
      'Pauze (min)': row.pauzeMinuten,
      'Totaal uren': row.totaalUren,
    })),
    {
      Medewerker: '',
      Datum: '',
      Begintijd: '',
      Eindtijd: '',
      'Pauze (min)': 'Maandtotaal',
      'Totaal uren': Number(totalHours.toFixed(2)),
    },
  ])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Uren')
  XLSX.writeFile(workbook, filename)
}

export function exportToPdf(rows: ExportRow[], filename: string, title: string) {
  const doc = new jsPDF()
  const totalHours = rows.reduce((sum, row) => sum + row.totaalUren, 0)

  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(11)
  doc.text(`Maandtotaal: ${totalHours.toFixed(2)} uur`, 14, 26)

  autoTable(doc, {
    startY: 32,
    head: [['Medewerker', 'Datum', 'Begintijd', 'Eindtijd', 'Pauze', 'Totaal uren']],
    body: rows.map((row) => [
      row.medewerker,
      row.datum,
      row.begintijd,
      row.eindtijd,
      String(row.pauzeMinuten),
      row.totaalUren.toFixed(2),
    ]),
    foot: [['', '', '', '', 'Maandtotaal', `${totalHours.toFixed(2)} uur`]],
    styles: {
      fontSize: 9,
    },
    headStyles: {
      fillColor: [140, 106, 47],
    },
    footStyles: {
      fillColor: [245, 238, 220],
      textColor: [48, 33, 16],
      fontStyle: 'bold',
    },
  })

  doc.save(filename)
}
