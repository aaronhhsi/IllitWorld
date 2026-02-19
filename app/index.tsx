import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CharacterCard from '../components/CharacterCard';
import CollectionModal from '../components/modals/CollectionModal';
import PhotoCardModal from '../components/modals/PhotoCardModal';
import SettingsModal from '../components/modals/SettingsModal';
import VideoListModal from '../components/modals/VideoListModal';
import VideoPlayerModal from '../components/modals/VideoPlayerModal';
import {
  BACKGROUNDS,
  GAME_CONFIG,
  calculateCardDimensions,
  Character,
  SPACING_RATIO,
} from '../constants/gameConfig';
import { useAuth } from '../contexts/AuthContext';
import { useGameData } from '../hooks/useGameData';
import { useVideoPlayer, VideoFilter } from '../hooks/useVideoPlayer';

interface Position {
  x: number;
  y: number;
}

export default function HomeScreen() {
  const { user, signInWithGoogle, signOut } = useAuth();

  const {
    characters,
    setCharacters,
    showPhotos,
    setShowPhotos,
    watchedVideos,
    setWatchedVideos,
    favoriteVideos,
    setFavoriteVideos,
    selectedBackground,
    setSelectedBackground,
  } = useGameData();

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [photoCardModalVisible, setPhotoCardModalVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [selectedVideoFilter, setSelectedVideoFilter] = useState<VideoFilter>('All');
  const [layoutReady, setLayoutReady] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  const cardDimensions = calculateCardDimensions(screenDimensions.width);
  const CARD_WIDTH = cardDimensions.width;
  const CARD_HEIGHT = cardDimensions.height;
  const SIDE_MARGIN = cardDimensions.margin;

  const cardPositions = useRef<Position[]>([]);
  const positionKey = `${screenDimensions.width}-${screenDimensions.height}-${characters.length}`;
  const currentPositionKey = useRef<string>('');

  const handleVideoReward = ({ video, secondsWatched }: { video: { id: string; duration: number }; secondsWatched: number }) => {
    const xpEarned = secondsWatched;
    if (!watchedVideos[video.id]) {
      setWatchedVideos(prev => ({ ...prev, [video.id]: Date.now() }));
      console.log(`Unlocked photo cards for video: ${video.id}`);
    }
    setCharacters(chars => chars.map(char => {
      const newXP = char.xp + xpEarned;
      return { ...char, xp: newXP, level: Math.floor(newXP / GAME_CONFIG.XP_PER_LEVEL) + 1 };
    }));
  };

  const videoPlayer = useVideoPlayer({
    watchedVideos,
    favoriteVideos,
    selectedVideoFilter,
    onVideoReward: handleVideoReward,
  });

  // Listen for dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    const handleResize = () => setScreenDimensions(Dimensions.get('window'));
    if (Platform.OS === 'web') window.addEventListener('resize', handleResize);
    return () => {
      subscription?.remove();
      if (Platform.OS === 'web') window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Delay rendering cards to prevent layout flash
  useEffect(() => {
    const timer = setTimeout(() => setLayoutReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Recalculate card positions when dimensions or character count changes
  const getSlotPosition = (index: number, total: number): Position => {
    const spacing = CARD_WIDTH * SPACING_RATIO;
    const totalWidth = (CARD_WIDTH + spacing) * total - spacing;
    const startX = Math.max((screenDimensions.width - totalWidth) / 2, SIDE_MARGIN / 2);
    const centerY = screenDimensions.height / 2 - CARD_HEIGHT / 2;
    return { x: startX + (CARD_WIDTH + spacing) * index, y: centerY };
  };

  if (currentPositionKey.current !== positionKey) {
    cardPositions.current = characters.map((_, i) => getSlotPosition(i, characters.length));
    currentPositionKey.current = positionKey;
  }

  const handleCardPress = (character: Character) => {
    setSelectedCharacter(character);
    setPhotoCardModalVisible(true);
  };

  const handlePhotoCardSelect = (photoCardId: string, characterId?: string) => {
    const targetId = characterId ?? selectedCharacter?.id;
    if (!targetId) return;
    setCharacters(characters.map(char =>
      char.id === targetId ? { ...char, selectedPhotoCard: photoCardId } : char
    ));
    if (!characterId) setPhotoCardModalVisible(false);
  };

  const toggleFavorite = (videoId: string) => {
    setFavoriteVideos(prev => {
      const updated = { ...prev };
      if (updated[videoId]) { delete updated[videoId]; } else { updated[videoId] = true; }
      return updated;
    });
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={styles.background}
      />
      {showPhotos && selectedBackground && (() => {
        const bg = BACKGROUNDS.find(b => b.id === selectedBackground);
        return bg ? <Image source={bg.source} style={styles.backgroundImage} resizeMode="cover" /> : null;
      })()}

      {/* Particles */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[styles.particle, { left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[
          styles.title,
          {
            fontSize: Math.max(20, Math.min(48, screenDimensions.width * 0.065)),
            letterSpacing: Math.max(0.5, Math.min(4, screenDimensions.width * 0.005)),
          },
        ]}>ILLIT WORLD</Text>
      </View>

      {/* Photo toggle — top left */}
      <TouchableOpacity style={styles.topLeftToggle} onPress={() => setShowPhotos(!showPhotos)}>
        <Text style={styles.toggleIconText}>{showPhotos ? '🖼️' : '🎨'}</Text>
      </TouchableOpacity>

      {/* Auth button — top right */}
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
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              borderRadius: CARD_WIDTH * 0.088,
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
          cardWidth={CARD_WIDTH}
          cardHeight={CARD_HEIGHT}
        />
      ))}

      {/* Play / Shuffle row */}
      <View style={styles.playRow}>
        <TouchableOpacity
          style={[styles.playButton, { paddingVertical: Math.max(16, screenDimensions.width * 0.015) }]}
          onPress={videoPlayer.handleAutoPlay}
        >
          <Text style={[styles.playButtonText, { fontSize: Math.max(16, screenDimensions.width * 0.013) }]}>
            ▶  Play
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.shuffleButton,
            {
              paddingVertical: Math.max(16, screenDimensions.width * 0.015),
              paddingHorizontal: Math.max(16, screenDimensions.width * 0.013),
            },
          ]}
          onPress={videoPlayer.handleShufflePlay}
        >
          <Text style={[styles.shuffleButtonText, { fontSize: Math.max(18, screenDimensions.width * 0.014) }]}>
            🔀
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom menu */}
      <View style={styles.bottomMenu}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setVideoModalVisible(true)}>
          <Text style={styles.menuButtonText}>📺 Videos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} onPress={() => setCollectionModalVisible(true)}>
          <Text style={styles.menuButtonText}>🎴 Collection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} onPress={() => setSettingsModalVisible(true)}>
          <Text style={styles.menuButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <PhotoCardModal
        visible={photoCardModalVisible}
        onClose={() => setPhotoCardModalVisible(false)}
        selectedCharacter={selectedCharacter}
        showPhotos={showPhotos}
        watchedVideos={watchedVideos}
        onPhotoCardSelect={handlePhotoCardSelect}
      />

      <CollectionModal
        visible={collectionModalVisible}
        onClose={() => setCollectionModalVisible(false)}
        characters={characters}
        showPhotos={showPhotos}
        watchedVideos={watchedVideos}
        selectedBackground={selectedBackground}
        onSelectBackground={setSelectedBackground}
        onPhotoCardSelect={handlePhotoCardSelect}
      />

      <VideoListModal
        visible={videoModalVisible && !videoPlayer.isVideoPlaying}
        onClose={() => setVideoModalVisible(false)}
        watchedVideos={watchedVideos}
        favoriteVideos={favoriteVideos}
        selectedVideoFilter={selectedVideoFilter}
        onFilterChange={setSelectedVideoFilter}
        getFilteredVideos={videoPlayer.getFilteredVideos}
        onVideoPress={videoPlayer.handleVideoPress}
        onToggleFavorite={toggleFavorite}
        onPlayFiltered={videoPlayer.handlePlayFiltered}
        onShuffleFiltered={videoPlayer.handleShuffleFiltered}
      />

      <VideoPlayerModal
        visible={videoPlayer.isVideoPlaying}
        selectedVideo={videoPlayer.selectedVideo}
        playHistory={videoPlayer.playHistory}
        autoPlayQueue={videoPlayer.autoPlayQueue}
        autoPlayEnabled={videoPlayer.autoPlayEnabled}
        hasRewarded={videoPlayer.hasRewarded}
        onExit={videoPlayer.handleVideoExit}
        onPrev={videoPlayer.handleVideoPrev}
        onNext={videoPlayer.handleVideoNext}
        onToggleAutoPlay={() => videoPlayer.setAutoPlayEnabled(!videoPlayer.autoPlayEnabled)}
        onVideoComplete={videoPlayer.handleVideoComplete}
        onVideoEnd={videoPlayer.handleVideoEnd}
      />

      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        user={user}
        characters={characters}
        setCharacters={setCharacters}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      />
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
  menuButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
