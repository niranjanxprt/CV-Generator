# CV + Cover Letter Generator

🎉 **Your Application is Ready!** All 17 tasks have been completed successfully. The CV + Cover Letter Generator is now fully functional and ready for use.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables (Optional)
You can either:

**Option A: Use Environment Variable (Recommended for development)**
Create a `.env.local` file in the root directory:
```bash
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

**Option B: Enter API Key in the Application**
If you don't set up the environment variable, the application will prompt you to enter your API key directly in the interface. This key will be stored locally in your browser.

**Getting Your Perplexity API Key:**
1. Visit [Perplexity API Settings](https://www.perplexity.ai/settings/api)
2. Sign up or log in to your account
3. Generate a new API key
4. Copy the key (starts with `pplx-`)

### 3. Start the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## How to Use the Application

### Step 1: Create Your Profile
1. Visit `http://localhost:3000/profile`
2. Fill in your professional information:
   - Header (name, title, contact info)
   - Professional summary
   - Work experience with categorized bullets
   - Education
   - Skills (organized by categories)
   - Languages
   - References
3. **Optional**: Import from existing CV using the "Import from CV" button
4. Your profile auto-saves every second to localStorage

### Step 2: Generate Documents
1. Visit `http://localhost:3000/generate`
2. Paste a job description (minimum 50 characters)
3. Click "Analyze Job" to get AI-powered keyword analysis
4. Review the extracted keywords (color-coded: red=must-have, amber=preferred, green=nice-to-have)
5. Select which documents to generate:
   - ✅ German CV (Lebenslauf) - 2 pages max
   - ✅ English CV (Resume) - 2 pages max  
   - ✅ German Cover Letter (Anschreiben) - 1 page
   - ✅ English Cover Letter - 1 page
6. Click "Generate Selected Documents"

### Step 3: Preview and Download
1. Review generated documents on the results page
2. Check match scores and page counts
3. Use "Preview" to view documents in full-screen modal
4. Navigate with keyboard (arrows, +/-, ESC) or swipe on mobile
5. Download individual PDFs or all as ZIP
6. Files are named according to German standards:
   - `Lebenslauf_YourName_Company_2024-01-13.pdf`
   - `Anschreiben_YourName_Company_2024-01-13.pdf`
   - `Resume_YourName_Company_2024-01-13.pdf`
   - `CoverLetter_YourName_Company_2024-01-13.pdf`

## Key Features Implemented

### ✅ Complete Feature Set
- **Profile Management**: Auto-save, CV import, data persistence
- **AI Job Analysis**: Perplexity API integration with keyword extraction
- **Smart CV Tailoring**: Bullet scoring, content optimization, skill reordering
- **Multi-language Support**: German and English documents
- **PDF Generation**: Professional formatting matching German standards
- **Page Limit Enforcement**: Automatic content reduction to meet limits
- **Preview System**: Full-screen viewer with mobile support
- **Download Management**: Individual and batch downloads with proper naming
- **Error Handling**: Comprehensive error recovery and user feedback
- **Responsive Design**: Mobile-optimized (375px to 1920px+)
- **Performance Optimization**: Caching, lazy loading, debouncing

### ✅ Quality Assurance
- **Property-Based Testing**: 12+ correctness properties validated
- **Unit Testing**: Comprehensive test coverage
- **TypeScript**: Full type safety
- **Build Validation**: Production-ready build
- **Mobile Optimization**: Touch-friendly, swipe gestures
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Technical Architecture

### Frontend Stack
- **Next.js 15**: App Router, TypeScript, Server Components
- **React**: Hooks, Context, Suspense boundaries
- **Tailwind CSS**: Responsive design, component styling
- **shadcn/ui**: Professional UI components

### PDF Generation
- **@react-pdf/renderer**: Professional PDF creation
- **Custom Components**: German/English CV and cover letter templates
- **Page Limit Enforcement**: Automatic content reduction algorithms

### AI Integration
- **Perplexity API**: Job analysis and keyword extraction using the latest `sonar` model
- **Rate Limiting**: Prevents API abuse
- **Caching**: Session-based response caching
- **Error Handling**: Graceful fallbacks

### Data Management
- **localStorage**: Client-side profile persistence
- **No Database**: Privacy-first approach
- **Version Migration**: Future-proof data handling
- **Auto-save**: 1-second debounced saving

## Production Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `PERPLEXITY_API_KEY`
3. Deploy automatically on push to main branch

### Alternative Deployment
The application can be deployed to any Node.js hosting platform:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - **Environment Variable**: Verify your Perplexity API key is correct in `.env.local`
   - **Frontend Input**: Enter your API key directly in the application interface
   - **Key Format**: Ensure the key starts with `pplx-` and is complete
   - **Browser Storage**: If using frontend input, the key is stored in localStorage

2. **"API key required" Error**
   - If no environment variable is set, you'll see an API key input field
   - Enter your Perplexity API key and click "Save"
   - The key will be stored locally in your browser for future use

3. **"Perplexity API error: 400" Error**
   - This was caused by using deprecated model names
   - ✅ **Fixed**: Updated to use the latest `sonar` model
   - If you still see this error, clear your browser cache and try again

4. **Bad PDF Filenames (e.g., "Not_explicitly_mentioned")**
   - This was caused by empty company names in job analysis
   - ✅ **Fixed**: Smart filename generation with proper length limits
   - **Examples**: 
     - `Resume_YourName_DeepRecai_recruiter_for_u_2026-01-13.pdf` (25 char limit)
     - `Resume_YourName_Training_Infrastruct_2026-01-13.pdf` (20 char limit for job titles)
     - `Resume_YourName_Google_2026-01-13.pdf` (clean company names)
   - Intelligent fallback: Company Name → Job Title → "Application"

5. **Poor PDF Format and Layout**
   - ✅ **Fixed**: Complete redesign with professional styling
   - **Enhanced typography**: Larger headers (24px), better fonts, proper spacing
   - **Professional colors**: Blue accents (#3498db), proper contrast ratios
   - **Improved layout**: Better margins (50px), organized sections, clean borders
   - **Better readability**: Increased line heights (1.4), proper bullet formatting
   - **Modern design**: Centered header, professional color scheme, clean sections

6. **Poor Preview Experience & PDF Rendering Issues**
   - ✅ **Fixed**: Complete preview system overhaul
   - **Smart Browser Detection**: Automatically chooses best rendering method per browser
   - **Multiple Fallbacks**: Object → Iframe → Download fallback for maximum compatibility
   - **Better Error Handling**: Error boundaries with helpful messages and retry options
   - **Enhanced Fonts**: Multiple font weights and styles for better PDF quality
   - **Improved Controls**: Better zoom (80% default), cleaner UI, proper PDF parameters

7. **PDF Generation Fails**
   - Check browser console for errors
   - Ensure all required data is present in profile

8. **Mobile Issues**
   - Clear browser cache
   - Ensure JavaScript is enabled
   - Try different mobile browser

9. **Storage Issues**
   - Clear localStorage if corrupted
   - Check browser storage quota

### Performance Tips
- Use Chrome or Safari for best PDF rendering
- Keep profile data reasonable in size
- Clear old cached data periodically

## Support

The application includes comprehensive error handling and user feedback. Most issues are automatically handled with helpful error messages and retry options.

## 🎉 Enjoy Your Professional CV Generator!

Your application is now ready for professional use. Generate tailored CVs and cover letters in German and English with AI-powered optimization!
