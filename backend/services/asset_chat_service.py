from openai import OpenAI
import os
from typing import Dict, Any, Union, List
from fastapi import HTTPException
import sqlite3
import json
from datetime import datetime
import pathlib
import yaml
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AssetChatService:
    def __init__(self):
        logger.info("Initializing AssetChatService")
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
            config_path = pathlib.Path(__file__).parent.parent / "config" / "asset_chat_service.yaml"
            with open(config_path, 'r') as file:
                prompts = yaml.safe_load(file)
                self.system_message = {
                    "role": "system",
                    "content": prompts['asset_chat_service']['system_message']
                }
            logger.info("Successfully loaded prompts from YAML")
        except Exception as e:
            logger.error(f"Failed to load prompts from YAML: {str(e)}")
            raise

        # Initialize database
        self._init_db()

    def _init_db(self):
        """Initialize SQLite database and create necessary tables."""
        # Use home directory for database
        db_path = os.path.expanduser("~/perplexity_hack.db")
        
        # Connect to database
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        
        # Create asset_messages table if it doesn't exist
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS asset_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.conn.commit()

    def clear_database(self):
        """Clear all data from the database."""
        try:
            self.conn.execute("DROP TABLE IF EXISTS asset_messages")
            self.conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error clearing database: {str(e)}")
            return False

    def _get_conversation_history(self, conversation_id: str, symbol: str) -> List[Dict[str, str]]:
        """Retrieve conversation history from database."""
        cursor = self.conn.execute(
            """
            SELECT role, content 
            FROM asset_messages 
            WHERE conversation_id = ? AND symbol = ?
            ORDER BY timestamp ASC
            """,
            (conversation_id, symbol)
        )
        return [{"role": row["role"], "content": row["content"]} for row in cursor.fetchall()]

    def _save_message(self, conversation_id: str, symbol: str, role: str, content: str):
        """Save a message to the database."""
        self.conn.execute(
            """
            INSERT INTO asset_messages (conversation_id, symbol, role, content)
            VALUES (?, ?, ?, ?)
            """,
            (conversation_id, symbol, role, content)
        )
        self.conn.commit()

    def _get_asset_details(self, symbol: str) -> Dict[str, Any]:
        """Retrieve details for a specific asset from the tracked_assets table."""
        try:
            cursor = self.conn.execute(
                """
                SELECT *
                FROM tracked_assets 
                WHERE symbol = ?
                """,
                (symbol,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            logger.warning(f"Asset details not found for symbol: {symbol} in tracked_assets table.")
            return {} 
        except sqlite3.Error as e:
            # Log specific sqlite3 error if it's about a missing table
            if "no such table" in str(e).lower() and "tracked_assets" in str(e).lower():
                logger.error(f"The 'tracked_assets' table does not exist. Please ensure it is created and populated. Error: {str(e)}")
            else:
                logger.error(f"Error fetching asset details for {symbol}: {str(e)}")
            return {}

    def _get_other_asset_symbols(self, current_symbol: str) -> Any:
        """Retrieve symbols of other tracked assets, excluding the current one."""
        try:
            cursor = self.conn.execute(
                """
                SELECT * 
                FROM tracked_assets 
                WHERE symbol != ?
                ORDER BY symbol ASC
                """,
                (current_symbol,)
            )
            return [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            if "no such table" in str(e).lower() and "tracked_assets" in str(e).lower():
                logger.error(f"The 'tracked_assets' table does not exist. Cannot fetch other asset symbols. Error: {str(e)}")
            else:
                logger.error(f"Error fetching other asset symbols: {str(e)}")
            return []

    def _create_messages(self, user_content: str, symbol: str, conversation_id: str) -> list:
        """Create message list with system message and user content, including conversation history."""
        
        # Fetch asset context
        asset_details = self._get_asset_details(symbol)
        other_assets = self._get_other_asset_symbols(symbol)
        
        context_parts = []
        if asset_details:
            asset_name = asset_details.get('name', symbol) 
            context_parts.append(f"Context for {asset_name} ({symbol}):")
            for key, value in asset_details.items():
                if key not in ['symbol', 'name'] and value is not None: # Exclude symbol and name, already used

                    formatted_key = key.replace('_', ' ').capitalize()
                    context_parts.append(f"- {formatted_key}: {value}")
        
        if other_assets:
            if context_parts: # Add a newline if there was previous asset context
                context_parts.append("") # Ensures a blank line for paragraph separation
            context_parts.append("Other of my tracked assets, you might need this info to compare against them:")
            context_parts.append(str(other_assets))
            
        context_string = "\\n".join(context_parts)
        
        # Get the base system message content
        base_system_content = self.system_message["content"]
        
        # Prepend context if available
        if context_string:
            final_system_content = f"{context_string}\\n\\n{base_system_content}"
        else:
            final_system_content = base_system_content
        current_system_message = {
            "role": "system",
            "content": final_system_content
        }
        
        messages = [current_system_message]
        # Add conversation history if it exists
        messages.extend(self._get_conversation_history(conversation_id, symbol))
        # Add new user message
        messages.append({"role": "user", "content": user_content})
        return messages

    def _handle_completion_response(self, messages: list) -> Dict[str, Any]:
        """Handle non-streaming response from the API."""
        try:
            response = self.client.chat.completions.create(
                model=self.model, messages=messages
            )
            return {"type": "completion", "data": response}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Completion error: {str(e)}")

    def _update_conversation_history(self, conversation_id: str, symbol: str, messages: List[Dict[str, str]], response: Dict[str, Any]):
        """Update conversation history with both user message and assistant response."""
        # Save the last user message
        self._save_message(conversation_id, symbol, "user", messages[-1]["content"])
        
        if response["type"] == "completion":
            assistant_content = response["data"].choices[0].message.content
            self._save_message(conversation_id, symbol, "assistant", assistant_content)

    def process_chat_request(
        self, user_content: str, symbol: str, conversation_id: str
    ) -> Dict[str, Any]:
        """
        Process the asset chat request and return appropriate response.

        Args:
            user_content (str): The user's message content
            symbol (str): The asset symbol being discussed
            conversation_id (str): Unique identifier for the conversation

        Returns:
            Dict[str, Any]: Response containing completion data
        """
        try:
            messages = self._create_messages(user_content, symbol, conversation_id)
            logger.info(f"Messages: {messages}")
            result = self._handle_completion_response(messages)
            # Update conversation history with the response
            self._update_conversation_history(conversation_id, symbol, messages, result)
            return result
            
        except Exception as e:
            logger.error(f"Error processing chat request: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_chat_history(self, symbol: str) -> List[Dict[str, Any]]:
        """Get chat history for a specific asset."""
        try:
            cursor = self.conn.execute("""
                SELECT 
                    conversation_id,
                    MIN(timestamp) as first_message_time,
                    (
                        SELECT content 
                        FROM asset_messages m2 
                        WHERE m2.conversation_id = m1.conversation_id 
                        AND m2.role = 'user'
                        ORDER BY m2.timestamp ASC 
                        LIMIT 1
                    ) as first_message
                FROM asset_messages m1
                WHERE symbol = ?
                GROUP BY conversation_id
                ORDER BY first_message_time DESC
            """, (symbol,))
            
            history = []
            for row in cursor.fetchall():
                history.append({
                    "id": row["conversation_id"],
                    "title": row["first_message"][:30] + ("..." if len(row["first_message"]) > 30 else ""),
                    "timestamp": row["first_message_time"]
                })
            
            return history
        except Exception as e:
            logger.error(f"Error fetching chat history: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_chat_messages(self, conversation_id: str, symbol: str) -> List[Dict[str, Any]]:
        """Get all messages for a specific chat conversation."""
        try:
            cursor = self.conn.execute("""
                SELECT id, role, content, timestamp
                FROM asset_messages
                WHERE conversation_id = ? AND symbol = ?
                ORDER BY timestamp ASC
            """, (conversation_id, symbol))
            
            messages = []
            for row in cursor.fetchall():
                messages.append({
                    "id": row["id"],
                    "text": row["content"],
                    "sender": "user" if row["role"] == "user" else "bot",
                    "timestamp": row["timestamp"]
                })
            
            return messages
        except Exception as e:
            logger.error(f"Error fetching chat messages: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def __del__(self):
        """Cleanup database connection when the service is destroyed."""
        if hasattr(self, 'conn'):
            self.conn.close() 