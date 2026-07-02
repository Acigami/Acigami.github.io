import { useEffect, useRef, useState } from 'preact/hooks';

type Variable = { variable: string; importancia: number };

interface Props {
  datos: Variable[];
}

const ANCHO = 520;
const MARGEN = { izq: 196, der: 60, arr: 16, aba: 16 };
const ALTO_BARRA = 26;
const ESPACIO = 12;

export default function GraficoBarras({ datos }: Props) {
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

    const n = datos.length;
    const ALTO = MARGEN.arr + n * (ALTO_BARRA + ESPACIO) - ESPACIO + MARGEN.aba;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = ANCHO * dpr;
    canvas.height = ALTO * dpr;
    canvas.style.height = `${ALTO}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const estilos = getComputedStyle(canvas);
    const color = (v: string, d: string) => estilos.getPropertyValue(v).trim() || d;
    const cFondo = color('--fondo-suave', '#f1eadd');
    const cTexto = color('--texto', '#1c1916');
    const cSuave = color('--texto-suave', '#6f675c');
    const cAccento = color('--acento', '#c2410c');
    const cBorde = color('--borde', '#ddd5c7');

    ctx.fillStyle = cFondo;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    const maxImp = Math.max(...datos.map((d) => d.importancia));
    const anchoBarras = ANCHO - MARGEN.izq - MARGEN.der;

    datos.forEach((d, i) => {
      const y = MARGEN.arr + i * (ALTO_BARRA + ESPACIO);
      const ancho = (d.importancia / maxImp) * anchoBarras;
      const midY = y + ALTO_BARRA / 2;

      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = cTexto;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.variable, MARGEN.izq - 8, midY);

      ctx.fillStyle = cAccento;
      ctx.fillRect(MARGEN.izq, y, ancho, ALTO_BARRA);

      ctx.fillStyle = cSuave;
      ctx.textAlign = 'left';
      ctx.fillText(`${(d.importancia * 100).toFixed(1)}%`, MARGEN.izq + ancho + 6, midY);
    });

    ctx.strokeStyle = cBorde;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, ANCHO - 1, ALTO - 1);
  }, [datos, versionTema]);

  const n = datos.length;
  const alto = MARGEN.arr + n * (ALTO_BARRA + ESPACIO) - ESPACIO + MARGEN.aba;

  return (
    <canvas
      ref={canvasRef}
      width={ANCHO}
      height={alto}
      style={{ width: '100%', maxWidth: `${ANCHO}px` }}
    />
  );
}
