from google.cloud import storage
from datetime import timedelta
from app.core.config import settings
import uuid

class StorageService:
    def __init__(self):
        self.client = storage.Client()
        self.bucket = self.client.bucket(settings.GCS_BUCKET_NAME)

    async def upload_file(self, file_bytes: bytes, filename: str, content_type: str, user_id: str, notice_id: str) -> str:
        """Upload to GCS and return the internal path."""
        path = f"users/{user_id}/notices/{notice_id}/{filename}"
        blob = self.bucket.blob(path)
        blob.upload_from_string(file_bytes, content_type=content_type)
        return path

    async def get_signed_url(self, gcs_path: str) -> str:
        """Generate a signed URL valid for 7 days."""
        blob = self.bucket.blob(gcs_path)
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(days=7),
            method="GET"
        )
        return url

    async def delete_file(self, gcs_path: str) -> bool:
        try:
            blob = self.bucket.blob(gcs_path)
            blob.delete()
            return True
        except Exception:
            return False

    async def get_file_bytes(self, gcs_path: str) -> bytes:
        blob = self.bucket.blob(gcs_path)
        return blob.download_as_bytes()

storage_service = StorageService()
