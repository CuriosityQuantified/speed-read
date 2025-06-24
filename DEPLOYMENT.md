# Deployment Guide for Speed Reader on Replit

## Setup Instructions

1. **Fork/Import to Replit**
   - Go to [Replit](https://replit.com)
   - Click "Create Repl" 
   - Choose "Import from GitHub" and use your repository URL
   - Or upload the project files directly

2. **Configure Secrets**
   In Replit, go to the Secrets tab (lock icon) and add:
   - `FIRECRAWL_API_KEY`: Your Firecrawl API key for URL extraction
   - `GROQ_API_KEY`: Your Groq API key for content processing
   
   Note: The app will still work without these keys, but URL extraction will be disabled.

3. **Install Dependencies**
   Replit should automatically install dependencies when you run the app, but if needed:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

4. **Run the Application**
   - Click the "Run" button in Replit
   - The app will:
     - Build the frontend automatically if needed
     - Start the unified server on port 8000
     - Serve both frontend and backend from the same port

## Production Features

- **Unified Server**: Single Python server serves both frontend and API
- **Automatic Frontend Build**: Builds frontend on first run if dist/ doesn't exist
- **Environment-based Configuration**: Uses relative URLs that work in any environment
- **WebSocket Support**: Automatic protocol detection (ws/wss)
- **Password Protection**: Access key: `5p33dr34d3r!`

## File Structure

```
speed-read/
├── main.py              # Production server entry point
├── .replit              # Replit configuration
├── replit.nix           # Replit dependencies
├── src/
│   ├── backend/         # Python backend
│   └── components/      # TypeScript frontend
├── dist/                # Built frontend (auto-generated)
└── requirements.txt     # Python dependencies
```

## Customization

### Change Password
Edit `src/components/Auth.ts` and change:
```typescript
private readonly CORRECT_PASSWORD = '5p33dr34d3r!'
```

### Change Port
Set the `PORT` environment variable in Replit Secrets (default: 8000)

### API Keys
- Get Firecrawl API key: https://firecrawl.com
- Get Groq API key: https://groq.com

## Troubleshooting

1. **Frontend not loading**: Check if `dist/` directory exists. Delete it and restart to rebuild.
2. **URL extraction not working**: Verify API keys are set in Secrets
3. **WebSocket connection failed**: Check browser console for errors
4. **Port already in use**: Change PORT in environment variables

## Performance Notes

- First load may be slower as frontend builds
- Subsequent loads are fast with cached static files
- WebSocket provides real-time URL extraction updates
- Frontend is optimized for production with Vite