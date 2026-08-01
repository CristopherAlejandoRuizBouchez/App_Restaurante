import QRCode from "qrcode";

/** Genera un PNG del QR con el nombre de la mesa debajo y lo descarga. */
export async function downloadQr(url: string, label: string): Promise<void> {
  const QR_SIZE = 800;
  const PADDING = 60;
  const TEXT_HEIGHT = 100;

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: QR_SIZE,
    margin: 1,
    errorCorrectionLevel: "H",
  });

  const canvas = document.createElement("canvas");
  canvas.width = QR_SIZE + PADDING * 2;
  canvas.height = QR_SIZE + PADDING * 2 + TEXT_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const image = new Image();
  image.src = qrDataUrl;

  await new Promise((resolve) => {
    image.onload = resolve;
  });

  ctx.drawImage(image, PADDING, PADDING, QR_SIZE, QR_SIZE);

  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 56px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, canvas.width / 2, QR_SIZE + PADDING + 70);

  canvas.toBlob((blob) => {
    if (!blob) return;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `qr-${label.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, "image/png");
}
