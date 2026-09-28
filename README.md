# Casa Lamarca — sitio web

Sitio institucional de Casa Lamarca (Villa Devoto, CABA). HTML/CSS/JS estático, sin build, sin backend — todo el contacto es por WhatsApp y la agenda de talleres se trae en vivo de un Google Sheet.

## Estructura

```
index.html            Inicio
talleres.html          Talleres + "Próximos talleres" (agenda dinámica)
taller.html            Detalle de un taller puntual (taller.html?id=...)
cumpleanos.html         Cumpleaños
espacio.html            Alquilá el espacio
tienda.html              Tienda
lamarca.html             Lamarca (incluye lo que antes era Contacto)
contacto.html            OBSOLETA — quedó de antes de unificarla con lamarca.html.
                         Nada del sitio la enlaza. Se puede borrar cuando confirmen
                         que no la necesitan, o dejarla como referencia por ahora.
styles.css              Estilos de todo el sitio
script.js               Formularios (arman el mensaje y abren WhatsApp)
talleres-data.js        Trae y parsea la agenda de talleres (ver más abajo)
data/talleres.csv       Datos de ejemplo (ya no se usan en producción)
assets/logo.png         Logo
```

## Cómo levantarlo local

No hace falta build ni instalar nada. Cualquier servidor estático alcanza, por ejemplo:

```bash
python3 -m http.server 8000
# o
npx serve .
```

Y abrís `http://localhost:8000`.

## La agenda de "Próximos talleres"

`talleres.html` trae la lista de próximos talleres desde un Google Sheet, usando la API de Google Sheets (`talleres-data.js`). Esto **no funcionaba dentro de un Claude Artifact** (el sandbox bloquea cualquier `fetch()` externo salvo a Google Fonts) — por eso el sitio se sacó de ahí. Corriendo como sitio estático normal (local o deployado), el fetch funciona sin problema.

Configuración en `talleres-data.js` (arriba del archivo):
- `TALLERES_SHEET_ID` — el ID del Sheet.
- `TALLERES_SHEET_TAB` — el nombre exacto de la pestaña.
- `TALLERES_API_KEY` — clave de Google Cloud, restringida solo a la API de Sheets (de solo lectura, no sirve para nada más aunque quede visible en el código del sitio).

El Sheet tiene que estar compartido como **"Cualquiera con el enlace — Lector"** (no alcanza con "Publicar en la web").

Esquema de columnas del Sheet — está documentado en el comentario de cabecera de `talleres-data.js`.

## Deploy

Es un sitio 100% estático, así que Vercel o Netlify (plan gratis) alcanzan de sobra:

1. Subir esta carpeta a un repo de GitHub.
2. Conectar el repo en Vercel/Netlify.
3. Sin build command, sin output directory especial (la raíz del repo es la raíz del sitio).
4. Listo — deploy automático en cada push.

Cuando tengan dominio propio, se apunta desde ahí.
