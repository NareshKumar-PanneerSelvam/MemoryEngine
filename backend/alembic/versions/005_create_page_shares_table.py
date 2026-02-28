"""create page_shares table

Revision ID: 005
Revises: 004
Create Date: 2024-01-01 00:00:04.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_level') THEN
                CREATE TYPE permission_level AS ENUM ('view_only', 'edit');
            END IF;
        END$$;
        """
    )

    if not inspector.has_table('page_shares'):
        op.create_table(
            'page_shares',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column('page_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('shared_with_user_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('permission_level', postgresql.ENUM('view_only', 'edit', name='permission_level', create_type=False), nullable=False, server_default='view_only'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['shared_with_user_id'], ['users.id'], ondelete='CASCADE'),
            sa.UniqueConstraint('page_id', 'shared_with_user_id', name='unique_page_share'),
            sa.CheckConstraint('owner_id != shared_with_user_id', name='no_self_share'),
        )

    existing_indexes = {index['name'] for index in inspector.get_indexes('page_shares')}
    if 'idx_page_shares_page_id' not in existing_indexes:
        op.create_index('idx_page_shares_page_id', 'page_shares', ['page_id'])
    if 'idx_page_shares_shared_with' not in existing_indexes:
        op.create_index('idx_page_shares_shared_with', 'page_shares', ['shared_with_user_id'])
    if 'idx_page_shares_owner' not in existing_indexes:
        op.create_index('idx_page_shares_owner', 'page_shares', ['owner_id'])


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_page_shares_owner")
    op.execute("DROP INDEX IF EXISTS idx_page_shares_shared_with")
    op.execute("DROP INDEX IF EXISTS idx_page_shares_page_id")
    op.execute("DROP TABLE IF EXISTS page_shares")
    op.execute("DROP TYPE IF EXISTS permission_level")
