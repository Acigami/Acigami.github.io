import { useEffect, useRef, useState } from 'preact/hooks';

type Punto = { x: number; y: number };

const ANCHO = 600;
const ALTO = 400;
const MARGEN = 32;
const ESCALA_MAX = 10;

const aPixelX = (x: number) => MARGEN + (x / ESCALA_MAX) * (ANCHO - 2 * MARGEN);
const aPixelY = (y: number) => ALTO - MARGEN - (y / ESCALA_MAX) * (ALTO - 2 * MARGEN);
const aDatoX = (px: number) => ((px - MARGEN) / (ANCHO - 2 * MARGEN)) * ESCALA_MAX;
const aDatoY = (py: number) => ((ALTO - MARGEN - py) / (ALTO - 2 * MARGEN)) * ESCALA_MAX;

function ajustar(puntos: Punto[]) {
  const n = puntos.length;
  if (n < 2) return null;
  const mediaX = puntos.reduce((suma, p) => suma + p.x, 0) / n;
  const mediaY = puntos.reduce((suma, p) => suma + p.y, 0) / n;
  const sumaXY = puntos.reduce((suma, p) => suma + (p.x - mediaX) * (p.y - mediaY), 0);
  const sumaXX = puntos.reduce((suma, p) => suma + (p.x - mediaX) ** 2, 0);
  if (sumaXX === 0) return null; // todos los puntos en la misma vertical
  const pendiente = sumaXY / sumaXX;
  const ordenada = mediaY - pendiente * mediaX;
  const ssRes = puntos.reduce((suma, p) => suma + (p.y - (ordenada + pendiente * p.x)) ** 2, 0);
  const ssTot = puntos.reduce((suma, p) => suma + (p.y - mediaY) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { pendiente, ordenada, r2 };
}

export default function RegresionLineal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const ajuste = ajustar(puntos);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = ANCHO * dpr;
    canvas.height = ALTO * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Los colores salen de las variables CSS, así el canvas respeta el modo oscuro.
    const estilos = getComputedStyle(canvas);
    const color = (variable: string, porDefecto: string) =>
      estilos.getPropertyValue(variable).trim() || porDefecto;

    ctx.fillStyle = color('--fondo-suave', '#f8fafc');
    ctx.fillRect(0, 0, ANCHO, ALTO);

    // Grilla y etiquetas de los ejes
    ctx.strokeStyle = color('--borde', '#e2e8f0');
    ctx.lineWidth = 1;
    for (let v = 0; v <= ESCALA_MAX; v += 2) {
      ctx.beginPath();
      ctx.moveTo(aPixelX(v), aPixelY(0));
      ctx.lineTo(aPixelX(v), aPixelY(ESCALA_MAX));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(aPixelX(0), aPixelY(v));
      ctx.lineTo(aPixelX(ESCALA_MAX), aPixelY(v));
      ctx.stroke();
    }
    ctx.fillStyle = color('--texto-suave', '#64748b');
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let v = 0; v <= ESCALA_MAX; v += 2) {
      ctx.fillText(String(v), aPixelX(v), ALTO - MARGEN + 16);
    }
    ctx.textAlign = 'right';
    for (let v = 2; v <= ESCALA_MAX; v += 2) {
      ctx.fillText(String(v), MARGEN - 6, aPixelY(v) + 4);
    }

    // Recta ajustada, recortada al área del gráfico
    if (ajuste) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(MARGEN, MARGEN, ANCHO - 2 * MARGEN, ALTO - 2 * MARGEN);
      ctx.clip();
      ctx.strokeStyle = color('--acento', '#2563eb');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(aPixelX(0), aPixelY(ajuste.ordenada));
      ctx.lineTo(aPixelX(ESCALA_MAX), aPixelY(ajuste.ordenada + ajuste.pendiente * ESCALA_MAX));
      ctx.stroke();
      ctx.restore();
    }

    // Puntos
    ctx.fillStyle = color('--texto', '#1e293b');
    for (const p of puntos) {
      ctx.beginPath();
      ctx.arc(aPixelX(p.x), aPixelY(p.y), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [puntos]);

  const manejarClick = (evento: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = aDatoX(((evento.clientX - rect.left) * ANCHO) / rect.width);
    const y = aDatoY(((evento.clientY - rect.top) * ALTO) / rect.height);
    if (x < 0 || x > ESCALA_MAX || y < 0 || y > ESCALA_MAX) return;
    setPuntos([...puntos, { x, y }]);
  };

  const puntosDeEjemplo = () => {
    const nuevos: Punto[] = [];
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * ESCALA_MAX;
      const ruido = (Math.random() - 0.5) * 2.5;
      const y = Math.min(ESCALA_MAX, Math.max(0, 0.8 * x + 1 + ruido));
      nuevos.push({ x, y });
    }
    setPuntos(nuevos);
  };

  return (
    <div class="juguete">
      <canvas
        ref={canvasRef}
        width={ANCHO}
        height={ALTO}
        style={{ width: '100%', maxWidth: `${ANCHO}px` }}
        onClick={manejarClick}
      />
      <p class="lectura">
        {ajuste
          ? `ŷ = ${ajuste.pendiente.toFixed(2)}·x ${ajuste.ordenada >= 0 ? '+' : '-'} ${Math.abs(
              ajuste.ordenada
            ).toFixed(2)} · R² = ${ajuste.r2.toFixed(3)} · ${puntos.length} puntos`
          : puntos.length === 0
            ? 'Hacé click en el gráfico para agregar puntos.'
            : 'Agregá al menos dos puntos (no alineados en vertical) para ajustar la recta.'}
      </p>
      <div class="botones">
        <button type="button" onClick={puntosDeEjemplo}>
          Puntos de ejemplo
        </button>
        <button type="button" onClick={() => setPuntos([])} disabled={puntos.length === 0}>
          Borrar todo
        </button>
      </div>
    </div>
  );
}
