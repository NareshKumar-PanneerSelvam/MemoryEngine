"""create users table

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # Create user_role enum type only if it does not already exist.
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                CREATE TYPE user_role AS ENUM ('admin', 'user');
            END IF;
        END$$;
        """
    )

    if not inspector.has_table('users'):
        op.create_table(
            'users',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column('email', sa.String(255), nullable=False, unique=True),
            sa.Column('password_hash', sa.String(255), nullable=False),
            sa.Column('role', postgresql.ENUM('admin', 'user', name='user_role', create_type=False), nullable=False, server_default='user'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        )

    existing_indexes = {index['name'] for index in inspector.get_indexes('users')}
    if 'idx_users_email' not in existing_indexes:
        op.create_index('idx_users_email', 'users', ['email'])
    if 'idx_users_role' not in existing_indexes:
        op.create_index('idx_users_role', 'users', ['role'])


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_users_role")
    op.execute("DROP INDEX IF EXISTS idx_users_email")
    op.execute("DROP TABLE IF EXISTS users")
    op.execute("DROP TYPE IF EXISTS user_role")
