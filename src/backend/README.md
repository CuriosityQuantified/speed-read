# Speed Read URL Extraction Backend

This backend service provides URL content extraction using Firecrawl and Groq's Llama 3.3 70B for content cleaning.

## Features

- **URL Content Extraction**: Uses Firecrawl to extract content from any URL
- **LLM Content Cleaning**: Uses Llama 3.3 70B to extract only the main article content
- **AG-UI Protocol**: WebSocket support for real-time communication
- **REST API**: Alternative HTTP endpoints for extraction
- **Simple Workflow**: URL → Firecrawl → LLM Cleaning → Speed Reader

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run the server**:
   ```bash
   python src/backend/run_server.py
   ```

## API Endpoints

### WebSocket: `/ws/agui`

Connect via WebSocket for real-time extraction:

```javascript
const ws = new WebSocket('ws://localhost:8001/ws/agui');

// Send extraction request
ws.send(JSON.stringify({
  type: 'request',
  action: 'extract_and_prepare',
  data: { url: 'https://example.com/article' },
  id: '123'
}));

// Receive response
ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log(response.data.processed_content);
};
```

### REST API: `/api/extract`

POST request for content extraction:

```bash
curl -X POST http://localhost:8001/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

Response:
```json
{
  "success": true,
  "url": "https://example.com/article",
  "title": "Article Title",
  "content": "Cleaned main article content ready for speed reading...",
  "word_count": 1500,
  "estimated_reading_time": 7.5
}
```

## AG-UI Protocol Actions

- `extract_and_prepare`: Extract URL content and clean it for speed reading

## Configuration

### Firecrawl Options

Edit `firecrawl_config.py` to customize:
- Content selectors
- Exclusion patterns
- Screenshot options
- JavaScript wait times

### LLM Content Cleaning

The LLM prompt in `llm_prompts.py` is designed to:
- Extract only the main article content
- Remove all navigation, ads, code snippets, and UI elements
- Preserve the original text without paraphrasing
- Output clean content ready for speed reading

## Development

### Running Tests
```bash
pytest src/backend/tests/
```

### Adding New Content Types

1. Add prompt in `llm_prompts.py`:
```python
CONTENT_TYPE_PROMPTS["new_type"] = "Custom processing instructions..."
```

2. Update extraction config if needed
3. Test with sample URLs

## Troubleshooting

### WebSocket Connection Failed
- Check if backend is running: `curl http://localhost:8001/health`
- Verify CORS settings for your frontend domain
- Check firewall/proxy settings

### Extraction Errors
- Verify Firecrawl API key is valid
- Check if URL is accessible
- Some sites may block scraping

### LLM Processing Issues
- Verify Groq API key is valid
- Check Groq API rate limits
- Content may be truncated if too long (30k char limit)

## Architecture

```
Frontend (TypeScript)
    ↓ WebSocket/REST
Backend Server (FastAPI)
    ↓
├── Firecrawl (URL extraction)
└── Groq Llama 3.3 70B (content cleaning)
```

## Workflow

1. User enters URL in frontend
2. Frontend sends request to backend via WebSocket/REST
3. Backend uses Firecrawl to extract webpage content
4. Extracted content is sent to Llama 3.3 70B for cleaning
5. LLM removes all non-article content (nav, ads, code, etc.)
6. Clean content is returned to frontend
7. Frontend displays content in speed reader

## Security Notes

- API keys are never exposed to frontend
- Content is processed server-side
- WebSocket connections use message validation
- CORS configured for security

## Performance

- Extraction: 2-5 seconds typical
- LLM processing: 1-3 seconds
- WebSocket latency: <100ms
- Supports concurrent extractions