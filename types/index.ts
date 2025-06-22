export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  bookId: string;
  title: string;
  pageNumber: number;
  images: NoteImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteImage {
  id: string;
  uri: string;
  description: string;
}
