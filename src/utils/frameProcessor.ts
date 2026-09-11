// Formats a captured photo for upload as a classic Polaroid:
// cream card, square photo inset with even side/top borders and a thicker
// bottom band. No text, no gold border. Corners are square in the stored
// JPEG (JPEG has no alpha); the wall rounds them via CSS.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Classic Polaroid proportions: image side S, side/top padding ~5.5% of S,
// bottom band ~19% of S. Total aspect ≈ 1111 : 1290 (portrait).
const PAD_RATIO = 0.055;
const BOTTOM_RATIO = 0.19;
const CREAM = "#FBF8F3";

export async function formatPolaroidImage(rawBlob: Blob): Promise<Blob> {
  const dataUrl = await blobToDataUrl(rawBlob);
  const photo = await loadImage(dataUrl);

  // Square center-crop of the source, capped so the card stays ~1024px wide
  const side = Math.min(photo.width, photo.height, 1024);
  const sx = (photo.width - side) / 2;
  const sy = (photo.height - side) / 2;

  const pad = Math.round(side * PAD_RATIO);
  const bottom = Math.round(side * BOTTOM_RATIO);
  const cardW = side + pad * 2;
  const cardH = side + pad + bottom;

  const canvas = document.createElement("canvas");
  canvas.width = cardW;
  canvas.height = cardH;
  const ctx = canvas.getContext("2d")!;

  // Cream card
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, cardW, cardH);

  // Square photo inset
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(photo, sx, sy, side, side, pad, pad, side, side);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      0.9,
    );
  });
}
