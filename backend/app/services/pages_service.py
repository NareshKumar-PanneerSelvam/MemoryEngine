import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.page import Page
from app.models.page_share import PageShare
from app.models.user import User


async def create_page(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    title: str,
    content: str | None,
    parent_id: uuid.UUID | None,
) -> Page:
    normalized_title = title.strip()
    if not normalized_title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Title cannot be empty",
        )

    if parent_id is not None:
        parent_page = await _get_owned_page_or_none(db, page_id=parent_id, user_id=user_id)
        if parent_page is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent page not found",
            )

    page = Page(
        user_id=user_id,
        parent_id=parent_id,
        title=normalized_title,
        content=content,
    )
    db.add(page)
    await db.commit()
    await db.refresh(page)
    return page


async def get_page(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Page:
    page = await _get_owned_page_or_none(db, page_id=page_id, user_id=user_id)
    if page is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )
    return page


async def get_page_by_id(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
) -> Page:
    result = await db.execute(select(Page).where(Page.id == page_id))
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )
    return page


async def update_page(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
    user_id: uuid.UUID,
    access_level: str,
    updates: dict[str, Any],
) -> Page:
    page = await get_page_by_id(db, page_id=page_id)

    if "title" in updates:
        title = updates["title"]
        normalized_title = title.strip() if title is not None else ""
        if not normalized_title:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Title cannot be empty",
            )
        page.title = normalized_title

    if "content" in updates:
        page.content = updates["content"]

    if "parent_id" in updates:
        if access_level != "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only page owner can change page hierarchy",
            )
        parent_id = updates["parent_id"]
        if parent_id is None:
            page.parent_id = None
        else:
            if parent_id == page.id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Page cannot be its own parent",
                )
            parent_page = await _get_owned_page_or_none(
                db, page_id=parent_id, user_id=user_id
            )
            if parent_page is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent page not found",
                )
            page.parent_id = parent_id

    await db.commit()
    await db.refresh(page)
    return page


async def delete_page(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    page = await get_page_by_id(db, page_id=page_id)
    await db.delete(page)
    await db.commit()


async def list_pages(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    parent_id: uuid.UUID | None = None,
) -> list[dict]:
    owned_result = await db.execute(
        select(Page).where(Page.user_id == user_id)
    )
    owned_pages = list(owned_result.scalars().all())

    shared_result = await db.execute(
        select(Page, PageShare.permission_level, User.email)
        .join(PageShare, PageShare.page_id == Page.id)
        .join(User, User.id == Page.user_id)
        .where(PageShare.shared_with_user_id == user_id, Page.user_id != user_id)
    )
    shared_rows = shared_result.all()

    pages: list[Page] = []
    metadata: dict[uuid.UUID, dict[str, object]] = {}

    for page in owned_pages:
        pages.append(page)
        metadata[page.id] = {
            "is_shared": False,
            "permission": None,
            "owner_email": None,
        }

    for page, permission_level, owner_email in shared_rows:
        if page.id in metadata:
            continue
        pages.append(page)
        metadata[page.id] = {
            "is_shared": True,
            "permission": permission_level,
            "owner_email": owner_email,
        }

    pages.sort(key=lambda page: (page.title.casefold(), str(page.id)))

    if parent_id is not None:
        parent_exists = any(page.id == parent_id for page in pages)
        if not parent_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent page not found",
            )

    by_parent: dict[uuid.UUID | None, list[Page]] = {}
    by_id: dict[uuid.UUID, Page] = {}
    for page in pages:
        by_id[page.id] = page
        by_parent.setdefault(page.parent_id, []).append(page)

    def serialize(node: Page) -> dict:
        node_meta = metadata.get(node.id, {})
        children = sorted(
            by_parent.get(node.id, []),
            key=lambda child: (child.title.casefold(), str(child.id)),
        )
        return {
            "id": node.id,
            "user_id": node.user_id,
            "parent_id": node.parent_id,
            "title": node.title,
            "content": node.content,
            "created_at": node.created_at,
            "updated_at": node.updated_at,
            "is_shared": bool(node_meta.get("is_shared", False)),
            "permission": node_meta.get("permission"),
            "owner_email": node_meta.get("owner_email"),
            "children": [serialize(child) for child in children],
        }

    if parent_id is None:
        roots = [
            page
            for page in pages
            if page.parent_id is None or page.parent_id not in by_id
        ]
        roots.sort(key=lambda page: (page.title.casefold(), str(page.id)))
        return [serialize(page) for page in roots]

    children = by_parent.get(parent_id, [])
    children.sort(key=lambda page: (page.title.casefold(), str(page.id)))
    return [serialize(page) for page in children]


async def get_child_pages(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
) -> list[Page]:
    result = await db.execute(
        select(Page)
        .where(Page.parent_id == page_id)
        .order_by(Page.title.asc(), Page.id.asc())
    )
    return list(result.scalars().all())


async def _get_owned_page_or_none(
    db: AsyncSession,
    *,
    page_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Page | None:
    result = await db.execute(
        select(Page).where(Page.id == page_id, Page.user_id == user_id)
    )
    return result.scalar_one_or_none()
