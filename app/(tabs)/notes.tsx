import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StorageService } from '@/services/storage';
import { Note, NoteImage } from '@/types';
import { generateId } from '@/utils/uuid';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function NotesScreen() {
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editTextContent, setEditTextContent] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleText, setEditTitleText] = useState('');

  useEffect(() => {
    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  const loadNote = async () => {
    if (!noteId) return;
    
    setLoading(true);
    try {
      const foundNote = await StorageService.getNoteById(noteId);
      setNote(foundNote);
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
      setEditingImageId(null);
      setEditDescription('');
    } catch (error) {
      console.error('Error saving description:', error);
      Alert.alert('Error', 'Failed to save description');
    }
  };

  const cancelEditDescription = () => {
    setEditingImageId(null);
    setEditDescription('');
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

  const addTextNote = () => {
    if (!note) return;
    
    const newTextEntry: NoteImage = {
      id: generateId(),
      uri: '', // Empty uri indicates this is a text-only entry
      description: '',
    };

    setEditingImageId(newTextEntry.id);
    setEditDescription('');
    
    const updatedNote = {
      ...note,
      images: [...note.images, newTextEntry],
      updatedAt: new Date(),
    };
    
    setNote(updatedNote);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Content',
      'Choose what to add to your note:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add Text Note',
          onPress: addTextNote,
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

  const editNoteTitle = () => {
    if (!note) return;
    setEditingTitle(true);
    setEditTitleText(note.title);
  };

  const saveTitleEdit = async () => {
    if (!note || !editTitleText.trim()) return;

    try {
      const updatedNote = {
        ...note,
        title: editTitleText.trim(),
        updatedAt: new Date(),
      };

      await StorageService.saveNote(updatedNote);
      setNote(updatedNote);
      setEditingTitle(false);
      setEditTitleText('');
    } catch (error) {
      console.error('Error saving title:', error);
      Alert.alert('Error', 'Failed to save title');
    }
  };

  const cancelTitleEdit = () => {
    setEditingTitle(false);
    setEditTitleText('');
  };

  if (!noteId) {
    return (
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <LinearGradient
          colors={colorScheme === 'dark' 
            ? ['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.9)', 'rgba(51, 65, 85, 0.85)']
            : ['rgba(248, 250, 252, 0.95)', 'rgba(241, 245, 249, 0.9)', 'rgba(226, 232, 240, 0.85)']
          }
          style={styles.gradientBackground}
        >
          <View style={styles.emptyStateContainer}>
            <View style={[styles.floatingCard, { backgroundColor: colors.background + '40' }]}>
              <BlurView intensity={20} style={styles.blurContainer}>
                <View style={[styles.iconCircle, { backgroundColor: colors.tint + '20' }]}>
                  <IconSymbol name="doc.text" size={64} color={colors.tint} />
                </View>
                <ThemedText type="title" style={[styles.emptyTitle, { color: colors.text }]}>
                  Markdown Note Editor
                </ThemedText>
                <ThemedText type="body" style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Select a note to create rich markdown documentation with embedded images
                </ThemedText>
              </BlurView>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (loading || !note) {
    return (
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <LinearGradient
          colors={colorScheme === 'dark' 
            ? ['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.9)']
            : ['rgba(248, 250, 252, 0.95)', 'rgba(241, 245, 249, 0.9)']
          }
          style={styles.gradientBackground}
        >
          <View style={styles.loadingContainer}>
            <ThemedText type="body" style={[styles.loadingText, { color: colors.textSecondary }]}>
              {loading ? 'Loading your notes...' : 'Note not found'}
            </ThemedText>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['rgba(15, 23, 42, 0.98)', 'rgba(30, 41, 59, 0.95)', 'rgba(51, 65, 85, 0.92)']
          : ['rgba(255, 255, 255, 0.98)', 'rgba(248, 250, 252, 0.95)', 'rgba(241, 245, 249, 0.92)']
        }
        style={styles.gradientBackground}
      >
        {/* Floating toolbar */}
        <BlurView intensity={15} style={[styles.floatingToolbar, { backgroundColor: colors.background + '20' }]}>
          <View style={styles.toolbarContent}>
            <View style={styles.noteInfoSection}>
              <IconSymbol name="doc.text" size={20} color={colors.tint} />
              <ThemedText type="defaultSemiBold" style={[styles.toolbarTitle, { color: colors.text }]} numberOfLines={1}>
                {note.title}
              </ThemedText>
            </View>
            
            <View style={styles.toolbarActions}>
              <TouchableOpacity 
                style={[styles.toolbarButton, { backgroundColor: colors.tint }]}
                onPress={showImageOptions}
              >
                <IconSymbol name="plus" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>

        {/* Notes viewer */}
        <View style={styles.editorContainer}>
          <View style={[styles.editorCard, { backgroundColor: colors.background + 'F0' }]}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingContainer}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <ScrollView 
                style={styles.viewerScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.viewerContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              >
                {note.images.length === 0 ? (
                  <View style={styles.emptyEditor}>
                    <View style={[styles.emptyEditorIcon, { backgroundColor: colors.tint + '15' }]}>
                      <IconSymbol name="doc.text" size={48} color={colors.tint} />
                    </View>
                    <ThemedText type="subtitle" style={[styles.emptyEditorTitle, { color: colors.text }]}>
                      Create Your First Entry
                    </ThemedText>
                    <ThemedText type="body" style={[styles.emptyEditorSubtitle, { color: colors.textSecondary }]}>
                      Capture images and build comprehensive notes with descriptions, insights, and connections
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.markdownViewer}>
                    <View style={styles.documentHeader}>
                      <View style={[styles.documentTitleSection, { borderBottomColor: colors.border + '30' }]}>
                        {editingTitle ? (
                          <View style={styles.titleEditContainer}>
                            <TextInput
                              style={[styles.titleEditInput, { 
                                backgroundColor: colors.background + '80',
                                borderColor: colors.tint + '40',
                                color: colors.text 
                              }]}
                              value={editTitleText}
                              onChangeText={setEditTitleText}
                              placeholder="Enter note title..."
                              placeholderTextColor={colors.textSecondary}
                              autoFocus
                              returnKeyType="done"
                              onSubmitEditing={saveTitleEdit}
                              blurOnSubmit={true}
                            />
                            <View style={styles.titleEditActions}>
                              <TouchableOpacity
                                style={[styles.titleActionButton, styles.cancelTitleButton, { borderColor: colors.border }]}
                                onPress={cancelTitleEdit}
                              >
                                <IconSymbol name="xmark" size={14} color={colors.textSecondary} />
                                <ThemedText type="caption" style={[styles.titleActionText, { color: colors.textSecondary }]}>
                                  Cancel
                                </ThemedText>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.titleActionButton, styles.saveTitleButton, { backgroundColor: colors.tint }]}
                                onPress={saveTitleEdit}
                              >
                                <IconSymbol name="checkmark" size={14} color="#ffffff" />
                                <ThemedText type="caption" style={[styles.titleActionText, { color: '#ffffff' }]}>
                                  Save
                                </ThemedText>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity onPress={editNoteTitle} style={styles.titleContainer}>
                            <ThemedText type="title" style={[styles.viewerTitle, { color: colors.text }]}>
                              {note.title}
                            </ThemedText>
                            <View style={[styles.editTitleIndicator, { backgroundColor: colors.tint + '15' }]}>
                              <IconSymbol name="pencil" size={14} color={colors.tint} />
                              {/* <ThemedText type="caption" style={[styles.editTitleText, { color: colors.tint }]}>
                                Tap to edit
                              </ThemedText> */}
                            </View>
                          </TouchableOpacity>
                        )}
                        
                        <View>
                          <IconSymbol name="book" size={16} color={colors.tint} />
                          <ThemedText type="caption" style={[ { color: colors.tint }]}>
                            Page {note.pageNumber}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.documentContent}>
                      {note.images.map((entry, index) => (
                        <View key={entry.id} style={[styles.imageSection, { backgroundColor: colors.background + '40' }]}>
                          <View style={styles.imageSectionHeader}>
                            <View style={[styles.sectionNumber, { backgroundColor: colors.tint + '20' }]}>
                              <ThemedText type="caption" style={[styles.sectionNumberText, { color: colors.tint }]}>
                                {index + 1}
                              </ThemedText>
                            </View>
                            {/* <ThemedText style={[styles.imageSectionTitle, { color: colors.text }]}>
                              {entry.uri ? 'Image Entry' : 'Text Note'}
                            </ThemedText> */}
                          </View>
                          
                          {entry.uri ? (
                            <View style={styles.imageContainer}>
                              <Image source={{ uri: entry.uri }} style={styles.markdownImage} />
                              <View style={styles.imageActions}>
                                <TouchableOpacity
                                  style={[styles.imageActionButton, { backgroundColor: colors.destructive + '15' }]}
                                  onPress={() => deleteImage(entry.id)}
                                >
                                  <IconSymbol name="trash" size={14} color={colors.destructive} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : null}
                          
                          <View style={[styles.descriptionBlock, { backgroundColor: colors.background + '60' }]}>
                            {editingImageId === entry.id ? (
                              <View style={styles.inlineEditContainer}>
                                <View style={styles.descriptionHeader}>
                                  <IconSymbol name="pencil" size={16} color={colors.tint} />
                                  <ThemedText type="caption" style={[styles.descriptionLabel, { color: colors.tint }]}>
                                    {entry.uri ? 'EDITING DESCRIPTION' : 'EDITING TEXT NOTE'}
                                  </ThemedText>
                                </View>
                                <TextInput
                                  style={[styles.inlineTextInput, { 
                                    backgroundColor: colors.background + '80',
                                    borderColor: colors.tint + '40',
                                    color: colors.text,
                                    minHeight: entry.uri ? 160 : 120
                                  }]}
                                  value={editDescription}
                                  onChangeText={setEditDescription}
                                  placeholder={entry.uri ? 
                                    "Describe what you see, key insights, or important details..." :
                                    "Write your thoughts, ideas, or notes here..."
                                  }
                                  placeholderTextColor={colors.textSecondary}
                                  multiline
                                  numberOfLines={entry.uri ? 4 : 3}
                                  autoFocus
                                  returnKeyType="default"
                                  blurOnSubmit={false}
                                  scrollEnabled={false}
                                />
                                <View style={styles.inlineEditActions}>
                                  <TouchableOpacity
                                    style={[styles.inlineActionButton, styles.cancelInlineButton, { borderColor: colors.border }]}
                                    onPress={() => {
                                      if (!entry.uri && !entry.description) {
                                        // If it's a new text entry with no content, delete it
                                        deleteImage(entry.id);
                                      } else {
                                        cancelEditDescription();
                                      }
                                    }}
                                  >
                                    <IconSymbol name="xmark" size={14} color={colors.textSecondary} />
                                    <ThemedText type="caption" style={[styles.inlineActionText, { color: colors.textSecondary }]}>
                                      {!entry.uri && !entry.description ? 'Delete' : 'Cancel'}
                                    </ThemedText>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.inlineActionButton, styles.saveInlineButton, { backgroundColor: colors.tint }]}
                                    onPress={saveDescription}
                                  >
                                    <IconSymbol name="checkmark" size={14} color="#ffffff" />
                                    <ThemedText type="caption" style={[styles.inlineActionText, { color: '#ffffff' }]}>
                                      Save
                                    </ThemedText>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ) : (
                              <View>
                                {entry.description ? (
                                  <View>
                                    <View style={styles.descriptionHeader}>
                                      <IconSymbol name={entry.uri ? "text.alignleft" : "doc.text"} size={16} color={colors.textSecondary} />
                                      <ThemedText type="caption" style={[styles.descriptionLabel, { color: colors.textSecondary }]}>
                                        {entry.uri ? 'DESCRIPTION' : 'TEXT NOTE'}
                                      </ThemedText>
                                      <TouchableOpacity
                                        style={[styles.editDescriptionButton, { backgroundColor: colors.tint + '15' }]}
                                        onPress={() => editImageDescription(entry)}
                                      >
                                        <IconSymbol name="pencil" size={12} color={colors.tint} />
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={[styles.editDescriptionButton, { backgroundColor: colors.destructive + '15', marginLeft: 8 }]}
                                        onPress={() => deleteImage(entry.id)}
                                      >
                                        <IconSymbol name="trash" size={12} color={colors.destructive} />
                                      </TouchableOpacity>
                                    </View>
                                    <ThemedText type="body" style={[styles.markdownDescription, { color: colors.text }]}>
                                      {entry.description}
                                    </ThemedText>
                                  </View>
                                ) : (
                                  <TouchableOpacity onPress={() => editImageDescription(entry)} style={styles.addDescriptionPromptContainer}>
                                    <IconSymbol name="plus.circle" size={20} color={colors.textSecondary} />
                                    <ThemedText type="caption" style={[styles.addDescriptionText, { color: colors.textSecondary }]}>
                                      {entry.uri ? 'Add description for this image...' : 'Add text content...'}
                                    </ThemedText>
                                  </TouchableOpacity>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                      
                      {/* Add extra padding when editing to ensure buttons are visible above keyboard */}
                      {editingImageId && <View style={styles.keyboardSpacer} />}
                    </View>
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    paddingTop: 50,
  },
  floatingToolbar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 10,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  noteInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  toolbarTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorContainer: {
    flex: 1,
    marginTop: 120,
  },
  editorCard: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  viewerScroll: {
    flex: 1,
  },
  viewerContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  keyboardSpacer: {
    height: 300, // Extra space to ensure content is visible above keyboard
  },
  emptyEditor: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyEditorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyEditorTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyEditorSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  markdownViewer: {
    flex: 1,
  },
  documentHeader: {
    backgroundColor: 'transparent',
  },
  documentTitleSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomWidth: 1,
  },
  viewerTitle: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  editTitleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 8,
  },
  editTitleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  titleEditContainer: {
    marginBottom: 16,
    gap: 16,
  },
  titleEditInput: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  titleEditActions: {
    flexDirection: 'row',
    gap: 12,
  },
  titleActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  cancelTitleButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  saveTitleButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titleActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  documentContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
  },
  imageSection: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    gap: 12,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  imageSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  imageContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  markdownImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  imageActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionBlock: {
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  inlineEditContainer: {
    gap: 16,
  },
  inlineTextInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 160,
    maxHeight: 220,
    width: '100%',
  },
  inlineEditActions: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  cancelInlineButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  saveInlineButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inlineActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editDescriptionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  markdownDescription: {
    fontSize: 16,
    lineHeight: 26,
  },
  addDescriptionPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  addDescriptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  // ...existing empty state styles...
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  floatingCard: {
    borderRadius: 30,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 350,
  },
  blurContainer: {
    padding: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalBlurBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalGradient: {
    padding: 30,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 25,
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalTitleUnderline: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  enhancedTextInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 160,
    maxHeight: 240,
    marginBottom: 25,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  modalActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cancelModalButton: {
    borderWidth: 1.5,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveModalButton: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelModalText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveModalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});