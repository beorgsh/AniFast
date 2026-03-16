import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { resolveEpisode, fetchAnimeInfo, fetchAnimeEpisodes } from '../api';
import { Download, ArrowLeft, Star, Calendar, Clock, Play, SkipBack, SkipForward, Loader2, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';

const formatDuration = (duration: string) => {
  if (!duration) return '';
  const parts = duration.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const totalMinutes = hours * 60 + minutes;
    return `${totalMinutes}m`;
  } else if (parts.length === 2) {
    return `${parseInt(parts[0])}m`;
  }
  const match = duration.match(/(\d+)/);
  return match ? `${match[0]}m` : duration;
};

export default function Watch() {
  const { animeSession, episodeSession } = useParams<{ animeSession: string; episodeSession?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passedTitle = location.state?.title;
  const passedPoster = location.state?.poster;
  const [data, setData] = useState<any>(null);
  const [info, setInfo] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSourceLoading, setIsSourceLoading] = useState(true);
  const [activeSource, setActiveSource] = useState<any>(null);
  const [playerType, setPlayerType] = useState<'builtin' | 'embed'>('builtin');
  const [isPlayerDropdownOpen, setIsPlayerDropdownOpen] = useState(false);
  const [audioMode, setAudioMode] = useState<'sub' | 'dub'>('sub');
  const [activeTab, setActiveTab] = useState<'overview' | 'relation' | 'recommended' | 'episodes'>('episodes');
  const [isDownloading, setIsDownloading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [initialTime, setInitialTime] = useState(0);

  const [episodesPage, setEpisodesPage] = useState(1);
  const [hasMoreEpisodes, setHasMoreEpisodes] = useState(true);
  const [isLoadingMoreEpisodes, setIsLoadingMoreEpisodes] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animeSession) {
      loadAnimeData();
    }
  }, [animeSession]);

  useEffect(() => {
    if (animeSession && episodeSession) {
      loadEpisodeSource();
    }
  }, [animeSession, episodeSession]);

  const loadAnimeData = async () => {
    try {
      setIsPageLoading(true);
      const [infoData, epsData] = await Promise.all([
        fetchAnimeInfo(animeSession!),
        fetchAnimeEpisodes(animeSession!, 1),
      ]);
      setInfo(infoData);
      setEpisodes(epsData.data);
      setEpisodesPage(1);
      setHasMoreEpisodes(epsData.current_page < epsData.last_page);
      
      if (!episodeSession && epsData.data && epsData.data.length > 0) {
        navigate(`/watch/${animeSession}/${epsData.data[0].session}`, { replace: true });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPageLoading(false);
    }
  };

  const loadMoreEpisodes = async () => {
    if (!animeSession || !hasMoreEpisodes || isLoadingMoreEpisodes) return;
    
    try {
      setIsLoadingMoreEpisodes(true);
      const nextPage = episodesPage + 1;
      const epsData = await fetchAnimeEpisodes(animeSession, nextPage);
      
      setEpisodes(prev => [...prev, ...epsData.data]);
      setEpisodesPage(nextPage);
      setHasMoreEpisodes(epsData.current_page < epsData.last_page);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMoreEpisodes(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreEpisodes && !isLoadingMoreEpisodes) {
          loadMoreEpisodes();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMoreEpisodes, isLoadingMoreEpisodes, episodesPage, animeSession]);

  const loadEpisodeSource = async () => {
    try {
      setIsSourceLoading(true);
      
      // Load saved progress
      const history = JSON.parse(localStorage.getItem('anime_history') || '{}');
      if (history[animeSession!] && history[animeSession!].episodeSession === episodeSession) {
        setInitialTime(history[animeSession!].progress || 0);
      } else {
        setInitialTime(0);
      }

      const resolveData = await resolveEpisode(animeSession!, episodeSession!);
      setData(resolveData);
      if (resolveData.sources && resolveData.sources.length > 0) {
        const sorted = [...resolveData.sources].sort((a, b) => parseInt(b.res) - parseInt(a.res));
        setActiveSource(sorted[0]);
      } else {
        setActiveSource(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSourceLoading(false);
    }
  };

  const playerOptions = useMemo(() => ({
    autoplay: autoPlay,
    controls: true,
    fill: true,
    sources: activeSource ? [{ src: activeSource.download, type: 'video/mp4' }] : []
  }), [activeSource?.download, autoPlay]);

  if (isPageLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="w-32 h-6 bg-zinc-800 rounded"></div>
        <div className="aspect-video bg-zinc-800 rounded-2xl"></div>
        <div className="flex justify-between items-center">
          <div className="w-48 h-10 bg-zinc-800 rounded-xl"></div>
          <div className="w-32 h-10 bg-zinc-800 rounded-xl"></div>
        </div>
        <div className="w-2/3 h-8 bg-zinc-800 rounded"></div>
        <div className="w-1/3 h-6 bg-zinc-800 rounded mt-2"></div>
        <div className="flex gap-6 border-b border-zinc-800 pb-2 mt-8">
          <div className="w-20 h-6 bg-zinc-800 rounded"></div>
          <div className="w-20 h-6 bg-zinc-800 rounded"></div>
          <div className="w-24 h-6 bg-zinc-800 rounded"></div>
          <div className="w-20 h-6 bg-zinc-800 rounded"></div>
        </div>
        <div className="flex gap-6 mt-6">
          <div className="w-48 aspect-[3/4] bg-zinc-800 rounded-xl"></div>
          <div className="flex-1 space-y-4">
            <div className="w-full h-4 bg-zinc-800 rounded"></div>
            <div className="w-full h-4 bg-zinc-800 rounded"></div>
            <div className="w-3/4 h-4 bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentEpisode = episodes.find(e => e.session === episodeSession);
  const hasDub = currentEpisode?.audio?.toLowerCase().includes('eng');
  const currentIndex = episodes.findIndex(e => e.session === episodeSession);
  
  // Episodes are usually sorted newest first or oldest first. Let's assume ascending (index + 1 is next).
  const nextEpisode = currentIndex >= 0 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;

  const handleNextEpisode = () => {
    if (nextEpisode) {
      navigate(`/watch/${animeSession}/${nextEpisode.session}`);
    }
  };

  const handlePrevEpisode = () => {
    if (prevEpisode) {
      navigate(`/watch/${animeSession}/${prevEpisode.session}`);
    }
  };

  const cleanTitle = passedTitle || info?.title?.replace(/ - AnimePahe.*/i, '')?.replace(/ -? ?Episode \d+.*/i, '')?.trim() || '';

  const handleProgress = (currentTime: number, duration: number) => {
    if (!info || !currentEpisode || duration <= 0) return;
    
    // Don't save if we're at the very end (let it reset or stay at 99%)
    if (currentTime >= duration - 2) return;

    const history = JSON.parse(localStorage.getItem('anime_history') || '{}');
    
    history[animeSession!] = {
      animeSession,
      episodeSession,
      animeTitle: cleanTitle,
      episodeNumber: currentEpisode.episode,
      thumbnail: info.poster || currentEpisode.snapshot,
      progress: currentTime,
      duration: duration,
      lastWatched: Date.now()
    };
    
    localStorage.setItem('anime_history', JSON.stringify(history));
  };

  const handleDownload = async (e: React.MouseEvent, epSession: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsDownloading(true);
      const res = await resolveEpisode(animeSession!, epSession);
      if (res.sources && res.sources.length > 0) {
        const best = [...res.sources].sort((a, b) => parseInt(b.res) - parseInt(a.res))[0];
        window.open(best.download, '_blank');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative h-full overflow-y-auto scrollbar-hide">
      {/* Background Grid & Moving Circle */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-50"></div>
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[100px] animate-top-to-left"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-all w-fit bg-transparent px-3 py-1.5 rounded-lg border border-zinc-800/30 hover:border-emerald-500/30"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </Link>

        {/* Player and Controls */}
        <div className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8 animate-fade-in-up">
          {/* Refined Background: Fade at top, solid at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-[150%] bg-zinc-950/90 backdrop-blur-2xl [mask-image:linear-gradient(to_top,black_0%,black_60%,transparent_100%)] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-full bg-zinc-950/40 backdrop-blur-md [mask-image:linear-gradient(to_top,black_0%,transparent_100%)] pointer-events-none" />
          
          <div className="relative z-10 px-4 py-2 sm:px-6 lg:px-8 space-y-3">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/10 border border-zinc-800/50">
              {!data || (!activeSource && !isSourceLoading) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 text-zinc-500">
                  Episode not found or no sources available.
                </div>
              ) : playerType === 'embed' ? (
                <>
                  {isSourceLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900/80">
                      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                      <p className="text-zinc-400 font-medium animate-pulse">Loading episode...</p>
                    </div>
                  )}
                  <iframe
                    src={activeSource?.embed}
                    allowFullScreen
                    className="w-full h-full border-0 absolute inset-0"
                    title="Video Player"
                  ></iframe>
                </>
              ) : (
                <VideoPlayer 
                  options={playerOptions} 
                  initialTime={initialTime}
                  onProgress={handleProgress}
                  isLoading={isSourceLoading}
                  animeTitle={cleanTitle}
                  episodeNumber={currentEpisode?.episode}
                  onNext={nextEpisode ? handleNextEpisode : undefined}
                  onPrev={prevEpisode ? handlePrevEpisode : undefined}
                  onEnded={() => {
                    if (autoPlay && nextEpisode) {
                      handleNextEpisode();
                    }
                  }} 
                />
              )}
            </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-1 sm:gap-3 w-full">
            {/* Left Side: Player Type & Sub/Dub */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Custom Player Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsPlayerDropdownOpen(!isPlayerDropdownOpen)}
                  className="flex items-center gap-1 sm:gap-2 bg-transparent hover:bg-zinc-800/40 px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-zinc-800/30 text-zinc-300 transition-colors text-[10px] sm:text-sm font-medium whitespace-nowrap [-webkit-tap-highlight-color:transparent]"
                >
                  <span className="sm:hidden">{playerType === 'builtin' ? 'Built-in' : 'Embed'}</span>
                  <span className="hidden sm:inline">{playerType === 'builtin' ? 'Built-in Player' : 'Embed Player'}</span>
                  <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isPlayerDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isPlayerDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsPlayerDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-32 sm:w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      <button
                        onClick={() => { setPlayerType('builtin'); setIsPlayerDropdownOpen(false); }}
                        className={`w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm transition-colors ${playerType === 'builtin' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300 hover:bg-zinc-800'}`}
                      >
                        Built-in Player
                      </button>
                      <button
                        onClick={() => { setPlayerType('embed'); setIsPlayerDropdownOpen(false); }}
                        className={`w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm transition-colors ${playerType === 'embed' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300 hover:bg-zinc-800'}`}
                      >
                        Embed Player
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Sub/Dub Switch */}
              <div className="flex items-center gap-1 sm:gap-2 bg-transparent px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-800/30 shrink-0">
                <span className={`text-[9px] sm:text-xs font-medium uppercase tracking-wider ${audioMode === 'sub' ? 'text-emerald-400' : 'text-zinc-500'}`}>Sub</span>
                <button 
                  disabled={!hasDub} 
                  onClick={() => setAudioMode(m => m === 'sub' ? 'dub' : 'sub')}
                  className={`w-6 h-3 sm:w-8 sm:h-4 rounded-full relative transition-colors [-webkit-tap-highlight-color:transparent] ${hasDub ? (audioMode === 'dub' ? 'bg-emerald-500' : 'bg-zinc-600') : 'bg-zinc-800 opacity-50 cursor-not-allowed'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white transition-transform ${audioMode === 'dub' ? 'translate-x-3 sm:translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className={`text-[9px] sm:text-xs font-medium uppercase tracking-wider ${audioMode === 'dub' ? 'text-emerald-400' : 'text-zinc-500'}`}>Dub</span>
              </div>
            </div>

            {/* Right Side: Prev, Next, AutoPlay */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handlePrevEpisode}
                disabled={!prevEpisode}
                className="p-1.5 sm:p-2 rounded-xl bg-transparent border border-zinc-800/30 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 [-webkit-tap-highlight-color:transparent]"
                title="Previous Episode"
              >
                <SkipBack className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleNextEpisode}
                disabled={!nextEpisode}
                className="p-1.5 sm:p-2 rounded-xl bg-transparent border border-zinc-800/30 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 [-webkit-tap-highlight-color:transparent]"
                title="Next Episode"
              >
                <SkipForward className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
              
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border transition-all text-[10px] sm:text-sm font-medium whitespace-nowrap active:scale-95 [-webkit-tap-highlight-color:transparent] ${
                  autoPlay 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-transparent border-zinc-800/30 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                }`}
              >
                {autoPlay ? <ToggleRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ToggleLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">Auto Play</span>
                <span className="sm:hidden">Auto</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fade effect below sticky components */}
        <div className="absolute top-full left-0 right-0 h-12 bg-gradient-to-b from-zinc-950/90 to-transparent pointer-events-none" />
      </div>

        {/* Title */}
        <div className="pt-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">
            {cleanTitle}
          </h1>
          <p className="text-zinc-400 font-medium mt-1 text-lg">
            Episode {currentEpisode?.episode || 'Unknown'}
          </p>
        </div>

        {/* Tabs */}
        <div className="pt-6">
          <div className="flex gap-6 border-b border-zinc-800 overflow-x-auto scrollbar-hide">
            {['overview', 'episodes', 'relation', 'recommended'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="py-6">
            {activeTab === 'overview' && (
              <div className="flex flex-col md:flex-row gap-8">
                <img src={info?.poster || passedPoster} alt={cleanTitle} className="w-48 md:w-64 rounded-xl shadow-2xl object-cover shrink-0" referrerPolicy="no-referrer" />
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {info?.score || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {info?.year || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {info?.status || 'N/A'}</span>
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">{info?.type || 'N/A'}</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {info?.synopsis || 'No synopsis available.'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'relation' && (
              <div className="text-zinc-400">
                <p>No relations found for this anime.</p>
              </div>
            )}

            {activeTab === 'recommended' && (
              <div className="text-zinc-400">
                <p>No recommendations available at this time.</p>
              </div>
            )}

            {activeTab === 'episodes' && (
              <div className="flex flex-col gap-3">
                {episodes.map((ep) => (
                  <Link
                    key={ep.id}
                    to={`/watch/${animeSession}/${ep.session}`}
                    className={`group flex flex-row items-center gap-4 bg-zinc-900/40 border rounded-xl p-2 sm:p-3 transition-all ${
                      ep.session === episodeSession 
                        ? 'border-emerald-500/50 bg-emerald-500/5' 
                        : 'border-zinc-800/50 hover:bg-zinc-800/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="relative w-28 sm:w-40 aspect-video rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                      <img
                        src={ep.snapshot}
                        alt={`Episode ${ep.episode}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Play className="w-8 h-8 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-row items-center justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <h3 className={`font-semibold text-sm sm:text-base line-clamp-1 transition-colors ${ep.session === episodeSession ? 'text-emerald-400' : 'text-zinc-200 group-hover:text-emerald-400'}`}>
                          Episode {ep.episode}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(ep.duration)}
                          </span>
                          <span className="hidden sm:inline">{new Date(ep.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => handleDownload(e, ep.session)}
                        className="p-2 sm:px-4 sm:py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 rounded-full sm:rounded-lg transition-all text-sm font-medium shadow-sm active:scale-95 shrink-0"
                        title="Download Episode"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </Link>
                ))}
                
                {hasMoreEpisodes && (
                  <div ref={observerTarget} className="py-4 flex justify-center">
                    {isLoadingMoreEpisodes && (
                      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download Overlay */}
      {isDownloading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          <p className="text-zinc-200 font-medium text-lg animate-pulse">Preparing download...</p>
        </div>
      )}
    </div>
  );
}
