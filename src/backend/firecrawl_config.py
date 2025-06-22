"""
Firecrawl configuration and document extraction utilities.
"""
import os
from typing import Optional, Dict, Any, List
from firecrawl import FirecrawlApp
from dotenv import load_dotenv
import logging
import httpx
from bs4 import BeautifulSoup
import html2text

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FirecrawlConfig:
    """Configuration for Firecrawl document loader."""
    
    def __init__(self):
        self.api_key = os.getenv("FIRECRAWL_API_KEY")
        if not self.api_key:
            raise ValueError("FIRECRAWL_API_KEY not found in environment variables")
        
        # Initialize Firecrawl app
        self.app = FirecrawlApp(api_key=self.api_key)
        
        # Default scraping parameters
        self.default_params = {
            "onlyMainContent": True,     # Extract only main content
            "includeHtml": False,        # Don't include raw HTML
            "screenshot": False,         # Don't take screenshots
            "waitFor": 2000,            # Wait 2 seconds for JS to load
            "removeTags": ["script", "style", "nav", "footer", "header"],  # Remove unwanted tags
        }
        
        # Initialize HTML to text converter
        self.html_converter = html2text.HTML2Text()
        self.html_converter.ignore_links = False
        self.html_converter.ignore_images = True
        self.html_converter.ignore_emphasis = False
        self.html_converter.body_width = 0  # Don't wrap text
    
    def extract_content(self, url: str, **kwargs) -> Dict[str, Any]:
        """
        Extract content from a URL using BeautifulSoup as default, with Firecrawl as fallback.
        
        Args:
            url: The URL to extract content from
            **kwargs: Additional parameters to pass to extraction
        
        Returns:
            Dictionary containing extracted content and metadata
        """
        logger.info(f"Extracting content from URL: {url}")
        
        # Try BeautifulSoup first (default)
        result = self._beautifulsoup_extract(url)
        
        if not result["success"]:
            # Try Firecrawl as fallback
            logger.warning(f"BeautifulSoup failed for {url}, trying Firecrawl fallback")
            result = self._firecrawl_fallback(url, **kwargs)
        
        return result
    
    def _firecrawl_fallback(self, url: str, **kwargs) -> Dict[str, Any]:
        """
        Fallback method to extract content using Firecrawl.
        
        Args:
            url: The URL to extract content from
            **kwargs: Additional parameters to pass to Firecrawl
            
        Returns:
            Dictionary containing extracted content and metadata
        """
        try:
            logger.info(f"Using Firecrawl to extract content from: {url}")
            
            # Merge default params with any provided kwargs
            params = self.default_params.copy()
            if kwargs:
                params.update(kwargs)
            
            # Scrape the URL
            result = self.app.scrape_url(url, params=params)
            
            if not result or 'content' not in result:
                raise ValueError("No content extracted from URL")
            
            # Extract the content
            content = result.get('content', '')
            metadata = result.get('metadata', {})
            
            # Calculate reading statistics
            word_count = len(content.split())
            reading_time_minutes = word_count / 200  # Assuming 200 WPM average
            
            return {
                "url": url,
                "title": metadata.get("title", result.get("title", "Untitled")),
                "description": metadata.get("description", ""),
                "content": content,
                "word_count": word_count,
                "estimated_reading_time": round(reading_time_minutes, 1),
                "metadata": {
                    "extraction_method": "firecrawl_fallback"
                },
                "success": True,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Firecrawl fallback also failed for {url}: {str(e)}")
            return {
                "url": url,
                "title": "Error",
                "description": "",
                "content": "",
                "word_count": 0,
                "estimated_reading_time": 0,
                "metadata": {},
                "success": False,
                "error": f"Both BeautifulSoup and Firecrawl failed: {str(e)}"
            }
    
    def _beautifulsoup_extract(self, url: str) -> Dict[str, Any]:
        """
        Primary method to extract content using BeautifulSoup.
        
        Args:
            url: The URL to extract content from
            
        Returns:
            Dictionary containing extracted content and metadata
        """
        try:
            logger.info(f"Using BeautifulSoup to extract content from: {url}")
            
            # Fetch the page content
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = httpx.get(url, headers=headers, follow_redirects=True, timeout=30.0)
            response.raise_for_status()
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract title
            title = soup.find('title')
            title_text = title.string if title else "Untitled"
            
            # Remove unwanted elements
            for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript']):
                tag.decompose()
            
            # Try to find main content areas
            main_content = None
            
            # Look for common main content selectors
            selectors = [
                'main',
                'article',
                '[role="main"]',
                '.main-content',
                '#main-content',
                '.content',
                '#content',
                '.post-content',
                '.entry-content',
                '.article-body'
            ]
            
            for selector in selectors:
                main_content = soup.select_one(selector)
                if main_content:
                    break
            
            # If no main content found, use body
            if not main_content:
                main_content = soup.find('body')
            
            # Convert to text
            if main_content:
                # Convert to markdown-like text
                text_content = self.html_converter.handle(str(main_content))
                
                # Clean up excessive whitespace
                lines = text_content.split('\n')
                cleaned_lines = []
                for line in lines:
                    stripped = line.strip()
                    if stripped:
                        cleaned_lines.append(stripped)
                
                content = '\n\n'.join(cleaned_lines)
            else:
                content = "Could not extract content from the page."
            
            # Extract metadata
            description = ""
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                description = meta_desc.get('content', '')
            
            # Calculate reading statistics
            word_count = len(content.split())
            reading_time_minutes = word_count / 200
            
            return {
                "url": url,
                "title": title_text,
                "description": description,
                "content": content,
                "word_count": word_count,
                "estimated_reading_time": round(reading_time_minutes, 1),
                "metadata": {
                    "extraction_method": "beautifulsoup_primary"
                },
                "success": True,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"BeautifulSoup extraction failed for {url}: {str(e)}")
            return {
                "url": url,
                "title": "Error",
                "description": "",
                "content": "",
                "word_count": 0,
                "estimated_reading_time": 0,
                "metadata": {},
                "success": False,
                "error": f"BeautifulSoup extraction failed: {str(e)}"
            }
    
    def extract_multiple_urls(self, urls: List[str], **kwargs) -> List[Dict[str, Any]]:
        """Extract content from multiple URLs."""
        results = []
        for url in urls:
            result = self.extract_content(url, **kwargs)
            results.append(result)
        return results


# Singleton instance
_firecrawl_config = None


def get_firecrawl_config() -> FirecrawlConfig:
    """Get or create the Firecrawl configuration singleton."""
    global _firecrawl_config
    if _firecrawl_config is None:
        _firecrawl_config = FirecrawlConfig()
    return _firecrawl_config