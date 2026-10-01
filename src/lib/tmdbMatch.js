export const UMBRAL = 0.7; // parecido mínimo de título para aceptar un póster

/**
 * Películas que TMDB no encuentra bien buscando solo por el nombre del Sheets.
 * Clave: el título como está en el Sheets, en minúsculas y sin acentos.
 * Valor: puede ser
 *   - un número: el ID de TMDB (themoviedb.org/movie/ID-nombre)
 *   - { q: 'título oficial', year: 2016 }: búsqueda por título y año de estreno
 */
export const OVERRIDES = {
  'jurassic park 1': 329,
  'jurassic park 2': 330,
  'jurassic park 3': 331,
  'jurassic world': 135397,
  'jurassic world 2': 351286,
  'jurassic world 3': 507086,
  'jurassic world 4': 1234821,
  'ice age': 425,
  'ice age 2': 950,
  'ice age 3': 8355,
  'ice age 4': 57800,
  'rompe ralph rompe internet': 404368,
  'PROJECTX': 57214,
  'HTTYD': 10191,
  'HTTYD 2': 82702,
  'HTTYD 3': 166428,
  'HSM': 10947,
  'HSM2': 13649,
  'HSM3': 11887,
  'Bad boys 2': 8961,
  'Bad boys 3': 38700,
  'Bad boys 4': 573435,
  'WALLE': 10681,
  'Barbie y el cascanueces': 15167,
  'Barbie y el lago de los cisnes': 15016,
  'Barbie 12 bailarinas': 13002,
  'Barbie sirenas 2': 91342,
  'Zootroplis': 269149,
  'Dencantada. vuelve giselle': 338958,
  'Oso cocainomano': 804150,
  'El gato con botas 2': 315162,
  'ice age 5': { q: 'Ice Age: Collision Course', year: 2016 },
  'mowgli': { q: 'Mowgli: Legend of the Jungle', year: 2018 },
  'del reves': { q: 'Inside Out', year: 2015 },
  'del reves 2': { q: 'Inside Out 2', year: 2024 },
  'detective pikachu': { q: 'Pokémon Detective Pikachu', year: 2019 },
  'hotel transilvania 3': { q: 'Hotel Transylvania 3: Summer Vacation', year: 2018 },
  'hotel transilvania 4': { q: 'Hotel Transylvania: Transformania', year: 2022 },
  'la sirenita': { q: 'The Little Mermaid', year: 1989 },
  'la sirenita 1': { q: 'The Little Mermaid', year: 1989 },
  'la sirenita 3': { q: "The Little Mermaid: Ariel's Beginning", year: 2008 },
  'las guerreras kpop': { q: 'KPop Demon Hunters', year: 2025 },
  'mamma mia 2': { q: 'Mamma Mia! Here We Go Again', year: 2018 },
  'tod y tobby': { q: 'The Fox and the Hound', year: 1981 },
  'tod y tobby 2': { q: 'The Fox and the Hound 2', year: 2006 },
  'el libro de la selva la': { q: 'The Jungle Book', year: 2016 },
  'el libro de la selva live action': { q: 'The Jungle Book', year: 2016 },
  'barbie princesa de las hadas': { q: 'Barbie: Mariposa & the Fairy Princess', year: 2013 },
  'barbie popstars': { q: 'Barbie: The Princess & the Popstar', year: 2012 },
};

// "El Diario de Noa!" → "el diario de noa"
export const normalizar = (texto) =>
  String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Números de un título ("ice age 2" → "2"), para no confundir secuelas.
const numeros = (texto) => (texto.match(/\d+/g) || []).join(' ');

// Parecido entre dos textos de 0 a 1 (coeficiente de Dice sobre pares de letras).
function parecido(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const pares = new Map();
  for (let i = 0; i < a.length - 1; i += 1) {
    const par = a.slice(i, i + 2);
    pares.set(par, (pares.get(par) || 0) + 1);
  }
  let comunes = 0;
  for (let i = 0; i < b.length - 1; i += 1) {
    const par = b.slice(i, i + 2);
    const restantes = pares.get(par) || 0;
    if (restantes > 0) {
      pares.set(par, restantes - 1);
      comunes += 1;
    }
  }
  return (2 * comunes) / (a.length + b.length - 2);
}

// Puntúa un resultado de TMDB frente al título buscado (usa título en español y original).
export function puntuar(buscado, resultado) {
  const nombres = [resultado.title, resultado.original_title].map(normalizar).filter(Boolean);
  let mejor = 0;
  nombres.forEach((nombre) => {
    let puntos;
    if (nombre === buscado) {
      puntos = 1;
    } else {
      puntos = nombre.startsWith(`${buscado} `) ? 0.9 : parecido(buscado, nombre);
      // Si los números no coinciden (Ice age 2 vs Ice age 3), casi seguro es otra película.
      if (numeros(buscado) !== numeros(nombre)) puntos -= 0.3;
    }
    if (puntos > mejor) mejor = puntos;
  });
  return mejor;
}