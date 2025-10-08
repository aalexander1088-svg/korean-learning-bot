#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

console.log('🧪 Testing PDF Watcher System');
console.log('==============================');

// Check if the Korean PDFs folder exists
const desktopPath = path.join(os.homedir(), 'Desktop');
const koreanPDFsPath = path.join(desktopPath, 'Korean PDFs');

console.log(`📁 Checking folder: ${koreanPDFsPath}`);

if (fs.existsSync(koreanPDFsPath)) {
  console.log('✅ Korean PDFs folder exists');
  
  // List existing PDFs
  const files = fs.readdirSync(koreanPDFsPath);
  const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
  
  if (pdfFiles.length > 0) {
    console.log(`📚 Found ${pdfFiles.length} existing PDF(s):`);
    pdfFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
  } else {
    console.log('📄 No PDF files found in the folder');
  }
  
  // Check README
  const readmePath = path.join(koreanPDFsPath, 'README.md');
  if (fs.existsSync(readmePath)) {
    console.log('✅ README file exists');
  } else {
    console.log('⚠️  README file missing');
  }
  
} else {
  console.log('❌ Korean PDFs folder does not exist');
  console.log('💡 Run: npm run setup-pdf-watcher');
}

// Check if we can import the required modules
console.log('\n🔧 Checking dependencies...');

try {
  const chokidar = require('chokidar');
  console.log('✅ chokidar (file watcher) is available');
} catch (error) {
  console.log('❌ chokidar not found - run: npm install chokidar');
}

try {
  const { PDFExtractor } = require('./pdf-uploader');
  console.log('✅ PDFExtractor is available');
} catch (error) {
  console.log('❌ PDFExtractor not found');
}

try {
  const { KoreanDatabase } = require('./database');
  console.log('✅ KoreanDatabase is available');
} catch (error) {
  console.log('❌ KoreanDatabase not found');
}

console.log('\n🎯 Ready to test!');
console.log('1. Drop a Korean PDF into: ' + koreanPDFsPath);
console.log('2. Run: npm run smart-watch-pdfs');
console.log('3. Watch the magic happen! ✨');
