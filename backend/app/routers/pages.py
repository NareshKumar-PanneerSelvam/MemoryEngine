import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.permissions import require_page_access
from app.models.user import User
from app.schemas.page import (
    CreatePageRequest,
    PageShareResponse,
    PageResponse,
    PageTreeResponse,
    SharePageRequest,
    UpdatePageRequest,
)
from app.services.pages_service import (
    create_page,
    delete_page,
    get_page_by_id,
    get_child_pages,
    list_pages,
    update_page,
)
from app.services.sharing_service import get_page_shares, revoke_share, share_page

router = APIRouter(prefix="/api/pages", tags=["pages"])


@router.get("", response_model=list[PageTreeResponse])
async def list_pages_endpoint(
    parent_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PageTreeResponse]:
    pages = await list_pages(
        db,
        user_id=current_user.id,
        parent_id=parent_id,
    )
    return [PageTreeResponse.model_validate(page) for page in pages]


@router.post("", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
async def create_page_endpoint(
    payload: CreatePageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PageResponse:
    page = await create_page(
        db,
        user_id=current_user.id,
        title=payload.title,
        content=payload.content,
        parent_id=payload.parent_id,
    )
    return PageResponse.model_validate(page)


@router.get("/{page_id}", response_model=PageResponse)
async def get_page_endpoint(
    page_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PageResponse:
    await require_page_access(
        db,
        page_id=page_id,
        user_id=current_user.id,
        required="view",
    )
    page = await get_page_by_id(db, page_id=page_id)
    return PageResponse.model_validate(page)


@router.get("/{page_id}/children", response_model=list[PageResponse])
async def get_page_children_endpoint(
    page_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PageResponse]:
    await require_page_access(
        db,
        page_id=page_id,
        user_id=current_user.id,
        required="view",
    )
    children = await get_child_pages(db, page_id=page_id)
    return [PageResponse.model_validate(page) for page in children]


@router.put("/{page_id}", response_model=PageResponse)
async def update_page_endpoint(
    page_id: uuid.UUID,
    payload: UpdatePageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PageResponse:
    access_level = await require_page_access(
        db,
        page_id=page_id,
        user_id=current_user.id,
        required="edit",
    )
    updates = payload.model_dump(exclude_unset=True)
    page = await update_page(
        db,
        page_id=page_id,
        user_id=current_user.id,
        access_level=access_level,
        updates=updates,
    )
    return PageResponse.model_validate(page)


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page_endpoint(
    page_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    await require_page_access(
        db,
        page_id=page_id,
        user_id=current_user.id,
        required="owner",
    )
    await delete_page(db, page_id=page_id, user_id=current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{page_id}/share", response_model=PageShareResponse)
async def share_page_endpoint(
    page_id: uuid.UUID,
    payload: SharePageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PageShareResponse:
    share = await share_page(
        db,
        page_id=page_id,
        owner_id=current_user.id,
        shared_with_user_id=payload.shared_with_user_id,
        permission_level=payload.permission_level,
    )
    return PageShareResponse(
        id=share.id,
        page_id=share.page_id,
        owner_id=share.owner_id,
        shared_with_user_id=share.shared_with_user_id,
        permission_level=share.permission_level,
        created_at=share.created_at,
    )


@router.delete("/{page_id}/share/{shared_with_user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_share_endpoint(
    page_id: uuid.UUID,
    shared_with_user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    await revoke_share(
        db,
        page_id=page_id,
        owner_id=current_user.id,
        shared_with_user_id=shared_with_user_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{page_id}/shares", response_model=list[PageShareResponse])
async def list_shares_endpoint(
    page_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PageShareResponse]:
    shares = await get_page_shares(db, page_id=page_id, owner_id=current_user.id)
    return [
        PageShareResponse(
            id=share.id,
            page_id=share.page_id,
            owner_id=share.owner_id,
            shared_with_user_id=share.shared_with_user_id,
            shared_with_email=share.shared_with_email,
            permission_level=share.permission_level,
            created_at=share.created_at,
        )
        for share in shares
    ]
