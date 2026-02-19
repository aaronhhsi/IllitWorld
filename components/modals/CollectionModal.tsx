import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMemberPhoto } from '../../assets/images/members';
import { BACKGROUNDS, Character } from '../../constants/gameConfig';
import { photoCardData } from '../../data/photoCards';
import { isPhotoCardUnlocked, getUnlockText } from '../../utils/photoCardUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CollectionTab = 'background' | 'yunah' | 'minju' | 'moka' | 'wonhee' | 'iroha';

const TAB_LABELS: Record<CollectionTab, string> = {
  background: 'Background',
  yunah: 'Yunah',
  minju: 'Minju',
  moka: 'Moka',
  wonhee: 'Wonhee',
  iroha: 'Iroha',
};

const TAB_COLORS: Record<CollectionTab, string> = {
  background: '#fff',
  yunah: '#FF6B9D',
  minju: '#C084FC',
  moka: '#60A5FA',
  wonhee: '#34D399',
  iroha: '#FBBF24',
};

interface CollectionModalProps {
  visible: boolean;
  onClose: () => void;
  characters: Character[];
  showPhotos: boolean;
  watchedVideos: Record<string, number>;
  selectedBackground: string;
  onSelectBackground: (id: string) => void;
  onPhotoCardSelect: (photoCardId: string, characterId: string) => void;
}

const CollectionModal: React.FC<CollectionModalProps> = ({
  visible,
  onClose,
  characters,
  showPhotos,
  watchedVideos,
  selectedBackground,
  onSelectBackground,
  onPhotoCardSelect,
}) => {
  const [collectionTab, setCollectionTab] = useState<CollectionTab>('background');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Collection</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabBar}
            contentContainerStyle={styles.tabBarContent}
          >
            {(Object.keys(TAB_LABELS) as CollectionTab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  collectionTab === tab && { borderBottomColor: TAB_COLORS[tab], borderBottomWidth: 3 },
                ]}
                onPress={() => setCollectionTab(tab)}
              >
                <Text style={[
                  styles.tabText,
                  collectionTab === tab && { color: TAB_COLORS[tab] },
                ]}>
                  {TAB_LABELS[tab]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.content}>
            {collectionTab === 'background' ? (
              <View style={styles.eraSection}>
                <Text style={styles.eraTitle}>Backgrounds</Text>
                <View style={styles.cardGrid}>
                  {BACKGROUNDS.map((bg) => {
                    const isSelected = selectedBackground === bg.id;
                    return (
                      <View key={bg.id} style={styles.cardWrapper}>
                        <TouchableOpacity
                          style={[styles.cardItem, isSelected && styles.cardSelected]}
                          onPress={() => onSelectBackground(isSelected ? '' : bg.id)}
                        >
                          <Image source={bg.source} style={styles.backgroundThumbnail} resizeMode="cover" />
                        </TouchableOpacity>
                        <Text style={styles.cardName} numberOfLines={1}>{bg.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              (() => {
                const member = characters.find(c => c.id === collectionTab);
                if (!member) return null;
                return photoCardData[collectionTab].map((eraData) => (
                  <View key={eraData.era} style={styles.eraSection}>
                    <Text style={styles.eraTitle}>{eraData.era}</Text>
                    <View style={styles.cardGrid}>
                      {eraData.cards.map((photoCard) => {
                        const isUnlocked = isPhotoCardUnlocked(photoCard, member.level, watchedVideos);
                        const isSelected = member.selectedPhotoCard === photoCard.id;
                        const localPhotoImage = getMemberPhoto(
                          collectionTab as 'yunah' | 'minju' | 'moka' | 'wonhee' | 'iroha',
                          photoCard.id
                        );

                        return (
                          <View key={photoCard.id} style={styles.cardWrapper}>
                            <TouchableOpacity
                              style={[
                                styles.cardItem,
                                isSelected && styles.cardSelected,
                                !isUnlocked && styles.cardLocked,
                              ]}
                              onPress={() => isUnlocked && onPhotoCardSelect(photoCard.id, collectionTab)}
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
                                      <View style={styles.lockedOverlay}>
                                        <Text style={styles.lockIcon}>🔒</Text>
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
                                <View style={styles.selectedBadge}>
                                  <Text style={styles.selectedBadgeText}>✓</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                            {!isUnlocked && (
                              <Text style={styles.cardUnlock} numberOfLines={1}>
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
  );
};

export default CollectionModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
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
  tabBar: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabBarContent: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    flex: 1,
  },
  eraSection: {
    marginBottom: 20,
  },
  eraTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
    marginBottom: 10,
    marginTop: 16,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  cardWrapper: {
    width: (SCREEN_WIDTH - 60) / 3,
    maxWidth: 140,
    alignItems: 'center',
  },
  cardItem: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardSelected: {
    borderColor: '#34D399',
    borderWidth: 3,
  },
  cardLocked: {
    opacity: 0.7,
  },
  cardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginTop: 6,
    textAlign: 'center',
  },
  cardUnlock: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 2,
  },
  backgroundThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoCardGradient: {
    flex: 1,
  },
  photoCardImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
  selectedBadge: {
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
  selectedBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});
