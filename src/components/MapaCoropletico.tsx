import { useEffect, useRef, useState } from 'preact/hooks';
import type { FeatureCollection } from 'geojson';
import { geoMercator, geoPath } from 'd3-geo';

interface Props {
  src: string;
  titulo: string;
  campo?: string;
  alto?: number;
}

function parsearHex(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '');
  if (h.length < 6) return [128, 128, 128];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function interpolarColor(hexMin: string, hexMax: string, t: number): string {
  const [r1, g1, b1] = parsearHex(hexMin);
  const [r2, g2, b2] = parsearHex(hexMax);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

const ANCHO = 520;
const PADDING = 12;
const LEYENDA_H = 38;

export default function MapaCoropletico({ src, titulo, campo = 'indice_acceso', alto = 520 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const [versionTema, setVersionTema] = useState(0);

  useEffect(() => {
    fetch(src).then((r) => r.json()).then(setGeojson);
  }, [src]);

  useEffect(() => {
    const alCambiar = () => setVersionTema((n) => n + 1);
    const obs = new MutationObserver(alCambiar);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', alCambiar);
    return () => { obs.disconnect(); mq.removeEventListener('change', alCambiar); };
  }, []);

  useEffect(() => {
    if (!geojson) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = ANCHO * dpr;
    canvas.height = alto * dpr;
    canvas.style.height = `${alto}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const estilos = getComputedStyle(canvas);
    const color = (v: string, d: string) => estilos.getPropertyValue(v).trim() || d;
    const cFondo = color('--fondo-suave', '#f1eadd');
    const cMin = color('--mapa-min', '#fde8d8');
    const cAccento = color('--acento', '#c2410c');
    const cSuave = color('--texto-suave', '#6f675c');
    const cBorde = color('--borde', '#ddd5c7');

    ctx.fillStyle = cFondo;
    ctx.fillRect(0, 0, ANCHO, alto);

    const vals = geojson.features
      .map((f) => f.properties?.[campo] as number | null)
      .filter((v): v is number => v != null);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);

    // Mapa (reserva espacio inferior para la leyenda)
    const proyeccion = geoMercator().fitExtent(
      [[PADDING, PADDING], [ANCHO - PADDING, alto - LEYENDA_H - PADDING]],
      geojson
    );
    const generador = geoPath().projection(proyeccion).context(ctx);

    for (const feature of geojson.features) {
      const val = feature.properties?.[campo] as number | null;
      ctx.beginPath();
      generador(feature);
      if (val == null) {
        ctx.fillStyle = cBorde;
      } else {
        const t = (val - minVal) / (maxVal - minVal || 1);
        ctx.fillStyle = interpolarColor(cMin, cAccento, t);
      }
      ctx.fill();
    }

    // Leyenda de color
    const leyY = alto - LEYENDA_H + 4;
    const leyAncho = ANCHO - 2 * PADDING;
    const grad = ctx.createLinearGradient(PADDING, 0, PADDING + leyAncho, 0);
    grad.addColorStop(0, cMin);
    grad.addColorStop(1, cAccento);
    ctx.fillStyle = grad;
    ctx.fillRect(PADDING, leyY, leyAncho, 13);
    ctx.strokeStyle = cBorde;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(PADDING, leyY, leyAncho, 13);

    ctx.font = '11px system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cSuave;
    ctx.textAlign = 'left';
    ctx.fillText('menor acceso', PADDING, leyY + 15);
    ctx.textAlign = 'right';
    ctx.fillText('mayor acceso', PADDING + leyAncho, leyY + 15);

    ctx.strokeStyle = cBorde;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, ANCHO - 1, alto - 1);
  }, [geojson, versionTema, campo, alto]);

  return (
    <figure class="mapa-coropletico">
      {!geojson && (
        <div
          class="mapa-cargando"
          style={{ height: `${alto}px`, maxWidth: `${ANCHO}px`, width: '100%' }}
        />
      )}
      <canvas
        ref={canvasRef}
        width={ANCHO}
        height={alto}
        style={{ width: '100%', maxWidth: `${ANCHO}px`, display: geojson ? 'block' : 'none' }}
      />
      <figcaption>{titulo}</figcaption>
    </figure>
  );
}
