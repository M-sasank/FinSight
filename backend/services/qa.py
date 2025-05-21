# Disease Information App with Sonar API - Interactive Browser App
# ========================================================

# This notebook demonstrates how to build a robust disease information app using Perplexity's AI API
# and generates an HTML file that can be opened in a browser with an interactive UI

# 1. Setup and Dependencies
# ------------------------

import requests
import json
import pandas as pd
from IPython.display import HTML, display, IFrame
import os
import webbrowser
from pathlib import Path
import logging
from dotenv import load_dotenv
from typing import Dict, List, Optional, Union, Any
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("disease_app.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("disease_app")

# 2. API Configuration
# -------------------

# Load environment variables from .env file if it exists
load_dotenv()

# Get API key from environment variable or use a placeholder
API_KEY = os.environ.get('PERPLEXITY_API_KEY', 'API_KEY')
API_ENDPOINT = 'https://api.perplexity.ai/chat/completions'

class ApiError(Exception):
    """Custom exception for API-related errors."""
    pass

# 3. Function to Query Perplexity API (for testing in notebook)
# ----------------------------------

def ask_disease_question(question: str, api_key: str = API_KEY, model: str = "sonar-pro") -> Optional[Dict[str, Any]]:
    """
    Send a disease-related question to Perplexity API and parse the response.
    
    Args:
        question: The question about a disease
        api_key: The Perplexity API key (defaults to environment variable)
        model: The model to use for the query (defaults to sonar-pro)
        
    Returns:
        Dictionary with overview, causes, treatments, and citations or None if an error occurs
        
    Raises:
        ApiError: If there's an issue with the API request
    """
    if api_key == 'API_KEY':
        logger.warning("Using placeholder API key. Set PERPLEXITY_API_KEY environment variable.")
    
    # Construct a prompt instructing the API to output only valid JSON
    prompt = f"""
    You are a medical assistant. Please answer the following question about a disease and provide only valid JSON output.
    The JSON object must have exactly four keys: "overview", "causes", "treatments", and "citations".
    For example:
    {{
    "overview": "A brief description of the disease.",
    "causes": "The causes of the disease.",
    "treatments": "Possible treatments for the disease.",
    "citations": ["https://example.com/citation1", "https://example.com/citation2"]
    }}
    Now answer this question:
    "{question}"
    """.strip()

    # Build the payload
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    try:
        # Make the API request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        logger.info(f"Sending request to Perplexity API for question: '{question}'")
        response = requests.post(API_ENDPOINT, headers=headers, json=payload, timeout=30)
        
        # Check for HTTP errors
        if response.status_code != 200:
            error_msg = f"API request failed with status code {response.status_code}: {response.text}"
            logger.error(error_msg)
            raise ApiError(error_msg)
        
        result = response.json()
        
        # Extract and parse the response
        if result.get("choices") and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            try:
                parsed_data = json.loads(content)
                logger.info("Successfully parsed JSON response")
                
                # Validate expected keys are present
                expected_keys = ["overview", "causes", "treatments", "citations"]
                missing_keys = [key for key in expected_keys if key not in parsed_data]
                
                if missing_keys:
                    logger.warning(f"Response missing expected keys: {missing_keys}")
                
                return parsed_data
            except json.JSONDecodeError as e:
                error_msg = f"Failed to parse JSON output from API: {str(e)}"
                logger.error(error_msg)
                logger.debug(f"Raw content: {content}")
                return None
        else:
            logger.error("No answer provided in the response.")
            return None
            
    except requests.exceptions.Timeout:
        logger.error("Request timed out")
        raise ApiError("Request to Perplexity API timed out. Please try again later.")
    except requests.exceptions.RequestException as e:
        logger.error(f"Request exception: {str(e)}")
        raise ApiError(f"Error communicating with Perplexity API: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise ApiError(f"Unexpected error: {str(e)}")