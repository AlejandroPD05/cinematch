# CINEMATCH

Catálogo privado de películas para dos personas. Google Sheets es el panel de administración; la web solo lee.

```
Google Sheets (añadir / editar / borrar)
        │  CSV público de solo lectura
        ▼
Web React (catálogo · búsqueda · filtros · estadísticas · ficha)
```

Sin backend, sin base de datos, sin películas escritas en el código.

---

## 1. Requisitos

- Node.js 20 o superior (`node -v`)
- Una cuenta de GitHub y otra de Vercel (gratuitas) para publicarla

## 2. Instalación

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

## 3. Preparar el Google Sheets

### 3.1 La columna de la carátula (importante)

La web lee la hoja como CSV. **Las imágenes insertadas dentro de una celda no viajan en el CSV**, solo el texto. Por eso la URL de cada carátula tiene que estar escrita como texto en alguna columna.

Añade una columna nueva (por ejemplo la F) con la cabecera `Carátula` y en cada fila la URL de la imagen.

Si vuestras imágenes actuales están hechas con la fórmula `=IMAGE("https://...")`, no hace falta copiar nada a mano. En `F2` pega esta fórmula y arrástrala hacia abajo:

```
=IFERROR(REGEXEXTRACT(FORMULATEXT(B2);"https?://[^""]+");"")
```

(Si tu hoja usa comas como separador de argumentos, cambia los `;` por `,`).

Si las imágenes se insertaron con *Insertar > Imagen > Imagen en la celda*, Google no guarda la URL: tendréis que pegarla en la columna `Carátula`. Mientras tanto la película aparece igualmente, con un placeholder.

Para las filas nuevas, lo más cómodo es: escribir la URL en `Carátula` y, si queréis seguir viendo la imagen en la hoja, poner en la columna B `=IMAGE(F2)`.

### 3.2 Cabeceras

La primera fila debe tener cabeceras. El parser es tolerante:

| Campo | Se reconoce si la cabecera contiene… |
|---|---|
| Título | nombre, título, película, title… (si no hay cabecera, usa la primera columna con texto) |
| Carátula | carátula, póster, portada, imagen, url… (si hay varias, la que tenga URLs) |
| Nota persona 1 | el nombre configurado (p. ej. `Nota Alba:`) |
| Nota persona 2 | el nombre configurado (p. ej. `Nota Alejandro:`) |
| Ignoradas | `FALTA POR AÑADIR` |

Las notas pueden escribirse como `10`, `8`, `7.5`, `7,5`, `10/10` o `7.5/10`. Una celda vacía es "sin nota" y nunca se inventa una media.

Cualquier otra columna con cabecera se conserva y se muestra en la ficha de la película. Si algún día añadís `Saga`, `Género`, `Año`, `Director`, `Duración`, `Plataforma`, `Fecha` o `Comentarios`, la web los detecta sola; `Saga`, `Género` y `Plataforma` aparecen además como filtros. Los alias están en `src/config/config.js` (`EXTRA_FIELDS`).

### 3.3 Compartir la hoja (lectura)

*Compartir > Acceso general > Cualquier persona con el enlace > Lector.*

No hace falta "Publicar en la web". La web nunca puede escribir en la hoja: el enlace es de solo lectura.

> Ten en cuenta que cualquiera que tenga el ID de la hoja puede leerla. No pongáis en esa pestaña nada que no queráis que se vea.

## 4. Sheet ID

En la URL de la hoja:

```
https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit#gid=0
                                       └──────────── SHEET ID ────────────┘
```

Es el texto entre `/d/` y `/edit`.

## 5. GID

Es el número que aparece tras `gid=` en la misma URL con la pestaña correcta seleccionada. La primera pestaña suele ser `0`. Si tenéis varias pestañas, haced clic en la de las películas y copiad el `gid` de la barra de direcciones.

## 6. Variables de entorno

Archivo `.env` en la raíz del proyecto:

```env
VITE_GOOGLE_SHEET_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789
VITE_GOOGLE_SHEET_GID=0
```

Opcionales:

| Variable | Para qué |
|---|---|
| `VITE_GOOGLE_SHEET_CSV_URL` | URL CSV completa (p. ej. la de *Archivo > Compartir > Publicar en la web > CSV*). Si existe, se usa primero. |
| `VITE_APP_NAME` | Cambiar el nombre de la app sin tocar código. |
| `VITE_PERSON_1_NAME`, `VITE_PERSON_2_NAME` | Cambiar los nombres sin tocar código. |

Los nombres por defecto, el nombre de la app, los umbrales de los filtros y los tamaños de los rankings están en **un único archivo: `src/config/config.js`**.

## 7. Ejecución local

```bash
npm run dev
```

Abre la URL que muestra la terminal (normalmente `http://localhost:5173`).

**Comprobar que los datos llegan:** abre la consola del navegador (F12 > Consola). Verás un mensaje como `[CINEMATCH] 42 películas leídas desde …` con las columnas detectadas (`title`, `poster`, `people`). Si `poster` es `-1`, falta la columna de URLs del paso 3.1.

## 8. Build

```bash
npm run build     # genera dist/
npm run preview   # sirve dist/ en local para probarlo
```

## 9. Despliegue en Vercel

1. Sube el proyecto a GitHub (el `.env` no se sube; está en `.gitignore`):
   ```bash
   git init
   git add .
   git commit -m "CINEMATCH"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/cinematch.git
   git push -u origin main
   ```
2. En vercel.com: *Add New > Project > Import* el repositorio.
3. Vercel detecta Vite solo (Build Command `npm run build`, Output `dist`). No cambies nada.
4. Antes de pulsar *Deploy*, abre *Environment Variables* y añade:

   | Name | Value |
   |---|---|
   | `VITE_GOOGLE_SHEET_ID` | tu Sheet ID |
   | `VITE_GOOGLE_SHEET_GID` | tu GID (p. ej. `0`) |

5. *Deploy*.

Si añades o cambias variables después, haz *Deployments > ⋯ > Redeploy*: las variables `VITE_` se incrustan al compilar.

## 10. Uso diario

1. Añadís una fila en el Sheets: `Jurassic World Dominion | URL | 7 | 8`.
2. Abrís la web y pulsáis el botón de actualizar (icono circular de la cabecera).
3. La película aparece con su media (7.5). Sin tocar código.

Los datos se guardan 10 minutos en la sesión del navegador para cargar al instante; el botón de actualizar siempre consulta la hoja de nuevo.

## 11. Solución de problemas

| Síntoma | Causa probable y solución |
|---|---|
| "No hemos podido cargar nuestra colección." | La hoja no está compartida como *Cualquier persona con el enlace*. En consola verás "La respuesta … es HTML, no CSV". |
| Error de configuración al abrir | Falta `VITE_GOOGLE_SHEET_ID` en `.env` o en Vercel. Tras editar `.env`, reinicia `npm run dev`. |
| Salen películas de otra pestaña | El `GID` no es el de la pestaña correcta. |
| Todas las películas con placeholder | No hay columna de URLs (paso 3.1) o las URLs no son directas a la imagen. |
| Algunas carátulas no cargan | La URL no es pública o el servidor bloquea el enlace externo. Usad URLs que terminen en `.jpg`/`.png`/`.webp` (por ejemplo de TMDB: `https://image.tmdb.org/t/p/w500/...`). Los enlaces de Google Drive no suelen funcionar como imagen. |
| Una nota no aparece | El valor no es un número entre 0 y 10. Revisa la celda. |
| Un cambio en la hoja no se ve | Pulsa actualizar. Si usas la URL de "Publicar en la web", Google puede tardar unos minutos en refrescar ese CSV. |
| Error CORS en consola | La app prueba automáticamente otra URL de Google. Si aun así falla, publica la hoja (*Archivo > Compartir > Publicar en la web > la pestaña > CSV*) y pon esa URL en `VITE_GOOGLE_SHEET_CSV_URL`. |
| En Vercel funciona distinto que en local | Revisa que las variables estén en Vercel y haz *Redeploy*. |

---

## Estructura

```
src/
├── config/config.js          ← único punto de configuración
├── services/googleSheets.js  ← lectura CSV, caché de sesión, URLs de respaldo
├── utils/
│   ├── csv.js                ← parser CSV sin dependencias
│   ├── movieParser.js        ← filas → películas (tolerante)
│   ├── ratings.js            ← normalizar notas, medias, formato
│   ├── statistics.js         ← estadísticas y rankings
│   ├── movieFilters.js       ← búsqueda, filtros, orden
│   └── text.js
├── hooks/                    ← useMovies, useMovieFilters, useModalA11y
├── components/               ← Header, Hero, FeaturedMovie, FilterBar, MovieGrid,
│                               MovieCard, Poster, Rating, MovieModal, StatsSection,
│                               TopMovies, AgreementSection, SkeletonCard, EmptyState,
│                               ErrorState, RefreshNotice, Footer…
├── App.jsx
├── main.jsx
└── index.css                 ← tokens de color y tipografía
```

Modelo de cada película:

```js
{
  id, order, title, poster,
  ratings: { person1, person2 },   // números o null
  average, difference,             // null si no hay datos
  details: { saga, genre, year },  // solo si existen esas columnas
  extra: [{ label, value }]        // todas las columnas adicionales
}
```
