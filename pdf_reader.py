#!/usr/bin/env python3
"""
Simple PDF reader tool to extract text content from PDF files
"""

import sys
import os

try:
    import PyPDF2
except ImportError:
    print("PyPDF2 not found. Installing...")
    os.system("pip install PyPDF2")
    import PyPDF2

def read_pdf(file_path):
    """Read PDF file and extract all text content"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text_content = []
            
            print(f"Reading PDF: {file_path}")
            print(f"Number of pages: {len(pdf_reader.pages)}")
            print("-" * 50)
            
            for page_num, page in enumerate(pdf_reader.pages, 1):
                print(f"Processing page {page_num}...")
                page_text = page.extract_text()
                text_content.append(f"\n--- PAGE {page_num} ---\n")
                text_content.append(page_text)
            
            return "\n".join(text_content)
            
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None

def main():
    if len(sys.argv) != 2:
        print("Usage: python pdf_reader.py <pdf_file_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        sys.exit(1)
    
    content = read_pdf(pdf_path)
    
    if content:
        # Save to text file
        output_file = pdf_path.replace('.pdf', '_extracted.txt')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"\nText extracted and saved to: {output_file}")
        print("\nFirst 2000 characters:")
        print("-" * 50)
        print(content[:2000])
        print("..." if len(content) > 2000 else "")
        
    else:
        print("Failed to extract text from PDF")

if __name__ == "__main__":
    main()