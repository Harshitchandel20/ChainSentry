import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "ChainSentry"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # FalkorDB settings
    FALKORDB_HOST: str = os.getenv("FALKORDB_HOST", "localhost")
    FALKORDB_PORT: int = int(os.getenv("FALKORDB_PORT", "6379"))
    FALKORDB_PASSWORD: str | None = os.getenv("FALKORDB_PASSWORD", None) or None
    FALKORDB_USERNAME: str | None = os.getenv("FALKORDB_USERNAME", None) or None
    FALKORDB_GRAPH_NAME: str = os.getenv("FALKORDB_GRAPH_NAME", "chainsentry")
    
    # Optional LLM settings
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY", None)
    
    # Application host/port
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()
