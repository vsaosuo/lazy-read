import { Book, Note } from '@/types';
import { DatabaseService } from './database';

/**
 * Storage Service for Lazy Read App
 * 
 * This service provides a unified interface for data storage operations.
 * It uses SQLite database via expo-sqlite for persistence.
 */
export class StorageService {
  private static initialized = false;

  /**
   * Initialize the storage service
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize the database
      await DatabaseService.initializeDatabase();

      this.initialized = true;
      console.log('StorageService initialized successfully');
    } catch (error) {
      console.error('Error initializing StorageService:', error);
      throw error;
    }
  }

  /**
   * Ensure the service is initialized before any operation
   */
  private static async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // ===== BOOKS MANAGEMENT =====

  /**
   * Get all books from storage
   */
  static async getBooks(): Promise<Book[]> {
    try {
      await this.ensureInitialized();
      return await DatabaseService.getBooks();
    } catch (error) {
      console.error('Error loading books:', error);
      return [];
    }
  }

  /**
   * Get a single book by ID
   */
  static async getBookById(bookId: string): Promise<Book | null> {
    try {
      await this.ensureInitialized();
      return await DatabaseService.getBookById(bookId);
    } catch (error) {
      console.error('Error loading book:', error);
      return null;
    }
  }

  /**
   * Save a book to storage
   */
  static async saveBook(book: Book): Promise<void> {
    try {
      await this.ensureInitialized();
      await DatabaseService.saveBook(book);
    } catch (error) {
      console.error('Error saving book:', error);
      throw error;
    }
  }

  /**
   * Delete a book and all its associated notes
   */
  static async deleteBook(bookId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      await DatabaseService.deleteBook(bookId);
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  // ===== NOTES MANAGEMENT =====

  /**
   * Get notes for a specific book, or all notes if no bookId provided
   */
  static async getNotes(bookId?: string): Promise<Note[]> {
    try {
      await this.ensureInitialized();
      return await DatabaseService.getNotes(bookId);
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  }

  /**
   * Get a single note by ID
   */
  static async getNoteById(noteId: string): Promise<Note | null> {
    try {
      await this.ensureInitialized();
      return await DatabaseService.getNoteById(noteId);
    } catch (error) {
      console.error('Error loading note:', error);
      return null;
    }
  }

  /**
   * Save a note to storage
   */
  static async saveNote(note: Note): Promise<void> {
    try {
      await this.ensureInitialized();
      await DatabaseService.saveNote(note);
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  }

  /**
   * Delete a note and all its associated images
   */
  static async deleteNote(noteId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      await DatabaseService.deleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  /**
   * Update the sort order of notes within a book
   */
  static async updateNotesOrder(bookId: string, noteIds: string[]): Promise<void> {
    try {
      await this.ensureInitialized();
      await DatabaseService.updateNotesOrder(bookId, noteIds);
    } catch (error) {
      console.error('Error updating notes order:', error);
      throw error;
    }
  }

  /**
   * Update the sort order of images within a note
   */
  static async updateImagesOrder(noteId: string, imageIds: string[]): Promise<void> {
    try {
      await this.ensureInitialized();
      await DatabaseService.updateImagesOrder(noteId, imageIds);
    } catch (error) {
      console.error('Error updating images order:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    booksCount: number;
    notesCount: number;
    imagesCount: number;
  }> {
    try {
      await this.ensureInitialized();
      return await DatabaseService.getDatabaseStats();
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { booksCount: 0, notesCount: 0, imagesCount: 0 };
    }
  }

  /**
   * Clear all data from storage (useful for testing or reset)
   */
  static async clearAllData(): Promise<void> {
    try {
      await this.ensureInitialized();
      await DatabaseService.clearAllData();
    } catch (error) {
      console.error('Error clearing storage data:', error);
      throw error;
    }
  }
}
