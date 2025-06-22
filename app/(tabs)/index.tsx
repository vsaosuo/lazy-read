import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { StorageService } from '@/services/storage';
import { Book } from '@/types';
import { generateId } from '@/utils/uuid';

export default function BooksScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadBooks = async () => {
    try {
      const loadedBooks = await StorageService.getBooks();
      setBooks(loadedBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [])
  );

  const handleAddBook = () => {
    Alert.prompt(
      'Add New Book',
      'Enter book title:',
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
                'Add New Book',
                'Enter author name:',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Create',
                    onPress: async (author) => {
                      if (author?.trim()) {
                        const newBook: Book = {
                          id: generateId(),
                          title: title.trim(),
                          author: author.trim(),
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        };
                        try {
                          await StorageService.saveBook(newBook);
                          loadBooks();
                        } catch (error) {
                          Alert.alert('Error', 'Failed to create book');
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

  const handleDeleteBook = (book: Book) => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${book.title}"? This will also delete all associated notes.`,
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
              await StorageService.deleteBook(book.id);
              loadBooks();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete book');
            }
          },
        },
      ]
    );
  };

  const handleBookPress = (book: Book) => {
    router.push(`/book/${book.id}` as any);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading books...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView>
          <ThemedText type="title" style={styles.headerTitle}>My Library</ThemedText>
          <ThemedText type="caption" style={styles.headerSubtitle}>
            {books.length} {books.length === 1 ? 'book' : 'books'}
          </ThemedText>
        </ThemedView>
        <TouchableOpacity style={styles.addButton} onPress={handleAddBook}>
          <IconSymbol name="plus" size={20} color="#ffffff" />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView 
        style={styles.booksList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksListContent}
      >
        {books.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedView style={styles.emptyIconContainer}>
              <IconSymbol name="book" size={48} color="#cbd5e1" />
            </ThemedView>
            <ThemedText type="heading" style={styles.emptyText}>Start your reading journey</ThemedText>
            <ThemedText type="body" style={styles.emptySubtext}>
              Add your first book to begin taking notes
            </ThemedText>
          </ThemedView>
        ) : (
          books.map((book, index) => (
            <TouchableOpacity
              key={book.id}
              style={[
                styles.bookItem,
                { 
                  marginTop: index === 0 ? 0 : 16,
                }
              ]}
              onPress={() => handleBookPress(book)}
              activeOpacity={0.8}
            >
              <ThemedView style={styles.bookIconContainer}>
                <IconSymbol name="book" size={24} color="#64748b" />
              </ThemedView>
              <ThemedView style={styles.bookInfo}>
                <ThemedText type="label" style={styles.bookTitle} numberOfLines={2}>
                  {book.title}
                </ThemedText>
                <ThemedText type="caption" style={styles.bookAuthor} numberOfLines={1}>
                  {book.author}
                </ThemedText>
              </ThemedView>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteBook(book)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="trash" size={18} color="#ef4444" />
              </TouchableOpacity>
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
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#64748b',
  },
  addButton: {
    backgroundColor: '#2563eb',
    width: 44,
    height: 44,
    borderRadius: 22,
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
  booksList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  booksListContent: {
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
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#64748b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bookIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
    marginRight: 12,
  },
  bookTitle: {
    color: '#1e293b',
    marginBottom: 4,
    lineHeight: 20,
  },
  bookAuthor: {
    color: '#64748b',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
});
