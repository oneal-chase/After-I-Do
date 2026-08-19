import { useState, useRef, useCallback } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";

const PRODUCTION_URL = "https://kendraanddiego.me";

export default function QRPage() {
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCard = useCallback(async () => {
    setGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = 3; // 300 DPI equivalent
    const cardW = 5 * dpr * 96; // 5 inches at 96 base
    const cardH = 7 * dpr * 96;
    canvas.width = cardW;
    canvas.height = cardH;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#FBF8F3";
    ctx.fillRect(0, 0, cardW, cardH);

    // Double gold border
    ctx.strokeStyle = "#C2A676";
    ctx.lineWidth = 4;
    roundRect(ctx, 20, 20, cardW - 40, cardH - 40, 16);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    roundRect(ctx, 32, 32, cardW - 64, cardH - 64, 12);
    ctx.stroke();

    // Corner floral accents (simple diamond shapes)
    const accentSize = 12;
    const corners = [
      [44, 44],
      [cardW - 44, 44],
      [44, cardH - 44],
      [cardW - 44, cardH - 44],
    ];
    ctx.fillStyle = "#C2A676";
    for (const [cx, cy] of corners) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-accentSize / 2, -accentSize / 2, accentSize, accentSize);
      ctx.restore();
    }

    // Header text — couple names
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = `${Math.round(cardW * 0.085)}px "Pinyon Script", cursive`;
    ctx.fillStyle = "#1E2D3D";
    ctx.fillText("Kendra & Diego", cardW / 2, cardH * 0.12);

    // Decorative line
    const lineY = cardH * 0.17;
    ctx.strokeStyle = "#C2A676";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardW * 0.3, lineY);
    ctx.lineTo(cardW * 0.7, lineY);
    ctx.stroke();
    // Center diamond
    ctx.fillStyle = "#C2A676";
    ctx.save();
    ctx.translate(cardW / 2, lineY);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();

    // Date & venue
    ctx.font = `500 ${Math.round(cardW * 0.025)}px "Cormorant Garamond", serif`;
    ctx.fillStyle = "#5B7B94";
    ctx.fillText("September 11, 2026", cardW / 2, cardH * 0.21);
    ctx.font = `${Math.round(cardW * 0.02)}px "Montserrat", sans-serif`;
    ctx.fillText("The Starlight Garden • Spring, TX", cardW / 2, cardH * 0.245);

    // QR Code
    const qrSize = cardW * 0.38;
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, PRODUCTION_URL, {
      width: qrSize,
      margin: 0,
      color: {
        dark: "#1E2D3D",
        light: "#00000000",
      },
      errorCorrectionLevel: "H",
    });

    // QR background circle
    const qrX = cardW / 2 - qrSize / 2;
    const qrY = cardH * 0.32;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cardW / 2, qrY + qrSize / 2, qrSize / 2 + 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#E8DEC8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.drawImage(qrCanvas, qrX, qrY);

    // Footer text
    ctx.textAlign = "center";
    ctx.font = `${Math.round(cardW * 0.018)}px "Montserrat", sans-serif`;
    ctx.fillStyle = "#1E2D3D";
    const footerLines = [
      "Scan with your phone camera",
      "to capture disposable photos",
      "& voice guestbook notes.",
      "",
      "No app download required —",
      "photos sync live to the couple's private album.",
    ];
    const footerStartY = cardH * 0.78;
    for (let i = 0; i < footerLines.length; i++) {
      ctx.fillText(footerLines[i], cardW / 2, footerStartY + i * (cardW * 0.028));
    }

    // Bottom decorative line
    const bottomLineY = cardH - 56;
    ctx.strokeStyle = "#C2A676";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardW * 0.3, bottomLineY);
    ctx.lineTo(cardW * 0.7, bottomLineY);
    ctx.stroke();

    setGenerating(false);
  }, []);

  const downloadCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "KD-Wedding-QR-Card.png";
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-navy text-cream">
        <Link to="/" className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-center font-display text-sm font-medium">QR Table Cards</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col items-center px-6 py-8 gap-6">
        <p className="font-body text-sm text-floral-slate text-center max-w-sm">
          Generate printable 5×7 table cards with QR codes for your reception tables.
        </p>

        {/* Card preview */}
        <div className="w-full max-w-[280px] bg-white rounded-xl shadow-lg shadow-navy/8 border border-parchment overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-auto" />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={generateCard}
            disabled={generating}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
            ) : (
              "Generate Card"
            )}
          </button>

          <button
            onClick={downloadCard}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl border-2 border-navy/15 text-navy font-body text-sm font-semibold hover:bg-navy/5 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Printable PNG
          </button>
        </div>

        <p className="font-body text-[10px] text-parchment text-center">
          Print on 5×7 ivory cardstock for reception table placement
        </p>
      </div>
    </div>
  );
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
