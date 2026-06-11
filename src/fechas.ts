// Formateo de fechas del contenido, en un solo lugar para que no diverja.
// El frontmatter ("2024-12-01") se parsea como medianoche UTC: hay que
// formatear también en UTC, o el huso local corre la fecha al mes anterior.
export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
