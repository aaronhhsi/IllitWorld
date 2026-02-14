import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const GAME_CONFIG = {
  XP_PER_VIDEO: 50,
  XP_PER_LEVEL: 200,
};

type Character = {
  id: string;
  name: string;
  level: number;
  xp: number;
  color: string;
  selectedPhotoCard: string;
};

type Props = {
  characters: Character[];
  setCharacters: (chars: Character[]) => void;
};

export default function DevTools({ characters, setCharacters }: Props) {
  const handleTestAddXP = () => {
    setCharacters(characters.map(char => {
      const newXP = char.xp + GAME_CONFIG.XP_PER_VIDEO;
      return { ...char, xp: newXP, level: Math.floor(newXP / GAME_CONFIG.XP_PER_LEVEL) + 1 };
    }));
  };

  const handleTestRemoveXP = () => {
    setCharacters(characters.map(char => {
      const newXP = Math.max(0, char.xp - GAME_CONFIG.XP_PER_VIDEO);
      return { ...char, xp: newXP, level: Math.floor(newXP / GAME_CONFIG.XP_PER_LEVEL) + 1 };
    }));
  };

  const handleTestAddLevel = () => {
    setCharacters(characters.map(char => {
      const newXP = char.xp + GAME_CONFIG.XP_PER_LEVEL;
      return { ...char, xp: newXP, level: Math.floor(newXP / GAME_CONFIG.XP_PER_LEVEL) + 1 };
    }));
  };

  const handleTestRemoveLevel = () => {
    setCharacters(characters.map(char => {
      const newXP = Math.max(0, char.xp - GAME_CONFIG.XP_PER_LEVEL);
      return { ...char, xp: newXP, level: Math.floor(newXP / GAME_CONFIG.XP_PER_LEVEL) + 1 };
    }));
  };

  return (
    <View style={styles.settingsSection}>
      <Text style={styles.settingsSectionTitle}>Developer Tools</Text>
      <View style={styles.devToolRow}>
        <TouchableOpacity style={styles.devToolButton} onPress={handleTestAddXP}>
          <Text style={styles.devToolButtonText}>⚡ +XP</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.devToolButton} onPress={handleTestRemoveXP}>
          <Text style={styles.devToolButtonText}>⚡ -XP</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.devToolRow}>
        <TouchableOpacity style={styles.devToolButton} onPress={handleTestAddLevel}>
          <Text style={styles.devToolButtonText}>📈 +Level</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.devToolButton} onPress={handleTestRemoveLevel}>
          <Text style={styles.devToolButtonText}>📉 -Level</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  devToolRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  devToolButton: {
    flex: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  devToolButtonText: {
    color: '#A78BFA',
    fontSize: 16,
    fontWeight: '600',
  },
});
