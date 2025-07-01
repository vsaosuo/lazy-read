# Database Documentation - Lazy Read App

## Overview

The Lazy Read app uses SQLite database via `expo-sqlite` for local data persistence. The database stores books, notes, and associated images in a relational structure that ensures data integrity and efficient querying.

## Database Schema

### Tables

#### 1. `books` Table
Stores information about books that users are reading.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique identifier for the book |
| `title` | TEXT | NOT NULL | Title of the book |
| `author` | TEXT | NOT NULL | Author of the book |
| `description` | TEXT | NULL | Optional description or summary |
| `created_at` | TEXT | NOT NULL | ISO timestamp when book was created |
| `updated_at` | TEXT | NOT NULL | ISO timestamp when book was last updated |

#### 2. `notes` Table
Stores notes taken for specific pages in books.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique identifier for the note |
| `book_id` | TEXT | NOT NULL, FK | References `books.id` |
| `title` | TEXT | NOT NULL | Title/summary of the note |
| `page_number` | INTEGER | NOT NULL | Page number the note refers to |
| `created_at` | TEXT | NOT NULL | ISO timestamp when note was created |
| `updated_at` | TEXT | NOT NULL | ISO timestamp when note was last updated |

**Foreign Key Constraint:**
- `book_id` REFERENCES `books(id)` ON DELETE CASCADE

#### 3. `note_images` Table
Stores images associated with notes (photos of pages, diagrams, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique identifier for the image |
| `note_id` | TEXT | NOT NULL, FK | References `notes.id` |
| `uri` | TEXT | NOT NULL | File URI or path to the image |
| `description` | TEXT | NOT NULL | Description or caption for the image |

**Foreign Key Constraint:**
- `note_id` REFERENCES `notes(id)` ON DELETE CASCADE

### Indexes

The following indexes are created for optimal query performance:

- `idx_notes_book_id` on `notes(book_id)` - For efficient book-to-notes queries
- `idx_notes_page_number` on `notes(page_number)` - For page-based note retrieval
- `idx_note_images_note_id` on `note_images(note_id)` - For efficient note-to-images queries

## Data Relationships

```
books (1) ──────── (many) notes (1) ──────── (many) note_images
  │                          │                          │
  ├─ id                      ├─ book_id (FK)           ├─ note_id (FK)
  ├─ title                   ├─ title                   ├─ uri
  ├─ author                  ├─ page_number             └─ description
  ├─ description             ├─ created_at
  ├─ created_at              └─ updated_at
  └─ updated_at
```

### Cascade Behavior

- **Deleting a book**: Automatically deletes all associated notes and their images
- **Deleting a note**: Automatically deletes all associated images

## TypeScript Interfaces

The database schema corresponds to the following TypeScript interfaces:

```typescript
interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Note {
  id: string;
  bookId: string;
  title: string;
  pageNumber: number;
  images: NoteImage[];
  createdAt: Date;
  updatedAt: Date;
}

interface NoteImage {
  id: string;
  uri: string;
  description: string;
}
```

## Database Operations

### Initialization

The database is automatically initialized when the app starts:

```typescript
await DatabaseService.initializeDatabase();
```

This creates the database file `lazy_read.db` and sets up all tables and indexes.

### Books Operations

- **Get all books**: `DatabaseService.getBooks()`
- **Get book by ID**: `DatabaseService.getBookById(bookId)`
- **Save book**: `DatabaseService.saveBook(book)` (insert or update)
- **Delete book**: `DatabaseService.deleteBook(bookId)` (cascades to notes and images)

### Notes Operations

- **Get all notes**: `DatabaseService.getNotes()`
- **Get notes for a book**: `DatabaseService.getNotes(bookId)`
- **Get note by ID**: `DatabaseService.getNoteById(noteId)`
- **Save note**: `DatabaseService.saveNote(note)` (insert or update with images)
- **Delete note**: `DatabaseService.deleteNote(noteId)` (cascades to images)

### Utility Operations

- **Get statistics**: `DatabaseService.getDatabaseStats()`
- **Clear all data**: `DatabaseService.clearAllData()`
- **Close database**: `DatabaseService.closeDatabase()`

## Transaction Handling

Critical operations use transactions to ensure data consistency:

- **Saving notes**: Ensures note and image data are saved atomically
- **Deleting books**: Ensures all related data is removed together
- **Deleting notes**: Ensures note and image cleanup happens together
- **Clearing all data**: Ensures complete cleanup

## Performance Considerations

1. **Indexes**: Strategic indexes on foreign keys and commonly queried columns
2. **Batch operations**: Image operations are batched within transactions
3. **Lazy loading**: Images are only loaded when notes are requested
4. **Prepared statements**: All queries use parameterized statements for efficiency and security

## Data Storage

- **Database location**: Local SQLite file managed by expo-sqlite
- **Image storage**: Image URIs point to local file system or Expo's asset system
- **Backup**: Database file can be backed up by copying the SQLite file

## Migration Notes

This app previously used AsyncStorage but has been migrated to SQLite for:
- Better performance with relational data
- ACID compliance and data integrity
- More efficient querying and indexing
- Support for complex relationships
- Better scalability as data grows

The migration system has been removed as all users should now be using SQLite exclusively.
