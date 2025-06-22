import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StorageService } from '@/services/storage';
import { Note, NoteImage } from '@/types';
import { generateId } from '@/utils/uuid';

export default function NotesScreen() {
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  const loadNote = async () => {
    if (!noteId) return;
    
    setLoading(true);
    try {
      const notes = await StorageService.getNotes();
      const foundNote = notes.find(n => n.id === noteId);
      setNote(foundNote || null);
    } catch (error) {
      console.error('Error loading note:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera and media library permissions to use this feature.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission || !note) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newImage: NoteImage = {
          id: generateId(),
          uri: asset.uri,
          description: '',
        };

        const updatedNote = {
          ...note,
          images: [...note.images, newImage],
          updatedAt: new Date(),
        };

        await StorageService.saveNote(updatedNote);
        setNote(updatedNote);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission || !note) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newImage: NoteImage = {
          id: generateId(),
          uri: asset.uri,
          description: '',
        };

        const updatedNote = {
          ...note,
          images: [...note.images, newImage],
          updatedAt: new Date(),
        };

        await StorageService.saveNote(updatedNote);
        setNote(updatedNote);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const editImageDescription = (image: NoteImage) => {
    setEditingImageId(image.id);
    setEditDescription(image.description);
    setModalVisible(true);
  };

  const saveDescription = async () => {
    if (!note || !editingImageId) return;

    try {
      const updatedImages = note.images.map(img =>
        img.id === editingImageId
          ? { ...img, description: editDescription }
          : img
      );

      const updatedNote = {
        ...note,
        images: updatedImages,
        updatedAt: new Date(),
      };

      await StorageService.saveNote(updatedNote);
      setNote(updatedNote);
      setModalVisible(false);
      setEditingImageId(null);
      setEditDescription('');
    } catch (error) {
      console.error('Error saving description:', error);
      Alert.alert('Error', 'Failed to save description');
    }
  };

  const deleteImage = (imageId: string) => {
    if (!note) return;

    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedImages = note.images.filter(img => img.id !== imageId);
              const updatedNote = {
                ...note,
                images: updatedImages,
                updatedAt: new Date(),
              };

              await StorageService.saveNote(updatedNote);
              setNote(updatedNote);
            } catch (error) {
              console.error('Error deleting image:', error);
              Alert.alert('Error', 'Failed to delete image');
            }
          },
        },
      ]
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose how to add an image:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
      ]
    );
  };

  if (!noteId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.emptyState}>
          <ThemedView style={[styles.emptyIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <IconSymbol name="note.text" size={48} color={colors.iconMuted} />
          </ThemedView>
          <ThemedText type="heading" style={styles.emptyText}>Select a note to edit</ThemedText>
          <ThemedText type="body" style={styles.emptySubtext}>
            Choose a note from your book to start taking notes with images
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText type="body" style={styles.loadingText}>Loading note...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!note) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText type="body" style={styles.loadingText}>Note not found</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView style={styles.noteInfo}>
          <ThemedText type="title" style={styles.noteTitle}>{note.title}</ThemedText>
          <ThemedText type="body" style={styles.pageNumber}>Page {note.pageNumber}</ThemedText>
        </ThemedView>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.tint }]} onPress={showImageOptions}>
          <IconSymbol name="plus" size={18} color="#ffffff" />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {note.images.length === 0 ? (
          <ThemedView style={styles.emptyImages}>
            <ThemedView style={[styles.emptyIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <IconSymbol name="camera" size={48} color={colors.iconMuted} />
            </ThemedView>
            <ThemedText type="heading" style={styles.emptyText}>No images yet</ThemedText>
            <ThemedText type="body" style={styles.emptySubtext}>
              Capture text images to start building your notes
            </ThemedText>
          </ThemedView>
        ) : (
          note.images.map((image, index) => (
            <ThemedView key={image.id} style={[styles.imageContainer, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <ThemedView style={styles.imageActions}>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  onPress={() => editImageDescription(image)}
                >
                  <IconSymbol name="pencil" size={14} color={colors.tint} />
                  <ThemedText type="caption" style={[styles.editButtonText, { color: colors.tint }]}>Edit Description</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteImageButton}
                  onPress={() => deleteImage(image.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <IconSymbol name="trash" size={14} color={colors.destructive} />
                </TouchableOpacity>
              </ThemedView>
              {image.description ? (
                <ThemedView style={[styles.descriptionContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <ThemedText type="body" style={[styles.description, { color: colors.text }]}>{image.description}</ThemedText>
                </ThemedView>
              ) : (
                <ThemedView style={[styles.descriptionContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <ThemedText type="body" style={[styles.noDescription, { color: colors.textMuted }]}>Tap "Edit Description" to add notes</ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          ))
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <ThemedText type="subtitle" style={[styles.modalTitle, { color: colors.text }]}>
              Edit Description
            </ThemedText>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.backgroundSecondary, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Describe what you see in this image..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              autoFocus
            />
            <ThemedView style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText type="label" style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.tint }]}
                onPress={saveDescription}
              >
                <ThemedText type="label" style={styles.saveButtonText}>Save</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 4,
  },
  pageNumber: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyImages: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  imageContainer: {
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  deleteImageButton: {
    padding: 8,
    borderRadius: 8,
  },
  descriptionContainer: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  noDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 120,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
