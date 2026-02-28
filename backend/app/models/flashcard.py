from sqlalchemy import Text, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin
from typing import Optional
from datetime import datetime
import uuid


class Flashcard(Base, UUIDMixin, TimestampMixin):
    """Flashcard model for spaced repetition learning."""
    
    __tablename__ = "flashcards"
    
    page_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    question: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    
    answer: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    
    last_reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    next_review_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )
    
    review_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    
    mastery_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        index=True,
    )
    
    # Relationships
    # page = relationship("Page", back_populates="flashcards")
    # user = relationship("User", back_populates="flashcards")
    
    # Table constraints
    __table_args__ = (
        CheckConstraint("review_count >= 0", name="review_count_non_negative"),
        CheckConstraint("mastery_score >= 0 AND mastery_score <= 100", name="mastery_score_bounds"),
    )
    
    def __repr__(self) -> str:
        return f"<Flashcard(id={self.id}, page_id={self.page_id}, mastery={self.mastery_score})>"

