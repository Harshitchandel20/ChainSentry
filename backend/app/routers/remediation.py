from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import RemediationTask, RemediationTaskCreate, RemediationTaskUpdate
from app.services.falkordb_service import graph_service

router = APIRouter(prefix="/api/remediation-tasks", tags=["Remediation"])

@router.get("", response_model=List[RemediationTask])
def list_remediation_tasks(
    status: Optional[str] = Query(None, description="Filter by status (OPEN, IN_PROGRESS, RESOLVED)")
):
    tasks = graph_service.get_remediation_tasks()
    if status:
        tasks = [t for t in tasks if t.status.upper() == status.upper()]
    return tasks

@router.post("", response_model=RemediationTask, status_code=201)
def create_remediation_task(task_in: RemediationTaskCreate):
    finding = graph_service.get_finding(task_in.finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding '{task_in.finding_id}' not found.")
    
    task = graph_service.create_remediation_task(
        finding_id=task_in.finding_id,
        title=task_in.title,
        priority=task_in.priority,
        assigned_to=task_in.assigned_to
    )
    return task

@router.patch("/{task_id}", response_model=RemediationTask)
def update_remediation_task(task_id: str, task_up: RemediationTaskUpdate):
    task = graph_service.update_remediation_task(
        task_id=task_id,
        status=task_up.status,
        priority=task_up.priority,
        assigned_to=task_up.assigned_to
    )
    if not task:
        raise HTTPException(status_code=404, detail=f"RemediationTask '{task_id}' not found.")
    return task
