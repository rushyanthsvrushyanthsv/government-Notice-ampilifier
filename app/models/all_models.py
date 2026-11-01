import enum
from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Integer, JSON, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

class Language(str, enum.Enum):
    EN = "en"
    KN = "kn"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_notifications_enabled = Column(Boolean, default=True)
    preferred_language = Column(Enum(Language), default=Language.EN)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime)

    # Relationships
    notices = relationship("Notice", back_populates="user", cascade="all, delete-orphan")
    deadlines = relationship("Deadline", back_populates="user")

    def __repr__(self):
        return f"<User {self.email}>"

class NoticeStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class UrgencyLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class FileType(str, enum.Enum):
    PDF = "pdf"
    IMAGE = "image"
    TEXT = "text"

class Notice(Base):
    __tablename__ = "notices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    original_filename = Column(String)
    file_type = Column(Enum(FileType))
    gcs_file_url = Column(String)
    raw_text = Column(String)
    
    simplified_summary = Column(String)
    simplified_summary_kn = Column(String)
    
    key_deadlines = Column(JSONB) # Array of objects
    fees_extracted = Column(JSONB) # Object
    eligibility_criteria = Column(JSONB) # Object
    action_items_json = Column(JSONB) # Snapshot of items
    
    processing_status = Column(Enum(NoticeStatus), default=NoticeStatus.PENDING)
    urgency_level = Column(Enum(UrgencyLevel))
    notice_category = Column(String, index=True)
    issued_by = Column(String)
    notice_date = Column(DateTime)
    
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notices")
    deadlines = relationship("Deadline", back_populates="notice", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="notice", cascade="all, delete-orphan")

class Deadline(Base):
    __tablename__ = "deadlines"

    id = Column(Integer, primary_key=True)
    notice_id = Column(UUID(as_uuid=True), ForeignKey("notices.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    title = Column(String, nullable=False)
    description = Column(String)
    deadline_date = Column(DateTime, index=True)
    is_urgent = Column(Boolean, default=False)
    is_missed = Column(Boolean, default=False)
    
    reminder_sent_3day = Column(Boolean, default=False)
    reminder_sent_1day = Column(Boolean, default=False)
    reminder_sent_day = Column(Boolean, default=False)
    
    completed_by_user = Column(Boolean, default=False)
    completed_at = Column(DateTime)

    user = relationship("User", back_populates="deadlines")
    notice = relationship("Notice", back_populates="deadlines")

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True)
    notice_id = Column(UUID(as_uuid=True), ForeignKey("notices.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    step_number = Column(Integer)
    description = Column(String)
    description_kn = Column(String)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    
    requires_document = Column(Boolean, default=False)
    requires_payment = Column(Boolean, default=False)
    amount = Column(String)

    notice = relationship("Notice", back_populates="action_items")

class NotificationType(str, enum.Enum):
    DEADLINE = "deadline"
    REMINDER = "reminder"
    ALERT = "alert"
    BROADCAST = "broadcast"
    EMAIL_SENT = "email_sent"

class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    PUSH = "push"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    title = Column(String)
    message = Column(String)
    type = Column(Enum(NotificationType))
    is_read = Column(Boolean, default=False)
    channel = Column(Enum(NotificationChannel))
    
    reference_id = Column(String)
    reference_type = Column(String)
    
    created_at = Column(DateTime, server_default=func.now())

class BroadcastAudience(str, enum.Enum):
    ALL = "all"
    ACTIVE = "active"
    URGENT = "urgent_deadline"

class AdminBroadcast(Base):
    __tablename__ = "admin_broadcasts"

    id = Column(Integer, primary_key=True)
    sent_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    title = Column(String)
    message = Column(String)
    target_audience = Column(Enum(BroadcastAudience))
    channels = Column(JSONB)
    
    sent_at = Column(DateTime, server_default=func.now())
    recipient_count = Column(Integer)
