# Production Deployment Guide

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt
npm install

# Build frontend
npm run build

# Set environment variables
export FIRECRAWL_API_KEY="your_key_here"
export GROQ_API_KEY="your_key_here"
export ENVIRONMENT="production"

# Run production server
python main.py
```

## Environment Variables

### Required
- `FIRECRAWL_API_KEY` - Your Firecrawl API key for URL extraction
- `GROQ_API_KEY` - Your Groq API key for LLM processing

### Optional
- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8000)
- `WORKERS` - Number of worker processes (default: 1)
- `LOG_LEVEL` - Logging level (default: info)
- `ENVIRONMENT` - Set to "production" for production mode

## Production Endpoints

- **Frontend**: `http://your-domain/`
- **API**: `http://your-domain/api/extract`
- **WebSocket**: `ws://your-domain/ws/agui`
- **Health Check**: `http://your-domain/health`

## Platform-Specific Deployment

### Replit
1. Fork this repository in Replit
2. Add environment variables to Replit Secrets:
   - `FIRECRAWL_API_KEY`
   - `GROQ_API_KEY`
   - `ENVIRONMENT=production`
3. Run: `python main.py`

### Railway/Render
1. Connect your GitHub repository
2. Set environment variables in platform dashboard
3. Build command: `npm install && npm run build && pip install -r requirements.txt`
4. Start command: `python main.py`

### Docker
```dockerfile
FROM python:3.10-slim

# Install Node.js
RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /app
COPY . .

# Install dependencies and build
RUN pip install -r requirements.txt
RUN npm install && npm run build

EXPOSE 8000
CMD ["python", "main.py"]
```

## Health Monitoring

The server includes a health check endpoint at `/health` that returns:
```json
{
  "status": "healthy",
  "service": "speed-read-production"
}
```

## Troubleshooting

### Frontend not loading
- Check that `dist/` directory exists with `index.html`
- Run `npm run build` to rebuild frontend
- Check server logs for static file serving errors

### API errors
- Verify environment variables are set
- Check backend import paths in logs
- Test API endpoint: `curl http://localhost:8000/health`

### WebSocket connection issues
- Ensure WebSocket route is not blocked by proxy/firewall
- Check for proper protocol (ws:// vs wss:// for HTTPS)

## Performance Optimization

For production, consider:
- Setting `WORKERS=4` (or number of CPU cores)
- Using a reverse proxy (Nginx) for static file serving
- Enabling gzip compression
- Setting up CDN for static assets