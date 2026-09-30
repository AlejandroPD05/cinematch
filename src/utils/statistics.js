import { AGREEMENT_THRESHOLD, PEOPLE } from '../config/config.js';
import { averageOf } from './ratings.js';

const hasNumber = (v) => typeof v === 'number' && Number.isFinite(v);

/** Ordena por nota media desc; empate → ambas notas presentes → orden original. */
export function byAverageDesc(a, b) {
  const aBoth = a.difference !== null ? 1 : 0;
  const bBoth = b.difference !== null ? 1 : 0;
  return (b.average ?? -1) - (a.average ?? -1) || bBoth - aBoth || a.order - b.order;
}

export function computeStats(movies) {
  const rated = movies.filter((m) => hasNumber(m.average));
  const shared = movies.filter((m) => hasNumber(m.difference));

  const people = PEOPLE.map((person) => {
    const values = movies.map((m) => m.ratings[person.key]).filter(hasNumber);
    return { ...person, average: averageOf(values), count: values.length };
  });

  const peopleWithAverage = people.filter((p) => hasNumber(p.average));
  let strictest = null;
  if (peopleWithAverage.length === PEOPLE.length) {
    const sorted = [...peopleWithAverage].sort((a, b) => a.average - b.average);
    if (sorted[sorted.length - 1].average - sorted[0].average >= 0.1) strictest = sorted[0];
  }

  const agreeing = shared.filter((m) => m.difference <= AGREEMENT_THRESHOLD);

  return {
    total: movies.length,
    ratedCount: rated.length,
    sharedCount: shared.length,
    people,
    collectionAverage: averageOf(rated.map((m) => m.average)),
    perfectTens: shared.filter((m) => m.average === 10).length,
    exactMatches: shared.filter((m) => m.difference === 0).length,
    agreementRate: shared.length > 0 ? Math.round((agreeing.length / shared.length) * 100) : null,
    averageDifference: averageOf(shared.map((m) => m.difference)),
    strictest,
  };
}

/** Mejor valoradas. Top 10 si hay suficientes, si no Top 5, si no todas las valoradas. */
export function getTopRated(movies, limit = 10) {
  const rated = movies.filter((m) => hasNumber(m.average)).sort(byAverageDesc);
  const size = rated.length >= limit ? limit : rated.length >= 5 ? 5 : rated.length;
  return rated.slice(0, size);
}

/** Donde más discrepamos: diferencia > 0, de mayor a menor. */
export function getDisagreements(movies, limit = 5) {
  return movies
    .filter((m) => hasNumber(m.difference) && m.difference > 0)
    .sort((a, b) => b.difference - a.difference || byAverageDesc(a, b))
    .slice(0, limit);
}

/** Donde más coincidimos: diferencia más pequeña; empate → mejor media. */
export function getAgreements(movies, limit = 5) {
  return movies
    .filter((m) => hasNumber(m.difference))
    .sort((a, b) => a.difference - b.difference || byAverageDesc(a, b))
    .slice(0, limit);
}

/** Película destacada: la mejor media (prefiere las que tienen carátula). */
export function getFeaturedMovie(movies) {
  const rated = movies.filter((m) => hasNumber(m.average));
  if (rated.length === 0) return null;
  const best = Math.max(...rated.map((m) => m.average));
  const tied = rated.filter((m) => m.average === best).sort(byAverageDesc);
  return tied.find((m) => m.poster) ?? tied[0];
}

/** Posición de una película en el ranking por media (1 = mejor). null si no tiene media. */
export function getRank(movies, movieId) {
  const ranked = movies.filter((m) => hasNumber(m.average)).sort(byAverageDesc);
  const index = ranked.findIndex((m) => m.id === movieId);
  return index === -1 ? null : { position: index + 1, of: ranked.length };
}
