import { useEffect, useRef, useState } from 'preact/hooks';

type Bin = { x: number; y: number; n: number };

interface Props {
  datos: Bin[];
  etiquetaX: string;
  etiquetaY: string;
}

const ANCHO = 520;
const ALTO = 290;
const M = { izq: 52, der: 16, arr: 12, aba: 52 };

export default function GraficoDispersion({ datos, etiquetaX, etiquetaY }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [versionTema, setVersionTema] = useState(0);

  useEffect(() => {
    const alCambiar = () => setVersionTema((n) => n + 1);
    const obs = new MutationObserver(alCambiar);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', alCambiar);
    return () => { obs.disconnect(); mq.removeEventListener('change', alCambiar); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = ANCHO * dpr;
    canvas.height = ALTO * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const estilos = getComputedStyle(canvas);
    const color = (v: string, d: string) => estilos.getPropertyValue(v).trim() || d;
    const cFondo = color('--fondo-suave', '#f1eadd');
    const cSuave = color('--texto-suave', '#6f675c');
    const cAccento = color('--acento', '#c2410c');
    const cBorde = color('--borde', '#ddd5c7');

    ctx.fillStyle = cFondo;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    const minX = datos[0].x;
    const maxX = datos[datos.length - 1].x;
    const allY = datos.map((d) => d.y);
    const minY = Math.min(...allY) - 0.02;
    const maxY = Math.max(...allY) + 0.02;
    const aW = ANCHO - M.izq - M.der;
    const aH = ALTO - M.arr - M.aba;

    const px = (x: number) => M.izq + ((x - minX) / (maxX - minX)) * aW;
    const py = (y: number) => M.arr + aH - ((y - minY) / (maxY - minY)) * aH;

    // Gridlines Y
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = cSuave;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const val = minY + (i / yTicks) * (maxY - minY);
      const y = py(val);
      ctx.strokeStyle = cBorde;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(M.izq, y);
      ctx.lineTo(ANCHO - M.der, y);
      ctx.stroke();
      ctx.fillStyle = cSuave;
      ctx.fillText(val.toFixed(2), M.izq - 5, y);
    }

    // Area fill
    ctx.beginPath();
    ctx.moveTo(px(datos[0].x), py(datos[0].y));
    for (const d of datos) ctx.lineTo(px(d.x), py(d.y));
    ctx.lineTo(px(datos[datos.length - 1].x), py(minY));
    ctx.lineTo(px(datos[0].x), py(minY));
    ctx.closePath();
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = cAccento;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Line
    ctx.beginPath();
    ctx.moveTo(px(datos[0].x), py(datos[0].y));
    for (const d of datos) ctx.lineTo(px(d.x), py(d.y));
    ctx.strokeStyle = cAccento;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots (sized by n)
    const maxN = Math.max(...datos.map((d) => d.n));
    for (const d of datos) {
      const radio = 2 + (d.n / maxN) * 4;
      ctx.beginPath();
      ctx.arc(px(d.x), py(d.y), radio, 0, Math.PI * 2);
      ctx.fillStyle = cAccento;
      ctx.fill();
    }

    // X axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cSuave;
    const xTicks = 5;
    for (let i = 0; i <= xTicks; i++) {
      const val = minX + (i / xTicks) * (maxX - minX);
      const label = val >= 1000 ? `${Math.round(val / 1000)}k` : val.toFixed(0);
      ctx.fillText(label, px(val), M.arr + aH + 6);
    }

    // Axes
    ctx.strokeStyle = cBorde;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M.izq, M.arr);
    ctx.lineTo(M.izq, M.arr + aH);
    ctx.lineTo(ANCHO - M.der, M.arr + aH);
    ctx.stroke();

    // X axis label
    ctx.fillStyle = cSuave;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(etiquetaX, M.izq + aW / 2, ALTO - 2);

    // Y axis label (rotado)
    ctx.save();
    ctx.translate(12, M.arr + aH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(etiquetaY, 0, 0);
    ctx.restore();

    ctx.strokeStyle = cBorde;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, ANCHO - 1, ALTO - 1);
  }, [datos, etiquetaX, etiquetaY, versionTema]);

  return (
    <canvas
      ref={canvasRef}
      width={ANCHO}
      height={ALTO}
      style={{ width: '100%', maxWidth: `${ANCHO}px` }}
    />
  );
}
