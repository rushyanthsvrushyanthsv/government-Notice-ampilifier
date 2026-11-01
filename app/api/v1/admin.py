from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.models.all_models import User, Notice, Deadline, UserRole
from app.api.v1.notices import get_current_user

router = APIRouter()

# Dependency to check admin role
async def check_admin(current_user: User = Depends(get_current_user)):
    if not current_user or current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Admin permissions required")
    return current_user

@router.get("/dashboard")
async def admin_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_admin)
):
    total_users = await db.execute(select(func.count(User.id)))
    total_notices = await db.execute(select(func.count(Notice.id)))
    urgent_deadlines = await db.execute(
        select(func.count(Deadline.id))
        .where(Deadline.is_urgent == True, Deadline.completed_by_user == False)
    )
    
    return {
        "total_users": total_users.scalar(),
        "notices_processed_total": total_notices.scalar(),
        "urgent_deadlines_count": urgent_deadlines.scalar(),
        "system_health": {"redis": True, "db": True, "ai_api": True}
    }

@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_admin)
):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()
