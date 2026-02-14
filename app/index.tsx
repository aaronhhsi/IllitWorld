import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { videos, Video } from '../data/videos';
import { photoCardData, PhotoCard } from '../data/photoCards';
import { useAuth } from '../contexts/AuthContext';
import { saveGameData, loadGameData } from '../services/firestoreService';
import { getMemberPhoto } from '../assets/images/members';
import DevTools from '../components/DevTools';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game configuration - easy to tweak
const GAME_CONFIG = {
  XP_PER_VIDEO: 50,
  XP_PER_LEVEL: 200,
};

// Character data - replace with actual images later
const initialCharacters = [
  { id: 'yunah', name: 'Yunah', level: 1, xp: 0, color: '#FF6B9D', selectedPhotoCard: 'yunah-run-1' },
  { id: 'minju', name: 'Minju', level: 1, xp: 0, color: '#C084FC', selectedPhotoCard: 'minju-run-1' },
  { id: 'moka', name: 'Moka', level: 1, xp: 0, color: '#60A5FA', selectedPhotoCard: 'moka-run-1' },
  { id: 'wonhee', name: 'Wonhee', level: 1, xp: 0, color: '#34D399', selectedPhotoCard: 'wonhee-misc-1' },
  { id: 'iroha', name: 'Iroha', level: 1, xp: 0, color: '#FBBF24', selectedPhotoCard: 'iroha-run-1' },
];

// Web-specific YouTube Player Component
const WebYouTubePlayer: React.FC<{
  videoId: string;
  onProgress: () => void;
  height: number;
}> = ({ videoId, onProgress, height }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const rewardedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Store callback in a ref so the effect doesn't depend on it
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

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

interface DraggableCardProps {
  character: typeof initialCharacters[0];
  position: Position;
  slotIndex: number;
  onPress: () => void;
  showPhotos: boolean;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  character,
  position,
  slotIndex,
  onPress,
  showPhotos
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
          <Text style={styles.characterName}>{character.name}</Text>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>LVL {character.level}</Text>
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
          <Text style={styles.xpText}>
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
  const [selectedVideoFilter, setSelectedVideoFilter] = useState<'All' | 'Music Video' | 'Dance Practice' | 'SUPER ILLIT' | 'Misc' | 'Watched' | 'Unwatched'>('All');
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [collectionTab, setCollectionTab] = useState<'background' | 'yunah' | 'minju' | 'moka' | 'wonhee' | 'iroha'>('background');
  const [autoPlayQueue, setAutoPlayQueue] = useState<Video[]>([]);
  const [playHistory, setPlayHistory] = useState<Video[]>([]);
  const cardPositions = useRef<Position[]>([]);
  const hasLoadedData = useRef(false);

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

            console.log('Loaded game data for user:', user.email);
          } else {
            console.log('No saved data found, starting fresh');
          }
          hasLoadedData.current = true;
        } catch (error) {
          console.error('Error loading game data:', error);
          hasLoadedData.current = true;
        }
      } else {
        // User signed out, reset the flag
        hasLoadedData.current = false;
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
            lastUpdated: Date.now(),
          });
          console.log('Game data saved for user:', user.email);
        } catch (error) {
          console.error('Error saving game data:', error);
        }
      }
    };

    saveUserData();
  }, [characters, showPhotos, watchedVideos, user]);

  // Calculate fixed slot positions in a horizontal row
  const getSlotPosition = (index: number, total: number): Position => {
    const cardWidth = 180;
    const spacing = 20;
    const totalWidth = (cardWidth + spacing) * total - spacing;
    const startX = (SCREEN_WIDTH - totalWidth) / 2;
    const centerY = SCREEN_HEIGHT / 2 - 120;

    return {
      x: startX + (cardWidth + spacing) * index,
      y: centerY,
    };
  };

  // Initialize card positions
  if (cardPositions.current.length === 0) {
    cardPositions.current = characters.map((_, i) => 
      getSlotPosition(i, characters.length)
    );
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

  const handleVideoPress = (video: Video) => {
    setSelectedVideo(video);
    setIsVideoPlaying(true);
    setHasRewarded(false); // Reset reward flag for new video
  };

  // Go back to previous video in history
  const handleVideoPrev = () => {
    if (playHistory.length === 0) return;
    const prev = playHistory[playHistory.length - 1];
    setPlayHistory(playHistory.slice(0, -1));
    // Push current video back to front of queue
    if (selectedVideo) {
      setAutoPlayQueue([selectedVideo, ...autoPlayQueue]);
    }
    setSelectedVideo(prev);
    setHasRewarded(false);
  };

  // Skip to next video in queue
  const handleVideoNext = () => {
    if (autoPlayQueue.length === 0) return;
    const [nextVideo, ...rest] = autoPlayQueue;
    // Push current video onto history
    if (selectedVideo) {
      setPlayHistory([...playHistory, selectedVideo]);
    }
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

  // Get unwatched videos ordered: music videos first, then others
  const getUnwatchedOrdered = (): Video[] => {
    const unwatched = videos.filter(v => !watchedVideos[v.id]);
    const musicVideos = unwatched.filter(v => v.category === 'Music Video');
    const others = unwatched.filter(v => v.category !== 'Music Video');
    return [...musicVideos, ...others];
  };

  // Auto-play unwatched videos in order
  const handleAutoPlay = () => {
    const ordered = getUnwatchedOrdered();
    if (ordered.length === 0) return;
    const [first, ...rest] = ordered;
    setAutoPlayQueue(rest);
    setSelectedVideo(first);
    setIsVideoPlaying(true);
    setHasRewarded(false);
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
    setSelectedVideo(first);
    setIsVideoPlaying(true);
    setHasRewarded(false);
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
        <Text style={styles.title}>ILLIT WORLD</Text>
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
            },
          ]}
        />
      ))}

      {/* Character cards */}
      {layoutReady && characters.map((character, index) => (
        <DraggableCard
          key={character.id}
          character={character}
          position={cardPositions.current[index]}
          slotIndex={index}
          onPress={() => handleCardPress(character)}
          showPhotos={showPhotos}
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
                <View style={styles.collectionPlaceholder}>
                  <Text style={styles.collectionPlaceholderIcon}>🎨</Text>
                  <Text style={styles.collectionPlaceholderTitle}>Backgrounds</Text>
                  <Text style={styles.collectionPlaceholderText}>
                    Unlock new backgrounds by watching videos! Coming soon.
                  </Text>
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
              <TouchableOpacity
                onPress={() => setVideoModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Video Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.videoFilterContainer}
              contentContainerStyle={styles.videoFilterContent}
            >
              {(['All', 'Music Video', 'Dance Practice', 'SUPER ILLIT', 'Misc', 'Watched', 'Unwatched'] as const).map((filter) => (
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
              style={[styles.backButton, playHistory.length === 0 && styles.navButtonDisabled]}
              disabled={playHistory.length === 0}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            {selectedVideo && (
              <Text style={styles.videoPlayerTitle} numberOfLines={1}>{selectedVideo.title}</Text>
            )}
            <TouchableOpacity
              onPress={handleVideoNext}
              style={[styles.nextButton, autoPlayQueue.length === 0 && styles.navButtonDisabled]}
              disabled={autoPlayQueue.length === 0}
            >
              <Text style={styles.nextButtonText}>→</Text>
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
                  height={Math.min(SCREEN_WIDTH * (9 / 16), SCREEN_HEIGHT - 80)}
                />
              ) : (
                selectedVideo && (
                  <YoutubePlayer
                    height={Math.min(SCREEN_WIDTH * (9 / 16), SCREEN_HEIGHT - 80)}
                    play={true}
                    videoId={selectedVideo.youtubeId}
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
          style={[styles.playButton, getUnwatchedOrdered().length === 0 && styles.playButtonDisabled]}
          onPress={handleAutoPlay}
          disabled={getUnwatchedOrdered().length === 0}
        >
          <Text style={styles.playButtonText}>▶  Play</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shuffleButton, getUnwatchedOrdered().length === 0 && styles.playButtonDisabled]}
          onPress={handleShufflePlay}
          disabled={getUnwatchedOrdered().length === 0}
        >
          <Text style={styles.shuffleButtonText}>🔀</Text>
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
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 157, 0.5)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 100,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  slotIndicator: {
    position: 'absolute',
    width: 180,
    height: 240,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.2,
  },
  cardContainer: {
    position: 'absolute',
    width: 180,
    height: 240,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    gap: 12,
  },
  playButton: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'rgba(96, 165, 250, 0.25)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
});