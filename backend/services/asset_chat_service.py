from openai import AsyncOpenAI
import os
from typing import Dict, Any, Union, List
from fastapi import HTTPException
import sqlite3
import json
from datetime import datetime
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

class AssetChatService:
    def __init__(self):
        logger.info("Initializing AssetChatService")
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
        db_path = os.path.expanduser("~/perplexity_hack.db")
        logger.info(f"AssetChatService is connecting to database at: {db_path}")
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
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
        self.conn.execute(""" 
            CREATE TABLE IF NOT EXISTS tracked_assets (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL, -- Assuming assets are tied to users
                symbol TEXT NOT NULL UNIQUE, -- Added UNIQUE constraint based on typical usage
                name TEXT NOT NULL,
                price REAL,
                movement REAL,
                reason TEXT,
                sector TEXT,
                news TEXT, -- Storing as JSON string
                price_history TEXT, -- Storing as JSON string
                created_at DATETIME,
                last_updated DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id) -- If you have a users table
            )
        """)
        self.conn.commit()

    async def clear_database(self):
        """Clear all data from the asset_messages table."""
        loop = asyncio.get_event_loop()
        try:
            def db_clear():
                self.conn.execute("DROP TABLE IF EXISTS asset_messages")
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
                return True
            
            success = await loop.run_in_executor(None, db_clear)
            logger.info("Successfully cleared asset_messages table.")
            return success
        except Exception as e:
            logger.error(f"Error clearing asset_messages database: {str(e)}")
            return False

    async def _get_conversation_history(self, conversation_id: str, symbol: str) -> List[Dict[str, str]]:
        """Retrieve conversation history from database."""
        loop = asyncio.get_event_loop()
        def db_query():
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
        
        history = await loop.run_in_executor(None, db_query)
        return history

    async def _save_message(self, conversation_id: str, symbol: str, role: str, content: str):
        """Save a message to the database."""
        loop = asyncio.get_event_loop()
        def db_insert():
            self.conn.execute(
                """
                INSERT INTO asset_messages (conversation_id, symbol, role, content)
                VALUES (?, ?, ?, ?)
                """,
                (conversation_id, symbol, role, content)
            )
            self.conn.commit()
        
        await loop.run_in_executor(None, db_insert)

    async def _get_asset_details(self, symbol: str) -> Dict[str, Any]:
        """Retrieve details for a specific asset from the tracked_assets table."""
        loop = asyncio.get_event_loop()
        def db_query():
            try:
                cursor = self.conn.execute(
                    "SELECT * FROM tracked_assets WHERE symbol = ?",
                    (symbol,)
                )
                row = cursor.fetchone()
                if row:
                    return dict(row)
                logger.warning(f"Asset details not found for symbol: {symbol} in tracked_assets table.")
                return {} 
            except sqlite3.Error as e:
                if "no such table" in str(e).lower() and "tracked_assets" in str(e).lower():
                    logger.error(f"The 'tracked_assets' table does not exist. Error: {str(e)}")
                else:
                    logger.error(f"Error fetching asset details for {symbol}: {str(e)}")
                return {}
        
        details = await loop.run_in_executor(None, db_query)
        return details

    async def _get_other_asset_symbols(self, current_symbol: str) -> List[Dict[str, Any]]:
        """Retrieve symbols of other tracked assets, excluding the current one."""
        loop = asyncio.get_event_loop()
        def db_query():
            try:
                cursor = self.conn.execute(
                    "SELECT * FROM tracked_assets WHERE symbol != ? ORDER BY symbol ASC",
                    (current_symbol,)
                )
                return [dict(row) for row in cursor.fetchall()]
            except sqlite3.Error as e:
                if "no such table" in str(e).lower() and "tracked_assets" in str(e).lower():
                    logger.error(f"The 'tracked_assets' table does not exist. Error: {str(e)}")
                else:
                    logger.error(f"Error fetching other asset symbols: {str(e)}")
                return []
        
        symbols = await loop.run_in_executor(None, db_query)
        return symbols

    async def _create_messages(self, user_content: str, symbol: str, conversation_id: str) -> list:
        asset_details = await self._get_asset_details(symbol)
        other_assets = await self._get_other_asset_symbols(symbol)
        
        context_parts = []
        if asset_details:
            asset_name = asset_details.get('name', symbol) 
            context_parts.append(f"Context for {asset_name} ({symbol}):")
            for key, value in asset_details.items():
                if key not in ['symbol', 'name', 'id', 'user_id'] and value is not None:
                    formatted_key = key.replace('_', ' ').capitalize()
                    context_parts.append(f"- {formatted_key}: {value}")
        
        if other_assets:
            if context_parts: 
                context_parts.append("") 
            context_parts.append("Other tracked assets for context (user might ask for comparisons):")
            other_assets_repr = [f"{a.get('name', a.get('symbol'))} ({a.get('symbol')})" for a in other_assets]
            context_parts.append(", ".join(other_assets_repr))
            
        context_string = "\n".join(context_parts)
        base_system_content = self.system_message["content"]
        
        if context_string:
            final_system_content = f"{context_string}\n\n{base_system_content}"
        else:
            final_system_content = base_system_content
        
        current_system_message = {"role": "system", "content": final_system_content}
        messages = [current_system_message]
        history = await self._get_conversation_history(conversation_id, symbol)
        messages.extend(history)
        messages.append({"role": "user", "content": user_content})
        return messages

    async def _handle_completion_response(self, messages: list) -> Dict[str, Any]:
        """Handle non-streaming response from the API."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model, messages=messages
            )
            return {"type": "completion", "data": response}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Completion error: {str(e)}")

    async def _update_conversation_history(self, conversation_id: str, symbol: str, messages: List[Dict[str, str]], response: Dict[str, Any]):
        await self._save_message(conversation_id, symbol, "user", messages[-1]["content"])
        
        if response["type"] == "completion":
            assistant_content = response["data"].choices[0].message.content
            await self._save_message(conversation_id, symbol, "assistant", assistant_content)

    async def process_chat_request(
        self, user_content: str, symbol: str, conversation_id: str
    ) -> Dict[str, Any]:
        try:
            messages = await self._create_messages(user_content, symbol, conversation_id)
            logger.info(f"Messages prepared for AssetChat for symbol {symbol}, convo ID {conversation_id}")
            result = await self._handle_completion_response(messages)
            await self._update_conversation_history(conversation_id, symbol, messages, result)
            logger.info(f"Successfully processed AssetChat request for symbol {symbol}, convo ID {conversation_id}")
            return result
        except Exception as e:
            logger.error(f"Error processing asset chat request for {symbol}, convo ID {conversation_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_chat_history(self, symbol: str, user_id: int) -> List[Dict[str, Any]]:
        """Get chat history summaries for a specific asset, associated with a user."""
        loop = asyncio.get_event_loop()
        def db_query():
            cursor = self.conn.execute("""
                SELECT 
                    conversation_id,
                    MIN(timestamp) as first_message_time,
                    (
                        SELECT content 
                        FROM asset_messages m2 
                        WHERE m2.conversation_id = m1.conversation_id 
                        AND m2.symbol = ? 
                        AND m2.role = 'user'
                        ORDER BY m2.timestamp ASC 
                        LIMIT 1
                    ) as first_message
                FROM asset_messages m1
                WHERE m1.symbol = ? 
                GROUP BY conversation_id
                ORDER BY first_message_time DESC
            """, (symbol, symbol))
            
            history_data = []
            for row in cursor.fetchall():
                history_data.append({
                    "id": row["conversation_id"],
                    "title": row["first_message"][:50] + ("..." if len(row["first_message"]) > 50 else ""),
                    "timestamp": row["first_message_time"],
                    "symbol": symbol
                })
            return history_data
        
        history = await loop.run_in_executor(None, db_query)
        logger.info(f"Retrieved {len(history)} conversation histories for asset: {symbol}")
        return history

    async def get_chat_messages(self, conversation_id: str, symbol: str, user_id: int) -> List[Dict[str, Any]]:
        """Get all messages for a specific asset chat conversation."""
        loop = asyncio.get_event_loop()
        def db_query():
            cursor = self.conn.execute("""
                SELECT id, role, content, timestamp
                FROM asset_messages
                WHERE conversation_id = ? AND symbol = ?
                ORDER BY timestamp ASC
            """, (conversation_id, symbol))
            
            messages_data = []
            for row in cursor.fetchall():
                messages_data.append({
                    "id": row["id"],
                    "text": row["content"],
                    "sender": "user" if row["role"] == "user" else "bot",
                    "timestamp": row["timestamp"],
                    "symbol": symbol
                })
            return messages_data

        messages = await loop.run_in_executor(None, db_query)
        logger.info(f"Retrieved {len(messages)} messages for asset {symbol}, conversation {conversation_id}")
        return messages

    def __del__(self):
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()
            logger.info("AssetChatService database connection closed.") 