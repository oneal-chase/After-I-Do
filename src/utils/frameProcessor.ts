import { getWeddingConfig, getCurrentPhase, getPhaseDisplayName } from "../config/wedding.config";
import { type ColorTokens, getFontStack } from "../config/designTokens";

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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export async function stampPolaroidFrame(
  rawBlob: Blob,
  phaseName?: string,
): Promise<Blob> {
  const config = getWeddingConfig();
  const colors: ColorTokens = config.colors;
  const fonts = config.fonts;

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

  // Background
  ctx.fillStyle = colors.cream;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Outer gold border
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = Math.round(w * 0.008);
  const inset = Math.round(framePadding * 0.35);
  roundRect(ctx, inset, inset, canvasW - inset * 2, canvasH - inset * 2, Math.round(w * 0.012));
  ctx.stroke();

  // Inner gold border
  const innerInset = Math.round(framePadding * 0.55);
  ctx.lineWidth = Math.round(w * 0.004);
  roundRect(ctx, innerInset, innerInset, canvasW - innerInset * 2, canvasH - innerInset * 2, Math.round(w * 0.008));
  ctx.stroke();

  // Photo
  ctx.drawImage(photo, framePadding, framePadding, w, h);

  // Subtle photo border
  ctx.strokeStyle = hexToRgba(colors.gold, 0.3);
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, w, h);

  // Bottom bezel
  const bezelY = framePadding + h + framePadding * 0.4;
  const monoSize = Math.round(w * 0.06);

  // Monogram
  ctx.font = `${monoSize}px ${getFontStack(fonts.display)}`;
  ctx.fillStyle = colors.gold;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(config.monogram || "K D", canvasW / 2, bezelY + monoSize * 0.6);

  // Couple name
  const textSize = Math.round(w * 0.022);
  ctx.font = `${textSize}px ${getFontStack(fonts.display)}`;
  ctx.fillStyle = colors.navy;
  ctx.textAlign = "left";
  ctx.fillText(config.coupleNames, framePadding * 2, bezelY + monoSize + textSize * 1.8);

  // Date
  const dateSize = Math.round(w * 0.018);
  ctx.font = `${dateSize}px ${getFontStack(fonts.body)}`;
  ctx.fillStyle = colors.floralSlate;
  const dateObj = new Date(config.weddingDate + "T12:00:00");
  const dateStr = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  ctx.fillText(dateStr, framePadding * 2, bezelY + monoSize + textSize * 3.2);

  // Phase badge
  const badgeSize = Math.round(w * 0.019);
  ctx.font = `500 ${badgeSize}px ${getFontStack(fonts.body)}`;
  const badgeText = displayName;
  const badgeMetrics = ctx.measureText(badgeText);
  const badgeW = badgeMetrics.width + badgeSize * 1.6;
  const badgeH = badgeSize * 2;
  const badgeX = canvasW - framePadding * 2 - badgeW;
  const badgeY = bezelY + monoSize * 0.15;

  ctx.fillStyle = hexToRgba(colors.mauve, 0.15);
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeSize * 0.5);
  ctx.fill();
  ctx.strokeStyle = colors.mauve;
  ctx.lineWidth = 1;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeSize * 0.5);
  ctx.stroke();

  ctx.fillStyle = colors.mauve;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
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
