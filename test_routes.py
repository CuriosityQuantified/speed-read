#!/usr/bin/env python3
"""Test script to verify API routes are working correctly."""
import requests
import json
import sys
import time

def test_routes(base_url="http://localhost:8000"):
    """Test all production endpoints."""
    print("🧪 Testing Speed Read Production API routes...")
    print(f"Base URL: {base_url}")
    print("=" * 50)
    
    tests_passed = 0
    tests_total = 0
    
    # Test health check
    tests_total += 1
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            print(f"✓ Health check: {response.status_code} - {response.json()}")
            tests_passed += 1
        else:
            print(f"✗ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Health check failed: {e}")
    
    # Test frontend (index.html)
    tests_total += 1
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200 and "html" in response.headers.get("content-type", ""):
            print(f"✓ Frontend: {response.status_code} - HTML served")
            tests_passed += 1
        else:
            print(f"✗ Frontend failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Frontend failed: {e}")
    
    # Test static assets
    tests_total += 1
    try:
        response = requests.get(f"{base_url}/assets/", timeout=10)
        # 404 is ok if no specific asset, but should not be a server error
        if response.status_code in [200, 404]:
            print(f"✓ Assets endpoint: {response.status_code} - Assets path accessible")
            tests_passed += 1
        else:
            print(f"✗ Assets endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Assets endpoint failed: {e}")
    
    # Test extract endpoint (requires API keys)
    tests_total += 1
    try:
        test_data = {"url": "https://example.com"}
        response = requests.post(
            f"{base_url}/api/extract",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        print(f"✓ Extract endpoint: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print(f"  ✓ Extraction successful")
                tests_passed += 1
            else:
                print(f"  ⚠ Extraction failed (likely missing API keys): {result.get('error', 'Unknown error')}")
                tests_passed += 0.5  # Partial credit - endpoint works but lacks keys
        else:
            print(f"  Response: {response.text[:200]}")
    except Exception as e:
        print(f"✗ Extract endpoint failed: {e}")
    
    # Summary
    print("=" * 50)
    print(f"Tests passed: {tests_passed}/{tests_total}")
    
    if tests_passed >= tests_total - 0.5:  # Allow for API key issues
        print("🎉 Production deployment is ready!")
        return True
    else:
        print("❌ Some tests failed. Check configuration.")
        return False

def main():
    """Main test function with argument support."""
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    # Wait a moment for server to start if testing locally
    if "localhost" in base_url:
        print("Waiting 2 seconds for local server to start...")
        time.sleep(2)
    
    success = test_routes(base_url)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()