/**
 * ÚNICO PUNTO DE CONFIGURACIÓN DE LA APLICACIÓN
 *
 * - Los valores de Google Sheets se leen del archivo .env (o de las variables de Vercel).
 * - Nombre de la app y nombres de las personas: cámbialos aquí o sobrescríbelos con .env.
 * - Ningún componente contiene "Alba", "Alejandro" ni el ID de la hoja.
 */

const env = import.meta.env ?? {};

const pick = (value, fallback) => {
  const clean = typeof value === 'string' ? value.trim() : '';
  return clean || fallback;
};

/* ─────────────── Identidad ─────────────── */

export const APP_NAME = pick(env.VITE_APP_NAME, 'CINEMATCH');
export const APP_TAGLINE = 'Una colección de películas para dos.';
export const COLLECTION_DESCRIPTION =
  'Todo lo que hemos visto juntos, con la nota de cada uno. Elige la próxima o revive las que más nos gustaron.';

/* ─────────────── Personas ─────────────── */
// "aliases": otras formas en que puede aparecer el nombre en la cabecera de la columna.
export const PEOPLE = [
  { key: 'person1', name: pick(env.VITE_PERSON_1_NAME, 'Alba'), aliases: [] },
  { key: 'person2', name: pick(env.VITE_PERSON_2_NAME, 'Alejandro'), aliases: [] },
];

// Nombre de la colección que aparece en la cabecera principal.
export const COLLECTION_NAME = `La colección de ${PEOPLE[0].name} y ${PEOPLE[1].name}`;

/* ─────────────── Google Sheets ─────────────── */

export const GOOGLE_SHEET_ID = pick(env.VITE_GOOGLE_SHEET_ID, '');
export const GOOGLE_SHEET_GID = pick(env.VITE_GOOGLE_SHEET_GID, '0');
// Opcional: URL CSV completa (p. ej. "Publicar en la web"). Tiene prioridad si existe.
export const GOOGLE_SHEET_CSV_URL = pick(env.VITE_GOOGLE_SHEET_CSV_URL, '');

// Minutos que se reutilizan los datos dentro de la misma sesión del navegador.
// El botón "Actualizar" siempre ignora la caché.
export const CACHE_MINUTES = 10;

/* ─────────────── Columnas del Sheets ─────────────── */
// Las cabeceras se comparan sin mayúsculas, tildes ni signos de puntuación.
// Si una cabecera contiene alguna de estas palabras, se asigna a ese campo.
export const COLUMN_ALIASES = {
  title: ['nombre', 'titulo', 'pelicula', 'peliculas', 'title', 'name', 'film', 'movie'],
  poster: ['caratula', 'poster', 'portada', 'imagen', 'image', 'cover', 'foto', 'url'],
  // Columnas que existen en el Sheets pero NO son datos de cada película.
  ignore: ['falta por anadir', 'falta', 'pendiente de anadir', 'por anadir'],
};

// Campos opcionales. Si algún día añadís una columna con alguno de estos nombres,
// la web la detecta sola: se muestra en la ficha y (si es "facet") como filtro.
export const EXTRA_FIELDS = [
  { key: 'saga', label: 'Saga', aliases: ['saga', 'franquicia'], facet: true },
  { key: 'genre', label: 'Género', aliases: ['genero', 'generos', 'genre'], facet: true },
  { key: 'year', label: 'Año', aliases: ['ano', 'year', 'estreno'] },
  { key: 'director', label: 'Director', aliases: ['director', 'directora', 'direccion'] },
  { key: 'duration', label: 'Duración', aliases: ['duracion', 'minutos', 'duration'] },
  { key: 'platform', label: 'Dónde la vimos', aliases: ['plataforma', 'platform', 'donde'], facet: true },
  { key: 'watchedAt', label: 'Fecha', aliases: ['fecha', 'vista el', 'watched'] },
  { key: 'comments', label: 'Comentarios', aliases: ['comentario', 'comentarios', 'opinion', 'resena'] },
];

/* ─────────────── Valoraciones ─────────────── */

export const RATING_MAX = 10;
export const RATING_TIERS = {
  high: 8, // media >= 8  → "Mejor valoradas"
  mid: 6, //  media >= 6  → "Valoración media" (y < 8)
  //          media <  6  → "Valoración baja"
};

// Diferencia máxima (en puntos) para considerar que "coincidimos".
export const AGREEMENT_THRESHOLD = 1;

// Cuántas películas mostrar en cada ranking.
export const TOP_LIMIT = 10;
export const DUEL_LIMIT = 5;
