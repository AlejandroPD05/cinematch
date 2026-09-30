/** Minúsculas, sin tildes, sin signos. "Nota Alba:" → "nota alba" · "Año" → "ano" */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** true si el texto normalizado contiene la frase completa (por palabras). */
export function containsPhrase(normalizedText, phrase) {
  const needle = normalizeText(phrase);
  if (!needle || !normalizedText) return false;
  return ` ${normalizedText} `.includes(` ${needle} `);
}

/** Extrae la primera URL http(s) de un texto, o null. */
export function extractUrl(value) {
  const match = String(value ?? '').match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : null;
}

export function isUrlLike(value) {
  return /^\s*https?:\/\//i.test(String(value ?? ''));
}

export function slugify(value) {
  return normalizeText(value).replace(/\s+/g, '-').slice(0, 60) || 'pelicula';
}

/** pluralize(1, 'película', 'películas') → "1 película" */
export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}
