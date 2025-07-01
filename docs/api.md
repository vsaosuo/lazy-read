# Services API Documentation - Lazy Read App

## Overview

The Lazy Read app provides a service layer that abstracts data storage operations. The main service classes are:

- **StorageService**: High-level interface for all data operations
- **DatabaseService**: Low-level SQLite database operations
- **PDFService**: PDF generation for exporting notes

## StorageService

The `StorageService` is the main interface that should be used by components. It provides a unified API for all storage operations.

### Initialization

```typescript
import { StorageService } from '@/services/storage';

// Initialize the service (called automatically when needed)
await StorageService.initialize();
```

### Books Management

#### Get All Books
```typescript
const books: Book[] = await StorageService.getBooks();
```
Returns an array of all books, ordered by creation date (newest first).

#### Get Book by ID
```typescript
const book: Book | null = await StorageService.getBookById(bookId);
```
Returns a specific book or `null` if not found.

#### Save Book
```typescript
const book: Book = {
  id: 'unique-id',
  title: 'Book Title',
  author: 'Author Name',
  description: 'Optional description',
  createdAt: new Date(),
  updatedAt: new Date()
};

await StorageService.saveBook(book);
```
Saves a book (insert if new, update if exists).

#### Delete Book
```typescript
await StorageService.deleteBook(bookId);
```
Deletes a book and all associated notes and images.

### Notes Management

#### Get All Notes
```typescript
// Get all notes
const allNotes: Note[] = await StorageService.getNotes();

// Get notes for a specific book
const bookNotes: Note[] = await StorageService.getNotes(bookId);
```
Returns notes ordered by page number, then by creation date.

#### Get Note by ID
```typescript
const note: Note | null = await StorageService.getNoteById(noteId);
```
Returns a specific note with all its images, or `null` if not found.

#### Save Note
```typescript
const note: Note = {
  id: 'unique-id',
  bookId: 'book-id',
  title: 'Note Title',
  pageNumber: 42,
  images: [
    {
      id: 'image-id',
      uri: 'file://path/to/image.jpg',
      description: 'Image description'
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

await StorageService.saveNote(note);
```
Saves a note with all its images (insert if new, update if exists).

#### Delete Note
```typescript
await StorageService.deleteNote(noteId);
```
Deletes a note and all associated images.

### Utility Methods

#### Get Storage Statistics
```typescript
const stats = await StorageService.getStorageStats();
// Returns: { booksCount: number, notesCount: number, imagesCount: number }
```

#### Clear All Data
```typescript
await StorageService.clearAllData();
```
⚠️ **Warning**: This permanently deletes all data. Use with caution.

## DatabaseService

The `DatabaseService` provides low-level database operations. Generally, you should use `StorageService` instead, but this is available for advanced use cases.

### Database Management

```typescript
import { DatabaseService } from '@/services/database';

// Initialize database
await DatabaseService.initializeDatabase();

// Get database statistics
const stats = await DatabaseService.getDatabaseStats();

// Close database connection
await DatabaseService.closeDatabase();

// Clear all data
await DatabaseService.clearAllData();
```

### Direct Database Operations

The `DatabaseService` provides the same CRUD operations as `StorageService` but without the higher-level error handling and initialization checks.

## Error Handling

### StorageService Error Handling

The `StorageService` implements comprehensive error handling:

- **Automatic initialization**: Services initialize automatically when needed
- **Graceful degradation**: Read operations return empty arrays/null on errors
- **Error logging**: All errors are logged to console
- **Exception propagation**: Write operations throw exceptions on errors

### Example Error Handling

```typescript
try {
  await StorageService.saveBook(book);
  console.log('Book saved successfully');
} catch (error) {
  console.error('Failed to save book:', error);
  // Handle error appropriately
}

// Read operations handle errors gracefully
const books = await StorageService.getBooks(); // Returns [] on error
const book = await StorageService.getBookById('invalid-id'); // Returns null
```

## Best Practices

### 1. Use StorageService for All Operations
```typescript
// ✅ Good
import { StorageService } from '@/services/storage';
const books = await StorageService.getBooks();

// ❌ Avoid
import { DatabaseService } from '@/services/database';
const books = await DatabaseService.getBooks();
```

### 2. Handle Async Operations Properly
```typescript
// ✅ Good
const saveBook = async () => {
  try {
    await StorageService.saveBook(book);
    navigation.goBack();
  } catch (error) {
    Alert.alert('Error', 'Failed to save book');
  }
};

// ❌ Avoid
const saveBook = () => {
  StorageService.saveBook(book); // Not awaited
  navigation.goBack(); // Might execute before save completes
};
```

### 3. Generate Unique IDs
```typescript
import { generateUUID } from '@/utils/uuid';

const newBook: Book = {
  id: generateUUID(),
  title: 'New Book',
  author: 'Author',
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### 4. Update timestamps
```typescript
// When updating existing data
const updatedBook = {
  ...existingBook,
  title: 'Updated Title',
  updatedAt: new Date() // Always update this
};
```

## Performance Tips

### 1. Batch Operations
```typescript
// ✅ Good - batch multiple notes
const notes = createMultipleNotes();
for (const note of notes) {
  await StorageService.saveNote(note);
}

// ⚠️ Consider using transactions for large batches
```

### 2. Selective Loading
```typescript
// ✅ Load only what you need
const bookNotes = await StorageService.getNotes(bookId);

// ❌ Avoid loading unnecessary data
const allNotes = await StorageService.getNotes();
const bookNotes = allNotes.filter(note => note.bookId === bookId);
```

### 3. Cache Results When Appropriate
```typescript
// In components, consider using state to cache results
const [books, setBooks] = useState<Book[]>([]);

useEffect(() => {
  const loadBooks = async () => {
    const result = await StorageService.getBooks();
    setBooks(result);
  };
  loadBooks();
}, []);
```

## Testing

### Mock StorageService for Testing
```typescript
// Mock implementation for tests
jest.mock('@/services/storage', () => ({
  StorageService: {
    getBooks: jest.fn(() => Promise.resolve([])),
    saveBook: jest.fn(() => Promise.resolve()),
    // ... other methods
  },
}));
```

### Database Testing
```typescript
// Clear data before/after tests
beforeEach(async () => {
  await StorageService.clearAllData();
});
```

## Migration from AsyncStorage

This app has been fully migrated from AsyncStorage to SQLite. The migration system has been removed. If you're upgrading from an older version:

1. The app will automatically use SQLite for all new data
2. Old AsyncStorage data can be manually exported if needed before upgrading
3. All APIs remain the same - only the underlying storage changed
