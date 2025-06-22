import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

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

  const loadBookAndNotes = async () => {
    if (!id) return;
    
    try {
      const books = await StorageService.getBooks();
      const foundBook = books.find(b => b.id === id);
      setBook(foundBook || null);
      
      const bookNotes = await StorageService.getNotes(id);
      setNotes(bookNotes.sort((a, b) => a.pageNumber - b.pageNumber));
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
      'Enter note title:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Next',
          onPress: (title) => {
            if (title?.trim()) {
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
                          title: title.trim(),
                          pageNumber,
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
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!book) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Book not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="chevron.left" size={20} color="#64748b" />
        </TouchableOpacity>
        <ThemedView style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportPDF}>
            <IconSymbol name="square.and.arrow.up" size={18} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
            <IconSymbol name="plus" size={18} color="#ffffff" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.bookInfo}>
        <ThemedText type="title" style={styles.bookTitle}>
          {book.title}
        </ThemedText>
        <ThemedText type="body" style={styles.bookAuthor}>by {book.author}</ThemedText>
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statItem}>
            <ThemedText type="caption" style={styles.statLabel}>Notes</ThemedText>
            <ThemedText type="label" style={styles.statValue}>{notes.length}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statDivider} />
          <ThemedView style={styles.statItem}>
            <ThemedText type="caption" style={styles.statLabel}>Images</ThemedText>
            <ThemedText type="label" style={styles.statValue}>
              {notes.reduce((total, note) => total + note.images.length, 0)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ScrollView 
        style={styles.notesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.notesListContent}
      >
        {notes.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedView style={styles.emptyIconContainer}>
              <IconSymbol name="note.text" size={48} color="#cbd5e1" />
            </ThemedView>
            <ThemedText type="heading" style={styles.emptyText}>No notes yet</ThemedText>
            <ThemedText type="body" style={styles.emptySubtext}>
              Start taking notes for this book
            </ThemedText>
          </ThemedView>
        ) : (
          notes.map((note, index) => (
            <TouchableOpacity
              key={note.id}
              style={[
                styles.noteItem,
                { marginTop: index === 0 ? 0 : 12 }
              ]}
              onPress={() => handleNotePress(note)}
              activeOpacity={0.8}
            >
              <ThemedView style={styles.noteHeader}>
                <ThemedView style={styles.noteInfo}>
                  <ThemedText type="label" style={styles.noteTitle} numberOfLines={2}>
                    {note.title}
                  </ThemedText>
                  <ThemedView style={styles.noteMetadata}>
                    <ThemedText type="caption" style={styles.pageNumber}>
                      Page {note.pageNumber}
                    </ThemedText>
                    <ThemedView style={styles.metadataDot} />
                    <ThemedText type="caption" style={styles.imageCount}>
                      {note.images.length} {note.images.length === 1 ? 'image' : 'images'}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteNote(note)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol name="trash" size={16} color="#ef4444" />
                </TouchableOpacity>
              </ThemedView>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookInfo: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  bookTitle: {
    color: '#1e293b',
    marginBottom: 8,
  },
  bookAuthor: {
    color: '#64748b',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  notesList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  notesListContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  noteItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteInfo: {
    flex: 1,
    marginRight: 12,
  },
  noteTitle: {
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 20,
  },
  noteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageNumber: {
    color: '#2563eb',
  },
  metadataDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  imageCount: {
    color: '#64748b',
  },
  deleteButton: {
    padding: 4,
  },
});
