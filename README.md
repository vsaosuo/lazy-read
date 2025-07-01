# Lazy Read 📚

A React Native app that helps you take organized notes while reading books. Capture text images and add descriptions to create comprehensive reading notes that can be exported as PDFs.

## Features

- **📚 Book Management**: Add and manage your book collection with titles and authors
- **📝 Note Taking**: Create notes with titles and page numbers for organized reading
- **📸 Image Capture**: Take photos of text and add descriptive notes
- **💾 Local Storage**: All data stored locally on your device for privacy
- **📄 PDF Export**: Export all your notes into a formatted PDF document
- **🎨 Modern UI**: Clean, intuitive interface with tab navigation

## Tech Stack

- **React Native** with Expo
- **Expo Router** for navigation
- **SQLite** with expo-sqlite for local data persistence
- **Expo Camera & Image Picker** for image capture
- **Expo Print** for PDF generation
- **TypeScript** for type safety

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## How to Use

### Adding Books
1. Go to the "Books" tab
2. Tap the "+" button
3. Enter the book title and author
4. Your book will appear in the list

### Taking Notes
1. Select a book from your collection
2. Tap the "+" button to create a new note
3. Enter a note title and page number
4. In the note editor, tap "+" to add images
5. Choose to take a photo or select from library
6. Add descriptions to your images

### Exporting Notes
1. Open any book with notes
2. Tap the share/export button
3. Your notes will be compiled into a PDF
4. Share or save the PDF as needed

## Project Structure

```
app/
├── (tabs)/           # Tab navigation screens
│   ├── index.tsx     # Books list screen
│   └── notes.tsx     # Note editing screen
├── book/
│   └── [id].tsx      # Book details screen
components/           # Reusable UI components
services/            # Business logic
├── storage.ts       # Local storage service
└── pdf.ts          # PDF generation service
types/              # TypeScript type definitions
```

## Permissions Required

- **Camera**: To take photos of book text
- **Media Library**: To save and access images

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
