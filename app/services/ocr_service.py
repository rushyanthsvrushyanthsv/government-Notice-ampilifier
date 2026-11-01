import os
from google.cloud import documentai_v1 as documentai
from google.cloud import vision
from app.core.config import settings

class OCRService:
    def __init__(self):
        # Configuration would normally use service account from settings.GOOGLE_APPLICATION_CREDENTIALS
        self.doc_ai_client = documentai.DocumentProcessorServiceClient()
        self.vision_client = vision.ImageAnnotatorClient()
        self.processor_name = self.doc_ai_client.processor_path(
            settings.GOOGLE_CLOUD_PROJECT, 
            settings.DOCUMENT_AI_LOCATION, 
            settings.DOCUMENT_AI_PROCESSOR_ID
        )

    async def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extract text using Google Document AI."""
        try:
            raw_document = documentai.RawDocument(content=file_bytes, mime_type="application/pdf")
            request = documentai.ProcessRequest(name=self.processor_name, raw_document=raw_document)
            result = self.doc_ai_client.process_document(request=request)
            return result.document.text
        except Exception as e:
            print(f"OCR PDF Error: {e}")
            raise

    async def extract_text_from_image(self, file_bytes: bytes) -> str:
        """Extract text using Google Cloud Vision API."""
        try:
            image = vision.Image(content=file_bytes)
            response = self.vision_client.text_detection(image=image)
            texts = response.text_annotations
            if texts:
                return texts[0].description
            return ""
        except Exception as e:
            print(f"OCR Image Error: {e}")
            raise

    async def extract_text_from_file(self, file_bytes: bytes, file_type: str) -> str:
        if file_type == "pdf":
            return await self.extract_text_from_pdf(file_bytes)
        elif file_type == "image":
            return await self.extract_text_from_image(file_bytes)
        return file_bytes.decode("utf-8")

ocr_service = OCRService()
