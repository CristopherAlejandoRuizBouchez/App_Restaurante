"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCode({ value, size = 200, className }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    void QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      // Nivel alto de corrección: el QR sigue funcionando aunque
      // se manche o se despegue una esquina. En un restaurante pasa.
      errorCorrectionLevel: "H",
      color: { dark: "#1a1a1a", light: "#ffffff" },
    });
  }, [value, size]);

  return <canvas ref={canvasRef} className={className} />;
}
