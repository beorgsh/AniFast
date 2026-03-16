import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchLatest, searchAnime } from '../api';
import { Play, Search, X, ArrowUp, Star, Clock } from 'lucide-react';

interface WatchHistory {
  animeSession: string;
  episodeSession: string;
  animeTitle: string;
  episodeNumber: string;
  thumbnail: string;
  progress: number;
  duration: number;
  lastWatched: number;
}

export default function Home() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [activeTab, setActiveTab] = useState<'latest' | 'history'>('latest');
  const [history, setHistory] = useState<WatchHistory[]>([]);

  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEpisodes(1);
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = JSON.parse(localStorage.getItem('anime_history') || '{}');
    const historyArray = Object.values(stored).sort((a: any, b: any) => b.lastWatched - a.lastWatched) as WatchHistory[];
    setHistory(historyArray);
  };

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchAnime(query);
        setSearchResults(Array.isArray(data) ? data : (data.data || []));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const loadEpisodes = async (p: number) => {
    try {
      setLoading(true);
      const data = await fetchLatest(p);
      if (p === 1) {
        setEpisodes(data.data);
      } else {
        setEpisodes((prev) => {
          // Prevent duplicates
          const newEps = data.data.filter((newEp: any) => !prev.some((oldEp: any) => oldEp.id === newEp.id));
          return [...prev, ...newEps];
        });
      }
      setHasMore(data.current_page < data.last_page);
      setPage(p);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    setShowBackToTop(scrollTop > 300);

    if (scrollHeight - scrollTop <= clientHeight + 150) {
      if (!loading && hasMore && !query) {
        loadEpisodes(page + 1);
      }
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden">
      {/* Background Grid & Moving Circle */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-50"></div>
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[100px] animate-top-to-left"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 gap-8">
        {/* Landing Page Header */}
        <div className="text-center space-y-3 mb-8 shrink-0">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            AnimeFast
          </h1>
          <p className="text-zinc-400 text-sm md:text-lg max-w-2xl mx-auto px-4">
            Watch your favorite anime in high quality, without the hassle.
          </p>
        </div>

        {/* Search Bar */}
        <div className="shrink-0 max-w-2xl mx-auto w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime..."
              className="w-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-full py-3 pl-12 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-zinc-500 transition-all shadow-lg"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            {query ? `Search Results for "${query}"` : activeTab === 'latest' ? 'Latest Episodes' : 'Continue Watching'}
          </h2>
          
          {!query && (
            <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/50">
              <button
                onClick={() => setActiveTab('latest')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'latest' 
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => {
                  loadHistory();
                  setActiveTab('history');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'history' 
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                History
              </button>
            </div>
          )}
        </div>

        {/* Scrollable List */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-hide pr-2 pb-6 relative"
        >
          {query ? (
            // Search Results
            isSearching ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-zinc-500 py-20">
                <p className="text-lg">No results found for "{query}".</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-6">
                {searchResults.map((anime) => (
                  <Link
                    key={anime.id}
                    to={`/watch/${anime.session}`}
                    state={{ title: anime.title }}
                    className="group relative flex flex-col gap-2 sm:gap-3 rounded-xl overflow-hidden bg-zinc-900/50 p-2 sm:p-3 border border-zinc-800/50 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800">
                      <img
                        src={anime.poster}
                        alt={anime.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-medium text-amber-400 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
                        {anime.score}
                      </div>
                      <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-emerald-500/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[9px] sm:text-xs font-bold text-white uppercase tracking-wider">
                        {anime.type}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 text-zinc-200 group-hover:text-emerald-400 transition-colors">
                        {anime.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-500 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-0">
                        <span>{anime.year} • {anime.season}</span>
                        <span>{anime.episodes} Eps</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : activeTab === 'history' ? (
            // History Tab
            history.length === 0 ? (
              <div className="text-center text-zinc-500 py-20">
                <p className="text-lg">No watch history yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {history.map((item) => (
                  <Link
                    key={item.animeSession}
                    to={`/watch/${item.animeSession}/${item.episodeSession}`}
                    state={{ title: item.animeTitle }}
                    className="group flex flex-row items-center gap-4 bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-800/60 hover:border-zinc-700 rounded-xl p-3 transition-all"
                  >
                    <div className="relative w-32 sm:w-48 aspect-video rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                      <img
                        src={item.thumbnail}
                        alt={item.animeTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Play className="w-8 h-8 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/80">
                        <div 
                          className="h-full bg-emerald-500" 
                          style={{ width: `${Math.min(100, (item.progress / item.duration) * 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                      <h3 className="font-semibold text-sm sm:text-lg line-clamp-1 text-zinc-200 group-hover:text-emerald-400 transition-colors">
                        {item.animeTitle}
                      </h3>
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-500">
                        <span className="font-medium text-emerald-500/80">Episode {item.episodeNumber}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {Math.floor(item.progress / 60)}m / {Math.floor(item.duration / 60)}m
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            // Latest Episodes
            episodes.length === 0 && loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {episodes.map((ep) => (
                    <Link
                      key={ep.id}
                      to={`/watch/${ep.anime_session}/${ep.session}`}
                      state={{ title: ep.anime_title }}
                      className="group relative flex flex-row sm:flex-col items-center sm:items-stretch gap-3 sm:gap-3 rounded-xl overflow-hidden bg-zinc-900/40 sm:bg-zinc-900/50 p-2 sm:p-3 border border-zinc-800/30 sm:border-zinc-800/50 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all duration-300 backdrop-blur-sm"
                    >
                      <div className="relative w-32 sm:w-full aspect-video rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                        <img
                          src={ep.snapshot}
                          alt={ep.anime_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500 fill-emerald-500" />
                        </div>
                        <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-medium text-zinc-200">
                          Ep {ep.episode}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-sm line-clamp-2 text-zinc-200 group-hover:text-emerald-400 transition-colors">
                          {ep.anime_title}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {new Date(ep.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {loading && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-8 right-8 p-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-full shadow-lg shadow-emerald-500/20 transition-all z-50 hover:scale-110"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
