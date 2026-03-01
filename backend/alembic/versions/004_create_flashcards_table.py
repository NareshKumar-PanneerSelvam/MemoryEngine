"""create flashcards table

Revision ID: 004
Revises: 003
Create Date: 2024-01-01 00:00:03.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create flashcards table
    op.create_table(
        'flashcards',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('page_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question', sa.Text, nullable=False),
        sa.Column('answer', sa.Text, nullable=False),
        sa.Column('last_reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_review_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('review_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('mastery_score', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        
        # Foreign keys
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        
        # Check constraints
        sa.CheckConstraint('review_count >= 0', name='review_count_non_negative'),
        sa.CheckConstraint('mastery_score >= 0 AND mastery_score <= 100', name='mastery_score_bounds'),
    )
    
    # Create indexes
    op.create_index('idx_flashcards_user_id', 'flashcards', ['user_id'])
    op.create_index('idx_flashcards_page_id', 'flashcards', ['page_id'])
    op.create_index('idx_flashcards_next_review', 'flashcards', ['user_id', 'next_review_at'])
    op.create_index('idx_flashcards_mastery', 'flashcards', ['user_id', 'mastery_score'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_flashcards_mastery', table_name='flashcards')
    op.drop_index('idx_flashcards_next_review', table_name='flashcards')
    op.drop_index('idx_flashcards_page_id', table_name='flashcards')
    op.drop_index('idx_flashcards_user_id', table_name='flashcards')
    
    # Drop table
    op.drop_table('flashcards')
