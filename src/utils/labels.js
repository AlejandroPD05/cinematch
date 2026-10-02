/** Palabras que cambian según se vean películas o series. */
const LABELS = {
  movies: {
    singular: 'película',
    plural: 'películas',
    Plural: 'Películas',
    ratingNote: '',
  },
  series: {
    singular: 'serie',
    plural: 'series',
    Plural: 'Series',
    ratingNote: ' Cada serie cuenta con la media de sus temporadas.',
  },
};

export function getLabels(kind) {
  return LABELS[kind] ?? LABELS.movies;
}