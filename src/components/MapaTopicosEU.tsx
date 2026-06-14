import { useEffect, useRef, useState } from 'preact/hooks';
import datosRaw from '../data/mapa-topicos-eu.json';

type Discurso = {
  x: number;
  y: number;
  topic: number;
  label: string;
  country: string;
  gender: string;
  party: string;
  date: string;
  snippet: string;
};

const datos = datosRaw as Discurso[];

// Mapa tópico -> etiqueta, derivado de los datos (todos los discursos de un
// mismo tópico comparten la misma etiqueta, generada en scripts/lda_mapa_topicos.py).
const ETIQUETAS_TOPICO: string[] = [];
for (const d of datos) {
  if (ETIQUETAS_TOPICO[d.topic] === undefined) {
    ETIQUETAS_TOPICO[d.topic] = d.label;
  }
}

const COLORES_TOPICO = [
  '#e6194b',
  '#3cb44b',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#42d4f4',
  '#f032e6',
  '#bfef45',
  '#9a6324',
  '#469990',
  '#dcbeff',
  '#a9a9a9',
];

const ANCHO = 640;
const ALTO = 480;
const MARGEN = 16;
const RADIO_PUNTO = 3;
const RADIO_CLICK = 6;
const ESCALA_MIN = 0.5;
const ESCALA_MAX = 8;

const xs = datos.map((d) => d.x);
const ys = datos.map((d) => d.y);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);
const centroX = (minX + maxX) / 2;
const centroY = (minY + maxY) / 2;
const rango = Math.max(maxX - minX, maxY - minY) || 1;
const ESCALA_BASE = (Math.min(ANCHO, ALTO) - 2 * MARGEN) / rango;

type Vista = { escala: number; offsetX: number; offsetY: number };

function aPixel(d: { x: number; y: number }, vista: Vista) {
  const px = ANCHO / 2 + (d.x - centroX) * ESCALA_BASE * vista.escala + vista.offsetX;
  const py = ALTO / 2 - (d.y - centroY) * ESCALA_BASE * vista.escala + vista.offsetY;
  return { px, py };
}

function nombreGenero(genero: string) {
  if (genero === 'FEMALE') return 'mujer';
  if (genero === 'MALE') return 'varón';
  return 'sin dato';
}

export default function MapaTopicosEU() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [vista, setVista] = useState<Vista>({ escala: 1, offsetX: 0, offsetY: 0 });
  const [topicosOcultos, setTopicosOcultos] = useState<Set<number>>(new Set());
  const [seleccionado, setSeleccionado] = useState<Discurso | null>(null);
  const [versionTema, setVersionTema] = useState(0);
  const arrastreRef = useRef({ activo: false, x: 0, y: 0, movido: false });

  // Repinta cuando cambia el tema: los colores del canvas se leen al dibujar.
  useEffect(() => {
    const alCambiar = () => setVersionTema((n) => n + 1);
    const observador = new MutationObserver(alCambiar);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-tema'],
    });
    const consulta = window.matchMedia('(prefers-color-scheme: dark)');
    consulta.addEventListener('change', alCambiar);
    return () => {
      observador.disconnect();
      consulta.removeEventListener('change', alCambiar);
    };
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
    const color = (variable: string, porDefecto: string) =>
      estilos.getPropertyValue(variable).trim() || porDefecto;

    ctx.fillStyle = color('--fondo-suave', '#f1eadd');
    ctx.fillRect(0, 0, ANCHO, ALTO);

    for (const d of datos) {
      if (topicosOcultos.has(d.topic)) continue;
      const { px, py } = aPixel(d, vista);
      if (px < -RADIO_PUNTO || px > ANCHO + RADIO_PUNTO || py < -RADIO_PUNTO || py > ALTO + RADIO_PUNTO) {
        continue;
      }
      ctx.beginPath();
      ctx.fillStyle = COLORES_TOPICO[d.topic % COLORES_TOPICO.length];
      ctx.globalAlpha = seleccionado && seleccionado !== d ? 0.35 : 0.85;
      ctx.arc(px, py, RADIO_PUNTO, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (seleccionado && !topicosOcultos.has(seleccionado.topic)) {
      const { px, py } = aPixel(seleccionado, vista);
      ctx.beginPath();
      ctx.strokeStyle = color('--acento', '#c2410c');
      ctx.lineWidth = 2;
      ctx.arc(px, py, RADIO_PUNTO + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = color('--borde', '#ddd5c7');
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, ANCHO - 1, ALTO - 1);
  }, [vista, topicosOcultos, seleccionado, versionTema]);

  const posicionCanvas = (evento: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((evento.clientX - rect.left) * ANCHO) / rect.width,
      y: ((evento.clientY - rect.top) * ALTO) / rect.height,
    };
  };

  const manejarRueda = (evento: WheelEvent) => {
    evento.preventDefault();
    const factor = evento.deltaY < 0 ? 1.15 : 1 / 1.15;
    setVista((v) => ({ ...v, escala: Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, v.escala * factor)) }));
  };

  const manejarMouseDown = (evento: MouseEvent) => {
    const { x, y } = posicionCanvas(evento);
    arrastreRef.current = { activo: true, x, y, movido: false };
  };

  const manejarMouseMove = (evento: MouseEvent) => {
    const arrastre = arrastreRef.current;
    if (!arrastre.activo) return;
    const { x, y } = posicionCanvas(evento);
    const dx = x - arrastre.x;
    const dy = y - arrastre.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) arrastre.movido = true;
    setVista((v) => ({ ...v, offsetX: v.offsetX + dx, offsetY: v.offsetY + dy }));
    arrastre.x = x;
    arrastre.y = y;
  };

  const manejarMouseUp = (evento: MouseEvent) => {
    const arrastre = arrastreRef.current;
    if (arrastre.activo && !arrastre.movido) {
      const { x, y } = posicionCanvas(evento);
      let masCercano: Discurso | null = null;
      let distanciaMin = RADIO_CLICK;
      for (const d of datos) {
        if (topicosOcultos.has(d.topic)) continue;
        const { px, py } = aPixel(d, vista);
        const distancia = Math.hypot(px - x, py - y);
        if (distancia < distanciaMin) {
          distanciaMin = distancia;
          masCercano = d;
        }
      }
      setSeleccionado(masCercano);
    }
    arrastreRef.current.activo = false;
  };

  const alternarTopico = (topico: number) => {
    setTopicosOcultos((actuales) => {
      const nuevos = new Set(actuales);
      if (nuevos.has(topico)) nuevos.delete(topico);
      else nuevos.add(topico);
      return nuevos;
    });
  };

  return (
    <div class="mapa-topicos">
      <canvas
        ref={canvasRef}
        width={ANCHO}
        height={ALTO}
        style={{ width: '100%', maxWidth: `${ANCHO}px` }}
        onWheel={manejarRueda}
        onMouseDown={manejarMouseDown}
        onMouseMove={manejarMouseMove}
        onMouseUp={manejarMouseUp}
        onMouseLeave={manejarMouseUp}
      />

      <div class="leyenda">
        {ETIQUETAS_TOPICO.map((etiqueta, indice) => (
          <button
            type="button"
            class={topicosOcultos.has(indice) ? 'oculto' : ''}
            onClick={() => alternarTopico(indice)}
          >
            <span class="punto" style={{ background: COLORES_TOPICO[indice % COLORES_TOPICO.length] }} />
            {etiqueta}
          </button>
        ))}
      </div>

      <div class="detalle">
        {seleccionado ? (
          <>
            <p class="meta">
              <strong>{seleccionado.label}</strong> · {seleccionado.country} ·{' '}
              {nombreGenero(seleccionado.gender)} · {seleccionado.party} · {seleccionado.date}
            </p>
            <p class="snippet">"{seleccionado.snippet}"</p>
          </>
        ) : (
          <p class="meta">Hacé click en un punto para ver el discurso. Con la rueda hacés zoom y arrastrando te movés por el mapa.</p>
        )}
      </div>
    </div>
  );
}
