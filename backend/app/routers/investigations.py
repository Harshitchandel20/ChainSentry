from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from app.models.schemas import InvestigationResult, DiscoveredPath
from app.services.agent_service import agent
from app.services.falkordb_service import graph_service

router = APIRouter(prefix="/api/investigations", tags=["Investigations"])

@router.post("", response_model=InvestigationResult)
def run_investigation(payload: Dict[str, str] = Body(...)):
    finding_id = payload.get("finding_id")
    if not finding_id:
        raise HTTPException(status_code=400, detail="Missing required field 'finding_id'")
    try:
        result = agent.investigate(finding_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Investigation failed: {str(e)}")

@router.get("/paths/{finding_id}", response_model=List[DiscoveredPath])
def get_finding_paths(finding_id: str):
    finding = graph_service.get_finding(finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found.")
    return graph_service.trace_finding_paths(finding_id)

@router.get("/history", response_model=List[Dict[str, Any]])
def get_investigation_history():
    return graph_service.get_investigations_history()
