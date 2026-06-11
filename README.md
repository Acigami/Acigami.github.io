# Sitio personal

Mi sitio personal: portfolio, hub de enlaces y sandbox para experimentos que corren en el navegador. Construido con [Astro](https://astro.build).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias (solo la primera vez o tras un clone) |
| `npm run dev` | Levanta el sitio en `http://localhost:4321` con recarga automática |
| `npm run build` | Genera el sitio estático en `dist/` |
| `npm run preview` | Sirve `dist/` localmente para revisar el build final |

## Estructura

```
src/
  pages/        cada archivo acá es una ruta del sitio (index.astro -> /)
public/         archivos que se copian tal cual (favicon, imágenes)
astro.config.mjs  configuración de Astro
.github/workflows/deploy.yml  build y deploy automático a GitHub Pages
```

## Publicar en GitHub Pages (pendiente, requiere tu cuenta)

El circuito de deploy ya está armado; falta conectarlo a GitHub:

1. Creá en GitHub un repo público llamado `<tu-usuario>.github.io` (ese nombre hace que el sitio se sirva en la raíz, sin path extra).
2. Conectá este repo local y subilo:

   ```powershell
   git remote add origin https://github.com/<tu-usuario>/<tu-usuario>.github.io.git
   git push -u origin main
   ```

3. En GitHub: Settings > Pages > Source: **GitHub Actions**.
4. En `astro.config.mjs`, descomentá `site:` y poné la URL real. Commit y push.

Después de eso, cada push a `main` buildea y publica solo. Si preferís otro nombre de repo (por ejemplo `sitio`), el sitio queda en `<tu-usuario>.github.io/sitio` y hay que agregar `base: '/sitio'` en la config.

## Agregar un experimento al sandbox

Cada experimento es una página aislada: si se rompe, no arrastra al resto del sitio.

1. Creá la página en `src/pages/sandbox/mi-experimento.astro` (usá `regresion-lineal.astro` como modelo).
2. Si lleva interactividad, escribí el componente en `src/components/` (`.tsx` con Preact) y metelo en la página con `client:load` o `client:visible`.
3. Sumá la entrada a la lista de `src/pages/sandbox/index.astro`.
4. `npm run dev` para probarlo; el build avisa si algo quedó roto.

## Dominio propio (cuando el sitio esté presentable)

Mientras tanto, el subdominio gratis `<tu-usuario>.github.io` funciona perfecto. Para pasar a un dominio propio sin pagar el primer año:

1. **Activá el GitHub Student Developer Pack** en [education.github.com/pack](https://education.github.com/pack) con el correo de la UNSAM. La verificación de estudiante puede tardar unos días.
2. **Canjeá el dominio .me gratis** (1 año, con SSL incluido) en la oferta de Namecheap dentro del Pack.
3. **Configurá el DNS en Namecheap** apuntando a GitHub Pages:
   - Registro `CNAME` para `www` → `<tu-usuario>.github.io`
   - Registros `A` para el dominio pelado → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
4. **Conectá el dominio en GitHub**: en el repo, Settings > Pages > Custom domain. Marcá "Enforce HTTPS" cuando el certificado esté listo (puede tardar un rato).
5. **Actualizá `site` en `astro.config.mjs`** con el dominio nuevo, commit y push.

El subdominio viejo redirige solo al dominio nuevo, así que no se rompe ningún enlace.

## Estado del entorno

Verificado el 2026-06-11: Node.js v24.16.0, npm 11.13.0, git 2.54.0, Astro 6.4.6 (con la integración de Preact para las islas interactivas).

## Nota sobre la identidad de git

Este repo tiene configurado localmente `user.name = rfernandezarias` (sacado del email) como placeholder. Para poner tu nombre real:

```powershell
git config user.name "Tu Nombre"
```
