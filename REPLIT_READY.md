# Speed Reader - Replit Ready! 🚀

Your speed reader application is now ready for deployment on Replit!

## What's Been Set Up

✅ **Production Server (`main.py`)**
- Unified server serves both frontend and backend
- Automatic frontend building on first run
- Static file serving for the SPA
- WebSocket and REST API support

✅ **Environment Configuration**
- `.replit` - Replit run configuration
- `replit.nix` - System dependencies
- `.env.example` - Environment variable template
- Relative URLs for any deployment environment

✅ **Authentication**
- Password protection implemented
- Access key: `5p33dr34d3r!`
- Session-based authentication

✅ **URL Extraction**
- WebSocket for real-time updates
- REST API fallback
- Works with Firecrawl and Groq APIs

## Quick Start on Replit

1. **Upload to Replit**
   - Create new Repl → Import from GitHub
   - Or drag and drop the project files

2. **Add Secrets** (in Replit's Secrets tab):
   ```
   FIRECRAWL_API_KEY = your_key_here
   GROQ_API_KEY = your_key_here
   ```

3. **Click Run**
   - The app will build and start automatically
   - Access at your Replit URL

## Files to Upload

Essential files:
- `main.py` - Entry point
- `.replit` - Configuration
- `replit.nix` - Dependencies
- `requirements.txt` - Python packages
- `package.json` - Node packages
- `src/` - All source code
- `index.html` - Frontend entry
- `vite.config.ts` - Build config
- `tsconfig.json` - TypeScript config

Don't upload:
- `node_modules/`
- `.venv/`
- `dist/`
- `.env`

## Testing Locally

```bash
# Build frontend
npm run build

# Run production server
python main.py

# Visit http://localhost:8000
```

## Customization Tips

- Change password in `src/components/Auth.ts`
- Modify styles in `src/styles.css`
- Add features in `src/components/`
- Backend logic in `src/backend/`

The app is fully ready for Replit deployment! 🎉