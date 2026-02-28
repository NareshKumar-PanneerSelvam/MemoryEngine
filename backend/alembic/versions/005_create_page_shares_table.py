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
    # Create permission_level enum type
    op.execute("CREATE TYPE permission_level AS ENUM ('view_only', 'edit')")
    
    # Create page_shares table
    op.create_table(
        'page_shares',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('page_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('shared_with_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('permission_level', postgresql.ENUM('view_only', 'edit', name='permission_level'), nullable=False, server_default='view_only'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        
        # Foreign keys
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_with_user_id'], ['users.id'], ondelete='CASCADE'),
        
        # Unique constraint - one share per page per user
        sa.UniqueConstraint('page_id', 'shared_with_user_id', name='unique_page_share'),
        
        # Check constraint - cannot share with yourself
        sa.CheckConstraint('owner_id != shared_with_user_id', name='no_self_share'),
    )
    
    # Create indexes
    op.create_index('idx_page_shares_page_id', 'page_shares', ['page_id'])
    op.create_index('idx_page_shares_shared_with', 'page_shares', ['shared_with_user_id'])
    op.create_index('idx_page_shares_owner', 'page_shares', ['owner_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_page_shares_owner', table_name='page_shares')
    op.drop_index('idx_page_shares_shared_with', table_name='page_shares')
    op.drop_index('idx_page_shares_page_id', table_name='page_shares')
    
    # Drop table
    op.drop_table('page_shares')
    
    # Drop enum type
    op.execute("DROP TYPE permission_level")
