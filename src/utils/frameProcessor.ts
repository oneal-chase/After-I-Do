// Formats a captured photo for upload: center-crop to a clean 1:1 square.
// No frame, no text — the wall supplies presentation.

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

export async function formatSquareImage(rawBlob: Blob): Promise<Blob> {
  const dataUrl = await blobToDataUrl(rawBlob);
  const photo = await loadImage(dataUrl);

  const side = Math.min(photo.width, photo.height);
  const target = Math.min(side, 1400);
  const sx = (photo.width - side) / 2;
  const sy = (photo.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(photo, sx, sy, side, side, 0, 0, target, target);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      0.9,
    );
  });
}
