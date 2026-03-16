import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchAnime } from '../api';
import { Star } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      setLoading(true);
      searchAnime(query)
        .then(data => setResults(Array.isArray(data) ? data : (data.data || [])))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setResults([]);
    }
  }, [query]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            Search Results for "{query}"
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-zinc-500 py-20">
            <p className="text-lg">No results found for "{query}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
            {results.map((anime) => (
              <Link
                key={anime.id}
                to={`/watch/${anime.session}`}
                className="group relative flex flex-col gap-3 rounded-xl overflow-hidden bg-zinc-900/50 p-3 border border-zinc-800/50 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all duration-300"
              >
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800">
                  <img
                    src={anime.poster}
                    alt={anime.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-emerald-500/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[9px] sm:text-xs font-bold text-white uppercase tracking-wider">
                    {anime.type}
                  </div>
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-medium text-amber-400 flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
                    {anime.score}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 text-zinc-200 group-hover:text-emerald-400 transition-colors">
                    {anime.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-zinc-500 flex items-center justify-center gap-1.5">
                    <span>{anime.year}</span>
                    <span>•</span>
                    <span>{anime.season}</span>
                    {anime.episodes > 0 && (
                      <>
                        <span>•</span>
                        <span>{anime.episodes} Eps</span>
                      </>
                    )}
                  </p>
                  <div className="w-full flex justify-center mt-0.5">
                    {anime.episodes > 0 ? (
                      <span className="text-emerald-400 font-medium text-[10px] sm:text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full w-full text-center">Finished</span>
                    ) : (
                      <span className="text-amber-400 font-medium text-[10px] sm:text-xs bg-amber-500/10 px-2 py-0.5 rounded-full w-full text-center">Airing</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
