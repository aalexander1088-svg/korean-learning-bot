#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

console.log('🚀 Setting up PDF Auto-Extraction System');
console.log('==========================================');

// Create the Korean PDFs folder on Desktop
const desktopPath = path.join(os.homedir(), 'Desktop');
const koreanPDFsPath = path.join(desktopPath, 'Korean PDFs');

console.log(`📁 Creating folder: ${koreanPDFsPath}`);

if (!fs.existsSync(koreanPDFsPath)) {
  fs.mkdirSync(koreanPDFsPath, { recursive: true });
  console.log('✅ Created Korean PDFs folder on your Desktop');
} else {
  console.log('✅ Korean PDFs folder already exists');
}

// Create a README file in the folder
const readmeContent = `# Korean PDFs Folder

This folder is monitored by your Korean learning system.

## How to use:
1. Drop any Korean PDF files into this folder
2. The system will automatically:
   - Extract Korean words from the PDF
   - Translate them using AI
   - Add them to your vocabulary database
   - Send you notifications about new words

## Supported formats:
- PDF files (.pdf)

## What happens when you add a PDF:
1. 📄 PDF is processed and text is extracted
2. 🇰🇷 Korean words are identified
3. 🤖 AI translates the words to English
4. 📚 Words are added to your vocabulary database
5. 📊 You'll see a summary of new words added

## To start monitoring:
Run: npm run smart-watch-pdfs

## To stop monitoring:
Press Ctrl+C in the terminal

Happy learning! 🇰🇷✨
`;

fs.writeFileSync(path.join(koreanPDFsPath, 'README.md'), readmeContent);
console.log('📝 Created README file with instructions');

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Drop Korean PDF files into: ' + koreanPDFsPath);
console.log('2. Run: npm run smart-watch-pdfs');
console.log('3. The system will automatically process any PDFs you add');
console.log('\n💡 Tip: You can also run "npm run watch-pdfs" for basic monitoring without AI translation');
