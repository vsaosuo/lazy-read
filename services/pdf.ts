import { Book, Note } from '@/types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export class PDFService {
  static async exportBookNotes(book: Book, notes: Note[]): Promise<void> {
    try {
      const htmlContent = this.generateHTML(book, notes);
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${book.title} - Notes`,
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }

  private static generateHTML(book: Book, notes: Note[]): string {
    const notesHTML = notes
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map(note => {
        const imagesHTML = note.images
          .map(image => `
            <div style="margin: 20px 0; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
              <img src="${image.uri}" style="max-width: 100%; height: auto; margin-bottom: 10px; border-radius: 4px;" />
              ${image.description ? `<p style="margin: 0; font-size: 14px; color: #333; line-height: 1.4;">${image.description}</p>` : '<p style="margin: 0; font-size: 14px; color: #999; font-style: italic;">No description</p>'}
            </div>
          `)
          .join('');

        return `
          <div style="page-break-inside: avoid; margin-bottom: 40px; border: 2px solid #f0f0f0; padding: 20px; border-radius: 12px;">
            <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">${note.title}</h3>
            <p style="color: #007AFF; margin: 0 0 20px 0; font-weight: 600;">Page ${note.pageNumber}</p>
            ${note.images.length > 0 ? imagesHTML : '<p style="color: #999; font-style: italic;">No images in this note</p>'}
          </div>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${book.title} - Notes</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #007AFF;
            }
            .book-title {
              font-size: 28px;
              font-weight: bold;
              color: #333;
              margin: 0 0 10px 0;
            }
            .book-author {
              font-size: 18px;
              color: #666;
              margin: 0 0 10px 0;
            }
            .export-date {
              font-size: 14px;
              color: #999;
              margin: 0;
            }
            .notes-count {
              font-size: 16px;
              color: #007AFF;
              margin: 10px 0 0 0;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="book-title">${book.title}</h1>
            <p class="book-author">by ${book.author}</p>
            <p class="export-date">Exported on ${new Date().toLocaleDateString()}</p>
            <p class="notes-count">${notes.length} ${notes.length === 1 ? 'Note' : 'Notes'}</p>
          </div>
          
          ${notes.length > 0 ? notesHTML : '<p style="text-align: center; color: #999; font-style: italic; font-size: 18px;">No notes available</p>'}
        </body>
      </html>
    `;
  }
}
