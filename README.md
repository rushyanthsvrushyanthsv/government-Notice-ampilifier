# Government Notice Simplifier Backend

AI-powered SaaS helping Indian citizens understand and act on complex government notices.

## Features
- **Magic Scan**: OCR + AI analysis (Gemini 1.5 Pro) to simplify legal jargon.
- **Deadline Tracking**: Automatic extraction and reminders (Celery + Redis).
- **Multilingual Support**: Automatic translation to Kannada.
- **Admin Dashboard**: Comprehensive platform management.

## Tech Stack
- **FastAPI**: Modern, high-performance web framework.
- **PostgreSQL**: Primary database with SQLAlchemy ORM.
- **Redis**: Caching and background task broker.
- **Celery**: Distributed task queue for processing.
- **Google Cloud**: Vision, Document AI, Translate, and GCS.
- **Gemini**: State-of-the-art LLM for simplification.

## Quick Start (Docker)
1. Copy `.env.example` to `.env` and fill in credentials.
2. Run `docker-compose up --build`.
3. API available at `http://localhost:8000/docs`.

## API Documentation
- `/api/v1/auth`: Registration, Login, Google OAuth.
- `/api/v1/notices`: Upload and manage government documents.
- `/api/v1/notifications`: In-app and push alerts.
- `/api/v1/translate`: Multilingual support.
- `/api/v1/admin`: Platform statistics and user management.
