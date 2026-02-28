from sqlalchemy import ForeignKey, Enum as SQLEnum, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base import UUIDMixin
from datetime import datetime
from sqlalchemy import DateTime
import enum
import uuid


class PermissionLevel(str, enum.Enum):
    """Permission level enumeration for page sharing."""
    VIEW_ONLY = "view_only"
    EDIT = "edit"


class PageShare(Base, UUIDMixin):
    """PageShare model for selective page sharing with permission levels."""
    
    __tablename__ = "page_shares"
    
    page_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    shared_with_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    permission_level: Mapped[PermissionLevel] = mapped_column(
        SQLEnum(PermissionLevel, name="permission_level"),
        nullable=False,
        default=PermissionLevel.VIEW_ONLY,
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    
    # Relationships
    # page = relationship("Page", back_populates="shares")
    # owner = relationship("User", foreign_keys=[owner_id])
    # shared_with = relationship("User", foreign_keys=[shared_with_user_id])
    
    # Table constraints
    __table_args__ = (
        UniqueConstraint('page_id', 'shared_with_user_id', name='unique_page_share'),
        CheckConstraint('owner_id != shared_with_user_id', name='no_self_share'),
    )
    
    def __repr__(self) -> str:
        return f"<PageShare(id={self.id}, page_id={self.page_id}, permission={self.permission_level})>"

