import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';
import { Play, Pause, FastForward, Rewind, SkipBack, SkipForward, Loader2, ChevronLeft } from 'lucide-react';

export const VideoPlayer = (props: { 
  options: any, 
  onReady?: (player: Player) => void, 
  onEnded?: () => void,
  onProgress?: (currentTime: number, duration: number) => void,
  onNext?: () => void,
  onPrev?: () => void,
  animeTitle?: string,
  episodeNumber?: string | number,
  initialTime?: number,
  isLoading?: boolean
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const { options, onReady, onEnded, onProgress, onNext, onPrev, animeTitle, episodeNumber, initialTime, isLoading } = props;
  
  const [playerElement, setPlayerElement] = useState<HTMLDivElement | null>(null);
  const [showFeedback, setShowFeedback] = useState<'play' | 'pause' | 'forward' | 'rewind' | null>(null);
  const [isUserActive, setIsUserActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const feedbackTimeout = useRef<any>(null);
  const lastTap = useRef<number>(0);
  const tapTimeout = useRef<any>(null);
  const lastProgressTime = useRef<number>(0);

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered', 'vjs-modern-skin');
      videoRef.current?.appendChild(videoElement);

      const mergedOptions = {
        ...options,
        inactivityTimeout: 3000,
        controlBar: {
          pictureInPictureToggle: false,
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'progressControl',
            'remainingTimeDisplay',
            'fullscreenToggle'
          ]
        }
      };

      const player = playerRef.current = videojs(videoElement, mergedOptions, () => {
        setPlayerElement(videoElement as HTMLDivElement);
        // Remove tooltips (title attributes)
        const removeTitles = () => {
          if (!videoRef.current) return;
          const elements = videoRef.current.querySelectorAll('[title]');
          elements.forEach(el => el.removeAttribute('title'));
        };
        
        removeTitles();
        player.on('play', removeTitles);
        player.on('pause', removeTitles);
        player.on('volumechange', removeTitles);
        player.on('fullscreenchange', () => {
          const isFS = player.isFullscreen();
          setIsFullscreen(isFS);
          removeTitles();

          // Lock to landscape on mobile when entering fullscreen
          const orientation = (screen as any).orientation;
          if (isFS && orientation && orientation.lock) {
            orientation.lock('landscape').catch((err: any) => {
              console.log('Orientation lock failed:', err);
            });
          } else if (!isFS && orientation && orientation.unlock) {
            orientation.unlock();
          }
        });
        player.on('useractive', () => setIsUserActive(true));
        player.on('userinactive', () => setIsUserActive(false));
        player.on('ended', () => {
          if (onEnded) onEnded();
        });

        player.on('timeupdate', () => {
          if (onProgress) {
            const currentTime = player.currentTime();
            const duration = player.duration();
            // Throttle progress updates to every 5 seconds
            if (Math.abs(currentTime - lastProgressTime.current) > 5) {
              onProgress(currentTime, duration);
              lastProgressTime.current = currentTime;
            }
          }
        });

        player.on('loadedmetadata', () => {
          if (initialTime && initialTime > 0) {
            player.currentTime(initialTime);
          }
        });

        onReady && onReady(player);
      });
    } else {
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      player.src(options.sources);
      player.hasStarted(false);
    }
  }, [options, videoRef]);

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  const triggerFeedback = (type: 'play' | 'pause' | 'forward' | 'rewind') => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    setShowFeedback(type);
    feedbackTimeout.current = setTimeout(() => setShowFeedback(null), 500);
  };

  const handleTouch = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const player = playerRef.current;
    if (!player) return;

    // Get click position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const width = rect.width;

    if (!player.hasStarted()) {
      player.play();
      return;
    }

    const wasActive = player.userActive();

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      
      if (x < width * 0.3) {
        // Left side - Rewind
        player.currentTime(Math.max(0, player.currentTime() - 10));
        triggerFeedback('rewind');
      } else if (x > width * 0.7) {
        // Right side - Forward
        player.currentTime(Math.min(player.duration(), player.currentTime() + 10));
        triggerFeedback('forward');
      } else {
        // Center - Play/Pause
        if (player.paused()) {
          player.play();
          triggerFeedback('play');
        } else {
          player.pause();
          triggerFeedback('pause');
        }
      }
      lastTap.current = 0;
    } else {
      // Single tap potential
      lastTap.current = now;
      tapTimeout.current = setTimeout(() => {
        // Toggle controls based on state when tap started
        if (player.controls()) {
          player.userActive(!wasActive);
        }
        lastTap.current = 0;
      }, DOUBLE_TAP_DELAY);
    }
  };

  return (
    <div data-vjs-player className="absolute inset-0 w-full h-full bg-black group">
      <div ref={videoRef} className="w-full h-full" />
      
      {playerElement && createPortal(
        <>
          {/* Gesture Overlay */}
          <div 
            className="absolute inset-x-0 top-0 bottom-[50px] z-10 cursor-pointer [-webkit-tap-highlight-color:transparent]"
            onClick={handleTouch}
          >
            {/* Top Controls Overlay - Only show in fullscreen */}
            <div className={`absolute top-0 inset-x-0 p-4 flex items-start justify-between transition-all duration-500 z-20 ${isLoading ? 'opacity-0' : (isUserActive && isFullscreen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none')}`}>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (playerRef.current?.isFullscreen()) {
                      playerRef.current.exitFullscreen();
                    } else {
                      window.history.back();
                    }
                  }}
                  className="p-1.5 rounded-full bg-transparent border border-white/10 text-white hover:bg-emerald-500/20 transition-all active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                    disabled={!onPrev}
                    className="p-1.5 rounded-full bg-transparent border border-white/10 text-white hover:bg-emerald-500/20 transition-all disabled:opacity-0 active:scale-95"
                  >
                    <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  {(animeTitle || episodeNumber) && (
                    <div className="flex flex-col drop-shadow-lg ml-0.5">
                      <span className="text-white font-bold text-xs sm:text-base line-clamp-1 max-w-[180px] sm:max-w-[400px]">
                        {animeTitle}
                      </span>
                      {episodeNumber && (
                        <span className="text-emerald-400 font-medium text-[9px] sm:text-xs">
                          Episode {episodeNumber}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                disabled={!onNext}
                className="p-2 rounded-full bg-transparent border border-white/10 text-white hover:bg-emerald-500/20 transition-all disabled:opacity-0 active:scale-95"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <p className="text-zinc-300 font-medium animate-pulse">Loading Source...</p>
              </div>
            )}

            {/* Feedback Icons */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Center Play/Pause */}
              <div className="absolute inset-0 flex items-center justify-center">
                {showFeedback === 'play' && (
                  <Play className="w-16 h-16 text-white opacity-50 animate-scale-out" />
                )}
                {showFeedback === 'pause' && (
                  <Pause className="w-16 h-16 text-white opacity-50 animate-scale-out" />
                )}
              </div>
              {/* Left Rewind */}
              <div className="absolute inset-y-0 left-12 flex items-center justify-center">
                {showFeedback === 'rewind' && (
                  <div className="flex flex-col items-center animate-scale-out opacity-50 text-white">
                    <Rewind className="w-8 h-8" />
                    <span className="text-xs font-bold mt-1">-10s</span>
                  </div>
                )}
              </div>
              {/* Right Forward */}
              <div className="absolute inset-y-0 right-12 flex items-center justify-center">
                {showFeedback === 'forward' && (
                  <div className="flex flex-col items-center animate-scale-out opacity-50 text-white">
                    <FastForward className="w-8 h-8" />
                    <span className="text-xs font-bold mt-1">+10s</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>,
        playerElement
      )}

      <style>{`
        /* Minimal Skin Overrides */
        .vjs-modern-skin .vjs-big-play-button {
          background-color: rgba(16, 185, 129, 0.4) !important;
          backdrop-blur: blur(4px) !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
          border-radius: 50% !important;
          width: 80px !important;
          height: 80px !important;
          line-height: 80px !important;
          margin-top: -40px !important;
          margin-left: -40px !important;
          transition: all 0.3s ease-in-out !important;
        }
        
        .vjs-modern-skin:hover .vjs-big-play-button {
          background-color: rgba(16, 185, 129, 0.6) !important;
          transform: scale(1.1) !important;
          border-color: rgba(16, 185, 129, 0.5) !important;
        }

        .vjs-modern-skin.vjs-has-started .vjs-big-play-button {
          opacity: 0 !important;
          visibility: hidden !important;
        }
        
        .vjs-modern-skin .vjs-control-bar {
          background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%) !important;
          height: 60px !important;
          padding: 0 20px !important;
          display: flex !important;
          align-items: center !important;
          transition: opacity 0.3s ease-in, visibility 0.3s ease-in !important;
        }

        .vjs-modern-skin.vjs-user-inactive .vjs-control-bar {
          opacity: 0 !important;
          visibility: hidden !important;
          transition: opacity 0.5s ease-out, visibility 0.5s ease-out !important;
        }

        .vjs-modern-skin.vjs-user-active .vjs-control-bar {
          opacity: 1 !important;
          visibility: visible !important;
          transition: opacity 0.3s ease-in, visibility 0.3s ease-in !important;
        }

        /* Time Displays */
        .vjs-modern-skin .vjs-current-time,
        .vjs-modern-skin .vjs-remaining-time {
          display: flex !important;
          align-items: center !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          padding: 0 12px !important;
          color: #e4e4e7 !important;
        }

        /* Progress Bar */
        .vjs-modern-skin .vjs-progress-control {
          flex: 1 !important;
          display: flex !important;
          align-items: center !important;
          min-width: 0 !important;
        }

        .vjs-modern-skin .vjs-progress-holder {
          height: 4px !important;
          margin: 0 !important;
          border-radius: 4px !important;
          transition: height 0.2s ease !important;
        }

        .vjs-modern-skin .vjs-progress-control:hover .vjs-progress-holder {
          height: 6px !important;
        }

        .vjs-modern-skin .vjs-slider {
          background-color: rgba(255,255,255,0.2) !important;
          border-radius: 4px !important;
        }

        .vjs-modern-skin .vjs-play-progress {
          background-color: #10b981 !important;
          border-radius: 4px !important;
        }
        
        .vjs-modern-skin .vjs-play-progress:before {
          color: #10b981 !important;
          font-size: 14px !important;
          top: 50% !important;
          transform: translateY(-50%) scale(0) !important;
          transition: transform 0.2s ease !important;
        }

        .vjs-modern-skin .vjs-progress-control:hover .vjs-play-progress:before {
          transform: translateY(-50%) scale(1) !important;
        }

        .vjs-modern-skin .vjs-load-progress {
          background-color: rgba(255,255,255,0.1) !important;
          border-radius: 4px !important;
        }

        /* Buttons */
        .vjs-modern-skin .vjs-button > .vjs-icon-placeholder:before {
          font-size: 1.5em !important;
          line-height: 50px !important;
        }

        /* Hide default tooltips */
        .vjs-modern-skin .vjs-control-text {
          display: none !important;
        }
        
        @keyframes ping-once {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping-once {
          animation: ping-once 0.5s ease-out forwards;
        }
        
        @keyframes scale-out {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-scale-out {
          animation: scale-out 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
