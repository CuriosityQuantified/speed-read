"""
LLM prompts for cleaning Firecrawl content.
"""
import os
from typing import Dict, Any, Optional, List, Tuple
from groq import Groq
from dotenv import load_dotenv
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
import math

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ContentProcessor:
    """Clean extracted content from Firecrawl using Groq's Llama 4 Scout 17B."""
    
    def __init__(self):
        """Initialize content processor with Groq client."""
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.client = Groq(api_key=api_key)
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct"
        self.chunk_size = 4000  # Words per chunk
        self.max_workers = 50    # Maximum parallel LLM calls
        self._setup_prompt()
    
    def _setup_prompt(self):
        """Setup the cleaning prompt."""
        self.cleaning_prompt = """You are a content extraction specialist. Your ONLY task is to extract and return the main textual content from the provided text, which has been scraped from a webpage.

IMPORTANT RULES:
1. Extract ONLY the main article or content body - the actual text the user wants to read
2. REMOVE all of the following:
   - Navigation menus, headers, footers
   - Code snippets, HTML tags, markdown formatting
   - Advertisements, promotional content
   - Social media buttons, share buttons
   - Author bios, related articles, comments sections
   - Cookie notices, privacy policy snippets
   - Subscribe/newsletter prompts
   - Image captions (unless integral to understanding)
   - Timestamps, metadata, tags
   - Any UI elements or website chrome
3. REMOVE ALL INLINE LINKS AND URLs from the text:
   - Remove markdown links like [text](url) - keep only the text part
   - Remove HTML links like <a href="url">text</a> - keep only the text part
   - Remove any standalone URLs (http://, https://, www.) from sentences
   - If a sentence says "Visit https://example.com for more info", change it to "Visit the website for more info"
   - The goal is clean, uninterrupted reading flow without any URLs
4. PRESERVE the natural reading flow of the main content
5. DO NOT add any commentary, summaries, or explanations
6. DO NOT rewrite or paraphrase - keep the original text intact
7. Output ONLY the cleaned main content, nothing else

Examples of link removal:
BEFORE: "After the [fall of France](url) in June 1940, the war continued mainly between Germany and the [British Empire](url)."
AFTER: "After the fall of France in June 1940, the war continued mainly between Germany and the British Empire."

BEFORE: "Visit https://example.com for more info or check out <a href='test.com'>this resource</a>."
AFTER: "Visit the website for more info or check out this resource."

Here is the content to clean:
<content>

{content}

</content>
CLEANED CONTENT:"""
    
    def _chunk_text(self, text: str) -> List[str]:
        """
        Split text into chunks of approximately chunk_size words.
        
        Args:
            text: The text to chunk
            
        Returns:
            List of text chunks
        """
        words = text.split()
        total_words = len(words)
        
        if total_words <= self.chunk_size:
            return [text]
        
        chunks = []
        num_chunks = math.ceil(total_words / self.chunk_size)
        
        for i in range(num_chunks):
            start_idx = i * self.chunk_size
            end_idx = min((i + 1) * self.chunk_size, total_words)
            chunk_words = words[start_idx:end_idx]
            chunks.append(' '.join(chunk_words))
        
        logger.info(f"Split {total_words} words into {len(chunks)} chunks")
        return chunks
    
    def _process_chunk(self, chunk: str, chunk_index: int) -> Tuple[int, str]:
        """
        Process a single chunk through the LLM.
        
        Args:
            chunk: The text chunk to process
            chunk_index: Index of this chunk for ordering
            
        Returns:
            Tuple of (chunk_index, cleaned_text)
        """
        try:
            # Format the prompt with content
            prompt = self.cleaning_prompt.format(content=chunk)
            
            # Call Groq API
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0,
                max_tokens=8000,
                top_p=1,
                stream=False
            )
            
            # Extract cleaned content
            cleaned_content = completion.choices[0].message.content.strip()
            
            logger.info(f"Processed chunk {chunk_index + 1}: {len(chunk.split())} words -> {len(cleaned_content.split())} words")
            
            return (chunk_index, cleaned_content)
            
        except Exception as e:
            logger.error(f"Error processing chunk {chunk_index + 1}: {str(e)}")
            # Return original chunk on error
            return (chunk_index, chunk)
    
    async def process_for_reading(self, content: str) -> Dict[str, Any]:
        """
        Clean content extracted by Firecrawl for speed reading.
        Handles large content by chunking and processing in parallel.
        
        Args:
            content: Raw content extracted from URL by Firecrawl
            
        Returns:
            Dictionary with cleaned content
        """
        try:
            # Split content into chunks
            chunks = self._chunk_text(content)
            
            if len(chunks) == 1:
                # Single chunk - process normally
                logger.info("Processing single chunk")
                _, cleaned_content = await asyncio.to_thread(
                    self._process_chunk, 
                    chunks[0], 
                    0
                )
            else:
                # Multiple chunks - process in parallel
                logger.info(f"Processing {len(chunks)} chunks in parallel")
                
                # Use ThreadPoolExecutor for parallel processing
                with ThreadPoolExecutor(max_workers=min(self.max_workers, len(chunks))) as executor:
                    # Submit all chunks for processing
                    loop = asyncio.get_event_loop()
                    tasks = []
                    
                    for i, chunk in enumerate(chunks):
                        task = loop.run_in_executor(
                            executor,
                            self._process_chunk,
                            chunk,
                            i
                        )
                        tasks.append(task)
                    
                    # Wait for all chunks to be processed
                    results = await asyncio.gather(*tasks)
                    
                    # Sort results by chunk index and combine
                    sorted_results = sorted(results, key=lambda x: x[0])
                    cleaned_chunks = [result[1] for result in sorted_results]
                    
                    # Combine chunks with proper spacing
                    cleaned_content = '\n\n'.join(cleaned_chunks)
            
            # Calculate word count
            word_count = len(cleaned_content.split())
            
            logger.info(f"Successfully cleaned content: {word_count} words from {len(content.split())} original words")
            
            return {
                "cleaned_content": cleaned_content,
                "word_count": word_count,
                "chunks_processed": len(chunks),
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error cleaning content: {str(e)}")
            # Return original content as fallback
            return {
                "cleaned_content": content,
                "word_count": len(content.split()),
                "chunks_processed": 0,
                "success": False,
                "error": str(e)
            }
    

# Example usage
if __name__ == "__main__":
    async def test():
        processor = ContentProcessor()
        
        test_content = """
        Home | About | Contact | Subscribe
        
        Breaking News: Scientists Discover New Planet
        
        [Advertisement: Buy our space telescope!]
        
        In a groundbreaking discovery, astronomers have identified a new exoplanet orbiting a distant star. The planet, designated HD 12345b, is located approximately 100 light-years away from Earth in the constellation Pegasus.
        
        RELATED ARTICLES:
        - 10 Amazing Space Facts
        - Subscribe to our newsletter!
        - Follow us on social media
        
        The discovery was made using the transit method, where scientists observe the dimming of a star's light as a planet passes in front of it. This particular exoplanet is roughly twice the size of Jupiter and completes an orbit around its host star every 3.5 days.
        
        [Code snippet showing orbital calculations]
        
        Share this article: Facebook | Twitter | LinkedIn
        
        About the Author: John Doe is a science writer...
        """
        
        result = await processor.process_for_reading(test_content)
        print(f"Cleaned content ({result['word_count']} words):\n")
        print(result['cleaned_content'])
    
    asyncio.run(test())