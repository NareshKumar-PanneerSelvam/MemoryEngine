import uuid
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.sharing_service import check_page_access

PageAccessLevel = Literal["owner", "edit", "view_only"]
RequiredPageAccess = Literal["view", "edit", "owner"]


async def require_page_access(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
    user_id: uuid.UUID,
    required: RequiredPageAccess = "view",
) -> PageAccessLevel:
    access = await check_page_access(db, page_id=page_id, user_id=user_id)
    if access is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )

    if required == "owner" and access != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permission for this operation",
        )

    if required == "edit" and access not in {"owner", "edit"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permission for this operation",
        )

    return access
