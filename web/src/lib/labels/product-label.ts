import bwipjs from "bwip-js";
import type { EtiquetteProduit } from "@cnts/api";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function code128(text: string): string {
  return bwipjs.toSVG({ bcid: "code128", text, scale: 2, height: 9, includetext: true, textxalign: "center" });
}

/**
 * Étiquette produit ISBT 128 (format 100 × 100 mm) : codes 128 du DIN, du code
 * produit, du groupe et de la péremption, plus le DataMatrix calculé par le
 * backend. Aucune donnée personnelle du donneur.
 */
export function renderProductLabelHtml(e: EtiquetteProduit): string {
  const fr = (d: string) => new Date(d).toLocaleDateString("fr-FR");
  const datamatrix = e.payload.datamatrix_content
    ? bwipjs.toSVG({ bcid: "datamatrix", text: e.payload.datamatrix_content, scale: 3 })
    : "";
  const cell = (label: string, value: string, barcode?: string) => `
    <div class="cell">
      <div class="label">${escapeHtml(label)}</div>
      ${barcode ? `<div class="bc">${barcode}</div>` : `<div class="value">${escapeHtml(value)}</div>`}
    </div>`;

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Étiquette ${escapeHtml(e.din)}</title>
<style>
  @page { size: 100mm 100mm; margin: 3mm; }
  body { font-family: Arial, sans-serif; margin: 0; }
  .etiquette { width: 94mm; height: 94mm; border: 1px solid #000; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(3, 1fr); }
  .cell { border: 1px solid #000; padding: 1.5mm; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
  .label { font-size: 7pt; text-transform: uppercase; color: #333; }
  .value { font-size: 16pt; font-weight: bold; }
  .bc svg { width: 100%; height: auto; max-height: 20mm; }
  .dm svg { width: 22mm; height: 22mm; }
  .foot { grid-column: span 2; font-size: 7pt; display: flex; justify-content: space-between; align-items: center; }
</style></head>
<body onload="window.print()">
<div class="etiquette">
  ${cell("DIN", e.din, code128(e.din))}
  ${cell("Groupe ABO/Rh", e.groupe_sanguin ?? "—")}
  ${cell("Produit", e.type_produit, e.code_produit_isbt ? code128(e.code_produit_isbt) : undefined)}
  ${cell("Péremption", fr(e.date_peremption))}
  <div class="cell foot">
    <div>Prélevé le ${escapeHtml(fr(e.date_prelevement))}${e.lot ? `<br>Lot ${escapeHtml(e.lot)}` : ""}<br>CNTS Dakar</div>
    <div class="dm">${datamatrix}</div>
  </div>
</div>
</body></html>`;
}
