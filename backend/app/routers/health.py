from fastapi import APIRouter
from app.services.falkordb_service import graph_service
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "falkordb_connected": graph_service.is_connected,
        "falkordb_host": settings.FALKORDB_HOST,
        "falkordb_port": settings.FALKORDB_PORT,
        "graph_name": settings.FALKORDB_GRAPH_NAME,
        "investigation_mode": "graph_native_deterministic"
    }
