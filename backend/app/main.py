import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.falkordb_service import graph_service
from app.routers import health, dashboard, findings, investigations, remediation, demo

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("chainsentry")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ChainSentry Backend...")
    try:
        graph_service.seed_graph()
        logger.info("Graph initialized and ready.")
    except Exception as e:
        logger.error("Initialization error: %s", e)
    yield
    logger.info("ChainSentry Backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ChainSentry - Graph-Native AI Security Investigation Platform for WeMakeDevs x FalkorDB Hackathon",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(health.router)
app.include_router(dashboard.router)
app.include_router(findings.router)
app.include_router(investigations.router)
app.include_router(remediation.router)
app.include_router(demo.router)

@app.get("/")
def root():
    return {
        "project": "ChainSentry",
        "tagline": "Don't just find vulnerabilities. Find the chain that makes them dangerous.",
        "track": "Agents That Act on Connected Data",
        "docs": "/docs",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
