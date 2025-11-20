
// utils/exports.ts

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import type {
  Employee,
  PointageWithJustifications,
  PointageStats,
} from "@/types/export";

// Helper pour calculer les heures
function calculerHeures(pointage: PointageWithJustifications): string {
  if (!pointage.pointage_arrive || !pointage.pointage_depart) return "0h00";

  const arrive = new Date(`2000-01-01T${pointage.pointage_arrive}`);
  const depart = new Date(`2000-01-01T${pointage.pointage_depart}`);
  let heures = (depart.getTime() - arrive.getTime()) / (1000 * 60 * 60);

  if (pointage.pointage_pause && pointage.pointage_reprise) {
    const pause = new Date(`2000-01-01T${pointage.pointage_pause}`);
    const reprise = new Date(`2000-01-01T${pointage.pointage_reprise}`);
    heures -= (reprise.getTime() - pause.getTime()) / (1000 * 60 * 60);
  } else {
    heures -= 1;
  }

  heures = Math.max(0, heures);
  const h = Math.floor(heures);
  const m = Math.round((heures - h) * 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

// Helper pour formater le statut de justification
function formatJustificationStatus(
  status: "en_attente" | "justifiee" | "rejetee" | null
): string {
  switch (status) {
    case "en_attente":
      return "En attente";
    case "justifiee":
      return "Validée";
    case "rejetee":
      return "Rejetée";
    default:
      return "-";
  }
}

export function exportRapportPDF(
  employe: Employee,
  mois: string,
  pointages: PointageWithJustifications[],
  stats: PointageStats
): void {
  const doc = new jsPDF();
  const primaryColor = [41, 128, 185] as [number, number, number]; // Blue
  const secondaryColor = [52, 73, 94] as [number, number, number]; // Dark Blue/Gray

  // --- En-tête ---
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, "F"); // Bandeau bleu en haut

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("RAPPORT MENSUEL DE POINTAGE", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const [annee, moisNum] = mois.split("-");
  const moisNom = new Date(
    parseInt(annee),
    parseInt(moisNum) - 1
  ).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  doc.text(moisNom.toUpperCase(), 105, 30, { align: "center" });

  // --- Infos Employé ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${employe.prenom_employe} ${employe.nom_employe}`, 20, 55);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(employe.post_employe || "Poste non défini", 20, 62);

  // --- Résumé (Box) ---
  const startYStats = 70;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(15, startYStats, 180, 35, 3, 3, "FD");

  doc.setFontSize(11);
  doc.setTextColor(...secondaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("Synthèse du mois", 20, startYStats + 8);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  // Colonne 1
  doc.text(`Heures travaillées :`, 25, startYStats + 18);
  doc.setFont("helvetica", "bold");
  doc.text(stats.totalHeures, 60, startYStats + 18);
  doc.setFont("helvetica", "normal");

  doc.text(`Jours travaillés :`, 25, startYStats + 25);
  doc.setFont("helvetica", "bold");
  doc.text(stats.joursPresent.toString(), 60, startYStats + 25);
  doc.setFont("helvetica", "normal");

  // Colonne 2
  doc.text(`Total retards :`, 85, startYStats + 18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(231, 76, 60); // Rouge pour retard
  doc.text(stats.totalRetard, 115, startYStats + 18);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  doc.text(`Absences :`, 85, startYStats + 25);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${stats.joursAbsent} (${stats.absencesJustifiees} justif.)`,
    115,
    startYStats + 25
  );
  doc.setFont("helvetica", "normal");

  // Colonne 3
  doc.setFontSize(11);
  doc.text(`Total Payable :`, 140, startYStats + 22);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(39, 174, 96); // Vert
  doc.text(stats.heuresPayables, 190, startYStats + 22, { align: "right" });
  doc.setTextColor(0, 0, 0);

  // --- Tableau ---
  const pointagesFiltres = pointages.filter((p) => p.statut !== "weekend");

  const tableData = pointagesFiltres.map((p) => {
    // Déterminer le statut de justification à afficher
    let justifStatus = "-";
    if (p.statut === "absent") {
      justifStatus = formatJustificationStatus(p.statut_justification_absence);
    } else if (p.retard_minutes > 0) {
      justifStatus = formatJustificationStatus(p.statut_justification_retard);
    }

    return [
      new Date(p.date_pointage).toLocaleDateString("fr-FR"),
      p.pointage_arrive?.slice(0, 5) || "--:--",
      p.pointage_pause?.slice(0, 5) || "--:--",
      p.pointage_reprise?.slice(0, 5) || "--:--",
      p.pointage_depart?.slice(0, 5) || "--:--",
      calculerHeures(p),
      p.retard_minutes > 0 ? `${p.retard_minutes}min` : "-",
      p.statut === "present"
        ? "Présent"
        : p.statut === "absent"
        ? "Absent"
        : "Week-end",
      justifStatus,
    ];
  });

  autoTable(doc, {
    startY: 115,
    head: [
      [
        "Date",
        "Arrivée",
        "Pause",
        "Reprise",
        "Départ",
        "Heures",
        "Retard",
        "Statut",
        "Justif.",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: secondaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 22 }, // Date
      1: { halign: "center", cellWidth: 15 },
      2: { halign: "center", cellWidth: 15 },
      3: { halign: "center", cellWidth: 15 },
      4: { halign: "center", cellWidth: 15 },
      5: { halign: "center", fontStyle: "bold", cellWidth: 18 },
      6: { halign: "center", textColor: [231, 76, 60], cellWidth: 18 }, // Retard en rouge
      7: { halign: "center", cellWidth: 20 },
      8: { halign: "center" }, // Justif
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    styles: {
      fontSize: 8, // Réduit un peu pour faire tenir la colonne
      cellPadding: 1.5,
    },
    didParseCell: function (data) {
      // Coloration conditionnelle de la colonne Justif
      if (data.section === "body" && data.column.index === 8) {
        const text = data.cell.raw as string;
        if (text === "Validée") {
          data.cell.styles.textColor = [39, 174, 96]; // Vert
          data.cell.styles.fontStyle = "bold";
        } else if (text === "Rejetée") {
          data.cell.styles.textColor = [231, 76, 60]; // Rouge
          data.cell.styles.fontStyle = "bold";
        } else if (text === "En attente") {
          data.cell.styles.textColor = [243, 156, 18]; // Orange
        }
      }
    },
  });

  // --- Pied de page ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Généré le ${new Date().toLocaleDateString(
        "fr-FR"
      )} - Page ${i}/${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  doc.save(`Rapport_${employe.nom_employe}_${mois}.pdf`);
}

export async function exportEmployeExcel(
  employe: Employee,
  pointages: PointageWithJustifications[],
  mois: string,
  stats: PointageStats
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Rapport Mensuel");

  // --- Styles ---
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 12 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF2980B9" } }, // Blue
    alignment: { horizontal: "center", vertical: "middle" },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
  };

  const subHeaderStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FF2C3E50" }, size: 11 },
    alignment: { horizontal: "left" },
  };

  const cellStyle: Partial<ExcelJS.Style> = {
    alignment: { horizontal: "center", vertical: "middle" },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
  };

  // --- En-tête ---
  worksheet.mergeCells("A1:L2");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "RAPPORT MENSUEL DE POINTAGE";
  titleCell.style = {
    font: { bold: true, size: 16, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF2C3E50" } }, // Dark Blue
    alignment: { horizontal: "center", vertical: "middle" },
  };

  // --- Infos Employé ---
  worksheet.getCell("A4").value = "Employé :";
  worksheet.getCell("A4").style = subHeaderStyle;
  worksheet.getCell(
    "B4"
  ).value = `${employe.prenom_employe} ${employe.nom_employe}`;
  worksheet.getCell("B4").font = { size: 11 };

  worksheet.getCell("A5").value = "Poste :";
  worksheet.getCell("A5").style = subHeaderStyle;
  worksheet.getCell("B5").value = employe.post_employe || "Non défini";

  worksheet.getCell("A6").value = "Période :";
  worksheet.getCell("A6").style = subHeaderStyle;
  worksheet.getCell("B6").value = mois;

  // --- Résumé (Box) ---
  worksheet.mergeCells("A8:L8");
  const statsTitle = worksheet.getCell("A8");
  statsTitle.value = "SYNTHÈSE DU MOIS";
  statsTitle.style = {
    font: { bold: true, color: { argb: "FF2C3E50" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFECF0F1" } }, // Light Gray
    alignment: { horizontal: "left", indent: 1 },
    border: {
      top: { style: "medium" },
      left: { style: "medium" },
      right: { style: "medium" },
    },
  };

  const statsRow1 = worksheet.getRow(9);
  statsRow1.values = [
    "Heures travaillées",
    stats.totalHeures,
    "",
    "Total Retards",
    stats.totalRetard,
    "",
    "Total Payable",
    stats.heuresPayables,
  ];
  statsRow1.font = { bold: true };

  const statsRow2 = worksheet.getRow(10);
  statsRow2.values = [
    "Jours travaillés",
    stats.joursPresent,
    "",
    "Absences",
    stats.joursAbsent,
  ];

  // Bordures pour la section stats
  for (let r = 9; r <= 10; r++) {
    worksheet.getRow(r).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
      cell.border = { left: { style: "medium" }, right: { style: "medium" } };
    });
  }
  worksheet.mergeCells("A11:L11"); // Fermeture du cadre
  worksheet.getCell("A11").border = { top: { style: "medium" } };

  // --- Tableau des Pointages ---
  const headerRow = worksheet.getRow(13);
  headerRow.values = [
    "Date",
    "Arrivée",
    "Pause",
    "Reprise",
    "Départ",
    "Heures",
    "Retard (min)",
    "Statut",
    "Justif. Absence",
    "Statut Justif.",
    "Justif. Retard",
    "Statut Justif.",
  ];
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.style = headerStyle;
  });

  pointages.forEach((p) => {
    const row = worksheet.addRow([
      new Date(p.date_pointage).toLocaleDateString("fr-FR"),
      p.pointage_arrive || "",
      p.pointage_pause || "",
      p.pointage_reprise || "",
      p.pointage_depart || "",
      calculerHeures(p),
      p.retard_minutes || 0,
      p.statut === "present"
        ? "Présent"
        : p.statut === "absent"
        ? "Absent"
        : "Week-end",
      p.justification_absence || "",
      p.statut_justification_absence || "",
      p.justification_retard || "",
      p.statut_justification_retard || "",
    ]);

    row.eachCell((cell, colNumber) => {
      cell.style = cellStyle;

      // Retard en rouge
      if (colNumber === 7 && p.retard_minutes > 0) {
        cell.font = { color: { argb: "FFE74C3C" }, bold: true };
      }

      // Statut colors
      if (colNumber === 8) {
        if (p.statut === "present") cell.font = { color: { argb: "FF27AE60" } }; // Green
        if (p.statut === "absent") cell.font = { color: { argb: "FFE74C3C" } }; // Red
      }
    });
  });

  // Largeur des colonnes
  worksheet.columns = [
    { width: 15 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 25 },
    { width: 15 },
    { width: 25 },
    { width: 15 },
  ];

  // Sauvegarde
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Rapport_${employe.nom_employe}_${mois}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
