export default function MesaInvalidaPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-xl font-semibold">Código de mesa inválido</h1>
      <p className="text-ink-muted">
        Verificá que escaneaste el QR correcto, o pedile ayuda al personal.
      </p>
    </div>
  );
}
