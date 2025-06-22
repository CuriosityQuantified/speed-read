"""
Speed Read URL Extraction Backend

This module provides Firecrawl-based URL content extraction
and LLM-powered content processing for speed reading.
"""

from .firecrawl_config import FirecrawlConfig, get_firecrawl_config
from .llm_prompts import ContentProcessor
from .agui_integration import AGUIHandler, AGUIWebSocketHandler

__all__ = [
    'FirecrawlConfig',
    'get_firecrawl_config',
    'ContentProcessor',
    'AGUIHandler',
    'AGUIWebSocketHandler'
]

__version__ = '0.1.0'