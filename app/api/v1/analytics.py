from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.all_models import Notice, Deadline, ActionItem, User
from app.api.v1.notices import get_current_user

router = APIRouter()

@router.get("/user-stats")
async def get_user_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notice_count = await db.execute(
        select(func.count(Notice.id)).where(Notice.user_id == current_user.id)
    )
    deadline_stats = await db.execute(
        select(func.count(Deadline.id)).where(Deadline.user_id == current_user.id)
    )
    action_stats = await db.execute(
        select(
            func.count(ActionItem.id),
            func.sum(func.cast(ActionItem.is_completed, func.Integer))
        ).where(ActionItem.user_id == current_user.id)
    )
    
    actions = action_stats.first()
    total_actions = actions[0] if actions else 0
    completed_actions = actions[1] if actions and actions[1] else 0
    
    return {
        "notices_total": notice_count.scalar(),
        "deadlines_total": deadline_stats.scalar(),
        "action_items_total": total_actions,
        "action_items_completed": completed_actions,
        "completion_rate": (completed_actions / total_actions * 100) if total_actions > 0 else 0
    }
