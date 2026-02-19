import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  user,
  characters,
  setCharacters,
  onSignIn,
  onSignOut,
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsContent}>
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
          </View>
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
    padding: 20,
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
});
