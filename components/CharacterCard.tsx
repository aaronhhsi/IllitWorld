import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMemberPhoto } from '../assets/images/members';
import { GAME_CONFIG, Character } from '../constants/gameConfig';
import { PhotoCard, photoCardData } from '../data/photoCards';

interface Position {
  x: number;
  y: number;
}

interface CharacterCardProps {
  character: Character;
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
  cardHeight,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

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
  const localImage = getMemberPhoto(
    character.id as 'yunah' | 'minju' | 'moka' | 'wonhee' | 'iroha',
    character.selectedPhotoCard
  );

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.95, useNativeDriver: false }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[
        styles.cardContainer,
        { left: position.x, top: position.y, width: cardWidth, height: cardHeight },
      ]}
    >
      <LinearGradient
        colors={[character.color, '#1a1a2e']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
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

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.infoOverlay}
        >
          <Text style={[styles.characterName, { fontSize: Math.max(12, cardWidth * 0.1) }]}>
            {character.name}
          </Text>
          <View style={styles.levelContainer}>
            <Text style={[styles.levelText, { fontSize: Math.max(10, cardWidth * 0.067) }]}>
              LVL {character.level}
            </Text>
            <View style={styles.xpBar}>
              <View
                style={[
                  styles.xpFill,
                  { width: `${((character.xp % GAME_CONFIG.XP_PER_LEVEL) / GAME_CONFIG.XP_PER_LEVEL) * 100}%` },
                ]}
              />
            </View>
          </View>
          <Text style={[styles.xpText, { fontSize: Math.max(8, cardWidth * 0.056) }]}>
            {character.xp % GAME_CONFIG.XP_PER_LEVEL}/{GAME_CONFIG.XP_PER_LEVEL} XP
          </Text>
        </LinearGradient>

        <View style={[styles.glow, { backgroundColor: character.color }]} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default CharacterCard;

const styles = StyleSheet.create({
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
});
