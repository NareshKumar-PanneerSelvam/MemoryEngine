from sqlalchemy import String, Text, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin
from typing import Optional
import uuid


class Page(Base, UUIDMixin, TimestampMixin):
    """Page model for hierarchical note organization."""
    
    __tablename__ = "pages"
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        index=True,
    )
    
    content: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Relationships
    # user = relationship("User", back_populates="pages")
    # parent = relationship("Page", remote_side=[id], back_populates="children")
    # children = relationship("Page", back_populates="parent")
    
    # Table constraints
    __table_args__ = (
        CheckConstraint("id != parent_id", name="no_self_reference"),
    )
    
    def __repr__(self) -> str:
        return f"<Page(id={self.id}, title={self.title}, user_id={self.user_id})>"

