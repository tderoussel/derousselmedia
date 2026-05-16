// Image path helpers.
//
// Existing migrated images have pre-built variants like:
//   /assets/sports/sports-01-sm.{jpg,webp}
//   /assets/sports/sports-01-md.{jpg,webp}
//   /assets/sports/sports-01-lg.{jpg,webp}
// The frontmatter `image` field points to the -md.jpg variant (the "canonical" reference).
// hasResponsiveVariants: true tells us we can derive the rest of the variants.
//
// New CMS uploads land in /uploads/ at their original size and only have one file.

export interface PictureSources {
  srcWebp?: string;        // srcset for the WebP <source>
  srcJpg?: string;         // srcset for the JPEG <source>
  imgSrc: string;          // default <img src>
  lightboxSrc: string;     // largest available; used by the lightbox script
}

const SIZES = ['sm', 'md', 'lg'] as const;
const SIZE_WIDTH = { sm: 800, md: 1600, lg: 2560 } as const;

// Derive variant base from a path like /assets/sports/sports-01-md.jpg -> /assets/sports/sports-01
// Returns null if path doesn't match the variant pattern.
function variantBase(imagePath: string): { base: string; ext: 'jpg' | 'jpeg' | 'webp' | 'png' } | null {
  const m = imagePath.match(/^(.*)-(sm|md|lg)\.(jpg|jpeg|webp|png)$/i);
  if (!m) return null;
  return { base: m[1]!, ext: m[3]!.toLowerCase() as 'jpg' | 'jpeg' | 'webp' | 'png' };
}

export function pictureSources(imagePath: string, hasResponsiveVariants: boolean): PictureSources {
  if (hasResponsiveVariants) {
    const v = variantBase(imagePath);
    if (v) {
      const { base } = v;
      const webp = SIZES
        .map((s) => `${base}-${s}.webp ${SIZE_WIDTH[s]}w`)
        .join(', ');
      const jpg = SIZES
        .map((s) => `${base}-${s}.jpg ${SIZE_WIDTH[s]}w`)
        .join(', ');
      return {
        srcWebp: webp,
        srcJpg: jpg,
        imgSrc: `${base}-md.jpg`,
        lightboxSrc: `${base}-lg.webp`,
      };
    }
  }
  // Fallback: single-source.
  return {
    imgSrc: imagePath,
    lightboxSrc: imagePath,
  };
}
