export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  bookId: string;
  title: string;
  pageNumber: number;
  sortOrder: number;
  images: NoteImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteImage {
  id: string;
  uri: string;
  description: string;
  sortOrder: number;
}
