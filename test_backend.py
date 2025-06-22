#!/usr/bin/env python3
"""Test script to verify backend functionality."""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Load environment variables
load_dotenv()

# Import backend modules
from backend.firecrawl_config import get_firecrawl_config
from backend.llm_prompts import ContentProcessor


async def test_extraction():
    """Test URL extraction and content processing."""
    print("Testing Speed Read Backend...")
    print("-" * 50)
    
    # Test environment
    print("Checking environment variables...")
    firecrawl_key = os.getenv("FIRECRAWL_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    
    if not firecrawl_key:
        print("❌ FIRECRAWL_API_KEY not found!")
        return
    else:
        print(f"✅ FIRECRAWL_API_KEY found: {firecrawl_key[:10]}...")
    
    if not groq_key:
        print("❌ GROQ_API_KEY not found!")
        return
    else:
        print(f"✅ GROQ_API_KEY found: {groq_key[:10]}...")
    
    print("\n" + "-" * 50)
    
    # Test URL - using a more reliable article
    test_url = "https://en.wikipedia.org/wiki/Speed_reading"
    print(f"Testing with URL: {test_url}")
    
    # Also test with a URL that might fail Firecrawl to test fallback
    test_fallback_url = "https://example.com"
    
    # Test with a longer article to test chunking
    test_long_url = "https://en.wikipedia.org/wiki/World_War_II"
    
    try:
        # Test extraction (BeautifulSoup as default)
        print("\n1. Testing content extraction...")
        firecrawl = get_firecrawl_config()
        extraction = firecrawl.extract_content(test_url)
        
        if extraction["success"]:
            method = extraction['metadata'].get('extraction_method', 'unknown')
            print(f"✅ Extracted {extraction['word_count']} words using {method}")
            print(f"   Title: {extraction['title']}")
            print(f"   First 100 chars: {extraction['content'][:100]}...")
        else:
            print(f"❌ Extraction failed: {extraction['error']}")
            return
        
        # Test LLM cleaning
        print("\n2. Testing LLM content cleaning...")
        processor = ContentProcessor()
        cleaned = await processor.process_for_reading(extraction['content'])
        
        if cleaned["success"]:
            print(f"✅ LLM cleaned content to {cleaned['word_count']} words")
            print(f"   Chunks processed: {cleaned.get('chunks_processed', 1)}")
            print(f"   First 200 chars of cleaned content:")
            print(f"   {cleaned['cleaned_content'][:200]}...")
        else:
            print(f"❌ LLM cleaning failed: {cleaned.get('error', 'Unknown error')}")
        
        # Test with a simple URL
        print("\n3. Testing with simpler URL...")
        print(f"   Testing with URL: {test_fallback_url}")
        
        simple_result = firecrawl.extract_content(test_fallback_url)
        
        if simple_result["success"]:
            method = simple_result['metadata'].get('extraction_method', 'unknown')
            print(f"✅ Extraction worked using {method}!")
            print(f"   Title: {simple_result['title']}")
            print(f"   Word count: {simple_result['word_count']}")
            print(f"   First 200 chars: {simple_result['content'][:200]}...")
        else:
            print(f"❌ Extraction failed: {simple_result['error']}")
        
        # Test with a longer article to test chunking
        print("\n4. Testing with longer article for chunking...")
        print(f"   Testing with URL: {test_long_url}")
        
        long_extraction = firecrawl.extract_content(test_long_url)
        
        if long_extraction["success"]:
            method = long_extraction['metadata'].get('extraction_method', 'unknown')
            print(f"✅ Extracted {long_extraction['word_count']} words using {method}")
            
            # Process with LLM to test chunking
            long_cleaned = await processor.process_for_reading(long_extraction['content'])
            
            if long_cleaned["success"]:
                print(f"✅ LLM processed large content:")
                print(f"   Original words: {long_extraction['word_count']}")
                print(f"   Cleaned words: {long_cleaned['word_count']}")
                print(f"   Chunks processed: {long_cleaned.get('chunks_processed', 1)}")
            else:
                print(f"❌ LLM processing failed: {long_cleaned.get('error', 'Unknown error')}")
        else:
            print(f"❌ Extraction failed: {long_extraction['error']}")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_extraction())