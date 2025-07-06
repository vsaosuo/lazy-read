import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PDFService } from '@/services/pdf';
import { StorageService } from '@/services/storage';
import { Book, Note } from '@/types';
import { generateId } from '@/utils/uuid';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadBookAndNotes = async () => {
    if (!id) return;
    
    try {
      const books = await StorageService.getBooks();
      const foundBook = books.find(b => b.id === id);
      setBook(foundBook || null);
      
      const bookNotes = await StorageService.getNotes(id);
      // Notes are already sorted by sort_order ASC, page_number ASC, created_at DESC from the database
      setNotes(bookNotes);
    } catch (error) {
      console.error('Error loading book and notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBookAndNotes();
    }, [id])
  );

  const handleAddNote = () => {
    Alert.prompt(
      'Add New Note',
      'Enter page number:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Create',
          onPress: async (pageStr) => {
            const pageNumber = parseInt(pageStr || '1', 10);
            if (pageNumber > 0) {
              const newNote: Note = {
                id: generateId(),
                bookId: id!,
                title: "Page " + pageNumber + "'s Note",
                pageNumber,
                sortOrder: 0, // Will be set by the database service
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              try {
                await StorageService.saveNote(newNote);
                router.push(`/(tabs)/notes?noteId=${newNote.id}` as any);
              } catch (error) {
                Alert.alert('Error', 'Failed to create note');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title}"?`,
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
              await StorageService.deleteNote(note.id);
              loadBookAndNotes();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const handleNotePress = (note: Note) => {
    router.push(`/(tabs)/notes?noteId=${note.id}` as any);
  };

  const handleExportPDF = async () => {
    if (!book || notes.length === 0) {
      Alert.alert('Export PDF', 'No notes to export');
      return;
    }
    
    try {
      await PDFService.exportBookNotes(book, notes);
      Alert.alert('Success', 'PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={StyleSheet.absoluteFillObject}
        />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!book) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={StyleSheet.absoluteFillObject}
        />
        <ThemedText style={styles.loadingText}>Book not found</ThemedText>
      </ThemedView>
    );
  }

  return (
     <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Floating Navigation */}
        <ThemedView style={[styles.floatingNav, { top: insets.top + 10 }]}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="chevron.left" size={22} color="#ffffff" />
          </TouchableOpacity>
          <ThemedView style={styles.navActions}>
            <TouchableOpacity style={styles.navActionButton} onPress={handleExportPDF}>
              <IconSymbol name="square.and.arrow.up" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addFloatingButton} onPress={handleAddNote}>
              <IconSymbol name="plus" size={20} color="#667eea" />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 80 }]}
          scrollIndicatorInsets={{ top: insets.top + 70 }}
          contentInsetAdjustmentBehavior="never"
          bounces={false}
        >
          {/* Hero Book Card */}
          <ThemedView style={styles.heroCard}>
            {book.coverUri ? (
              <ThemedView style={styles.bookCoverWrapper}>
                <Image 
                  source={{ uri: book.coverUri }} 
                  style={styles.heroBookCover}
                  resizeMode="cover"
                />
              </ThemedView>
            ) : (
              <ThemedView style={styles.bookIconContainer}>
                <IconSymbol name="book.closed" size={32} color="#667eea" />
              </ThemedView>
            )}
            <ThemedText style={styles.heroTitle}>{book.title}</ThemedText>
            <ThemedText style={styles.heroAuthor}>by {book.author}</ThemedText>
            
            {/* Floating Stats */}
            <ThemedView style={styles.floatingStats}>
              <ThemedView style={styles.statBubble}>
                <ThemedText style={styles.statNumber}>{notes.length}</ThemedText>
                <ThemedText style={styles.statLabel}>Notes</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statBubble}>
                <ThemedText style={styles.statNumber}>
                  {notes.reduce((total, note) => total + note.images.length, 0)}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Photos</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Notes Section Header */}
          <ThemedView style={styles.notesSection}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Your Notes</ThemedText>
            </ThemedView>
            
            {notes.length === 0 && (
              <ThemedView style={styles.emptyCard}>
                <ThemedView style={styles.emptyIconWrapper}>
                  <IconSymbol name="note.text" size={40} color="#667eea" />
                </ThemedView>
                <ThemedText style={styles.emptyTitle}>Start Your Journey</ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Capture your thoughts and insights as you read
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          {/* Notes Grid - Outside ScrollView to avoid nesting virtualized lists */}
          {notes.length > 0 && (
            <ThemedView style={styles.notesGridContainer}>
              <ScrollView
                style={styles.notesScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.notesScrollContent}
              >
                <ThemedView style={styles.notesGrid}>
                  {notes.map((note, index) => (
                    <TouchableOpacity
                      key={note.id}
                      style={[
                        styles.noteCard,
                        {
                          transform: [{ rotate: `${(index % 2 === 0 ? -1 : 1) * 0.5}deg` }],
                          marginTop: index === 0 ? 0 : -8,
                          zIndex: notes.length - index
                        }
                      ]}
                      onPress={() => handleNotePress(note)}
                      activeOpacity={0.9}
                    >
                      <ThemedView style={styles.noteCardHeader}>
                        <ThemedView style={styles.notePageBadge}>
                          <ThemedText style={styles.notePageText}>p.{note.pageNumber}</ThemedText>
                        </ThemedView>

                        <ThemedText style={styles.noteCardTitle} numberOfLines={3}>
                          {note.title}
                        </ThemedText>

                        <TouchableOpacity
                          style={styles.noteDeleteButton}
                          onPress={() => handleDeleteNote(note)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <IconSymbol name="trash" size={14} color="#ff6b6b" />
                        </TouchableOpacity>
                      </ThemedView>
                      {note.images.length > 0 && note.images[0].description && (
                        <ThemedText style={{ color: '#8b92b8', fontSize: 12 }}>
                          {note.images[0].description
                            ?.replace(/\n/g, ' ')
                            .trim()
                            .substring(0, 100) + (note.images[0].description?.length > 100 ? '...' : '')}
                        </ThemedText>
                      )}
                      {note.images.length > 0 && (
                        <ThemedView style={styles.noteImageIndicator}>                         
                          <ThemedText style={styles.noteImageCount}>
                            {note.images.length} {(note.images.length == 1) ? 'Note' : 'Notes'}
                          </ThemedText>
                        </ThemedView>
                      )}
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              </ScrollView>
            </ThemedView>
          )}
        </ScrollView>

        {/* Gradient Overlay to mask content behind navigation */}
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.8)', 'rgba(102, 126, 234, 0)']}
          style={[styles.topGradientOverlay, { height: insets.top + 80 }]}
          pointerEvents="none"
        />
      </ThemedView>
      </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'green',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  floatingNav: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  navActions: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  navActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  addFloatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 32,
  },
  bookIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f8faff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  heroAuthor: {
    fontSize: 16,
    color: '#667eea',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  floatingStats: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: 'transparent',
  },
  statBubble: {
    backgroundColor: '#f8faff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#8b92b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesSection: {
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8faff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#667eea',
    textAlign: 'center',
    lineHeight: 22,
  },
  notesGrid: {
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  noteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  notePageBadge: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  notePageText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  noteDeleteButton: {
    padding: 4,
  },
  noteCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    lineHeight: 22,
    marginBottom: 12,
  },
  noteImageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f8faff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  noteImageCount: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  bookCoverWrapper: {
    width: 80,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  heroBookCover: {
    width: '100%',
    height: '100%',
  },
  topGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  notesGridContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  notesScrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  notesScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
