import { useEffect, useRef, useState } from 'react';
import { Character, initialCharacters } from '../constants/gameConfig';
import { useAuth } from '../contexts/AuthContext';
import { loadGameData, saveGameData } from '../services/gameDataService';

export function useGameData() {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [showPhotos, setShowPhotos] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState<Record<string, number>>({});
  const [favoriteVideos, setFavoriteVideos] = useState<Record<string, boolean>>({});
  const [selectedBackground, setSelectedBackground] = useState<string>('japanese-classroom');
  const hasLoadedData = useRef(false);

  // Load game data when user signs in
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const gameData = await loadGameData(user.id);
          if (gameData) {
            setCharacters(gameData.characters);
            setShowPhotos(gameData.showPhotos);

            // Handle migration from old array format to new object format
            let watchedVideosData: Record<string, number> = {};
            if (gameData.watchedVideos) {
              if (Array.isArray(gameData.watchedVideos)) {
                gameData.watchedVideos.forEach((videoId: string) => {
                  watchedVideosData[videoId] = Date.now();
                });
              } else {
                watchedVideosData = gameData.watchedVideos;
              }
            }
            setWatchedVideos(watchedVideosData);

            if (gameData.favoriteVideos) setFavoriteVideos(gameData.favoriteVideos);
            if (gameData.selectedBackground) setSelectedBackground(gameData.selectedBackground);
            console.log('Loaded game data for user:', user.email);
          } else {
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
        // User signed out — reset to guest defaults
        hasLoadedData.current = false;
        setCharacters(initialCharacters);
        setShowPhotos(false);
        setWatchedVideos({});
        setFavoriteVideos({});
        setSelectedBackground('japanese-classroom');
      }
    };

    loadUserData();
  }, [user]);

  // Save game data when state changes
  useEffect(() => {
    const saveUserData = async () => {
      if (user && hasLoadedData.current) {
        try {
          await saveGameData(user.id, {
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

  return {
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
  };
}
