import asyncio
from app.workers.celery_app import celery_app
from app.core.database import async_session_factory
from app.models.all_models import Notice, NoticeStatus, ActionItem, Deadline
from app.services.storage_service import storage_service
from app.services.ocr_service import ocr_service
from app.services.ai_service import ai_service
from sqlalchemy import select
import uuid

@celery_app.task(bind=True, max_retries=3)
def process_notice_task(self, notice_id_str: str):
    """Background task to process a government notice using AI."""
    notice_id = uuid.UUID(notice_id_str)
    
    # Run async logic in celery (using a sync wrapper)
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_process_notice(notice_id))

async def _process_notice(notice_id: uuid.UUID):
    async with async_session_factory() as db:
        # 1. Fetch Notice
        result = await db.execute(select(Notice).where(Notice.id == notice_id))
        notice = result.scalars().first()
        if not notice: return
        
        try:
            notice.processing_status = NoticeStatus.PROCESSING
            await db.commit()
            
            # 2. Download from GCS
            file_bytes = await storage_service.get_file_bytes(notice.gcs_file_url)
            
            # 3. OCR Extraction
            raw_text = await ocr_service.extract_text_from_file(
                file_bytes, notice.file_type.value
            )
            notice.raw_text = raw_text
            
            # 4. AI Simplification (Gemini)
            analysis = await ai_service.simplify_notice(raw_text)
            
            notice.simplified_summary = analysis.get("simplified_summary")
            notice.urgency_level = analysis.get("urgency_level")
            notice.notice_category = analysis.get("notice_category")
            notice.key_deadlines = analysis.get("key_deadlines")
            notice.fees_extracted = analysis.get("fees_required")
            notice.eligibility_criteria = analysis.get("eligibility_criteria")
            notice.action_items_json = analysis.get("action_items")
            
            # 5. Kannada Translation
            notice.simplified_summary_kn = await ai_service.translate_to_kannada(
                notice.simplified_summary
            )
            
            # 6. Save Action Items and Deadlines to indexed tables
            for item in analysis.get("action_items", []):
                new_item = ActionItem(
                    notice_id=notice.id,
                    user_id=notice.user_id,
                    step_number=item.get("step_number"),
                    description=item.get("action"),
                    # Translation logic could go here
                )
                db.add(new_item)
                
            for dl in analysis.get("key_deadlines", []):
                new_dl = Deadline(
                    notice_id=notice.id,
                    user_id=notice.user_id,
                    title=dl.get("title"),
                    description=dl.get("description"),
                    # Parse ISO date string here
                )
                db.add(new_dl)
            
            notice.processing_status = NoticeStatus.COMPLETED
            await db.commit()
            
            print(f"Notice {notice_id} processed successfully.")
            
        except Exception as e:
            print(f"Error processing notice {notice_id}: {e}")
            notice.processing_status = NoticeStatus.FAILED
            await db.commit()
            raise e
