import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { getMemberPhoto } from '../assets/images/members';
import DevTools from '../components/DevTools';
import { useAuth } from '../contexts/AuthContext';
import { PhotoCard, photoCardData } from '../data/photoCards';
import { Video, videos } from '../data/videos';
import { loadGameData, saveGameData } from '../services/firestoreService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Card sizing constants
const NUM_CARDS = 5;
const SPACING_RATIO = 0.1; // 10% spacing between cards (increased for better visual separation)

// Helper function to calculate card dimensions based on screen width
const calculateCardDimensions = (screenWidth: number) => {
  // Responsive margins: smaller on mobile, larger on desktop
  // Mobile (<768px): 20px total margin
  // Tablet (768-1024px): 40px + extra based on width
  // Desktop (>1024px): Enough margin so cards don't exceed max width
  let sideMargin = 20;
  if (screenWidth > 1024) {
    // On desktop, calculate margin to center cards at max width
    const maxCardWidth = 180;
    const maxTotalCardWidth = (maxCardWidth * NUM_CARDS) + (maxCardWidth * SPACING_RATIO * (NUM_CARDS - 1));
    if (screenWidth > maxTotalCardWidth + 100) {
      // Add substantial margins on desktop
      sideMargin = Math.max(100, (screenWidth - maxTotalCardWidth) * 0.3);
    } else {
      sideMargin = 60;
    }
  } else if (screenWidth > 768) {
    sideMargin = 40;
  }

  // Total available width for cards
  const availableWidth = screenWidth - sideMargin;
  // Calculate: availableWidth = NUM_CARDS * cardWidth + (NUM_CARDS - 1) * (cardWidth * SPACING_RATIO)
  // Simplify: availableWidth = cardWidth * (NUM_CARDS + (NUM_CARDS - 1) * SPACING_RATIO)
  const cardWidth = availableWidth / (NUM_CARDS + (NUM_CARDS - 1) * SPACING_RATIO);
  // Cap at reasonable min/max values
  const finalCardWidth = Math.min(Math.max(cardWidth, 50), 180);
  const finalCardHeight = (finalCardWidth / 180) * 240; // keep aspect ratio
  return { width: finalCardWidth, height: finalCardHeight, margin: sideMargin };
};

// Background images
const BACKGROUNDS: { id: string; name: string; source: any }[] = [
  { id: 'japanese-classroom', name: 'Japanese Classroom', source: require('../assets/images/japaneseclassroomcreduJamoues.webp') },
];

// Game configuration - easy to tweak
const GAME_CONFIG = {
  XP_PER_VIDEO: 50,
  XP_PER_LEVEL: 200,
};

// Character data - replace with actual images later
const initialCharacters = [
  { id: 'yunah', name: 'Yunah', level: 1, xp: 0, color: '#FF6B9D', selectedPhotoCard: 'yunah-misc-1' },
  { id: 'minju', name: 'Minju', level: 1, xp: 0, color: '#C084FC', selectedPhotoCard: 'minju-misc-1' },
  { id: 'moka', name: 'Moka', level: 1, xp: 0, color: '#60A5FA', selectedPhotoCard: 'moka-misc-1' },
  { id: 'wonhee', name: 'Wonhee', level: 1, xp: 0, color: '#34D399', selectedPhotoCard: 'wonhee-misc-1' },
  { id: 'iroha', name: 'Iroha', level: 1, xp: 0, color: '#FBBF24', selectedPhotoCard: 'iroha-misc-1' },
];

// Web-specific YouTube Player Component
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

    // Check if the YouTube IFrame API is already loaded
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
      // Clear the wrapper contents safely
      if (wrapperRef.current) wrapperRef.current.innerHTML = '';
    };
  }, [videoId, height]);

  return <div ref={wrapperRef as any} />;
};

interface Position {
  x: number;
  y: number;
}

interface CharacterCardProps {
  character: typeof initialCharacters[0];
  position: Position;
  onPress: () => void;
  showPhotos: boolean;
  cardWidth: number;
  cardHeight: number;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  position,
  onPress,
  showPhotos,
  cardWidth,
  cardHeight
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  // Get the current photo card data to check for image
  const getCurrentPhotoCard = (): PhotoCard | undefined => {
    const characterCards = photoCardData[character.id];
    if (!characterCards) return undefined;

    for (const era of characterCards) {
      const card = era.cards.find(c => c.id === character.selectedPhotoCard);
      if (card) return card;
    }
    return undefined;
  };

  const currentCard = getCurrentPhotoCard();

  // Get local image for this character's photo card
  const localImage = getMemberPhoto(
    character.id as 'yunah' | 'minju' | 'moka' | 'wonhee' | 'iroha',
    character.selectedPhotoCard
  );

  const handlePress = () => {
    // Animate press feedback
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: false,
      }),
    ]).start();
    
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[
        styles.cardContainer,
        {
          left: position.x,
          top: position.y,
          width: cardWidth,
          height: cardHeight,
        },
      ]}
    >
      <LinearGradient
        colors={[character.color, '#1a1a2e']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Character image or placeholder */}
        {showPhotos && (localImage || currentCard?.imageUrl) ? (
          <Image
            source={localImage || { uri: currentCard?.imageUrl || '' }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>{character.name[0]}</Text>
          </View>
        )}

        {/* Character info overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.infoOverlay}
        >
          <Text style={[
            styles.characterName,
            {
              fontSize: Math.max(12, cardWidth * 0.1),
            }
          ]}>{character.name}</Text>
          <View style={styles.levelContainer}>
            <Text style={[
              styles.levelText,
              {
                fontSize: Math.max(10, cardWidth * 0.067),
              }
            ]}>LVL {character.level}</Text>
            <View style={styles.xpBar}>
              <View
                style={[
                  styles.xpFill,
                  {
                    width: `${((character.xp % GAME_CONFIG.XP_PER_LEVEL) / GAME_CONFIG.XP_PER_LEVEL) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
          <Text style={[
            styles.xpText,
            {
              fontSize: Math.max(8, cardWidth * 0.056),
            }
          ]}>
            {character.xp % GAME_CONFIG.XP_PER_LEVEL}/{GAME_CONFIG.XP_PER_LEVEL} XP
          </Text>
        </LinearGradient>

        {/* Glow effect */}
        <View style={[styles.glow, { backgroundColor: character.color }]} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [characters, setCharacters] = useState(initialCharacters);
  const [selectedCharacter, setSelectedCharacter] = useState<typeof initialCharacters[0] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasRewarded, setHasRewarded] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState<Record<string, number>>({});
  const [selectedVideoFilter, setSelectedVideoFilter] = useState<'All' | 'Music Video' | 'Dance Practice' | 'SUPER ILLIT' | 'Misc' | 'Watched' | 'Unwatched' | 'Favorites'>('All');
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [collectionTab, setCollectionTab] = useState<'background' | 'yunah' | 'minju' | 'moka' | 'wonhee' | 'iroha'>('background');
  const [autoPlayQueue, setAutoPlayQueue] = useState<Video[]>([]);
  const [playHistory, setPlayHistory] = useState<Video[]>([]);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [favoriteVideos, setFavoriteVideos] = useState<Record<string, boolean>>({});
  const [selectedBackground, setSelectedBackground] = useState<string>('japanese-classroom');

  // Dynamic card dimensions based on screen width
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const cardDimensions = calculateCardDimensions(screenDimensions.width);
  const CARD_WIDTH = cardDimensions.width;
  const CARD_HEIGHT = cardDimensions.height;
  const SIDE_MARGIN = cardDimensions.margin;

  const cardPositions = useRef<Position[]>([]);
  const hasLoadedData = useRef(false);
  // Remembers how the queue was built so loops can re-evaluate the source list
  const queueSourceRef = useRef<{ getList: () => Video[], shuffle: boolean }>({
    getList: () => videos,
    shuffle: false,
  });

  // Listen for dimension changes (orientation changes, browser resize, etc.)
  useEffect(() => {
    // React Native Dimensions listener (for mobile orientation changes)
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    // Web-specific window resize listener
    const handleResize = () => {
      const newDimensions = Dimensions.get('window');
      setScreenDimensions(newDimensions);
    };

    if (Platform.OS === 'web') {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      subscription?.remove();
      if (Platform.OS === 'web') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Set layout ready after mount to prevent flash of mispositioned cards
  useEffect(() => {
    // Small delay to ensure screen dimensions are calculated
    const timer = setTimeout(() => {
      setLayoutReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Load game data when user signs in
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const gameData = await loadGameData(user.uid);
          if (gameData) {
            setCharacters(gameData.characters);
            setShowPhotos(gameData.showPhotos);

            // Handle migration from old array format to new object format
            let watchedVideosData: Record<string, number> = {};
            if (gameData.watchedVideos) {
              if (Array.isArray(gameData.watchedVideos)) {
                // Migrate from old array format
                gameData.watchedVideos.forEach((videoId: string) => {
                  watchedVideosData[videoId] = Date.now();
                });
              } else {
                // Already in new object format
                watchedVideosData = gameData.watchedVideos;
              }
            }
            setWatchedVideos(watchedVideosData);

            if (gameData.favoriteVideos) {
              setFavoriteVideos(gameData.favoriteVideos);
            }
            if (gameData.selectedBackground) {
              setSelectedBackground(gameData.selectedBackground);
            }

            console.log('Loaded game data for user:', user.email);
          } else {
            // New user with no saved data - reset to defaults
            setCharacters(initialCharacters);
            setShowPhotos(false);
            setWatchedVideos({});
            setFavoriteVideos({});
            setSelectedBackground('japanese-classroom');
            console.log('No saved data found, starting fresh');
          }
          hasLoadedData.current = true;
        } catch (error) {
          console.error('Error loading game data:', error);
          hasLoadedData.current = true;
        }
      } else {
        // User signed out, reset to guest defaults
        hasLoadedData.current = false;
        setCharacters(initialCharacters);
        setShowPhotos(false);
        setWatchedVideos({});
        setFavoriteVideos({});
        setSelectedBackground('japanese-classroom');
        setAutoPlayEnabled(false);
        setSelectedVideo(null);
        setIsVideoPlaying(false);
        setAutoPlayQueue([]);
        setPlayHistory([]);
      }
    };

    loadUserData();
  }, [user]);

  // Save game data when characters, photos, or watched videos change
  useEffect(() => {
    const saveUserData = async () => {
      // Only save if user is signed in AND we've loaded their data
      if (user && hasLoadedData.current) {
        try {
          await saveGameData(user.uid, {
            characters,
            showPhotos,
            watchedVideos,
            favoriteVideos,
            selectedBackground,
            lastUpdated: Date.now(),
          });
          console.log('Game data saved for user:', user.email);
        } catch (error) {
          console.error('Error saving game data:', error);
        }
      }
    };

    saveUserData();
  }, [characters, showPhotos, watchedVideos, favoriteVideos, selectedBackground, user]);

  // Calculate fixed slot positions in a horizontal row
  const getSlotPosition = (index: number, total: number): Position => {
    const spacing = CARD_WIDTH * SPACING_RATIO;
    const totalWidth = (CARD_WIDTH + spacing) * total - spacing;
    // Center the cards, ensuring they stay within screen bounds
    const startX = Math.max((screenDimensions.width - totalWidth) / 2, SIDE_MARGIN / 2);
    const centerY = screenDimensions.height / 2 - CARD_HEIGHT / 2;

    return {
      x: startX + (CARD_WIDTH + spacing) * index,
      y: centerY,
    };
  };

  // Recalculate card positions when dimensions or card count changes
  // Use a stable key based on dimensions and character count to force recalculation
  const positionKey = `${screenDimensions.width}-${screenDimensions.height}-${characters.length}`;
  const currentKey = useRef<string>('');

  if (currentKey.current !== positionKey) {
    cardPositions.current = characters.map((_, i) =>
      getSlotPosition(i, characters.length)
    );
    currentKey.current = positionKey;
  }

  const handleCardPress = (character: typeof initialCharacters[0]) => {
    setSelectedCharacter(character);
    setModalVisible(true);
  };

  const handlePhotoCardSelect = (photoCardId: string, characterId?: string) => {
    const targetId = characterId || selectedCharacter?.id;
    if (!targetId) return;

    const updatedCharacters = characters.map(char =>
      char.id === targetId
        ? { ...char, selectedPhotoCard: photoCardId }
        : char
    );
    setCharacters(updatedCharacters);
    if (!characterId) setModalVisible(false);
  };

  const handleVideoComplete = (percentageWatched: number = 0.9) => {
    if (!selectedVideo || hasRewarded) return;

    // Mark as rewarded to prevent duplicate rewards
    setHasRewarded(true);

    // Calculate XP based on watch time (1 XP per second)
    const secondsWatched = Math.floor(selectedVideo.duration * percentageWatched);
    const xpEarned = secondsWatched; // 1 XP per second

    // Add video to watched map if not already watched
    if (!watchedVideos[selectedVideo.id]) {
      setWatchedVideos({
        ...watchedVideos,
        [selectedVideo.id]: Date.now(), // Store timestamp when watched
      });
      console.log(`Unlocked photo cards for video: ${selectedVideo.id}`);
    }

    // Award XP to all characters based on watch time
    const updatedCharacters = characters.map(char => {
      const newXP = char.xp + xpEarned;
      const newLevel = Math.floor(newXP / GAME_CONFIG.XP_PER_LEVEL) + 1;

      return {
        ...char,
        xp: newXP,
        level: newLevel,
      };
    });

    setCharacters(updatedCharacters);
    console.log(`Awarded ${xpEarned} XP (${secondsWatched}s watched) to all characters!`);
  };

  const handleVideoEnd = () => {
    if (autoPlayEnabled && (autoPlayQueue.length > 0 || playHistory.length > 0)) {
      handleVideoNext();
    }
  };

  const toggleFavorite = (videoId: string) => {
    setFavoriteVideos(prev => {
      const updated = { ...prev };
      if (updated[videoId]) {
        delete updated[videoId];
      } else {
        updated[videoId] = true;
      }
      return updated;
    });
  };

  const handleVideoPress = (video: Video) => {
    // Build queue from the current grid order so back/next navigate through all videos
    const gridVideos = getFilteredVideos();
    const index = gridVideos.findIndex(v => v.id === video.id);
    setPlayHistory(index > 0 ? gridVideos.slice(0, index) : []);
    setAutoPlayQueue(index < gridVideos.length - 1 ? gridVideos.slice(index + 1) : []);
    queueSourceRef.current = { getList: getFilteredVideos, shuffle: false };
    setSelectedVideo(video);
    setIsVideoPlaying(true);
    setHasRewarded(false); // Reset reward flag for new video
  };

  // Regenerate a fresh list from the queue source (for looping)
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

  // Go back to previous video in history (loops via fresh source list if at start)
  const handleVideoPrev = () => {
    if (playHistory.length > 0) {
      const prev = playHistory[playHistory.length - 1];
      setPlayHistory(playHistory.slice(0, -1));
      if (selectedVideo) {
        setAutoPlayQueue([selectedVideo, ...autoPlayQueue]);
      }
      setSelectedVideo(prev);
      setHasRewarded(false);
      return;
    }
    // Loop: regenerate from source and go to last video
    const freshList = getFreshQueueList();
    if (freshList.length === 0) return;
    const prev = freshList[freshList.length - 1];
    setPlayHistory(freshList.slice(0, -1));
    setAutoPlayQueue([]);
    setSelectedVideo(prev);
    setHasRewarded(false);
  };

  // Skip to next video in queue (loops via fresh source list if at end)
  const handleVideoNext = () => {
    if (autoPlayQueue.length > 0) {
      const [nextVideo, ...rest] = autoPlayQueue;
      if (selectedVideo) {
        setPlayHistory([...playHistory, selectedVideo]);
      }
      setAutoPlayQueue(rest);
      setSelectedVideo(nextVideo);
      setHasRewarded(false);
      return;
    }
    // Loop: regenerate from source and go to first video
    const freshList = getFreshQueueList();
    if (freshList.length === 0) return;
    const [nextVideo, ...rest] = freshList;
    setPlayHistory([]);
    setAutoPlayQueue(rest);
    setSelectedVideo(nextVideo);
    setHasRewarded(false);
  };

  // Fully close the player and return to main menu
  const handleVideoExit = () => {
    setSelectedVideo(null);
    setIsVideoPlaying(false);
    setAutoPlayQueue([]);
    setPlayHistory([]);
  };

  // Get unwatched videos ordered: music videos first, then others.
  // Falls back to all videos if everything has been watched.
  const getUnwatchedOrdered = (): Video[] => {
    const unwatched = videos.filter(v => !watchedVideos[v.id]);
    const list = unwatched.length > 0 ? unwatched : videos;
    const musicVideos = list.filter(v => v.category === 'Music Video');
    const others = list.filter(v => v.category !== 'Music Video');
    return [...musicVideos, ...others];
  };

  // Auto-play unwatched videos in order
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

  // Shuffle play unwatched videos
  const handleShufflePlay = () => {
    const ordered = getUnwatchedOrdered();
    if (ordered.length === 0) return;
    // Fisher-Yates shuffle
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

  const isPhotoCardUnlocked = (photoCard: PhotoCard, characterLevel: number): boolean => {
    switch (photoCard.unlockType) {
      case 'default':
        return true;
      case 'video':
        // Check if the required video has been watched (O(1) lookup)
        return !!watchedVideos[photoCard.unlockRequirement as string];
      case 'level':
        return characterLevel >= (photoCard.unlockRequirement as number);
      case 'purchase':
        return false;
      case 'exclusive':
        return false;
      case 'event':
        return false;
      default:
        return false;
    }
  };

  const getUnlockText = (photoCard: PhotoCard): string => {
    switch (photoCard.unlockType) {
      case 'video':
        // Find the video title for better UX
        const video = videos.find(v => v.id === photoCard.unlockRequirement);
        return video ? `Watch: ${video.title}` : 'Watch a video to unlock';
      case 'level':
        return `Unlock at Level ${photoCard.unlockRequirement}`;
      case 'purchase':
        return 'Available for Purchase';
      case 'exclusive':
        return 'Exclusive Reward';
      case 'event':
        return 'Limited Event Reward';
      default:
        return 'Locked';
    }
  };

  // Filter videos based on selected tab
  const getFilteredVideos = () => {
    switch (selectedVideoFilter) {
      case 'All':
        return videos;
      case 'Watched':
        return videos.filter(v => watchedVideos[v.id]);
      case 'Unwatched':
        return videos.filter(v => !watchedVideos[v.id]);
      case 'Favorites':
        return videos.filter(v => favoriteVideos[v.id]);
      case 'Music Video':
      case 'Dance Practice':
      case 'SUPER ILLIT':
      case 'Misc':
        return videos.filter(v => v.category === selectedVideoFilter);
      default:
        return videos;
    }
  };


  return (
    <View style={styles.container}>
      {/* Animated background */}
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={styles.background}
      />
      {showPhotos && selectedBackground && (() => {
        const bg = BACKGROUNDS.find(b => b.id === selectedBackground);
        return bg ? (
          <Image source={bg.source} style={styles.backgroundImage} resizeMode="cover" />
        ) : null;
      })()}

      {/* Floating particles effect */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              },
            ]}
          />
        ))}
      </View>

      {/* Title */}
      <View style={styles.header}>
        <Text style={[
          styles.title,
          {
            fontSize: Math.max(20, Math.min(48, screenDimensions.width * 0.065)),
            letterSpacing: Math.max(0.5, Math.min(4, screenDimensions.width * 0.005)),
          }
        ]}>ILLIT WORLD</Text>
      </View>

      {/* Photo Toggle Button - Top Left */}
      <TouchableOpacity
        style={styles.topLeftToggle}
        onPress={() => setShowPhotos(!showPhotos)}
      >
        <Text style={styles.toggleIconText}>
          {showPhotos ? '🖼️' : '🎨'}
        </Text>
      </TouchableOpacity>

      {/* Auth Button - Top Right */}
      <TouchableOpacity
        style={styles.authButton}
        onPress={user ? undefined : signInWithGoogle}
        disabled={!!user}
      >
        <Text style={styles.authButtonText}>
          {user ? `👤 ${user.email?.split('@')[0]}` : '🔐 Sign In'}
        </Text>
      </TouchableOpacity>

      {/* Slot indicators */}
      {layoutReady && cardPositions.current.map((pos, index) => (
        <View
          key={`slot-${index}`}
          style={[
            styles.slotIndicator,
            {
              left: pos.x,
              top: pos.y,
              width: CARD_WIDTH,    // dynamically match card
              height: CARD_HEIGHT,  // dynamically match card
              borderRadius: CARD_WIDTH * 0.088, // keep proportional if you want
            },
          ]}
        />
      ))}

      {/* Character cards */}
      {layoutReady && characters.map((character, index) => (
        <CharacterCard
          key={character.id}
          character={character}
          position={cardPositions.current[index]}
          onPress={() => handleCardPress(character)}
          showPhotos={showPhotos}
          cardWidth={CARD_WIDTH}    // dynamically set width
          cardHeight={CARD_HEIGHT}  // dynamically set height
        />
      ))}

      {/* Photo Card Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCharacter && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedCharacter.name}'s Photo Cards</Text>
                  <TouchableOpacity 
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.eraScrollView}>
                  {photoCardData[selectedCharacter.id].map((eraData) => (
                    <View key={eraData.era} style={styles.eraSection}>
                      <Text style={styles.eraTitle}>{eraData.era}</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        contentContainerStyle={styles.photoCardRow}
                      >
                        {eraData.cards.map((photoCard) => {
                          const isUnlocked = isPhotoCardUnlocked(photoCard, selectedCharacter.level);
                          const isSelected = selectedCharacter.selectedPhotoCard === photoCard.id;
                          const localPhotoImage = getMemberPhoto(
                            selectedCharacter.id as 'yunah' | 'minju' | 'moka' | 'wonhee' | 'iroha',
                            photoCard.id
                          );

                          return (
                            <View
                              key={photoCard.id}
                              style={styles.photoCardWrapper}
                            >
                              <TouchableOpacity
                                style={[
                                  styles.photoCardItem,
                                  isSelected && styles.photoCardSelected,
                                  !isUnlocked && styles.photoCardLocked,
                                ]}
                                onPress={() => isUnlocked && handlePhotoCardSelect(photoCard.id)}
                                disabled={!isUnlocked}
                              >
                                <LinearGradient
                                  colors={[photoCard.color, '#1a1a2e']}
                                  style={styles.photoCardGradient}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 1 }}
                                >
                                  {showPhotos && (localPhotoImage || photoCard.imageUrl) ? (
                                    <>
                                      <Image
                                        source={localPhotoImage || { uri: photoCard.imageUrl || '' }}
                                        style={styles.photoCardImage}
                                        resizeMode="cover"
                                      />
                                      {!isUnlocked && (
                                        <View style={styles.photoCardLockedOverlay}>
                                          <Text style={styles.photoCardLockIcon}>🔒</Text>
                                        </View>
                                      )}
                                    </>
                                  ) : (
                                    <View style={styles.photoCardImagePlaceholder}>
                                      <Text style={styles.photoCardPlaceholderText}>
                                        {isUnlocked ? photoCard.name[0] : '🔒'}
                                      </Text>
                                    </View>
                                  )}
                                </LinearGradient>
                              </TouchableOpacity>

                              <View style={styles.photoCardInfo}>
                                {!isUnlocked && (
                                  <Text style={styles.photoCardUnlockText}>
                                    {getUnlockText(photoCard)}
                                  </Text>
                                )}
                                {isSelected && (
                                  <View style={styles.selectedBadge}>
                                    <Text style={styles.selectedBadgeText}>✓</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Collection Modal */}
      <Modal
        visible={collectionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCollectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Collection</Text>
              <TouchableOpacity
                onPress={() => setCollectionModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Member Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.collectionTabBar}
              contentContainerStyle={styles.collectionTabBarContent}
            >
              {(['background', 'yunah', 'minju', 'moka', 'wonhee', 'iroha'] as const).map((tab) => {
                const tabLabels: Record<string, string> = {
                  background: 'Background',
                  yunah: 'Yunah',
                  minju: 'Minju',
                  moka: 'Moka',
                  wonhee: 'Wonhee',
                  iroha: 'Iroha',
                };
                const tabColors: Record<string, string> = {
                  background: '#fff',
                  yunah: '#FF6B9D',
                  minju: '#C084FC',
                  moka: '#60A5FA',
                  wonhee: '#34D399',
                  iroha: '#FBBF24',
                };
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.collectionTab,
                      collectionTab === tab && { borderBottomColor: tabColors[tab], borderBottomWidth: 3 },
                    ]}
                    onPress={() => setCollectionTab(tab)}
                  >
                    <Text style={[
                      styles.collectionTabText,
                      collectionTab === tab && { color: tabColors[tab] },
                    ]}>
                      {tabLabels[tab]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Tab Content */}
            <ScrollView style={styles.collectionContent}>
              {collectionTab === 'background' ? (
                <View style={styles.collectionEraSection}>
                  <Text style={styles.collectionEraTitle}>Backgrounds</Text>
                  <View style={styles.collectionCardGrid}>
                    {BACKGROUNDS.map((bg) => {
                      const isSelected = selectedBackground === bg.id;
                      return (
                        <View key={bg.id} style={styles.collectionCardWrapper}>
                          <TouchableOpacity
                            style={[
                              styles.collectionCardItem,
                              isSelected && styles.collectionCardSelected,
                            ]}
                            onPress={() => setSelectedBackground(isSelected ? '' : bg.id)}
                          >
                            <Image source={bg.source} style={styles.backgroundThumbnail} resizeMode="cover" />
                          </TouchableOpacity>
                          <Text style={styles.collectionCardName} numberOfLines={1}>{bg.name}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : (
                /* Member photo cards */
                (() => {
                  const member = characters.find(c => c.id === collectionTab);
                  if (!member) return null;
                  return photoCardData[collectionTab].map((eraData) => (
                    <View key={eraData.era} style={styles.collectionEraSection}>
                      <Text style={styles.collectionEraTitle}>{eraData.era}</Text>
                      <View style={styles.collectionCardGrid}>
                        {eraData.cards.map((photoCard) => {
                          const isUnlocked = isPhotoCardUnlocked(photoCard, member.level);
                          const isSelected = member.selectedPhotoCard === photoCard.id;
                          const localPhotoImage = getMemberPhoto(
                            collectionTab as 'yunah' | 'minju' | 'moka' | 'wonhee' | 'iroha',
                            photoCard.id
                          );

                          return (
                            <View key={photoCard.id} style={styles.collectionCardWrapper}>
                              <TouchableOpacity
                                style={[
                                  styles.collectionCardItem,
                                  isSelected && styles.collectionCardSelected,
                                  !isUnlocked && styles.collectionCardLocked,
                                ]}
                                onPress={() => isUnlocked && handlePhotoCardSelect(photoCard.id, collectionTab)}
                                disabled={!isUnlocked}
                              >
                                <LinearGradient
                                  colors={[photoCard.color, '#1a1a2e']}
                                  style={styles.photoCardGradient}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 1 }}
                                >
                                  {showPhotos && (localPhotoImage || photoCard.imageUrl) ? (
                                    <>
                                      <Image
                                        source={localPhotoImage || { uri: photoCard.imageUrl || '' }}
                                        style={styles.photoCardImage}
                                        resizeMode="cover"
                                      />
                                      {!isUnlocked && (
                                        <View style={styles.photoCardLockedOverlay}>
                                          <Text style={styles.photoCardLockIcon}>🔒</Text>
                                        </View>
                                      )}
                                    </>
                                  ) : (
                                    <View style={styles.photoCardImagePlaceholder}>
                                      <Text style={styles.photoCardPlaceholderText}>
                                        {isUnlocked ? photoCard.name[0] : '🔒'}
                                      </Text>
                                    </View>
                                  )}
                                </LinearGradient>
                                {isSelected && (
                                  <View style={styles.collectionSelectedBadge}>
                                    <Text style={styles.selectedBadgeText}>✓</Text>
                                  </View>
                                )}
                              </TouchableOpacity>
                              {!isUnlocked && (
                                <Text style={styles.collectionCardUnlock} numberOfLines={1}>
                                  {getUnlockText(photoCard)}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ));
                })()
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Video List Modal */}
      <Modal
        visible={videoModalVisible && !isVideoPlaying}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVideoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Watch Videos</Text>
              <View style={styles.videoHeaderButtons}>
                <TouchableOpacity
                  style={styles.videoHeaderPlayButton}
                  onPress={() => {
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
                  }}
                  disabled={getFilteredVideos().length === 0}
                >
                  <Text style={styles.videoHeaderPlayButtonText}>▶</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.videoHeaderShuffleButton}
                  onPress={() => {
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
                  }}
                  disabled={getFilteredVideos().length === 0}
                >
                  <Text style={styles.videoHeaderShuffleButtonText}>🔀</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setVideoModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Video Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.videoFilterContainer}
              contentContainerStyle={styles.videoFilterContent}
            >
              {(['All', 'Favorites', 'Music Video', 'Dance Practice', 'SUPER ILLIT', 'Misc', 'Watched', 'Unwatched'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterTab,
                    selectedVideoFilter === filter && styles.filterTabActive
                  ]}
                  onPress={() => setSelectedVideoFilter(filter)}
                >
                  <Text style={[
                    styles.filterTabText,
                    selectedVideoFilter === filter && styles.filterTabTextActive
                  ]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.videoScrollView}>
              <View style={styles.videoGrid}>
                {getFilteredVideos().map((video) => (
                  <TouchableOpacity
                    key={video.id}
                    style={styles.videoItem}
                    onPress={() => handleVideoPress(video)}
                    activeOpacity={0.7}
                  >
                    {/* Thumbnail with duration overlay */}
                    <View style={styles.videoThumbnailContainer}>
                      <Image
                        source={{ uri: `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg` }}
                        style={styles.videoThumbnailImage}
                        resizeMode="cover"
                      />
                      {/* Duration badge overlaid on thumbnail */}
                      <View style={styles.videoDurationOverlay}>
                        <Text style={styles.videoDurationOverlayText}>
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </Text>
                      </View>
                      {/* Favorite button */}
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={(e) => { e.stopPropagation(); toggleFavorite(video.id); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.favoriteButtonText}>
                          {favoriteVideos[video.id] ? '♥' : '♡'}
                        </Text>
                      </TouchableOpacity>
                      {/* Watched progress bar at bottom of thumbnail */}
                      {watchedVideos[video.id] && (
                        <View style={styles.videoWatchedBar} />
                      )}
                    </View>
                    {/* Video info below thumbnail */}
                    <View style={styles.videoInfoBelow}>
                      <Text style={styles.videoTitleBelow} numberOfLines={2}>{video.title}</Text>
                      <View style={styles.videoMetaBelow}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{video.category}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Video Player Modal */}
      <Modal
        visible={isVideoPlaying}
        animationType="fade"
        transparent={false}
        onRequestClose={handleVideoExit}
      >
        <View style={styles.videoPlayerContainer}>
          <View style={styles.videoPlayerHeader}>
            <TouchableOpacity
              onPress={handleVideoPrev}
              style={[styles.backButton, (playHistory.length === 0 && autoPlayQueue.length === 0) && styles.navButtonDisabled]}
              disabled={playHistory.length === 0 && autoPlayQueue.length === 0}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            {selectedVideo && (
              <Text style={styles.videoPlayerTitle} numberOfLines={1}>{selectedVideo.title}</Text>
            )}
            <TouchableOpacity
              onPress={handleVideoNext}
              style={[styles.nextButton, (autoPlayQueue.length === 0 && playHistory.length === 0) && styles.navButtonDisabled]}
              disabled={autoPlayQueue.length === 0 && playHistory.length === 0}
            >
              <Text style={styles.nextButtonText}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAutoPlayEnabled(!autoPlayEnabled)}
              style={[styles.autoPlayButton, autoPlayEnabled && styles.autoPlayButtonActive]}
            >
              <Text style={[styles.autoPlayButtonText, autoPlayEnabled && styles.autoPlayButtonTextActive]}>
                {autoPlayEnabled ? '▶▶ Auto' : '▶▶ Auto'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleVideoExit} style={styles.exitButton}>
              <Text style={styles.exitButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.videoPlayerContent}>
            <View style={[styles.videoPlayerWrapper, { height: Math.min(SCREEN_WIDTH * (9 / 16), SCREEN_HEIGHT - 80) }]}>
              {selectedVideo && Platform.OS === 'web' ? (
                <WebYouTubePlayer
                  videoId={selectedVideo.youtubeId}
                  onProgress={handleVideoComplete}
                  onEnd={handleVideoEnd}
                  height={Math.min(SCREEN_WIDTH * (9 / 16), SCREEN_HEIGHT - 80)}
                />
              ) : (
                selectedVideo && (
                  <YoutubePlayer
                    height={Math.min(SCREEN_WIDTH * (9 / 16), SCREEN_HEIGHT - 80)}
                    play={true}
                    videoId={selectedVideo.youtubeId}
                    onChangeState={(state: string) => {
                      if (state === 'ended') {
                        handleVideoEnd();
                      }
                    }}
                    onProgress={(progress: { currentTime: number; duration: number }) => {
                      const percentWatched = progress.currentTime / progress.duration;
                      console.log(`Native: Progress ${(percentWatched * 100).toFixed(1)}%`);

                      if (percentWatched >= 0.9 && !hasRewarded) {
                        console.log('Native: 90% watched! Triggering reward...');
                        handleVideoComplete();
                      }
                    }}
                  />
                )
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity
                onPress={() => setSettingsModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsContent}>
              {user ? (
                <>
                  <View style={styles.settingsSection}>
                    <Text style={styles.settingsSectionTitle}>Account</Text>
                    <View style={styles.settingsItem}>
                      <Text style={styles.settingsLabel}>Signed in as:</Text>
                      <Text style={styles.settingsValue}>{user.email}</Text>
                    </View>
                  </View>

                  {__DEV__ && (
                    <DevTools characters={characters} setCharacters={setCharacters} />
                  )}

                  <TouchableOpacity
                    style={styles.signOutButton}
                    onPress={() => {
                      signOut();
                      setSettingsModalVisible(false);
                    }}
                  >
                    <Text style={styles.signOutButtonText}>🚪 Sign Out</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.settingsSection}>
                  <Text style={styles.settingsMessage}>
                    Sign in to save your progress across devices
                  </Text>
                  <TouchableOpacity
                    style={styles.settingsSignInButton}
                    onPress={() => {
                      signInWithGoogle();
                      setSettingsModalVisible(false);
                    }}
                  >
                    <Text style={styles.settingsSignInButtonText}>🔐 Sign In with Google</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Play / Shuffle row */}
      <View style={styles.playRow}>
        <TouchableOpacity
          style={[
            styles.playButton,
            {
              paddingVertical: Math.max(16, screenDimensions.width * 0.015),
            }
          ]}
          onPress={handleAutoPlay}
        >
          <Text style={[
            styles.playButtonText,
            { fontSize: Math.max(16, screenDimensions.width * 0.013) }
          ]}>▶  Play</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.shuffleButton,
            {
              paddingVertical: Math.max(16, screenDimensions.width * 0.015),
              paddingHorizontal: Math.max(16, screenDimensions.width * 0.013),
            }
          ]}
          onPress={handleShufflePlay}
        >
          <Text style={[
            styles.shuffleButtonText,
            { fontSize: Math.max(18, screenDimensions.width * 0.014) }
          ]}>🔀</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom menu */}
      <View style={styles.bottomMenu}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setVideoModalVisible(true)}
        >
          <Text style={styles.menuButtonText}>📺 Videos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setCollectionModalVisible(true)}
        >
          <Text style={styles.menuButtonText}>🎴 Collection</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSettingsModalVisible(true)}
        >
          <Text style={styles.menuButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backgroundThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(255, 107, 157, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 4,
  },
  topLeftToggle: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(255, 107, 157, 0.45)',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 157, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  toggleIconText: {
    fontSize: 24,
  },
  authButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 100,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  slotIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.2,
  },
  cardContainer: {
    position: 'absolute',
    zIndex: 100,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  placeholderText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  cardImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  characterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  xpBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  xpText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 2,
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 20,
    opacity: 0.3,
    zIndex: -1,
  },
  bottomMenu: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  menuButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  testButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#1a1a2e',
    borderRadius: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  eraScrollView: {
    flex: 1,
  },
  eraSection: {
    marginBottom: 24,
  },
  eraTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  photoCardRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  photoCardWrapper: {
    marginRight: 12,
    alignItems: 'center',
  },
  photoCardItem: {
    width: 150,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  photoCardSelected: {
    borderColor: '#34D399',
    borderWidth: 3,
  },
  photoCardLocked: {
    opacity: 0.8,
  },
  photoCardGradient: {
    flex: 1,
  },
  photoCardImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  photoCardPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  photoCardImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  photoCardLockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCardLockIcon: {
    fontSize: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  photoCardInfo: {
    marginTop: 8,
    alignItems: 'center',
    width: 150,
  },
  photoCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  photoCardUnlockText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  selectedBadge: {
    marginTop: 6,
    backgroundColor: '#34D399',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  collectionTabBar: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  collectionTabBarContent: {
    paddingHorizontal: 8,
  },
  collectionTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  collectionTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  collectionContent: {
    flex: 1,
  },
  collectionPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  collectionPlaceholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  collectionPlaceholderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  collectionPlaceholderText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  collectionEraSection: {
    marginBottom: 20,
  },
  collectionEraTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
    marginBottom: 10,
    marginTop: 16,
  },
  collectionCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  collectionCardWrapper: {
    width: (SCREEN_WIDTH - 60) / 3,
    maxWidth: 140,
    alignItems: 'center',
  },
  collectionCardItem: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  collectionCardSelected: {
    borderColor: '#34D399',
    borderWidth: 3,
  },
  collectionCardLocked: {
    opacity: 0.7,
  },
  collectionSelectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#34D399',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginTop: 6,
    textAlign: 'center',
  },
  collectionCardUnlock: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 2,
  },
  videoFilterContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterTabActive: {
    backgroundColor: 'rgba(255, 107, 157, 0.3)',
    borderColor: '#FF6B9D',
  },
  filterTabText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  videoScrollView: {
    flex: 1,
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'center',
    gap: 12,
  },
  videoItem: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    maxWidth: 400,
    width: SCREEN_WIDTH > 424 ? (SCREEN_WIDTH / Math.floor(SCREEN_WIDTH / 400)) - 20 : '100%',
  },
  videoThumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 340,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoDurationOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  videoDurationOverlayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  videoWatchedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FF6B9D',
  },
  videoInfoBelow: {
    padding: 12,
  },
  videoTitleBelow: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 20,
  },
  videoMetaBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  videoPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoPlayerContent: {
    flex: 1,
  },
  videoPlayerWrapper: {
    width: '100%',
    backgroundColor: '#000',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  videoPlayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  videoPlayerInfo: {
    padding: 20,
    alignItems: 'center',
  },
  videoPlayerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  videoPlayerSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  webWarning: {
    fontSize: 12,
    color: '#FFA500',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  testRewardButton: {
    marginTop: 30,
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  testRewardButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  settingsContent: {
    flex: 1,
    padding: 20,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  settingsItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  settingsValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  settingsMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  signOutButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.5)',
    marginTop: 20,
  },
  signOutButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsSignInButton: {
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.5)',
  },
  settingsSignInButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '600',
  },
  playRow: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  playButton: {
    flex: 1,
    maxWidth: 600,
    minWidth: 120,
    backgroundColor: 'rgba(96, 165, 250, 0.45)',
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  playButtonDisabled: {
    opacity: 0.35,
  },
  shuffleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shuffleButtonText: {
    fontSize: 22,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  nextButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginLeft: 8,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  exitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  exitButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonText: {
    fontSize: 18,
    color: '#FF6B9D',
  },
  videoHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoHeaderPlayButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  videoHeaderPlayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoHeaderShuffleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  videoHeaderShuffleButtonText: {
    fontSize: 16,
  },
  autoPlayButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 8,
  },
  autoPlayButtonActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.3)',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  autoPlayButtonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
  },
  autoPlayButtonTextActive: {
    color: '#60A5FA',
  },
});