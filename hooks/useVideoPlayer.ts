import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Video, videos } from '../data/videos';

export type VideoFilter = 'All' | 'Music Video' | 'Dance Practice' | 'SUPER ILLIT' | 'Misc' | 'Watched' | 'Unwatched' | 'Favorites';

interface VideoReward {
  video: Video;
  secondsWatched: number;
}

interface UseVideoPlayerParams {
  watchedVideos: Record<string, number>;
  favoriteVideos: Record<string, boolean>;
  selectedVideoFilter: VideoFilter;
  onVideoReward: (reward: VideoReward) => void;
}

export function useVideoPlayer({
  watchedVideos,
  favoriteVideos,
  selectedVideoFilter,
  onVideoReward,
}: UseVideoPlayerParams) {
  const { user } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasRewarded, setHasRewarded] = useState(false);
  const [autoPlayQueue, setAutoPlayQueue] = useState<Video[]>([]);
  const [playHistory, setPlayHistory] = useState<Video[]>([]);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const queueSourceRef = useRef<{ getList: () => Video[]; shuffle: boolean }>({
    getList: () => videos,
    shuffle: false,
  });

  // Reset player state when user signs out
  useEffect(() => {
    if (!user) {
      setAutoPlayEnabled(false);
      setSelectedVideo(null);
      setIsVideoPlaying(false);
      setAutoPlayQueue([]);
      setPlayHistory([]);
    }
  }, [user]);

  const getFilteredVideos = (): Video[] => {
    switch (selectedVideoFilter) {
      case 'All': return videos;
      case 'Watched': return videos.filter(v => watchedVideos[v.id]);
      case 'Unwatched': return videos.filter(v => !watchedVideos[v.id]);
      case 'Favorites': return videos.filter(v => favoriteVideos[v.id]);
      case 'Music Video':
      case 'Dance Practice':
      case 'SUPER ILLIT':
      case 'Misc':
        return videos.filter(v => v.category === selectedVideoFilter);
      default: return videos;
    }
  };

  const getUnwatchedOrdered = (): Video[] => {
    const unwatched = videos.filter(v => !watchedVideos[v.id]);
    const list = unwatched.length > 0 ? unwatched : videos;
    const musicVideos = list.filter(v => v.category === 'Music Video');
    const others = list.filter(v => v.category !== 'Music Video');
    return [...musicVideos, ...others];
  };

  const getFreshQueueList = (): Video[] => {
    let list = queueSourceRef.current.getList();
    if (queueSourceRef.current.shuffle) {
      list = [...list];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return list;
  };

  const handleVideoPress = (video: Video) => {
    const gridVideos = getFilteredVideos();
    const index = gridVideos.findIndex(v => v.id === video.id);
    setPlayHistory(index > 0 ? gridVideos.slice(0, index) : []);
    setAutoPlayQueue(index < gridVideos.length - 1 ? gridVideos.slice(index + 1) : []);
    queueSourceRef.current = { getList: getFilteredVideos, shuffle: false };
    setSelectedVideo(video);
    setIsVideoPlaying(true);
    setHasRewarded(false);
  };

  const handleVideoComplete = (percentageWatched: number = 0.9) => {
    if (!selectedVideo || hasRewarded) return;
    setHasRewarded(true);
    const secondsWatched = Math.floor(selectedVideo.duration * percentageWatched);
    onVideoReward({ video: selectedVideo, secondsWatched });
    console.log(`Awarded ${secondsWatched} XP (${(percentageWatched * 100).toFixed(0)}% watched)!`);
  };

  const handleVideoEnd = () => {
    if (autoPlayEnabled && (autoPlayQueue.length > 0 || playHistory.length > 0)) {
      handleVideoNext();
    }
  };

  const handleVideoPrev = () => {
    if (playHistory.length > 0) {
      const prev = playHistory[playHistory.length - 1];
      setPlayHistory(playHistory.slice(0, -1));
      if (selectedVideo) setAutoPlayQueue([selectedVideo, ...autoPlayQueue]);
      setSelectedVideo(prev);
      setHasRewarded(false);
      return;
    }
    const freshList = getFreshQueueList();
    if (freshList.length === 0) return;
    const prev = freshList[freshList.length - 1];
    setPlayHistory(freshList.slice(0, -1));
    setAutoPlayQueue([]);
    setSelectedVideo(prev);
    setHasRewarded(false);
  };

  const handleVideoNext = () => {
    if (autoPlayQueue.length > 0) {
      const [nextVideo, ...rest] = autoPlayQueue;
      if (selectedVideo) setPlayHistory([...playHistory, selectedVideo]);
      setAutoPlayQueue(rest);
      setSelectedVideo(nextVideo);
      setHasRewarded(false);
      return;
    }
    const freshList = getFreshQueueList();
    if (freshList.length === 0) return;
    const [nextVideo, ...rest] = freshList;
    setPlayHistory([]);
    setAutoPlayQueue(rest);
    setSelectedVideo(nextVideo);
    setHasRewarded(false);
  };

  const handleVideoExit = () => {
    setSelectedVideo(null);
    setIsVideoPlaying(false);
    setAutoPlayQueue([]);
    setPlayHistory([]);
  };

  const handleAutoPlay = () => {
    const ordered = getUnwatchedOrdered();
    if (ordered.length === 0) return;
    const [first, ...rest] = ordered;
    setAutoPlayQueue(rest);
    setPlayHistory([]);
    queueSourceRef.current = { getList: getUnwatchedOrdered, shuffle: false };
    setSelectedVideo(first);
    setIsVideoPlaying(true);
    setHasRewarded(false);
    setAutoPlayEnabled(true);
  };

  const handleShufflePlay = () => {
    const ordered = getUnwatchedOrdered();
    if (ordered.length === 0) return;
    const shuffled = [...ordered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const [first, ...rest] = shuffled;
    setAutoPlayQueue(rest);
    setPlayHistory([]);
    queueSourceRef.current = { getList: getUnwatchedOrdered, shuffle: true };
    setSelectedVideo(first);
    setIsVideoPlaying(true);
    setHasRewarded(false);
    setAutoPlayEnabled(true);
  };

  const handlePlayFiltered = () => {
    const filtered = getFilteredVideos();
    if (filtered.length === 0) return;
    const [first, ...rest] = filtered;
    setAutoPlayQueue(rest);
    setPlayHistory([]);
    queueSourceRef.current = { getList: getFilteredVideos, shuffle: false };
    setSelectedVideo(first);
    setIsVideoPlaying(true);
    setHasRewarded(false);
    setAutoPlayEnabled(true);
  };

  const handleShuffleFiltered = () => {
    const filtered = getFilteredVideos();
    if (filtered.length === 0) return;
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const [first, ...rest] = shuffled;
    setAutoPlayQueue(rest);
    setPlayHistory([]);
    queueSourceRef.current = { getList: getFilteredVideos, shuffle: true };
    setSelectedVideo(first);
    setIsVideoPlaying(true);
    setHasRewarded(false);
    setAutoPlayEnabled(true);
  };

  return {
    selectedVideo,
    isVideoPlaying,
    hasRewarded,
    autoPlayQueue,
    playHistory,
    autoPlayEnabled,
    setAutoPlayEnabled,
    getFilteredVideos,
    handleVideoPress,
    handleVideoComplete,
    handleVideoEnd,
    handleVideoPrev,
    handleVideoNext,
    handleVideoExit,
    handleAutoPlay,
    handleShufflePlay,
    handlePlayFiltered,
    handleShuffleFiltered,
  };
}
