import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Video } from '../../data/videos';
import { VideoFilter } from '../../hooks/useVideoPlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VIDEO_FILTERS: VideoFilter[] = [
  'All', 'Favorites', 'Music Video', 'Dance Practice', 'SUPER ILLIT', 'Misc', 'Watched', 'Unwatched',
];

interface VideoListModalProps {
  visible: boolean;
  onClose: () => void;
  watchedVideos: Record<string, number>;
  favoriteVideos: Record<string, boolean>;
  selectedVideoFilter: VideoFilter;
  onFilterChange: (filter: VideoFilter) => void;
  getFilteredVideos: () => Video[];
  onVideoPress: (video: Video) => void;
  onToggleFavorite: (videoId: string) => void;
  onPlayFiltered: () => void;
  onShuffleFiltered: () => void;
}

const VideoListModal: React.FC<VideoListModalProps> = ({
  visible,
  onClose,
  watchedVideos,
  favoriteVideos,
  selectedVideoFilter,
  onFilterChange,
  getFilteredVideos,
  onVideoPress,
  onToggleFavorite,
  onPlayFiltered,
  onShuffleFiltered,
}) => {
  const filteredVideos = getFilteredVideos();

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
            <Text style={styles.modalTitle}>Watch Videos</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={onPlayFiltered}
                disabled={filteredVideos.length === 0}
              >
                <Text style={styles.playButtonText}>▶</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shuffleButton}
                onPress={onShuffleFiltered}
                disabled={filteredVideos.length === 0}
              >
                <Text style={styles.shuffleButtonText}>🔀</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {VIDEO_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterTab, selectedVideoFilter === filter && styles.filterTabActive]}
                onPress={() => onFilterChange(filter)}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedVideoFilter === filter && styles.filterTabTextActive,
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.videoScrollView}>
            <View style={styles.videoGrid}>
              {filteredVideos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.videoItem}
                  onPress={() => onVideoPress(video)}
                  activeOpacity={0.7}
                >
                  <View style={styles.thumbnailContainer}>
                    <Image
                      source={{ uri: `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg` }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    <View style={styles.durationOverlay}>
                      <Text style={styles.durationText}>
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={(e) => { e.stopPropagation(); onToggleFavorite(video.id); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.favoriteButtonText}>
                        {favoriteVideos[video.id] ? '♥' : '♡'}
                      </Text>
                    </TouchableOpacity>
                    {watchedVideos[video.id] && (
                      <View style={styles.watchedBar} />
                    )}
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                    <View style={styles.videoMeta}>
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
  );
};

export default VideoListModal;

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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shuffleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shuffleButtonText: {
    fontSize: 16,
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
  filterContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterContent: {
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
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 340,
    backgroundColor: '#000',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  durationOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonText: {
    fontSize: 18,
    color: '#FF6B9D',
  },
  watchedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FF6B9D',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 20,
  },
  videoMeta: {
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
});
