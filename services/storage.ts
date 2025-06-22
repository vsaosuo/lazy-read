import { Book, Note } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKS_KEY = '@lazy_read_books';
const NOTES_KEY = '@lazy_read_notes';

export class StorageService {
  // Books management
  static async getBooks(): Promise<Book[]> {
    try {
      const booksJson = await AsyncStorage.getItem(BOOKS_KEY);
      if (!booksJson) return [];
      const books = JSON.parse(booksJson);
      return books.map((book: any) => ({
        ...book,
        createdAt: new Date(book.createdAt),
        updatedAt: new Date(book.updatedAt),
      }));
    } catch (error) {
      console.error('Error loading books:', error);
      return [];
    }
  }

  static async saveBook(book: Book): Promise<void> {
    try {
      const books = await this.getBooks();
      const existingIndex = books.findIndex(b => b.id === book.id);
      
      if (existingIndex >= 0) {
        books[existingIndex] = book;
      } else {
        books.push(book);
      }
      
      await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    } catch (error) {
      console.error('Error saving book:', error);
      throw error;
    }
  }

  static async deleteBook(bookId: string): Promise<void> {
    try {
      const books = await this.getBooks();
      const filteredBooks = books.filter(book => book.id !== bookId);
      await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(filteredBooks));
      
      // Also delete all notes for this book
      const notes = await this.getNotes();
      const filteredNotes = notes.filter(note => note.bookId !== bookId);
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filteredNotes));
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  // Notes management
  static async getNotes(bookId?: string): Promise<Note[]> {
    try {
      const notesJson = await AsyncStorage.getItem(NOTES_KEY);
      if (!notesJson) return [];
      const notes = JSON.parse(notesJson);
      const parsedNotes = notes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
      
      return bookId 
        ? parsedNotes.filter((note: Note) => note.bookId === bookId)
        : parsedNotes;
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  }

  static async saveNote(note: Note): Promise<void> {
    try {
      const notes = await this.getNotes();
      const existingIndex = notes.findIndex(n => n.id === note.id);
      
      if (existingIndex >= 0) {
        notes[existingIndex] = note;
      } else {
        notes.push(note);
      }
      
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  }

  static async deleteNote(noteId: string): Promise<void> {
    try {
      const notes = await this.getNotes();
      const filteredNotes = notes.filter(note => note.id !== noteId);
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filteredNotes));
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }
}
