import { Book, Note } from '@/types';
import { File } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export class PDFService {
  static async exportBookNotes(book: Book, notes: Note[]): Promise<void> {
    try {
      console.log('Starting PDF export for:', book.title);
      console.log('Total notes to export:', notes.length);
      
      const htmlContent = await this.generateHTML(book, notes);
      
      console.log('HTML content generated, creating PDF...');
      console.log('HTML preview (first 500 chars):', htmlContent.substring(0, 500));
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 612,
        height: 792,
        margins: {
          left: 72,
          top: 72,
          right: 72,
          bottom: 72,
        },
      });

      console.log('PDF created at:', uri);
      
      // Verify PDF was created
      const pdfFile = new File(uri);
      const pdfExists = pdfFile.exists;
      const pdfSize = pdfExists ? pdfFile.size : 0;
      console.log('PDF file info:', pdfExists ? `size: ${pdfSize || 'unknown'}` : 'file does not exist');
      
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

  private static async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      console.log('Converting image:', imageUri);
      
      // Validate URI first
      if (!imageUri || imageUri.trim() === '' || imageUri === 'file://' || imageUri === 'content://') {
        return '';
      }
      
      // Handle different URI formats
      let normalizedUri = imageUri.trim();
      
      // If it's already a proper file:// or content:// URI, use it as is
      if (normalizedUri.startsWith('file://') || normalizedUri.startsWith('content://')) {
        // Check if there's actually a path after the protocol
        if (normalizedUri === 'file://' || normalizedUri === 'content://') {
          console.error('URI has protocol but no path:', normalizedUri);
          return '';
        }
      } else {
        // Add file:// prefix if missing
        normalizedUri = `file://${normalizedUri}`;
      }
      
      console.log('Normalized URI:', normalizedUri);
      
      // Get file info to determine the actual image format
      const file = new File(normalizedUri);
      const fileExists = file.exists;
      if (!fileExists) {
        console.error('Image file does not exist:', normalizedUri);
        // Try original URI as fallback only if it's different
        if (normalizedUri !== imageUri) {
          console.log('Trying original URI as fallback:', imageUri);
          const originalFile = new File(imageUri);
          const originalExists = originalFile.exists;
          if (!originalExists) {
            console.error('Original URI also does not exist:', imageUri);
            return '';
          }
          normalizedUri = imageUri;
          console.log('Using original URI:', normalizedUri);
        } else {
          return '';
        }
      }
      
      console.log('File exists, reading as base64...');
      const base64 = await FileSystemLegacy.readAsStringAsync(normalizedUri, {
        encoding: FileSystemLegacy.EncodingType.Base64,
      });

      if (!base64 || base64.trim() === '') {
        console.error('Failed to read base64 data or empty result');
        return '';
      }

      // Determine the image format from the URI or default to jpeg
      let mimeType = 'image/jpeg';
      const lowerUri = normalizedUri.toLowerCase();
      if (lowerUri.includes('.png')) {
        mimeType = 'image/png';
      } else if (lowerUri.includes('.gif')) {
        mimeType = 'image/gif';
      } else if (lowerUri.includes('.webp')) {
        mimeType = 'image/webp';
      }

      console.log('Base64 conversion successful, mime type:', mimeType, 'length:', base64.length);
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  }

  private static async generateHTML(book: Book, notes: Note[]): Promise<string> {
    console.log('Generating HTML for', notes.length, 'notes');
    
    const notesHTML = await Promise.all(
      notes
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map(async (note, index) => {
          console.log(`Processing note ${index + 1}/${notes.length}: ${note.title}`);
          console.log(`Note has ${note.images.length} images`);
          
          const imagesHTML = await Promise.all(
            note.images.map(async (image, imageIndex) => {
              console.log(`Converting image ${imageIndex + 1}/${note.images.length} for note: ${note.title}`);
              const base64Image = await this.convertImageToBase64(image.uri);
              
              if (!base64Image) {
                return `
                  <div class="content-item">
                    <div class="item-header">
                      <span class="item-number">${imageIndex + 1}</span>
                      <span class="content-type">Text Note</span>
                    </div>
                    <div class="text-content">
                      <pre class="description-text">${image.description || 'No description available'}</pre>
                    </div>
                  </div>
                `;
              }
              
              console.log(`Successfully converted image ${imageIndex + 1} for note: ${note.title}`);
              
              return `
                <div class="content-item">
                  <div class="item-header">
                    <span class="item-number">${imageIndex + 1}</span>
                    <span class="content-type">Image Note</span>
                  </div>
                  <div class="image-content">
                    <img src="${base64Image}" alt="Note image ${imageIndex + 1}" class="note-image" />
                    ${image.description ? `
                      <div class="description-section">
                        <h4 class="description-label">Description</h4>
                        <pre class="description-text">${image.description}</pre>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            })
          );

          const successfulImages = imagesHTML.filter(html => !html.includes('Failed to load image'));
          console.log(`Note ${note.title}: ${successfulImages.length}/${note.images.length} images successfully converted`);

          return `
            <div class="note-section">
              <div class="note-header">
                <div class="note-title-row">
                  <h2 class="note-title">${note.title}</h2>
                  <div class="note-meta">
                    <span class="page-number">Page ${note.pageNumber}</span>
                    <span class="item-count">${note.images.length} ${note.images.length === 1 ? 'Item' : 'Items'}</span>
                  </div>
                </div>
                <div class="separator"></div>
              </div>
              
              <div class="note-content">
                ${note.images.length > 0 ? imagesHTML.join('') : `
                  <div class="empty-state">
                    <p class="empty-text">No content available for this note</p>
                  </div>
                `}
              </div>
            </div>
          `;
        })
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${book.title} - Notes</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #2d3748;
              background: #ffffff;
              font-size: 14px;
            }
            
            .header {
              background: #f8fafc;
              padding: 40px 0;
              text-align: center;
              border-bottom: 2px solid #e2e8f0;
              margin-bottom: 40px;
            }
            
            .book-title {
              font-size: 36px;
              font-weight: 700;
              color: #1a202c;
              margin-bottom: 8px;
              letter-spacing: -0.5px;
            }
            
            .book-author {
              font-size: 18px;
              color: #4a5568;
              margin-bottom: 20px;
              font-weight: 400;
            }
            
            .export-info {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 20px;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              font-size: 13px;
              color: #718096;
            }
            
            .export-date {
              font-weight: 500;
            }
            
            .notes-count {
              background: #667eea;
              color: white;
              padding: 6px 12px;
              border-radius: 4px;
              font-weight: 600;
              font-size: 12px;
            }
            
            .note-section {
              margin-bottom: 50px;
              break-inside: avoid;
            }
            
            .note-header {
              margin-bottom: 30px;
            }
            
            .note-title-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
            }
            
            .note-title {
              font-size: 24px;
              font-weight: 700;
              color: #1a202c;
              letter-spacing: -0.5px;
            }
            
            .note-meta {
              display: flex;
              gap: 15px;
              align-items: center;
              font-size: 13px;
              color: #4a5568;
            }
            
            .page-number {
              background: #edf2f7;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: 600;
            }
            
            .item-count {
              color: #718096;
              font-weight: 500;
            }
            
            .separator {
              height: 2px;
              background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
              border-radius: 1px;
              width: 100%;
            }
            
            .note-content {
              margin-top: 30px;
            }
            
            .content-item {
              margin-bottom: 40px;
              break-inside: avoid;
            }
            
            .content-item:last-child {
              margin-bottom: 0;
            }
            
            .item-header {
              display: flex;
              align-items: center;
              gap: 15px;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .item-number {
              background: #667eea;
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 14px;
              flex-shrink: 0;
            }
            
            .content-type {
              font-weight: 600;
              color: #4a5568;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .image-content {
              width: 100%;
            }
            
            .note-image {
              width: 100%;
              height: auto;
              display: block;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            
            .text-content {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #667eea;
            }
            
            .description-section {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #667eea;
              margin-top: 20px;
            }
            
            .description-label {
              font-weight: 600;
              color: #2d3748;
              font-size: 14px;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .description-text {
              font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
              font-size: 13px;
              line-height: 1.7;
              color: #2d3748;
              white-space: pre-wrap;
              word-wrap: break-word;
              background: white;
              padding: 16px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
              margin: 0;
              overflow-wrap: break-word;
            }
            
            .empty-state {
              text-align: center;
              padding: 40px 20px;
              color: #a0aec0;
            }
            
            .empty-text {
              font-size: 16px;
              font-style: italic;
            }
            
            @media print {
              body {
                font-size: 12px;
              }
              
              .note-section {
                break-inside: avoid;
                margin-bottom: 40px;
              }
              
              .content-item {
                break-inside: avoid;
              }
              
              .header {
                padding: 30px 0;
              }
              
              .book-title {
                font-size: 28px;
              }
              
              .note-title {
                font-size: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="book-title">${book.title}</h1>
            <p class="book-author">by ${book.author}</p>
            <div class="export-info">
              <span class="export-date">Exported ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              <span class="notes-count">${notes.length} ${notes.length === 1 ? 'Note' : 'Notes'}</span>
            </div>
          </div>
          
          ${notes.length > 0 ? notesHTML.join('') : `
            <div class="empty-state">
              <p class="empty-text">No notes available for this book</p>
            </div>
          `}
        </body>
      </html>
    `;
    
    console.log('HTML generation complete');
    return html;
  }
}
