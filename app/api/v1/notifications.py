from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.models.all_models import Notification, User
from app.api.v1.notices import get_current_user

router = APIRouter()

@router.get("/")
async def get_notifications(
    skip: int = 0,
    limit: int = 20,
    is_read: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Notification).where(Notification.user_id == current_user.id).order_by(desc(Notification.created_at))
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

@router.patch("/{id}/read")
async def mark_notification_read(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        update(Notification)
        .where(Notification.id == id, Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    return {"status": "ok"}

@router.patch("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    return {"status": "ok"}

@router.get("/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Mock count calculation
    result = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    count = len(result.scalars().all())
    return {"count": count}
