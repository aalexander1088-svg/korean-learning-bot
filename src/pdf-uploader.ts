import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export class PDFUploader {
  private desktopPath: string;
  private koreanClassNotesPath: string;

  constructor() {
    this.desktopPath = path.join(process.env.USERPROFILE || '', 'Desktop');
    this.koreanClassNotesPath = path.join(this.desktopPath, 'korean class notes');
  }

  public async uploadNewestPDF(): Promise<string | null> {
    try {
      console.log('📤 Starting PDF upload process...');
      
      // Find the newest Korean PDF
      const pdfPath = this.findNewestKoreanPDF();
      if (!pdfPath) {
        console.log('❌ No Korean PDF found to upload');
        return null;
      }

      const fileName = path.basename(pdfPath);
      const targetPath = path.join('pdfs', fileName);
      
      // Create pdfs directory if it doesn't exist
      if (!fs.existsSync('pdfs')) {
        fs.mkdirSync('pdfs');
      }

      // Copy PDF to project directory
      fs.copyFileSync(pdfPath, targetPath);
      
      console.log(`✅ PDF uploaded: ${fileName}`);
      console.log(`📁 Local path: ${pdfPath}`);
      console.log(`📁 Project path: ${targetPath}`);
      
      return targetPath;
      
    } catch (error) {
      console.error('❌ Error uploading PDF:', error);
      return null;
    }
  }

  private findNewestKoreanPDF(): string | null {
    try {
      // First check the "korean class notes" folder
      if (fs.existsSync(this.koreanClassNotesPath)) {
        const files = fs.readdirSync(this.koreanClassNotesPath);
        const pdfFiles = files.filter(file => 
          file.toLowerCase().endsWith('.pdf') && 
          (file.toLowerCase().includes('korean') || file.toLowerCase().includes('한국'))
        );

        if (pdfFiles.length > 0) {
          // Sort by modification time to get the newest
          const sortedPdfs = pdfFiles.sort((a, b) => {
            const statA = fs.statSync(path.join(this.koreanClassNotesPath, a));
            const statB = fs.statSync(path.join(this.koreanClassNotesPath, b));
            return statB.mtime.getTime() - statA.mtime.getTime();
          });
          
          const pdfPath = path.join(this.koreanClassNotesPath, sortedPdfs[0]);
          console.log(`📄 Found newest Korean PDF: ${sortedPdfs[0]}`);
          return pdfPath;
        }
      }

      // Fallback to desktop root
      const files = fs.readdirSync(this.desktopPath);
      const pdfFiles = files.filter(file => 
        file.toLowerCase().endsWith('.pdf') && 
        (file.toLowerCase().includes('korean') || file.toLowerCase().includes('한국'))
      );

      if (pdfFiles.length > 0) {
        const pdfPath = path.join(this.desktopPath, pdfFiles[0]);
        console.log(`📄 Found Korean PDF: ${pdfFiles[0]}`);
        return pdfPath;
      }

      console.log('❌ No Korean PDF found');
      return null;
    } catch (error) {
      console.error('❌ Error finding Korean PDF:', error);
      return null;
    }
  }

  public async commitAndPushPDF(): Promise<boolean> {
    try {
      console.log('🔄 Committing and pushing PDF to GitHub...');
      
      // This would require Git to be installed and configured
      // For now, we'll just prepare the file for manual push
      console.log('📝 PDF is ready for Git commit');
      console.log('💡 Run these commands to push to GitHub:');
      console.log('   git add pdfs/');
      console.log('   git commit -m "Update Korean PDF"');
      console.log('   git push origin main');
      
      return true;
    } catch (error) {
      console.error('❌ Error committing PDF:', error);
      return false;
    }
  }
}

// Standalone script to upload PDF
async function uploadPDF() {
  const uploader = new PDFUploader();
  const result = await uploader.uploadNewestPDF();
  
  if (result) {
    console.log('✅ PDF upload completed successfully!');
    console.log('📁 PDF is now available in the project directory');
  } else {
    console.log('❌ PDF upload failed');
  }
}

// Run if called directly
if (require.main === module) {
  uploadPDF();
}



