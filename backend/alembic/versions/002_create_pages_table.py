"""create pages table

Revision ID: 002
Revises: 001
Create Date: 2024-01-01 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create pages table
    op.create_table(
        'pages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('content', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        
        # Foreign keys
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['pages.id'], ondelete='CASCADE'),
        
        # Check constraint
        sa.CheckConstraint('id != parent_id', name='no_self_reference'),
    )
    
    # Create indexes
    op.create_index('idx_pages_user_id', 'pages', ['user_id'])
    op.create_index('idx_pages_parent_id', 'pages', ['parent_id'])
    op.create_index('idx_pages_title', 'pages', ['title'])
    
    # Create full-text search index on content
    op.execute("""
        CREATE INDEX idx_pages_content_fts ON pages 
        USING GIN(to_tsvector('english', content))
    """)


def downgrade() -> None:
    # Drop indexes
    op.execute("DROP INDEX IF EXISTS idx_pages_content_fts")
    op.drop_index('idx_pages_title', table_name='pages')
    op.drop_index('idx_pages_parent_id', table_name='pages')
    op.drop_index('idx_pages_user_id', table_name='pages')
    
    # Drop table
    op.drop_table('pages')
