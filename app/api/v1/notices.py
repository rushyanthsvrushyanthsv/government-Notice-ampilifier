from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.models.all_models import Notice, User, NoticeStatus, FileType, ActionItem
from app.api.v1.auth import router as auth_router # For shared dependencies like current_user
from app.services.storage_service import storage_service
from app.core.config import settings

# This would ideally be in a dependencies.py file
async def get_current_user(db: AsyncSession = Depends(get_db)):
    # Mock for brevity, in production would use JWT verify
    result = await db.execute(select(User).limit(1))
    return result.scalars().first()

router = APIRouter()

@router.post("/upload")
async def upload_notice(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    # Validate file
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    
    file_type = FileType.PDF if file.content_type == "application/pdf" else FileType.IMAGE
    notice_id = uuid.uuid4()
    
    # Upload to GCS
    gcs_path = await storage_service.upload_file(
        content, file.filename, file.content_type, str(current_user.id), str(notice_id)
    )
    
    # Create DB record
    new_notice = Notice(
        id=notice_id,
        user_id=current_user.id,
        original_filename=file.filename,
        file_type=file_type,
        gcs_file_url=gcs_path,
        processing_status=NoticeStatus.PENDING
    )
    db.add(new_notice)
    await db.commit()
    
    # Trigger Celery task (Task 6 would implement this)
    # from app.workers.tasks.process_notice import process_notice_task
    # process_notice_task.delay(str(notice_id))
    
    return {"notice_id": str(notice_id), "status": "processing"}

@router.get("/{notice_id}")
async def get_notice(
    notice_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notice).where(Notice.id == notice_id, Notice.user_id == current_user.id)
    )
    notice = result.scalars().first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    
    # Fetch action items
    ai_result = await db.execute(select(ActionItem).where(ActionItem.notice_id == notice_id))
    action_items = ai_result.scalars().all()
    
    return {
        "id": notice.id,
        "title": notice.original_filename,
        "status": notice.processing_status,
        "summary": notice.simplified_summary,
        "summary_kn": notice.simplified_summary_kn,
        "urgency": notice.urgency_level,
        "deadlines": notice.key_deadlines,
        "action_items": action_items
    }

@router.get("/")
async def list_notices(
    skip: int = 0,
    limit: int = 20,
    status: Optional[NoticeStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Notice).where(Notice.user_id == current_user.id).order_by(desc(Notice.created_at))
    if status:
        query = query.where(Notice.processing_status == status)
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()
