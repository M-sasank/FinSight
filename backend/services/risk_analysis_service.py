from openai import AsyncOpenAI
import os
from typing import Dict, Any, List
from fastapi import HTTPException
import logging
import json
import yaml
from pathlib import Path
from datetime import datetime, timezone, timedelta
from models.risk_analysis import RiskAnalysisResponse, RiskFactors, PricePoint
import sqlite3
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

class RiskAnalysisService:
    def __init__(self):
        logger.info("Initializing RiskAnalysisService")
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

        try:
            db_path = "finsight.db"
            logger.info(f"RiskAnalysisService is connecting to database at: {os.path.abspath(db_path)}")
            self.conn = sqlite3.connect(db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
            logger.info(f"Successfully connected to database at {db_path}")
        except Exception as e:
            logger.error(f"Failed to connect to database: {str(e)}")
            self.conn = None

        # Load prompts from YAML
        try:
            config_path = Path(__file__).parent.parent / "config" / "risk_analysis.yaml"
            with open(config_path, "r") as file:
                prompts = yaml.safe_load(file)
                self.system_message = {
                    "role": "system",
                    "content": prompts["risk_analysis"]["system_prompt"],
                }
                self.user_prompt_template = prompts["risk_analysis"]["user_prompt_template"]
            logger.info("Successfully loaded prompts from YAML")
        except Exception as e:
            logger.error(f"Failed to load prompts from YAML: {str(e)}")
            raise

    async def _store_risk_analysis(self, asset_symbol: str, analysis: RiskAnalysisResponse):
        """Store risk analysis results in the tracked_assets table."""
        try:
            def db_call():
                self.conn.execute("""
                    UPDATE tracked_assets 
                    SET 
                        risk_level = ?,
                        volatility_score = ?,
                        sector_trend_score = ?,
                        dip_count_last_month = ?,
                        sentiment_class = ?,
                        volatility_breakdown = ?,
                        sector_breakdown = ?,
                        sentiment_breakdown = ?,
                        risk_confidence = ?,
                        risk_recommendation = ?,
                        risk_analysis_updated_at = CURRENT_TIMESTAMP
                    WHERE symbol = ?
                """, (
                    analysis.risk_level,
                    analysis.factors.volatility_score,
                    analysis.factors.sector_trend_score,
                    analysis.factors.dip_count_last_month,
                    analysis.factors.sentiment_class,
                    analysis.risk_breakdown.volatility,
                    analysis.risk_breakdown.sector,
                    analysis.risk_breakdown.sentiment,
                    analysis.confidence,
                    analysis.recommendation,
                    asset_symbol
                ))
                self.conn.commit()

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, db_call)
            logger.info(f"Stored risk analysis for asset {asset_symbol}")
        except Exception as e:
            logger.error(f"Failed to store risk analysis for {asset_symbol}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to store risk analysis")

    async def _get_latest_risk_analysis(self, asset_symbol: str) -> Dict[str, Any]:
        """Get the latest risk analysis for an asset from tracked_assets table."""
        try:
            def db_call():
                cursor = self.conn.execute("""
                    SELECT 
                        symbol,
                        name,
                        risk_level,
                        volatility_score,
                        sector_trend_score,
                        dip_count_last_month,
                        sentiment_class,
                        volatility_breakdown,
                        sector_breakdown,
                        sentiment_breakdown,
                        risk_confidence,
                        risk_recommendation,
                        risk_analysis_updated_at
                    FROM tracked_assets 
                    WHERE symbol = ?
                """, (asset_symbol,))
                row = cursor.fetchone()
                if not row or not row["risk_level"]:
                    return None
                
                return {
                    "asset_symbol": row["symbol"],
                    "asset_name": row["name"],
                    "risk_level": row["risk_level"],
                    "factors": {
                        "volatility_score": row["volatility_score"],
                        "sector_trend_score": row["sector_trend_score"],
                        "dip_count_last_month": row["dip_count_last_month"],
                        "sentiment_class": row["sentiment_class"]
                    },
                    "risk_breakdown": {
                        "volatility": row["volatility_breakdown"],
                        "sector": row["sector_breakdown"],
                        "sentiment": row["sentiment_breakdown"]
                    },
                    "confidence": row["risk_confidence"],
                    "recommendation": row["risk_recommendation"],
                    "risk_analysis_updated_at": row["risk_analysis_updated_at"]
                }

            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, db_call)
        except Exception as e:
            logger.error(f"Failed to get risk analysis for {asset_symbol}: {str(e)}")
            return None

    async def _get_asset_data(self, asset_symbol: str) -> Dict[str, Any]:
        """Fetch asset data from the database."""
        if not self.conn:
            logger.error("Database connection not available")
            raise HTTPException(status_code=500, detail="Database connection not available")

        try:
            def db_call():
                cursor = self.conn.execute(
                    "SELECT symbol, name, price, price_history FROM tracked_assets WHERE symbol = ?",
                    (asset_symbol,)
                )
                row = cursor.fetchone()
                if not row:
                    return None
                
                asset_data = {
                    "symbol": row["symbol"],
                    "name": row["name"],
                    "price": row["price"]
                }
                try:
                    asset_data["price_history"] = json.loads(row["price_history"]) if row["price_history"] else []
                except (json.JSONDecodeError, TypeError):
                    asset_data["price_history"] = []
                return asset_data

            loop = asyncio.get_event_loop()
            asset_data = await loop.run_in_executor(None, db_call)
            
            if not asset_data:
                raise HTTPException(status_code=404, detail=f"Asset {asset_symbol} not found")
            
            return asset_data
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching asset data for {asset_symbol}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def _create_messages(self, asset_data: Dict[str, Any]) -> list:
        """Create message list with system message and asset data."""
        logger.info(f"Creating messages for asset: {asset_data['symbol']}")
        try:
            messages = [self.system_message]
            
            # Format price history for the prompt
            price_history_str = ""
            if asset_data.get("price_history"):
                today = datetime.now().date()
                for i, price in enumerate(asset_data["price_history"]):
                    date = today - timedelta(days=len(asset_data["price_history"]) - i)
                    price_history_str += f"Date: {date.isoformat()}, Close: {price}\n"
            
            user_content = self.user_prompt_template.format(
                symbol=asset_data["symbol"],
                name=asset_data["name"],
                current_price=asset_data["price"],
                price_history=price_history_str
            )
            
            messages.append({"role": "user", "content": user_content})
            return messages
        except Exception as e:
            logger.error(f"Error creating messages: {str(e)}")
            raise

    async def _handle_completion_response(self, messages: list) -> Dict[str, Any]:
        """Handle response from the Sonar API."""
        logger.info("Handling completion response")
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={
                    "type": "json_schema",
                    "json_schema": {"schema": RiskAnalysisResponse.model_json_schema()},
                },
            )
            
            response_dict = response.model_dump(exclude_none=True)
            content = response_dict["choices"][0]["message"]["content"]
            
            # Extract JSON from the response
            try:
                parsed_json = json.loads(content)
                return parsed_json
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from response: {str(e)}")
                raise HTTPException(status_code=500, detail="Invalid response format from Sonar API")
                
        except Exception as e:
            logger.error(f"Error in completion response: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Completion error: {str(e)}")

    async def analyze_asset_risk(self, asset_symbol: str) -> RiskAnalysisResponse:
        """Analyze risk for a given asset."""
        logger.info(f"Analyzing risk for asset: {asset_symbol}")
        
        try:
            # First check if we have a recent analysis in the database
            cached_analysis = await self._get_latest_risk_analysis(asset_symbol)
            
            if cached_analysis:
                # Check if the analysis is less than 1 day old
                updated_at = datetime.fromisoformat(cached_analysis["risk_analysis_updated_at"].replace('Z', '+00:00')).replace(tzinfo=timezone.utc)
                now = datetime.now(timezone.utc)
                if (now - updated_at) < timedelta(days=1):
                    logger.info(f"Using cached risk analysis for {asset_symbol} from {updated_at}")
                    return RiskAnalysisResponse(**cached_analysis)
                else:
                    logger.info(f"Cached analysis for {asset_symbol} is older than 1 day, proceeding with new analysis")
            
            # If no cached analysis or it's too old, proceed with new analysis
            asset_data = await self._get_asset_data(asset_symbol)
            messages = self._create_messages(asset_data)
            analysis_result = await self._handle_completion_response(messages)
            analysis = RiskAnalysisResponse(**analysis_result)
            await self._store_risk_analysis(asset_symbol, analysis)  
            return analysis
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error analyzing asset risk for {asset_symbol}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e)) 