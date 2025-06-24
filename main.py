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

# Mount the backend API
app.mount("/api", backend_app)
app.mount("/ws", backend_app)

# Build frontend if dist doesn't exist
dist_path = Path(__file__).parent / "dist"
if not dist_path.exists():
    logger.info("Building frontend...")
    try:
        subprocess.run(["npm", "install"], check=True, cwd=Path(__file__).parent)
        subprocess.run(["npm", "run", "build"], check=True, cwd=Path(__file__).parent)
        logger.info("Frontend build completed")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to build frontend: {e}")
        sys.exit(1)

# Serve static files
app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

# Serve index.html for all other routes (SPA support)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve the SPA for all non-API routes."""
    return FileResponse("dist/index.html")

def check_environment():
    """Check required environment variables."""
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
        logger.warning("Please add them to your .env file or Replit Secrets")
    else:
        logger.info("Environment check passed")

def main():
    """Run the production server."""
    check_environment()
    
    # Server configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    logger.info(f"Starting Speed Read Production Server on {host}:{port}")
    logger.info(f"Frontend: http://{host}:{port}/")
    logger.info(f"API: http://{host}:{port}/api/")
    logger.info(f"WebSocket: ws://{host}:{port}/ws/agui")
    
    # Run the server
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )

if __name__ == "__main__":
    main()