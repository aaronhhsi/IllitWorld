import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMemberPhoto } from '../../assets/images/members';
import { Character } from '../../constants/gameConfig';
import { photoCardData } from '../../data/photoCards';
import { isPhotoCardUnlocked, getUnlockText } from '../../utils/photoCardUtils';

interface PhotoCardModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCharacter: Character | null;
  showPhotos: boolean;
  watchedVideos: Record<string, number>;
  onPhotoCardSelect: (photoCardId: string) => void;
}

const PhotoCardModal: React.FC<PhotoCardModalProps> = ({
  visible,
  onClose,
  selectedCharacter,
  showPhotos,
  watchedVideos,
  onPhotoCardSelect,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedCharacter && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedCharacter.name}'s Photo Cards</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
                        const isUnlocked = isPhotoCardUnlocked(photoCard, selectedCharacter.level, watchedVideos);
                        const isSelected = selectedCharacter.selectedPhotoCard === photoCard.id;
                        const localPhotoImage = getMemberPhoto(
                          selectedCharacter.id as 'yunah' | 'minju' | 'moka' | 'wonhee' | 'iroha',
                          photoCard.id
                        );

                        return (
                          <View key={photoCard.id} style={styles.photoCardWrapper}>
                            <TouchableOpacity
                              style={[
                                styles.photoCardItem,
                                isSelected && styles.photoCardSelected,
                                !isUnlocked && styles.photoCardLocked,
                              ]}
                              onPress={() => isUnlocked && onPhotoCardSelect(photoCard.id)}
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
  );
};

export default PhotoCardModal;

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
});
