import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.page_share import PermissionLevel


class CreatePageRequest(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    content: str | None = None
    parent_id: uuid.UUID | None = None


class UpdatePageRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    content: str | None = None
    parent_id: uuid.UUID | None = None


class PageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    parent_id: uuid.UUID | None = None
    title: str
    content: str | None = None
    created_at: datetime
    updated_at: datetime


class PageTreeResponse(PageResponse):
    is_shared: bool = False
    permission: PermissionLevel | None = None
    owner_email: str | None = None
    children: list["PageTreeResponse"] = Field(default_factory=list)


PageTreeResponse.model_rebuild()


class SharePageRequest(BaseModel):
    shared_with_user_id: uuid.UUID
    permission_level: PermissionLevel = PermissionLevel.VIEW_ONLY


class PageShareResponse(BaseModel):
    id: uuid.UUID
    page_id: uuid.UUID
    owner_id: uuid.UUID
    shared_with_user_id: uuid.UUID
    permission_level: PermissionLevel
    shared_with_email: str | None = None
    created_at: datetime | None = None
