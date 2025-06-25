import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, ScrollView, StatusBar, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { StorageService } from '@/services/storage';
import { Book } from '@/types';
import { generateId } from '@/utils/uuid';

const { width } = Dimensions.get('window');

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
        <ThemedText style={styles.loadingText}>Loading your library...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header with minimal design */}
      <ThemedView style={styles.headerContainer}>
        <ThemedView style={styles.headerContent}>
          <ThemedView style={styles.headerTextContainer}>
            <ThemedText type="title" style={styles.headerTitle}>
              My Library
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </ThemedText>
          </ThemedView>
          
          <TouchableOpacity style={styles.minimalistAddButton} onPress={handleAddBook}>
            <IconSymbol name="plus" size={20} color="#4a5568" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Books content area */}
      <ScrollView 
        style={styles.booksList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksListContent}
      >
        {books.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedView style={styles.emptyIllustration}>
              <ThemedText style={styles.emptyEmoji}>📖</ThemedText>
              <ThemedView style={styles.emptyFloatingDots}>
                <ThemedView style={[styles.dot, styles.dot1]} />
                <ThemedView style={[styles.dot, styles.dot2]} />
                <ThemedView style={[styles.dot, styles.dot3]} />
              </ThemedView>
            </ThemedView>
            <ThemedText type="heading" style={styles.emptyTitle}>
              Your reading adventure begins here
            </ThemedText>
            <ThemedText style={styles.emptyMessage}>
              Create your first book and start capturing those brilliant insights ✨
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.booksGrid}>
            {books.map((book, index) => (
              <TouchableOpacity
                key={book.id}
                style={[
                  styles.modernBookCard,
                  { 
                    marginTop: Math.floor(index / 2) === 0 ? 20 : 20,
                    marginLeft: index % 2 === 0 ? 0 : 12,
                    marginRight: index % 2 === 1 ? 0 : 12,
                  }
                ]}
                onPress={() => handleBookPress(book)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={index % 3 === 0 ? ['#667eea', '#764ba2'] : 
                          index % 3 === 1 ? ['#f093fb', '#f5576c'] : 
                          ['#4facfe', '#00f2fe']}
                  style={styles.bookCardGradient}
                >
                  <ThemedView style={styles.bookCardHeader}>
                    <ThemedView style={styles.bookIconWrapper}>
                      <ThemedText style={styles.bookEmoji}>
                        {index % 4 === 0 ? '📚' : index % 4 === 1 ? '📖' : index % 4 === 2 ? '📝' : '🎯'}
                      </ThemedText>
                    </ThemedView>
                    <TouchableOpacity
                      style={styles.modernDeleteButton}
                      onPress={() => handleDeleteBook(book)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <IconSymbol name="trash" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </ThemedView>
                  
                  <ThemedView style={styles.bookCardContent}>
                    <ThemedText style={styles.modernBookTitle} numberOfLines={3}>
                      {book.title}
                    </ThemedText>
                    <ThemedText style={styles.modernBookAuthor} numberOfLines={2}>
                      by {book.author}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.bookCardFooter}>
                    <ThemedText style={styles.readMoreText}>Tap to explore →</ThemedText>
                  </ThemedView>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerContainer: {
    paddingTop: (StatusBar.currentHeight || 0) + 50,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  headerTextContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    // color: '#1a202c',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '500',
  },
  minimalistAddButton: {
    backgroundColor: '#ffffff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contentContainer: {
    flex: 1,
    marginTop: -20,
    backgroundColor: 'transparent',
  },
  booksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  booksListContent: {
    paddingBottom: 120,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
    backgroundColor: 'transparent',
  },
  emptyIllustration: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyFloatingDots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
  },
  dot1: {
    top: 20,
    right: 10,
    backgroundColor: '#ff6b6b',
  },
  dot2: {
    top: 50,
    left: 15,
    backgroundColor: '#4facfe',
  },
  dot3: {
    bottom: 30,
    right: 30,
    backgroundColor: '#f093fb',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#2d3748',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#718096',
    fontWeight: '500',
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  modernBookCard: {
    width: (width - 64) / 2,
    height: 220,
    marginBottom: 20,
  },
  bookCardGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  bookCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  bookIconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookEmoji: {
    fontSize: 18,
  },
  modernDeleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCardContent: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  modernBookTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  modernBookAuthor: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  bookCardFooter: {
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  readMoreText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});