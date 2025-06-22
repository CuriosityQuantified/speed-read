"""
AG-UI Protocol integration for URL content extraction.
"""
import asyncio
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass
import json
import logging
try:
    from .firecrawl_config import get_firecrawl_config
    from .llm_prompts import ContentProcessor
except ImportError:
    # When running as a script
    from firecrawl_config import get_firecrawl_config
    from llm_prompts import ContentProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class AGUIMessage:
    """AG-UI protocol message structure."""
    type: str
    action: str
    data: Dict[str, Any]
    id: Optional[str] = None


class AGUIHandler:
    """Handler for AG-UI protocol messages."""
    
    def __init__(self):
        self.firecrawl = get_firecrawl_config()
        self.content_processor = ContentProcessor()
        self.handlers: Dict[str, Callable] = {
            "extract_and_prepare": self.handle_extract_and_prepare
        }
    
    async def handle_message(self, message: str) -> str:
        """
        Handle incoming AG-UI protocol message.
        
        Args:
            message: JSON string containing the AG-UI message
            
        Returns:
            JSON string containing the response
        """
        try:
            # Parse message
            msg_data = json.loads(message)
            msg = AGUIMessage(**msg_data)
            
            # Route to appropriate handler
            if msg.action in self.handlers:
                result = await self.handlers[msg.action](msg.data)
                response = {
                    "type": "response",
                    "action": msg.action,
                    "id": msg.id,
                    "success": True,
                    "data": result
                }
            else:
                response = {
                    "type": "error",
                    "action": msg.action,
                    "id": msg.id,
                    "success": False,
                    "error": f"Unknown action: {msg.action}"
                }
            
            return json.dumps(response)
            
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            return json.dumps({
                "type": "error",
                "success": False,
                "error": str(e)
            })
    
    async def handle_extract_and_prepare(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract URL content and prepare it for speed reading in one step."""
        url = data.get("url")
        if not url:
            raise ValueError("URL is required")
        
        logger.info(f"Starting extraction for URL: {url}")
        
        # Step 1: Extract content using Firecrawl
        extraction = await asyncio.to_thread(
            self.firecrawl.extract_content,
            url
        )
        
        if not extraction["success"]:
            logger.error(f"Firecrawl extraction failed: {extraction.get('error')}")
            return extraction
        
        logger.info(f"Firecrawl extracted {extraction['word_count']} words")
        
        # Step 2: Clean content using LLM
        processed = await self.content_processor.process_for_reading(
            extraction["content"]
        )
        
        if not processed["success"]:
            logger.warning("LLM cleaning failed, using original content")
            cleaned_content = extraction["content"]
            word_count = extraction["word_count"]
            chunks_processed = 0
        else:
            cleaned_content = processed["cleaned_content"]
            word_count = processed["word_count"]
            chunks_processed = processed.get("chunks_processed", 1)
            logger.info(f"LLM cleaned content to {word_count} words using {chunks_processed} chunks")
        
        # Step 3: Return cleaned content for speed reading
        result = {
            "url": url,
            "title": extraction["title"],
            "content": cleaned_content,  # This is what goes to the reader
            "word_count": word_count,
            "chunks_processed": chunks_processed,
            "estimated_reading_time": round(word_count / 200, 1),
            "success": True
        }
        
        return result


class AGUIWebSocketHandler:
    """WebSocket handler for AG-UI protocol."""
    
    def __init__(self):
        self.handler = AGUIHandler()
        self.connections = set()
    
    async def handle_connection(self, websocket, path):
        """Handle WebSocket connection."""
        self.connections.add(websocket)
        try:
            async for message in websocket:
                response = await self.handler.handle_message(message)
                await websocket.send(response)
        finally:
            self.connections.remove(websocket)
    
    async def broadcast(self, message: str):
        """Broadcast message to all connected clients."""
        if self.connections:
            await asyncio.gather(
                *[ws.send(message) for ws in self.connections],
                return_exceptions=True
            )


# FastAPI integration
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Speed Read URL Extractor")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize handler
agui_handler = AGUIHandler()


@app.websocket("/ws/agui")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for AG-UI protocol."""
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            response = await agui_handler.handle_message(message)
            await websocket.send_text(response)
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close()


@app.post("/api/extract")
async def extract_url(request: Dict[str, Any]):
    """REST endpoint for URL extraction."""
    try:
        result = await agui_handler.handle_extract_and_prepare(request)
        return result
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "speed-read-url-extractor"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)