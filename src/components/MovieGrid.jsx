import { AnimatePresence } from 'framer-motion';
import MovieCard from './MovieCard.jsx';

export default function MovieGrid({ movies, onOpen }) {
  return (
    <div className="relative grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
      <AnimatePresence>
        {movies.map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} index={index} onOpen={onOpen} />
        ))}
      </AnimatePresence>
    </div>
  );
}
