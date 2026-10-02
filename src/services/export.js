import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// sheets: [[name, arrayOfObjects], ...]
export function exportXlsx(filename, sheets) {
  const wb = XLSX.utils.book_new()
  sheets.forEach(([name, rows]) => {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{}]), name.slice(0, 31))
  })
  XLSX.writeFile(wb, filename)
}

// sections: [[heading, arrayOfObjects], ...]
export function exportPdf(filename, title, subtitle, sections) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 16)
  doc.setFontSize(9)
  doc.text(subtitle, 14, 22)
  let y = 32
  sections.forEach(([heading, rows]) => {
    if (!rows.length) return
    if (y > 250) { doc.addPage(); y = 16 }
    doc.setFontSize(11)
    doc.text(heading, 14, y)
    const head = Object.keys(rows[0])
    autoTable(doc, {
      startY: y + 3,
      head: [head],
      body: rows.map((r) => head.map((h) => String(r[h] ?? ''))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 32, 29] },
    })
    y = doc.lastAutoTable.finalY + 12
  })
  doc.save(filename)
}
