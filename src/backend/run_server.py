#!/usr/bin/env python3
"""
Run the Speed Read URL extraction backend server.
"""
import os
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import uvicorn
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
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        logger.error("Please add them to your .env file")
        sys.exit(1)
    
    logger.info("Environment check passed")


def main():
    """Run the backend server."""
    check_environment()
    
    # Server configuration
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8001"))
    reload = os.getenv("BACKEND_RELOAD", "true").lower() == "true"
    
    logger.info(f"Starting Speed Read URL Extraction Server on {host}:{port}")
    logger.info(f"WebSocket endpoint: ws://{host}:{port}/ws/agui")
    logger.info(f"REST endpoint: http://{host}:{port}/api/extract")
    
    # Run the server
    uvicorn.run(
        "agui_integration:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )


if __name__ == "__main__":
    main()