#!/usr/bin/env python3
"""
Production server for Speed Read application.
Serves both the frontend static files and backend API.
"""
import os
import sys
import subprocess
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.agui_integration import app as backend_app
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create main app
app = FastAPI(title="Speed Read Production Server")

# Get absolute paths for production deployment
base_dir = Path(__file__).parent.absolute()
dist_path = base_dir / "dist"
assets_path = dist_path / "assets"
index_path = dist_path / "index.html"

# Build frontend if dist doesn't exist
if not dist_path.exists():
    logger.info("Building frontend...")
    try:
        subprocess.run(["npm", "install"], check=True, cwd=base_dir)
        subprocess.run(["npm", "run", "build"], check=True, cwd=base_dir)
        logger.info("Frontend build completed")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to build frontend: {e}")
        sys.exit(1)

# Verify required files exist
if not index_path.exists():
    logger.error(f"Frontend build failed: {index_path} not found")
    sys.exit(1)

# Include backend routes directly instead of mounting
# This allows better control over route precedence
from backend.agui_integration import agui_handler

# Add backend routes to main app
@app.post("/api/extract")
async def extract_url_route(request: dict):
    """REST endpoint for URL extraction."""
    try:
        result = await agui_handler.handle_extract_and_prepare(request)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.websocket("/ws/agui")
async def websocket_endpoint(websocket):
    """WebSocket endpoint for AG-UI protocol."""
    from fastapi import WebSocket, WebSocketDisconnect
    import logging
    logger = logging.getLogger(__name__)
    
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

# Serve static assets
if assets_path.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")
    logger.info(f"Serving static assets from: {assets_path}")
else:
    logger.warning(f"Assets directory not found: {assets_path}")

# Add health check endpoint at root level
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "speed-read-production"}

# Serve index.html for all other routes (SPA support)
# This MUST be last to serve as catch-all
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve the SPA for all non-API and non-asset routes."""
    # This will catch all routes not handled above
    if index_path.exists():
        return FileResponse(str(index_path))
    else:
        logger.error(f"Index file not found: {index_path}")
        return {"error": "Frontend not built", "path": full_path}

def check_environment():
    """Check required environment variables and system readiness."""
    logger.info("Performing environment and system checks...")
    
    # Check required environment variables
    required_vars = [
        "FIRECRAWL_API_KEY",
        "GROQ_API_KEY",
    ]
    
    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        logger.warning(f"Missing environment variables: {', '.join(missing)}")
        logger.warning("URL extraction feature will not work without these keys")
        logger.warning("Please add them to your .env file or platform secrets")
    else:
        logger.info("✓ All required environment variables are set")
    
    # Check if we're in a production environment
    env = os.getenv("ENVIRONMENT", "development")
    logger.info(f"Running in {env} mode")
    
    # Check frontend build
    if dist_path.exists() and index_path.exists():
        logger.info("✓ Frontend build is ready")
    else:
        logger.warning("Frontend build may be missing")
    
    # Check backend dependencies
    try:
        from backend.agui_integration import app as backend_app
        logger.info("✓ Backend modules loaded successfully")
    except ImportError as e:
        logger.error(f"✗ Backend import failed: {e}")
        sys.exit(1)
    
    return True

def main():
    """Run the production server."""
    logger.info("Starting Speed Read Production Server...")
    check_environment()
    
    # Server configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    workers = int(os.getenv("WORKERS", "1"))
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    
    # Production settings
    is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
    
    logger.info("=" * 60)
    logger.info(f"🚀 Speed Read Production Server")
    logger.info(f"Host: {host}:{port}")
    logger.info(f"Base directory: {base_dir}")
    logger.info(f"Frontend files: {dist_path}")
    logger.info(f"Workers: {workers}")
    logger.info(f"Log level: {log_level}")
    logger.info(f"Production mode: {is_production}")
    logger.info("=" * 60)
    logger.info("📍 Available endpoints:")
    logger.info(f"   Frontend: http://{host}:{port}/")
    logger.info(f"   API: http://{host}:{port}/api/")
    logger.info(f"   WebSocket: ws://{host}:{port}/ws/agui")
    logger.info(f"   Health check: http://{host}:{port}/health")
    logger.info("=" * 60)
    
    try:
        # Run the server
        if is_production:
            # Production mode with multiple workers
            uvicorn.run(
                "main:app",  # Use import string for workers
                host=host,
                port=port,
                log_level=log_level,
                access_log=True,
                workers=workers
            )
        else:
            # Development mode with reload
            uvicorn.run(
                app,
                host=host,
                port=port,
                log_level=log_level,
                access_log=True,
                reload=False  # Disable reload for now to avoid import issues
            )
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception as e:
        logger.error(f"Server failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()