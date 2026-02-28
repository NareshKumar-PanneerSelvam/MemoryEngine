"""add name and username fields to users

Revision ID: 007
Revises: 006
Create Date: 2026-02-28 00:00:06.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}

    if "name" not in columns:
        op.add_column("users", sa.Column("name", sa.String(length=255), nullable=True))

    if "username" not in columns:
        op.add_column("users", sa.Column("username", sa.String(length=50), nullable=True))

    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
        ON users (LOWER(username))
        WHERE username IS NOT NULL
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_users_username_unique")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS username")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS name")
