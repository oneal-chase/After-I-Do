// Formats a captured photo for upload as a classic Polaroid:
// cream card, square photo inset with matching borders on top/left/right
// and a thicker bottom band (the caption strip). No text baked in; the wall
// renders the note into the band. Corners are square in the stored JPEG
// (JPEG has no alpha); the wall rounds them via CSS.

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

// Geometry (fractions of the square photo side S):
//   side/top pads, bottom band. cardW = S*(1+2*SIDE), cardH = S*(TOP+1+BOTTOM)
export const POLAROID = {
  SIDE_RATIO: 0.055, // border on left/right
  TOP_RATIO: 0.055, // top border matches the side borders
  BOTTOM_RATIO: 0.19, // caption strip
  CREAM: "#FBF8F3",
} as const;

// Where the caption band starts, as a fraction of card height
// = (TOP_RATIO + 1) / (TOP_RATIO + 1 + BOTTOM_RATIO)
export const BAND_TOP_FRACTION =
  (POLAROID.TOP_RATIO + 1) / (POLAROID.TOP_RATIO + 1 + POLAROID.BOTTOM_RATIO);

export async function formatPolaroidImage(rawBlob: Blob): Promise<Blob> {
  const dataUrl = await blobToDataUrl(rawBlob);
  const photo = await loadImage(dataUrl);

  // Square crop of the source, anchored to the TOP of the raw image:
  // the raw image's top edge marks the top of the picture space
  // (protects faces/heads on typical phone photos). Whitespace unchanged.
  const side = Math.min(photo.width, photo.height, 1024);
  const sx = (photo.width - side) / 2;
  const sy = 0;

  const padSide = Math.round(side * POLAROID.SIDE_RATIO);
  const padTop = Math.round(side * POLAROID.TOP_RATIO);
  const bottom = Math.round(side * POLAROID.BOTTOM_RATIO);
  const cardW = side + padSide * 2;
  const cardH = side + padTop + bottom;

  const canvas = document.createElement("canvas");
  canvas.width = cardW;
  canvas.height = cardH;
  const ctx = canvas.getContext("2d")!;

  // Cream card
  ctx.fillStyle = POLAROID.CREAM;
  ctx.fillRect(0, 0, cardW, cardH);

  // Square photo inset — top nearly flush with the card top
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(photo, sx, sy, side, side, padSide, padTop, side, side);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      0.9,
    );
  });
}
