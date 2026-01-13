#!/usr/bin/env ts-node
/**
 * TypeScript PDF Reader Tool
 * Extracts full text content from PDF files without truncation
 */

import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

// PDF parsing library - we'll use pdf-parse which is commonly available
let pdfParse: any;

async function loadPdfParse() {
  try {
    const require = createRequire(import.meta.url);
    pdfParse = require('pdf-parse');
  } catch (error) {
    console.log('pdf-parse not found. Please install it:');
    console.log('npm install pdf-parse');
    process.exit(1);
  }
}

interface PDFContent {
  text: string;
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
}

async function readPDF(filePath: string): Promise<string | null> {
  try {
    console.log(`Reading PDF: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }

    // Read the PDF file as buffer
    const dataBuffer = fs.readFileSync(filePath);
    
    console.log(`File size: ${(dataBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Parse the PDF
    const data: PDFContent = await pdfParse(dataBuffer);
    
    console.log(`Pages: ${data.numpages}`);
    console.log(`Characters extracted: ${data.text.length}`);
    console.log('-'.repeat(50));
    
    return data.text;
    
  } catch (error) {
    console.error('Error reading PDF:', error);
    return null;
  }
}

async function saveParsedContent(content: string, originalPath: string): Promise<string> {
  const outputPath = originalPath.replace('.pdf', '_extracted.txt');
  
  try {
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`Content saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error saving content:', error);
    throw error;
  }
}

function displayPreview(content: string, maxLength: number = 3000): void {
  console.log('\nContent Preview:');
  console.log('='.repeat(50));
  
  if (content.length <= maxLength) {
    console.log(content);
  } else {
    console.log(content.substring(0, maxLength));
    console.log(`\n... (truncated - showing first ${maxLength} characters of ${content.length} total)`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.log('Usage: ts-node pdf-reader.ts <pdf-file-path>');
    console.log('   or: npx ts-node pdf-reader.ts <pdf-file-path>');
    process.exit(1);
  }

  const pdfPath = args[0];
  
  // Load the PDF parsing library
  await loadPdfParse();
  
  // Read the PDF
  const content = await readPDF(pdfPath);
  
  if (!content) {
    console.error('Failed to extract content from PDF');
    process.exit(1);
  }
  
  // Save the extracted content
  const outputPath = await saveParsedContent(content, pdfPath);
  
  // Display preview
  displayPreview(content);
  
  console.log(`\nExtraction complete!`);
  console.log(`Full content available in: ${outputPath}`);
}

// Run the script
const args = process.argv.slice(2);
if (args.length > 0) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export { readPDF, saveParsedContent };