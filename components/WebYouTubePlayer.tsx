import React, { useEffect, useRef } from 'react';

const WebYouTubePlayer: React.FC<{
  videoId: string;
  onProgress: () => void;
  onEnd?: () => void;
  height: number;
}> = ({ videoId, onProgress, onEnd, height }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const rewardedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Store callbacks in refs so the effect doesn't depend on them
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    rewardedRef.current = false;
    if (!wrapperRef.current) return;

    // Create a disposable child element for YT.Player to replace
    // This prevents React DOM conflicts since React only manages the wrapper
    const playerEl = document.createElement('div');
    wrapperRef.current.innerHTML = '';
    wrapperRef.current.appendChild(playerEl);

    const createPlayer = () => {
      playerRef.current = new (window as any).YT.Player(playerEl, {
        videoId: videoId,
        width: '100%',
        height: height,
        playerVars: { autoplay: 1 },
        events: {
          onReady: () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
              try {
                if (playerRef.current && playerRef.current.getCurrentTime && !rewardedRef.current) {
                  const currentTime = playerRef.current.getCurrentTime();
                  const duration = playerRef.current.getDuration();

                  if (duration > 0) {
                    const percentWatched = currentTime / duration;
                    console.log(`Web: Progress ${(percentWatched * 100).toFixed(1)}%`);

                    if (percentWatched >= 0.9) {
                      console.log('Web: 90% watched! Triggering reward...');
                      rewardedRef.current = true;
                      if (intervalRef.current) clearInterval(intervalRef.current);
                      onProgressRef.current();
                    }
                  }
                }
              } catch (e) {
                // Player may have been destroyed
                if (intervalRef.current) clearInterval(intervalRef.current);
              }
            }, 1000);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED === 0
            if (event.data === 0 && onEndRef.current) {
              onEndRef.current();
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch (e) { /* ignore */ }
        playerRef.current = null;
      }
      if (wrapperRef.current) wrapperRef.current.innerHTML = '';
    };
  }, [videoId, height]);

  return <div ref={wrapperRef as any} />;
};

export default WebYouTubePlayer;
