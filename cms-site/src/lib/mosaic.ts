// Editorial mosaic layout algorithm.
//
// Given an ordered list of photos (each with an aspect ratio and optional `span` hint),
// return a list of CSS class strings for the 12-column grid that produces a varied,
// editorial mosaic — not a uniform IG-style grid.
//
// Strategy:
//   1. If span hint is explicit (small/medium/large/wide/tall) → use it.
//   2. Otherwise: walk through a curated *row template* sequence (full-bleed,
//      triptych, unequal pair, tall triptych, equal pair, etc.) row by row.
//      For each row slot, the photo's aspect is used to nudge:
//        - landscape photos (aspect ≥ 1.6) get promoted to full-bleed
//          (cell-w12 cell-h-wide) regardless of where they land — they look bad
//          stuffed into a narrow column.
//        - very tall portraits (aspect ≤ 0.6) get cell-h-tall when their row
//          slot allows it.
//   3. The template repeats; after 10 photos it cycles back. Each cycle is
//      visually distinct enough that 30+ photos don't feel mechanical.

export type SpanHint = 'auto' | 'small' | 'medium' | 'large' | 'wide' | 'tall';

export interface PhotoForMosaic {
  /** width / height. 1.5 = landscape 3:2; 0.667 = portrait 2:3 */
  aspect: number;
  span: SpanHint;
}

// Row templates — each entry is one row. Each row is an array of cell widths
// (summing to 12). `tall: true` means the cell gets cell-h-tall.
// The templates were chosen by looking at the original hand-tuned site
// (site/index.html sports section) to preserve its visual rhythm.
// Full-bleed (wide) rows are NOT in this list — they're inserted automatically
// by the algorithm when a photo's aspect ratio is ≥ 1.7, or when the user
// explicitly sets span: wide. This keeps the template rotation predictable for
// portrait/standard photos.
const ROW_TEMPLATES: Array<Array<{ w: number; tall?: boolean }>> = [
  [{ w: 7, tall: true }, { w: 5, tall: true }],   // 0: hero portrait + tall
  [{ w: 4 }, { w: 4 }, { w: 4 }],                  // 1: triptych
  [{ w: 7 }, { w: 5 }],                            // 2: unequal pair
  [{ w: 4, tall: true }, { w: 4, tall: true }, { w: 4, tall: true }], // 3: tall triptych
  [{ w: 6 }, { w: 6 }],                            // 4: equal pair
  [{ w: 8 }, { w: 4 }],                            // 5: unequal pair (other direction)
  [{ w: 5 }, { w: 7 }],                            // 6: unequal pair, mirror of 2
];

const EXPLICIT: Record<Exclude<SpanHint, 'auto'>, { w: number; tall?: boolean; wide?: boolean }> = {
  small:  { w: 4 },
  medium: { w: 6 },
  large:  { w: 8 },
  wide:   { w: 12, wide: true },
  tall:   { w: 4, tall: true },
};

export interface MosaicCell {
  classes: string;
  sizes: string; // suitable for the <picture sizes=""> attribute
}

const sizesFor = (w: number, wide: boolean): string => {
  if (wide || w === 12) return '100vw';
  if (w === 8) return '(min-width:1000px) 66vw, 100vw';
  if (w === 7) return '(min-width:1000px) 58vw, 100vw';
  if (w === 6) return '(min-width:1000px) 48vw, 100vw';
  if (w === 5) return '(min-width:1000px) 40vw, 100vw';
  if (w === 4) return '(min-width:1000px) 32vw, 100vw';
  return '(min-width:1000px) 50vw, 100vw';
};

const cellFor = (w: number, tall: boolean, wide: boolean): MosaicCell => {
  const parts = [`cell`, `cell-w${w}`];
  if (wide) parts.push('cell-h-wide');
  else if (tall) parts.push('cell-h-tall');
  return { classes: parts.join(' '), sizes: sizesFor(w, wide) };
};

export function layoutMosaic(photos: PhotoForMosaic[]): MosaicCell[] {
  const out: MosaicCell[] = [];
  let templateIdx = 0;
  let slotIdx = 0;

  // First, handle any explicit-span photos by short-circuiting templates.
  // But because explicit spans can break row sums, we route each explicit
  // photo into its OWN row (it occupies the full row by itself, even when
  // span=small). This keeps the math simple and matches editorial behavior
  // — a single hand-picked emphasis lives alone in its row.
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]!;

    // Auto-promote ultra-wide landscape to full-bleed regardless of template
    // (looks terrible in a narrow column otherwise). Wide cells occupy their own
    // row but do NOT disturb the template counter — the next photo continues
    // the template flow as if the wide cell wasn't there. This preserves the
    // overall mosaic rhythm even when wide insertions break it.
    if (p.span === 'auto' && p.aspect >= 1.7) {
      out.push(cellFor(12, false, true));
      // Only advance slot if we were mid-row; otherwise stay put. Easiest:
      // if mid-row, force the rest of the row to be empty (skip to next row).
      if (slotIdx > 0) {
        templateIdx = (templateIdx + 1) % ROW_TEMPLATES.length;
        slotIdx = 0;
      }
      continue;
    }

    // Explicit span: occupies its own row, but template counter is undisturbed.
    if (p.span !== 'auto') {
      const def = EXPLICIT[p.span];
      out.push(cellFor(def.w, !!def.tall, !!def.wide));
      if (slotIdx > 0) {
        templateIdx = (templateIdx + 1) % ROW_TEMPLATES.length;
        slotIdx = 0;
      }
      continue;
    }

    // Otherwise walk through template.
    const row = ROW_TEMPLATES[templateIdx]!;
    const slot = row[slotIdx]!;

    // If template says single full-bleed row, mark wide.
    const isWide = row.length === 1 && slot.w === 12;
    // If template asked for tall but the photo is wide (landscape), demote to non-tall
    // so we don't crop a horizontal photo vertically.
    const isTall = !!slot.tall && p.aspect <= 1.2;

    out.push(cellFor(slot.w, isTall, isWide));

    slotIdx += 1;
    if (slotIdx >= row.length) {
      templateIdx = (templateIdx + 1) % ROW_TEMPLATES.length;
      slotIdx = 0;
    }
  }

  return out;
}
