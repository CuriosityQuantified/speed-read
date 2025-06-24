#!/usr/bin/env python3
"""Test script to verify API routes are working correctly."""
import requests
import json

def test_routes():
    base_url = "http://localhost:8000"
    
    print("Testing API routes...")
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✓ Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"✗ Health check failed: {e}")
    
    # Test extract endpoint
    try:
        test_data = {"url": "https://example.com"}
        response = requests.post(
            f"{base_url}/api/extract",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"✓ Extract endpoint: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"✗ Extract endpoint failed: {e}")
    
    # Test WebSocket endpoint
    print(f"\nWebSocket endpoint available at: ws://localhost:8000/ws/agui")

if __name__ == "__main__":
    test_routes()