from openai import OpenAI
import os
from typing import Dict, Any, Union, List
from fastapi import HTTPException
from collections import defaultdict
import sqlite3
import json
from datetime import datetime
import pprint
import pathlib
import yaml
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        logger.info("Initializing ChatService")
        try:
            self.client = OpenAI(
                api_key=os.getenv("PERPLEXITY_API_KEY"),
                base_url="https://api.perplexity.ai",
            )
            logger.info("OpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {str(e)}")
            raise

        self.model = "sonar-pro"
        logger.info(f"Using model: {self.model}")

        # Load prompts from YAML
        try:
            config_path = pathlib.Path(__file__).parent.parent / "config" / "chat_service.yaml"
            with open(config_path, 'r') as file:
                prompts = yaml.safe_load(file)
                self.system_message_chat = {
                    "role": "system",
                    "content": prompts['chat_service']['system_message_chat']
                }
                self.system_message_newbie = {
                    "role": "system",
                    "content": prompts['chat_service']['system_message_newbie']
                }
            logger.info("Successfully loaded prompts from YAML")
        except Exception as e:
            logger.error(f"Failed to load prompts from YAML: {str(e)}")
            raise

        # Initialize database
        self._init_db()

    def _init_db(self):
        """Initialize SQLite database and create necessary tables."""
        # Get database path from environment or use default
        db_path = os.getenv("DB_PATH", "chat_history.db")
        
        # Ensure the directory exists
        db_dir = os.path.dirname(db_path)
        if db_dir:  # If path contains directory
            pathlib.Path(db_dir).mkdir(parents=True, exist_ok=True)
        
        # Connect to database
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        
        # Create messages table if it doesn't exist
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                type TEXT NOT NULL
            )
        """)
        self.conn.commit()

    def clear_database(self):
        """Clear all data from the database."""
        try:
            self.conn.execute("DELETE FROM messages")
            self.conn.commit()
            return True
        except Exception as e:
            print("Error clearing database:", e)
            return False

    def _get_conversation_history(self, conversation_id: str, type: str) -> List[Dict[str, str]]:
        """Retrieve conversation history from database."""
        cursor = self.conn.execute(
            """
            SELECT role, content 
            FROM messages 
            WHERE conversation_id = ? AND type = ?
            ORDER BY timestamp ASC
            """,
            (conversation_id, type)
        )
        return [{"role": row["role"], "content": row["content"]} for row in cursor.fetchall()]

    def _save_message(self, conversation_id: str, role: str, content: str, type: str):
        """Save a message to the database."""
        self.conn.execute(
            """
            INSERT INTO messages (conversation_id, role, content, type)
            VALUES (?, ?, ?, ?)
            """,
            (conversation_id, role, content, type)
        )
        self.conn.commit()

    def _create_messages_chat(self, user_content: str, conversation_id: str) -> list:
        """Create message list with chat message and user content, including conversation history."""
        messages = [self.system_message_chat]
        # Add conversation history if it exists
        messages.extend(self._get_conversation_history(conversation_id, "chat"))
        # Add new user message
        messages.append({"role": "user", "content": user_content})
        return messages

    def _create_messages_newbie(self, user_content: str, conversation_id: str) -> list:
        """Create message list with newbie message and user content, including conversation history."""
        messages = [self.system_message_newbie]
        # Add conversation history if it exists
        messages.extend(self._get_conversation_history(conversation_id, "newbie"))
        # Add new user message
        messages.append({"role": "user", "content": user_content})
        return messages

    def _update_conversation_history(self, conversation_id: str, messages: List[Dict[str, str]], response: Dict[str, Any], type: str):
        """Update conversation history with both user message and assistant response."""
        # Save the last user message
        self._save_message(conversation_id, "user", messages[-1]["content"], type)
        
        if response["type"] == "completion":
            assistant_content = response["data"].choices[0].message.content
            self._save_message(conversation_id, "assistant", assistant_content, type)

    def _handle_streaming_response(self, messages: list) -> Dict[str, Any]:
        """Handle streaming response from the API."""
        try:
            response_stream = self.client.chat.completions.create(
                model=self.model, messages=messages, stream=True
            )
            return {"type": "stream", "data": response_stream}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Streaming error: {str(e)}")

    def _handle_completion_response(self, messages: list) -> Dict[str, Any]:
        """Handle non-streaming response from the API."""
        try:
            response = self.client.chat.completions.create(
                model=self.model, messages=messages
            )
            return {"type": "completion", "data": response}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Completion error: {str(e)}")

    def process_chat_request(
        self, type: str, user_content: str, stream: bool, conversation_id: str
    ) -> Dict[str, Any]:
        """
        Process the chat request and return appropriate response.

        Args:
            type (str): The type of request, either "chat" or "newbie"
            user_content (str): The user's message content
            stream (bool): Whether to stream the response
            conversation_id (str): Unique identifier for the conversation

        Returns:
            Dict[str, Any]: Response containing either stream or completion data
        """
        try:
            if type == "chat":
                messages = self._create_messages_chat(user_content, conversation_id)
            elif type == "newbie":
                messages = self._create_messages_newbie(user_content, conversation_id)
            else:
                raise HTTPException(status_code=400, detail="Invalid request type")

            print("Context messages: ", pprint.pformat(messages))

            if stream:
                result = self._handle_streaming_response(messages)
            else:
                result = self._handle_completion_response(messages)
                # Update conversation history with the response
                self._update_conversation_history(conversation_id, messages, result, type)
            print("Result: ", result)
            return result
            
        except Exception as e:
            print("Error: ", e)
            raise HTTPException(status_code=500, detail=str(e))

    def __del__(self):
        """Cleanup database connection when the service is destroyed."""
        if hasattr(self, 'conn'):
            self.conn.close()
