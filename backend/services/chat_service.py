from openai import AsyncOpenAI
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
import asyncio

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
            self.client = AsyncOpenAI(
                api_key=os.getenv("PERPLEXITY_API_KEY"),
                base_url="https://api.perplexity.ai",
            )
            logger.info("AsyncOpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AsyncOpenAI client: {str(e)}")
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
                self.system_message_guide = {
                    "role": "system",
                    "content": prompts['chat_service']['system_message_guide']
                }
                self.guide_content = prompts['chat_service']['guide_content']
            logger.info("Successfully loaded prompts from YAML")
        except Exception as e:
            logger.error(f"Failed to load prompts from YAML: {str(e)}")
            raise

        # Initialize database
        self._init_db()

    def _init_db(self):
        """Initialize SQLite database and create necessary tables."""
        db_path = "finsight.db"
        logger.info(f"ChatService is connecting to database at: {os.path.abspath(db_path)}")

        # Connect to database
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        
        # Create messages table if it doesn't exist
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                type TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)

        # Create tracked_assets table if it doesn't exist
        # Note: Assets should ideally be linked to users too.
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS tracked_assets (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                movement REAL NOT NULL,
                reason TEXT NOT NULL,
                sector TEXT NOT NULL,
                news TEXT NOT NULL,
                price_history TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                last_updated DATETIME NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        self.conn.commit()


    async def clear_database(self, user_id: Union[int, None] = None):
        """Clear data from the database. If user_id is provided, clears only for that user."""
        loop = asyncio.get_event_loop()
        try:
            def db_clear():
                if user_id is not None:
                    logger.info(f"Clearing database for user_id: {user_id}")
                    self.conn.execute("DELETE FROM messages WHERE user_id = ?", (user_id,))
                    self.conn.execute("DELETE FROM tracked_assets WHERE user_id = ?", (user_id,))
                else:
                    # This is the old behavior, clears everything. 
                    # Consider restricting this to admin users in the future.
                    logger.warning("Clearing all data from messages and tracked_assets tables (no user_id provided).")
                    self.conn.execute("DROP TABLE IF EXISTS messages")
                    self.conn.execute("DROP TABLE IF EXISTS tracked_assets")
                    
                    # recreate the tables with user_id
                    self.conn.execute("""
                        CREATE TABLE IF NOT EXISTS messages (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            conversation_id TEXT NOT NULL,
                            user_id INTEGER NOT NULL,
                            role TEXT NOT NULL,
                            content TEXT NOT NULL,
                            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                            type TEXT NOT NULL,
                            FOREIGN KEY (user_id) REFERENCES users (id)
                        )
                    """)

                    self.conn.execute("""
                        CREATE TABLE IF NOT EXISTS tracked_assets (
                            id TEXT PRIMARY KEY,
                            user_id INTEGER NOT NULL,
                            symbol TEXT NOT NULL,
                            name TEXT NOT NULL,
                            price REAL NOT NULL,
                            movement REAL NOT NULL,
                            reason TEXT NOT NULL,
                            sector TEXT NOT NULL,
                            news TEXT NOT NULL,
                            price_history TEXT NOT NULL,
                            created_at DATETIME NOT NULL,
                            last_updated DATETIME NOT NULL,
                            FOREIGN KEY (user_id) REFERENCES users (id)
                        )
                    """)
                
                self.conn.commit()
                return True
            
            success = await loop.run_in_executor(None, db_clear)
            return success
        except Exception as e:
            logger.error(f"Error clearing database: {e}")
            # Ensure we return False on exception after logging
            return False

    async def _get_conversation_history(self, conversation_id: str, type: str, user_id: int) -> List[Dict[str, str]]:
        """Retrieve conversation history from database for a specific user."""
        loop = asyncio.get_event_loop()
        def db_query():
            cursor = self.conn.execute(
                """
                SELECT role, content 
                FROM messages 
                WHERE conversation_id = ? AND type = ? AND user_id = ?
                ORDER BY timestamp ASC
                """,
                (conversation_id, type, user_id)
            )
            return [{"role": row["role"], "content": row["content"]} for row in cursor.fetchall()]
        
        history = await loop.run_in_executor(None, db_query)
        return history

    async def _save_message(self, conversation_id: str, role: str, content: str, type: str, user_id: int):
        """Save a message to the database for a specific user."""
        loop = asyncio.get_event_loop()
        def db_insert():
            self.conn.execute(
                """
                INSERT INTO messages (conversation_id, role, content, type, user_id)
                VALUES (?, ?, ?, ?, ?)
                """,
                (conversation_id, role, content, type, user_id)
            )
            self.conn.commit()
        
        await loop.run_in_executor(None, db_insert)

    async def _create_messages_chat(self, user_content: str, conversation_id: str, user_id: int) -> list:
        """Create message list with chat message and user content, including conversation history."""
        messages = [self.system_message_chat]
        history = await self._get_conversation_history(conversation_id, "chat", user_id)
        messages.extend(history)
        messages.append({"role": "user", "content": user_content})
        return messages

    async def _create_messages_newbie(self, user_content: str, conversation_id: str, user_id: int) -> list:
        """Create message list with newbie message and user content, including conversation history."""
        messages = [self.system_message_newbie]
        history = await self._get_conversation_history(conversation_id, "newbie", user_id)
        messages.extend(history)
        messages.append({"role": "user", "content": user_content})
        return messages

    async def _create_messages_guide(self, user_content: str, conversation_id: str, user_id: int) -> list:
        """Create message list with guide-specific system message, section context, and user content, including conversation history."""
        # Format the system message with the current section name
        system_message_content = self.system_message_guide["content"].format(guide_text=yaml.dump(self.guide_content))
        print(system_message_content)
        messages = [{"role": "system", "content": system_message_content}]
        
        history = await self._get_conversation_history(conversation_id, "guide", user_id)
        messages.extend(history)
        messages.append({"role": "user", "content": user_content})
        logger.info(f"Created messages for guide: {pprint.pformat(messages)}")
        return messages

    async def _update_conversation_history(self, conversation_id: str, messages: List[Dict[str, str]], response: Dict[str, Any], type: str, user_id: int):
        """Update conversation history with both user message and assistant response."""
        await self._save_message(conversation_id, "user", messages[-1]["content"], type, user_id)
        
        if response["type"] == "completion":
            assistant_content = response["data"].choices[0].message.content
            await self._save_message(conversation_id, "assistant", assistant_content, type, user_id)

    async def _handle_streaming_response(self, messages: list) -> Dict[str, Any]:
        """Handle streaming response from the API."""
        try:
            response_stream = await self.client.chat.completions.create(
                model=self.model, messages=messages, stream=True
            )
            return {"type": "stream", "data": response_stream}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Streaming error: {str(e)}")

    async def _handle_completion_response(self, messages: list) -> Dict[str, Any]:
        """Handle non-streaming response from the API."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model, messages=messages
            )
            return {"type": "completion", "data": response}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Completion error: {str(e)}")

    async def process_chat_request(
        self, type: str, user_content: str, stream: bool, conversation_id: str, user_id: int
    ) -> Dict[str, Any]:
        """
        Process the chat request and return appropriate response.

        Args:
            type (str): The type of request, either "chat", "newbie", or "guide"
            user_content (str): The user's message content. For "guide" type, this is the user's query.
            stream (bool): Whether to stream the response
            conversation_id (str): Unique identifier for the conversation
            user_id (int): Unique identifier for the user

        Returns:
            Dict[str, Any]: Response containing either stream or completion data
        """
        messages: list = []
        try:
            if type == "chat":
                messages = await self._create_messages_chat(user_content, conversation_id, user_id)
            elif type == "newbie":
                messages = await self._create_messages_newbie(user_content, conversation_id, user_id)
            elif type == "guide":
                messages = await self._create_messages_guide(user_content, conversation_id, user_id)
            else:
                raise HTTPException(status_code=400, detail="Invalid request type")

            logger.info(f"Context messages for conversation {conversation_id} (type: {type}): {pprint.pformat(messages)}")

            if stream:
                result = await self._handle_streaming_response(messages)
            else:
                result = await self._handle_completion_response(messages)
                await self._update_conversation_history(conversation_id, messages, result, type, user_id)
            
            logger.info(f"Result for conversation {conversation_id} (type: {type}): {result}")
            return result
            
        except HTTPException as he:
            logger.error(f"HTTPException in process_chat_request: {he.detail}")
            raise he
        except Exception as e:
            logger.error(f"Error in process_chat_request: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))

    def __del__(self):
        """Cleanup database connection when the service is destroyed."""
        if hasattr(self, 'conn'):
            self.conn.close()
