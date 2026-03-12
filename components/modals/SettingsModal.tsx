import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import DevTools from '../DevTools';
import { Character } from '../../constants/gameConfig';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  user: { email?: string | null } | null;
  characters: Character[];
  setCharacters: (characters: Character[]) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  showPhotos: boolean;
  setShowPhotos: (value: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  user,
  characters,
  setCharacters,
  onSignIn,
  onSignOut,
  showPhotos,
  setShowPhotos,
}) => {
  const router = useRouter();
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
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsContent} contentContainerStyle={styles.settingsContentInner}>
            {user ? (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Account</Text>
                  <View style={styles.item}>
                    <Text style={styles.itemLabel}>Signed in as:</Text>
                    <Text style={styles.itemValue}>{user.email}</Text>
                  </View>
                </View>

                {__DEV__ && (
                  <DevTools characters={characters} setCharacters={setCharacters} />
                )}

                <TouchableOpacity
                  style={styles.signOutButton}
                  onPress={() => { onSignOut(); onClose(); }}
                >
                  <Text style={styles.signOutButtonText}>🚪 Sign Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.section}>
                <Text style={styles.message}>
                  Sign in to save your progress across devices
                </Text>
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={() => { onSignIn(); onClose(); }}
                >
                  <Text style={styles.signInButtonText}>🔐 Sign In with Google</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appearance</Text>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setShowPhotos(!showPhotos)}
              >
                <Text style={styles.toggleLabel}>🖼️ Show Photo Cards</Text>
                <View style={[styles.toggleTrack, showPhotos && styles.toggleTrackOn]}>
                  <View style={[styles.toggleThumb, showPhotos && styles.toggleThumbOn]} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Legal</Text>
              <TouchableOpacity
                style={styles.legalButton}
                onPress={() => { onClose(); router.push('/privacy'); }}
              >
                <Text style={styles.legalButtonText}>📄 Privacy Policy</Text>
                <Text style={styles.legalChevron}>›</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default SettingsModal;

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
  settingsContent: {
    flex: 1,
  },
  settingsContentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  item: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  itemLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  message: {
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
    marginBottom: 8,
  },
  signOutButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.5)',
  },
  signInButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '600',
  },
  legalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legalButtonText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    fontWeight: '500',
  },
  legalChevron: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 20,
  },
  toggleRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    fontWeight: '500',
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackOn: {
    backgroundColor: '#FF6B9D',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
});
