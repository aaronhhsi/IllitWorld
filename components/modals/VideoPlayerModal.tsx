import React from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import WebYouTubePlayer from '../WebYouTubePlayer';
import { Video } from '../../data/videos';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoPlayerModalProps {
  visible: boolean;
  selectedVideo: Video | null;
  playHistory: Video[];
  autoPlayQueue: Video[];
  autoPlayEnabled: boolean;
  hasRewarded: boolean;
  onExit: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleAutoPlay: () => void;
  onVideoComplete: (percentageWatched?: number) => void;
  onVideoEnd: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  visible,
  selectedVideo,
  playHistory,
  autoPlayQueue,
  autoPlayEnabled,
  hasRewarded,
  onExit,
  onPrev,
  onNext,
  onToggleAutoPlay,
  onVideoComplete,
  onVideoEnd,
}) => {
  const playerHeight = Math.min(SCREEN_WIDTH * (9 / 16), SCREEN_HEIGHT - 80);
  const canNavigate = playHistory.length > 0 || autoPlayQueue.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onExit}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onPrev}
            style={[styles.navButton, !canNavigate && styles.navButtonDisabled]}
            disabled={!canNavigate}
          >
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>

          {selectedVideo && (
            <Text style={styles.title} numberOfLines={1}>{selectedVideo.title}</Text>
          )}

          <TouchableOpacity
            onPress={onNext}
            style={[styles.navButton, !canNavigate && styles.navButtonDisabled]}
            disabled={!canNavigate}
          >
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onToggleAutoPlay}
            style={[styles.autoPlayButton, autoPlayEnabled && styles.autoPlayButtonActive]}
          >
            <Text style={[styles.autoPlayButtonText, autoPlayEnabled && styles.autoPlayButtonTextActive]}>
              ▶▶ Auto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onExit} style={styles.exitButton}>
            <Text style={styles.exitButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playerContent}>
          <View style={[styles.playerWrapper, { height: playerHeight }]}>
            {selectedVideo && Platform.OS === 'web' ? (
              <WebYouTubePlayer
                videoId={selectedVideo.youtubeId}
                onProgress={() => onVideoComplete()}
                onEnd={onVideoEnd}
                height={playerHeight}
              />
            ) : (
              selectedVideo && (
                <YoutubePlayer
                  height={playerHeight}
                  play={true}
                  videoId={selectedVideo.youtubeId}
                  onChangeState={(state: string) => {
                    if (state === 'ended') onVideoEnd();
                  }}
                  onProgress={(progress: { currentTime: number; duration: number }) => {
                    const percentWatched = progress.currentTime / progress.duration;
                    console.log(`Native: Progress ${(percentWatched * 100).toFixed(1)}%`);
                    if (percentWatched >= 0.9 && !hasRewarded) {
                      console.log('Native: 90% watched! Triggering reward...');
                      onVideoComplete();
                    }
                  }}
                />
              )
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default VideoPlayerModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginRight: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
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
  playerContent: {
    flex: 1,
  },
  playerWrapper: {
    width: '100%',
    backgroundColor: '#000',
  },
});
