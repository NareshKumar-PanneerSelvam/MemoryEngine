import uuid
from dataclasses import dataclass
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.page import Page
from app.models.page_share import PageShare, PermissionLevel
from app.models.user import User


@dataclass
class PageShareView:
    id: uuid.UUID
    page_id: uuid.UUID
    owner_id: uuid.UUID
    shared_with_user_id: uuid.UUID
    shared_with_email: str
    permission_level: PermissionLevel
    created_at: datetime


async def share_page(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
    owner_id: uuid.UUID,
    shared_with_user_id: uuid.UUID,
    permission_level: PermissionLevel,
) -> PageShare:
    await _require_page_owner(db, page_id=page_id, owner_id=owner_id)
    await _require_target_user(db, user_id=shared_with_user_id)

    if owner_id == shared_with_user_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot share page with yourself",
        )

    existing = await db.execute(
        select(PageShare).where(
            PageShare.page_id == page_id,
            PageShare.shared_with_user_id == shared_with_user_id,
        )
    )
    share = existing.scalar_one_or_none()

    if share is None:
        share = PageShare(
            page_id=page_id,
            owner_id=owner_id,
            shared_with_user_id=shared_with_user_id,
            permission_level=permission_level,
        )
        db.add(share)
    else:
        share.permission_level = permission_level

    await db.commit()
    await db.refresh(share)
    return share


async def revoke_share(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
    owner_id: uuid.UUID,
    shared_with_user_id: uuid.UUID,
) -> None:
    await _require_page_owner(db, page_id=page_id, owner_id=owner_id)

    result = await db.execute(
        select(PageShare).where(
            PageShare.page_id == page_id,
            PageShare.shared_with_user_id == shared_with_user_id,
        )
    )
    share = result.scalar_one_or_none()
    if share is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share record not found",
        )

    await db.delete(share)
    await db.commit()


async def get_page_shares(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
    owner_id: uuid.UUID,
) -> list[PageShareView]:
    await _require_page_owner(db, page_id=page_id, owner_id=owner_id)

    result = await db.execute(
        select(PageShare, User.email)
        .join(User, User.id == PageShare.shared_with_user_id)
        .where(PageShare.page_id == page_id)
        .order_by(User.email.asc())
    )
    rows = result.all()
    return [
        PageShareView(
            id=share.id,
            page_id=share.page_id,
            owner_id=share.owner_id,
            shared_with_user_id=share.shared_with_user_id,
            shared_with_email=email,
            permission_level=share.permission_level,
            created_at=share.created_at,
        )
        for share, email in rows
    ]


async def check_page_access(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
    user_id: uuid.UUID,
) -> str | None:
    page_result = await db.execute(select(Page).where(Page.id == page_id))
    page = page_result.scalar_one_or_none()
    if page is None:
        return None

    if page.user_id == user_id:
        return "owner"

    share_result = await db.execute(
        select(PageShare.permission_level).where(
            and_(
                PageShare.page_id == page_id,
                PageShare.shared_with_user_id == user_id,
            )
        )
    )
    permission = share_result.scalar_one_or_none()
    if permission is None:
        return None

    return permission.value


async def _require_page_owner(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
    owner_id: uuid.UUID,
) -> Page:
    result = await db.execute(
        select(Page).where(Page.id == page_id, Page.user_id == owner_id)
    )
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only page owner can manage shares",
        )
    return page


async def _require_target_user(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found",
        )
    return user
