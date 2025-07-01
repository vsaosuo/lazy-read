import { Book, Note, NoteImage } from '@/types';
import * as SQLite from 'expo-sqlite';

/**
 * Database Service for Lazy Read App
 * 
 * This service manages the SQLite database for storing books and notes.
 * It provides methods for CRUD operations on books and notes with their associated images.
 */
export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static readonly DB_NAME = 'lazy_read.db';

  /**
   * Initialize the database connection and create tables if they don't exist
   */
  static async initializeDatabase(): Promise<void> {
    try {
      if (!this.db) {
        this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
        await this.createTables();
        console.log('Database initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Create the necessary tables for the app
   */
  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Create books table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS books (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // Create notes table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          book_id TEXT NOT NULL,
          title TEXT NOT NULL,
          page_number INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
        );
      `);

      // Create note_images table to store image data
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS note_images (
          id TEXT PRIMARY KEY,
          note_id TEXT NOT NULL,
          uri TEXT NOT NULL,
          description TEXT NOT NULL,
          FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
        );
      `);

      // Create indexes for better performance
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes (book_id);
        CREATE INDEX IF NOT EXISTS idx_notes_page_number ON notes (page_number);
        CREATE INDEX IF NOT EXISTS idx_note_images_note_id ON note_images (note_id);
      `);

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Get the database instance, initialize if needed
   */
  private static async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initializeDatabase();
    }
    return this.db!;
  }

  // ===== BOOKS MANAGEMENT =====

  /**
   * Get all books from the database
   */
  static async getBooks(): Promise<Book[]> {
    try {
      const db = await this.getDatabase();
      const result = await db.getAllAsync('SELECT * FROM books ORDER BY created_at DESC');
      
      return result.map((row: any) => ({
        id: row.id,
        title: row.title,
        author: row.author,
        description: row.description,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
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
      const db = await this.getDatabase();
      const result = await db.getFirstAsync('SELECT * FROM books WHERE id = ?', [bookId]);
      
      if (!result) return null;
      
      const row = result as any;
      return {
        id: row.id,
        title: row.title,
        author: row.author,
        description: row.description,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } catch (error) {
      console.error('Error loading book:', error);
      return null;
    }
  }

  /**
   * Save a book to the database (insert or update)
   */
  static async saveBook(book: Book): Promise<void> {
    try {
      const db = await this.getDatabase();
      
      // Check if book exists
      const existing = await db.getFirstAsync('SELECT id FROM books WHERE id = ?', [book.id]);
      
      if (existing) {
        // Update existing book
        await db.runAsync(
          'UPDATE books SET title = ?, author = ?, description = ?, updated_at = ? WHERE id = ?',
          [book.title, book.author, book.description || null, book.updatedAt.toISOString(), book.id]
        );
      } else {
        // Insert new book
        await db.runAsync(
          'INSERT INTO books (id, title, author, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [book.id, book.title, book.author, book.description || null, book.createdAt.toISOString(), book.updatedAt.toISOString()]
        );
      }
    } catch (error) {
      console.error('Error saving book:', error);
      throw error;
    }
  }

  /**
   * Delete a book and all its associated notes and images
   */
  static async deleteBook(bookId: string): Promise<void> {
    try {
      const db = await this.getDatabase();
      
      // Start a transaction to ensure data consistency
      await db.withTransactionAsync(async () => {
        // Delete note images for all notes of this book
        await db.runAsync(`
          DELETE FROM note_images 
          WHERE note_id IN (SELECT id FROM notes WHERE book_id = ?)
        `, [bookId]);
        
        // Delete notes for this book
        await db.runAsync('DELETE FROM notes WHERE book_id = ?', [bookId]);
        
        // Delete the book
        await db.runAsync('DELETE FROM books WHERE id = ?', [bookId]);
      });
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
      const db = await this.getDatabase();
      let query = 'SELECT * FROM notes';
      let params: any[] = [];
      
      if (bookId) {
        query += ' WHERE book_id = ?';
        params.push(bookId);
      }
      
      query += ' ORDER BY page_number ASC, created_at DESC';
      
      const notesResult = await db.getAllAsync(query, params);
      
      // Get images for each note
      const notes: Note[] = [];
      for (const noteRow of notesResult) {
        const row = noteRow as any;
        const imagesResult = await db.getAllAsync(
          'SELECT * FROM note_images WHERE note_id = ? ORDER BY id',
          [row.id]
        );
        
        const images: NoteImage[] = imagesResult.map((imgRow: any) => ({
          id: imgRow.id,
          uri: imgRow.uri,
          description: imgRow.description,
        }));
        
        notes.push({
          id: row.id,
          bookId: row.book_id,
          title: row.title,
          pageNumber: row.page_number,
          images,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        });
      }
      
      return notes;
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  }

  /**
   * Get a single note by ID with its images
   */
  static async getNoteById(noteId: string): Promise<Note | null> {
    try {
      const db = await this.getDatabase();
      const noteResult = await db.getFirstAsync('SELECT * FROM notes WHERE id = ?', [noteId]);
      
      if (!noteResult) return null;
      
      const row = noteResult as any;
      
      // Get images for this note
      const imagesResult = await db.getAllAsync(
        'SELECT * FROM note_images WHERE note_id = ? ORDER BY id',
        [noteId]
      );
      
      const images: NoteImage[] = imagesResult.map((imgRow: any) => ({
        id: imgRow.id,
        uri: imgRow.uri,
        description: imgRow.description,
      }));
      
      return {
        id: row.id,
        bookId: row.book_id,
        title: row.title,
        pageNumber: row.page_number,
        images,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } catch (error) {
      console.error('Error loading note:', error);
      return null;
    }
  }

  /**
   * Save a note with its images to the database
   */
  static async saveNote(note: Note): Promise<void> {
    try {
      const db = await this.getDatabase();
      
      await db.withTransactionAsync(async () => {
        // Check if note exists
        const existing = await db.getFirstAsync('SELECT id FROM notes WHERE id = ?', [note.id]);
        
        if (existing) {
          // Update existing note
          await db.runAsync(
            'UPDATE notes SET book_id = ?, title = ?, page_number = ?, updated_at = ? WHERE id = ?',
            [note.bookId, note.title, note.pageNumber, note.updatedAt.toISOString(), note.id]
          );
          
          // Delete existing images
          await db.runAsync('DELETE FROM note_images WHERE note_id = ?', [note.id]);
        } else {
          // Insert new note
          await db.runAsync(
            'INSERT INTO notes (id, book_id, title, page_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [note.id, note.bookId, note.title, note.pageNumber, note.createdAt.toISOString(), note.updatedAt.toISOString()]
          );
        }
        
        // Insert images
        for (const image of note.images) {
          await db.runAsync(
            'INSERT INTO note_images (id, note_id, uri, description) VALUES (?, ?, ?, ?)',
            [image.id, note.id, image.uri, image.description]
          );
        }
      });
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
      const db = await this.getDatabase();
      
      await db.withTransactionAsync(async () => {
        // Delete note images
        await db.runAsync('DELETE FROM note_images WHERE note_id = ?', [noteId]);
        
        // Delete the note
        await db.runAsync('DELETE FROM notes WHERE id = ?', [noteId]);
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<{
    booksCount: number;
    notesCount: number;
    imagesCount: number;
  }> {
    try {
      const db = await this.getDatabase();
      
      const booksResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM books');
      const notesResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM notes');
      const imagesResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM note_images');
      
      return {
        booksCount: (booksResult as any)?.count || 0,
        notesCount: (notesResult as any)?.count || 0,
        imagesCount: (imagesResult as any)?.count || 0,
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { booksCount: 0, notesCount: 0, imagesCount: 0 };
    }
  }

  /**
   * Close the database connection
   */
  static async closeDatabase(): Promise<void> {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
        console.log('Database connection closed');
      }
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }

  /**
   * Clear all data from the database (useful for testing or reset)
   */
  static async clearAllData(): Promise<void> {
    try {
      const db = await this.getDatabase();
      
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM note_images');
        await db.runAsync('DELETE FROM notes');
        await db.runAsync('DELETE FROM books');
      });
      
      console.log('All data cleared from database');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }
}
