import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

// Type pour jspdf-autotable (déclaration manuelle)
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Import dynamique de jspdf-autotable
if (typeof window !== 'undefined') {
  import('jspdf-autotable')
}

// Fonction pour calculer les heures travaillées
function calculerHeures(pointage: any): string {
  if (!pointage.pointage_arrive || !pointage.pointage_depart) return '0h00'

  const arrive = new Date(`2000-01-01T${pointage.pointage_arrive}`)
  const depart = new Date(`2000-01-01T${pointage.pointage_depart}`)
  let heures = (depart.getTime() - arrive.getTime()) / (1000 * 60 * 60)

  if (pointage.pointage_pause && pointage.pointage_reprise) {
    const pause = new Date(`2000-01-01T${pointage.pointage_pause}`)
    const reprise = new Date(`2000-01-01T${pointage.pointage_reprise}`)
    heures -= (reprise.getTime() - pause.getTime()) / (1000 * 60 * 60)
  } else {
    heures -= 1
  }

  const h = Math.floor(heures)
  const m = Math.round((heures - h) * 60)
  return `${h}h${String(m).padStart(2, '0')}`
}

// Fonction pour exporter le rapport mensuel en PDF (employé)
export async function exportRapportPDF(
  employe: any,
  mois: string,
  pointages: any[],
  stats: any
) {
  const doc = new jsPDF()

  // En-tête
  doc.setFontSize(20)
  doc.text('Rapport Mensuel de Pointage', 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.text(`${employe.prenom_employe} ${employe.nom_employe}`, 105, 30, { align: 'center' })
  doc.text(employe.post_employe || '', 105, 37, { align: 'center' })

  const [annee, moisNum] = mois.split('-')
  const moisNom = new Date(parseInt(annee), parseInt(moisNum) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  doc.setFontSize(10)
  doc.text(`Période : ${moisNom}`, 105, 44, { align: 'center' })

  // Ligne de séparation
  doc.setLineWidth(0.5)
  doc.line(20, 50, 190, 50)

  // Statistiques
  doc.setFontSize(12)
  doc.text('Résumé du mois', 20, 60)

  doc.setFontSize(10)
  doc.text(`Heures travaillées : ${stats.totalHeures}`, 20, 70)
  doc.text(`Jours travaillés : ${stats.joursPresent}`, 20, 77)
  doc.text(`Total retards : ${stats.totalRetard}`, 20, 84)
  doc.text(`Absences : ${stats.joursAbsent} (dont ${stats.absencesJustifiees} justifiées)`, 20, 91)
  doc.text(`Total payable : ${stats.heuresPayables}`, 20, 98)

  // Tableau des pointages
  const tableData = pointages.map(p => [
    new Date(p.date_pointage).toLocaleDateString('fr-FR'),
    p.pointage_arrive || '----',
    p.pointage_pause || '----',
    p.pointage_reprise || '----',
    p.pointage_depart || '----',
    calculerHeures(p),
    p.retard_minutes > 0 ? `${p.retard_minutes}min` : 'OK',
    p.statut === 'present' ? 'Présent' : p.statut === 'absent' ? 'Absent' : 'Week-end'
  ])

  doc.autoTable({
    startY: 110,
    head: [['Date', 'Arrivée', 'Pause', 'Reprise', 'Départ', 'Heures', 'Retard', 'Statut']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  })

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Page ${i} sur ${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      105,
      285,
      { align: 'center' }
    )
  }

  // Télécharger
  doc.save(`rapport_${employe.nom_employe}_${mois}.pdf`)
}

// Fonction pour exporter en Excel (Admin/RH)
export function exportRapportExcel(
  employes: any[],
  pointages: any[],
  mois: string
) {
  // Préparer les données
  const data = pointages.map(p => {
    const emp = employes.find(e => e.id_employe === p.id_employe)
    return {
      'Employé': emp ? `${emp.prenom_employe} ${emp.nom_employe}` : 'N/A',
      'Poste': emp?.post_employe || '',
      'Date': new Date(p.date_pointage).toLocaleDateString('fr-FR'),
      'Arrivée': p.pointage_arrive || '',
      'Pause': p.pointage_pause || '',
      'Reprise': p.pointage_reprise || '',
      'Départ': p.pointage_depart || '',
      'Heures travaillées': calculerHeures(p),
      'Retard (min)': p.retard_minutes || 0,
      'Statut': p.statut === 'present' ? 'Présent' : p.statut === 'absent' ? 'Absent' : 'Week-end',
      'Justification Absence': p.justification_absence || '',
      'Statut Justif. Absence': p.statut_justification_absence || '',
      'Justification Retard': p.justification_retard || '',
      'Statut Justif. Retard': p.statut_justification_retard || '',
    }
  })

  // Créer le workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // Ajuster la largeur des colonnes
  const colWidths = [
    { wch: 20 }, // Employé
    { wch: 15 }, // Poste
    { wch: 12 }, // Date
    { wch: 10 }, // Arrivée
    { wch: 10 }, // Pause
    { wch: 10 }, // Reprise
    { wch: 10 }, // Départ
    { wch: 15 }, // Heures
    { wch: 12 }, // Retard
    { wch: 12 }, // Statut
    { wch: 30 }, // Justif Absence
    { wch: 15 }, // Statut Justif Absence
    { wch: 30 }, // Justif Retard
    { wch: 15 }, // Statut Justif Retard
  ]
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Pointages')

  // Ajouter une feuille de statistiques
  const statsData = employes.map(emp => {
    const empPointages = pointages.filter(p => p.id_employe === emp.id_employe)
    const joursPresent = empPointages.filter(p => p.statut === 'present').length
    const joursAbsent = empPointages.filter(p => p.statut === 'absent').length
    const totalRetard = empPointages.reduce((sum, p) => sum + (p.retard_minutes || 0), 0)
    const totalHeures = empPointages.reduce((sum, p) => {
      const heuresStr = calculerHeures(p)
      const [h, m] = heuresStr.split('h').map(v => parseInt(v) || 0)
      return sum + h + (m / 60)
    }, 0)

    return {
      'Employé': `${emp.prenom_employe} ${emp.nom_employe}`,
      'Poste': emp.post_employe || '',
      'Jours travaillés': joursPresent,
      'Heures travaillées': `${Math.floor(totalHeures)}h${Math.round((totalHeures % 1) * 60)}`,
      'Jours d\'absence': joursAbsent,
      'Total retard (min)': totalRetard,
    }
  })

  const wsStats = XLSX.utils.json_to_sheet(statsData)
  wsStats['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques')

  // Télécharger
  XLSX.writeFile(wb, `rapport_pointages_${mois}.xlsx`)
}

// Fonction pour exporter un employé spécifique en Excel
export function exportEmployeExcel(
  employe: any,
  pointages: any[],
  mois: string,
  stats: any
) {
  const data = pointages.map(p => ({
    'Date': new Date(p.date_pointage).toLocaleDateString('fr-FR'),
    'Arrivée': p.pointage_arrive || '',
    'Pause': p.pointage_pause || '',
    'Reprise': p.pointage_reprise || '',
    'Départ': p.pointage_depart || '',
    'Heures travaillées': calculerHeures(p),
    'Retard (min)': p.retard_minutes || 0,
    'Statut': p.statut === 'present' ? 'Présent' : p.statut === 'absent' ? 'Absent' : 'Week-end',
    'Justification Absence': p.justification_absence || '',
    'Statut Justif. Absence': p.statut_justification_absence || '',
    'Justification Retard': p.justification_retard || '',
    'Statut Justif. Retard': p.statut_justification_retard || '',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  
  ws['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 15 },
    { wch: 30 }, { wch: 15 }
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Pointages')

  // Ajouter une feuille de résumé
  const resumeData = [
    { 'Indicateur': 'Heures travaillées', 'Valeur': stats.totalHeures },
    { 'Indicateur': 'Jours travaillés', 'Valeur': stats.joursPresent },
    { 'Indicateur': 'Total retards', 'Valeur': stats.totalRetard },
    { 'Indicateur': 'Jours d\'absence', 'Valeur': stats.joursAbsent },
    { 'Indicateur': 'Absences justifiées', 'Valeur': stats.absencesJustifiees },
    { 'Indicateur': 'Total payable', 'Valeur': stats.heuresPayables },
  ]

  const wsResume = XLSX.utils.json_to_sheet(resumeData)
  wsResume['!cols'] = [{ wch: 25 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé')

  XLSX.writeFile(wb, `rapport_${employe.nom_employe}_${mois}.xlsx`)
}