import { getCurrentPhase, getPhaseDisplayName } from "../config/wedding.config";

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

export async function stampPolaroidFrame(
  rawBlob: Blob,
  phaseName?: string,
): Promise<Blob> {
  const phase = phaseName ?? getCurrentPhase();
  const displayName = getPhaseDisplayName(phase);

  const dataUrl = await blobToDataUrl(rawBlob);
  const photo = await loadImage(dataUrl);

  const maxDim = 1600;
  let w = photo.width;
  let h = photo.height;
  if (w > maxDim || h > maxDim) {
    const ratio = Math.min(maxDim / w, maxDim / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const framePadding = Math.round(w * 0.04);
  const bottomBezel = Math.round(h * 0.18);
  const canvasW = w + framePadding * 2;
  const canvasH = h + framePadding * 2 + bottomBezel;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;

  // Warm ivory background
  ctx.fillStyle = "#FBF8F3";
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Outer gold border
  ctx.strokeStyle = "#C2A676";
  ctx.lineWidth = Math.round(w * 0.008);
  const inset = Math.round(framePadding * 0.35);
  roundRect(ctx, inset, inset, canvasW - inset * 2, canvasH - inset * 2, Math.round(w * 0.012));
  ctx.stroke();

  // Inner gold border
  const innerInset = Math.round(framePadding * 0.55);
  ctx.lineWidth = Math.round(w * 0.004);
  roundRect(ctx, innerInset, innerInset, canvasW - innerInset * 2, canvasH - innerInset * 2, Math.round(w * 0.008));
  ctx.stroke();

  // Draw the photo
  ctx.drawImage(photo, framePadding, framePadding, w, h);

  // Subtle photo border
  ctx.strokeStyle = "rgba(194, 166, 118, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, w, h);

  // Bottom bezel content
  const bezelY = framePadding + h + framePadding * 0.4;

  // Monogram "KD" centered
  const monoSize = Math.round(w * 0.06);
  ctx.font = `${monoSize}px "Cinzel", serif`;
  ctx.fillStyle = "#C2A676";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("K D", canvasW / 2, bezelY + monoSize * 0.6);

  // Couple name and date
  const textSize = Math.round(w * 0.022);
  ctx.font = `${textSize}px "Cormorant Garamond", serif`;
  ctx.fillStyle = "#1E2D3D";
  ctx.textAlign = "left";
  ctx.fillText("Kendra & Diego", framePadding * 2, bezelY + monoSize + textSize * 1.8);

  const dateSize = Math.round(w * 0.018);
  ctx.font = `${dateSize}px "Montserrat", sans-serif`;
  ctx.fillStyle = "#5B7B94";
  ctx.fillText("September 11, 2026", framePadding * 2, bezelY + monoSize + textSize * 3.2);

  // Phase badge
  const badgeSize = Math.round(w * 0.019);
  ctx.font = `500 ${badgeSize}px "Montserrat", sans-serif`;
  const badgeText = displayName;
  const badgeMetrics = ctx.measureText(badgeText);
  const badgeW = badgeMetrics.width + badgeSize * 1.6;
  const badgeH = badgeSize * 2;
  const badgeX = canvasW - framePadding * 2 - badgeW;
  const badgeY = bezelY + monoSize * 0.15;

  // Badge background
  ctx.fillStyle = "rgba(197, 155, 155, 0.15)";
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeSize * 0.5);
  ctx.fill();
  ctx.strokeStyle = "#C59B9B";
  ctx.lineWidth = 1;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeSize * 0.5);
  ctx.stroke();

  // Badge text
  ctx.fillStyle = "#C59B9B";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      "image/jpeg",
      0.85,
    );
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
