import { jsPDF } from "jspdf";
import type { JourneyExport } from "@/lib/journey-export";
import { journeyPdfFilename } from "@/lib/journey-export";

const INK = { r: 12, g: 10, b: 9 };
const MUTED = { r: 87, g: 83, b: 78 };
const RULE = { r: 214, g: 211, b: 209 };
const PAPER = { r: 250, g: 250, b: 249 };
const ACCENT_BG = { r: 28, g: 25, b: 23 };

const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

type Doc = InstanceType<typeof jsPDF>;

function setInk(doc: Doc, color = INK) {
  doc.setTextColor(color.r, color.g, color.b);
}

function rule(doc: Doc, y: number) {
  doc.setDrawColor(RULE.r, RULE.g, RULE.b);
  doc.setLineWidth(0.35);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
}

function ensureSpace(doc: Doc, y: number, needed: number): number {
  if (y + needed <= PAGE_H - 18) return y;
  doc.addPage();
  paintPage(doc);
  return 28;
}

function paintPage(doc: Doc) {
  doc.setFillColor(PAPER.r, PAPER.g, PAPER.b);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setFillColor(ACCENT_BG.r, ACCENT_BG.g, ACCENT_BG.b);
  doc.rect(0, 0, PAGE_W, 8, "F");
}

function wrap(doc: Doc, text: string, width: number): string[] {
  return doc.splitTextToSize(text, width) as string[];
}

function sectionTitle(doc: Doc, label: string, y: number): number {
  y = ensureSpace(doc, y, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(label.toUpperCase(), MARGIN, y);
  rule(doc, y + 3);
  return y + 12;
}

function footer(doc: Doc, pages: number) {
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setInk(doc, MUTED);
    doc.text("JourneyMind", MARGIN, PAGE_H - 10);
    doc.text(`${i} / ${pages}`, PAGE_W - MARGIN, PAGE_H - 10, { align: "right" });
  }
}

export function renderJourneyPdf(model: JourneyExport): Doc {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  paintPage(doc);

  let y = 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setInk(doc, MUTED);
  doc.text(model.brand.toUpperCase(), MARGIN, y);

  y += 14;
  doc.setFont("times", "italic");
  doc.setFontSize(28);
  setInk(doc);
  const titleLines = wrap(doc, model.destination, CONTENT_W);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 11 + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setInk(doc, MUTED);
  doc.text(`${model.country}  ·  ${model.durationLabel}`, MARGIN, y);
  y += 8;

  doc.setFont("times", "italic");
  doc.setFontSize(12);
  setInk(doc);
  const tagLines = wrap(doc, model.tagline, CONTENT_W);
  doc.text(tagLines, MARGIN, y);
  y += tagLines.length * 6 + 6;

  if (model.interests.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setInk(doc, MUTED);
    doc.text(model.interests.map((i) => i.replace(/-/g, " ")).join("  ·  "), MARGIN, y);
    y += 8;
  }

  rule(doc, y);
  y += 12;

  y = sectionTitle(doc, "Itinerary", y);
  if (!model.days.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setInk(doc, MUTED);
    doc.text("No day-wise itinerary yet — generate days in Explore first.", MARGIN, y);
    y += 10;
  }

  for (const day of model.days) {
    y = ensureSpace(doc, y, 22);
    doc.setFont("times", "italic");
    doc.setFontSize(16);
    setInk(doc);
    doc.text(day.title, MARGIN, y);
    y += 6;
    if (day.summary) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setInk(doc, MUTED);
      const summaryLines = wrap(doc, day.summary, CONTENT_W);
      doc.text(summaryLines, MARGIN, y);
      y += summaryLines.length * 4.4 + 3;
    }

    for (const slot of day.slots) {
      const body = [slot.description, slot.tags.length ? slot.tags.join(" · ") : ""]
        .filter(Boolean)
        .join("  ");
      const bodyLines = wrap(doc, body, CONTENT_W - 28);
      y = ensureSpace(doc, y, 10 + bodyLines.length * 4.2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setInk(doc, MUTED);
      doc.text(slot.timeLabel, MARGIN, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setInk(doc);
      const title = slot.placeName && slot.placeName !== slot.title
        ? `${slot.title}`
        : slot.title;
      doc.text(title, MARGIN + 28, y);
      y += 5;

      if (slot.durationLabel) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        setInk(doc, MUTED);
        doc.text(slot.durationLabel, MARGIN, y);
      }

      if (bodyLines.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setInk(doc, MUTED);
        doc.text(bodyLines, MARGIN + 28, y);
        y += bodyLines.length * 4.2 + 3;
      } else {
        y += 5;
      }
    }
    y += 4;
  }

  if (model.notes) {
    y = ensureSpace(doc, y, 16);
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    setInk(doc, MUTED);
    const noteLines = wrap(doc, model.notes, CONTENT_W);
    doc.text(noteLines, MARGIN, y);
    y += noteLines.length * 5 + 6;
  }

  y = sectionTitle(doc, "Packing list", y);
  if (!model.packingGroups.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setInk(doc, MUTED);
    doc.text("Prepare packing in JourneyMind to add a trip-aware checklist.", MARGIN, y);
    y += 10;
  } else {
    if (model.packingSummary) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setInk(doc, MUTED);
      doc.text(model.packingSummary, MARGIN, y);
      y += 7;
    }
    for (const group of model.packingGroups) {
      y = ensureSpace(doc, y, 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setInk(doc);
      doc.text(group.category, MARGIN, y);
      y += 6;
      for (const item of group.items) {
        const mark = item.packed ? "[x]" : "[ ]";
        const extra = [item.quantityLabel, item.essential ? "essential" : "", item.reason]
          .filter(Boolean)
          .join(" · ");
        const line = extra ? `${mark}  ${item.label}  —  ${extra}` : `${mark}  ${item.label}`;
        const lines = wrap(doc, line, CONTENT_W);
        y = ensureSpace(doc, y, lines.length * 4.4 + 2);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setInk(doc);
        doc.text(lines, MARGIN, y);
        y += lines.length * 4.4 + 1.5;
      }
      y += 3;
    }
  }

  y = sectionTitle(doc, "Hidden gems", y);
  if (!model.hiddenGems.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setInk(doc, MUTED);
    doc.text("No hidden gems were included with this journey.", MARGIN, y);
    y += 10;
  } else {
    model.hiddenGems.forEach((gem, index) => {
      const why = wrap(doc, gem.whyVisit || gem.description, CONTENT_W);
      const tip = gem.localTip ? wrap(doc, `Local tip · ${gem.localTip}`, CONTENT_W) : [];
      y = ensureSpace(doc, y, 14 + why.length * 4.4 + tip.length * 4.4);
      doc.setFont("times", "italic");
      doc.setFontSize(13);
      setInk(doc);
      doc.text(`${index + 1}.  ${gem.name}`, MARGIN, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setInk(doc, MUTED);
      doc.text(why, MARGIN, y);
      y += why.length * 4.4 + 2;
      if (tip.length) {
        doc.setFont("helvetica", "italic");
        doc.text(tip, MARGIN, y);
        y += tip.length * 4.4 + 5;
      } else {
        y += 4;
      }
    });
  }

  y = sectionTitle(doc, "Cultural journey", y);
  if (!model.insights.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setInk(doc, MUTED);
    doc.text("No cultural insight cards were available for this journey.", MARGIN, y);
    y += 10;
  } else {
    for (const insight of model.insights) {
      y = ensureSpace(doc, y, 18);
      doc.setFont("times", "italic");
      doc.setFontSize(14);
      setInk(doc);
      doc.text(insight.title, MARGIN, y);
      y += 6;
      if (insight.summary) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setInk(doc, MUTED);
        const summaryLines = wrap(doc, insight.summary, CONTENT_W);
        doc.text(summaryLines, MARGIN, y);
        y += summaryLines.length * 4.4 + 2;
      }
      for (const bullet of insight.bullets) {
        const lines = wrap(doc, `•  ${bullet}`, CONTENT_W);
        y = ensureSpace(doc, y, lines.length * 4.4 + 2);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setInk(doc);
        doc.text(lines, MARGIN, y);
        y += lines.length * 4.4 + 1.2;
      }
      if (insight.footer) {
        const footerLines = wrap(doc, insight.footer, CONTENT_W);
        y = ensureSpace(doc, y, footerLines.length * 4.4 + 3);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        setInk(doc, MUTED);
        doc.text(footerLines, MARGIN, y);
        y += footerLines.length * 4.4 + 4;
      } else {
        y += 4;
      }
    }
  }

  footer(doc, doc.getNumberOfPages());
  return doc;
}

export function downloadJourneyPdf(model: JourneyExport): void {
  const doc = renderJourneyPdf(model);
  doc.save(journeyPdfFilename(model.destination));
}
