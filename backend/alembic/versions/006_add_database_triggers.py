"""add database triggers for auto-updates

Revision ID: 006
Revises: 005
Create Date: 2024-01-01 00:00:05.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create function to auto-update updated_at timestamp
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Create triggers for users table
    op.execute("""
        CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    """)
    
    # Create triggers for pages table
    op.execute("""
        CREATE TRIGGER update_pages_updated_at 
        BEFORE UPDATE ON pages
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    """)
    
    # Create triggers for flashcards table
    op.execute("""
        CREATE TRIGGER update_flashcards_updated_at 
        BEFORE UPDATE ON flashcards
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    """)
    
    # Create function to assign admin role to first user
    op.execute("""
        CREATE OR REPLACE FUNCTION assign_first_user_admin()
        RETURNS TRIGGER AS $$
        DECLARE
            user_count INTEGER;
        BEGIN
            -- Count existing users
            SELECT COUNT(*) INTO user_count FROM users;

            -- If this is the first user, make them admin
            IF user_count = 0 THEN
                NEW.role := 'admin';
            END IF;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Create trigger for first user admin assignment
    op.execute("""
        CREATE TRIGGER set_first_user_admin 
        BEFORE INSERT ON users
        FOR EACH ROW 
        EXECUTE FUNCTION assign_first_user_admin();
    """)


def downgrade() -> None:
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS set_first_user_admin ON users")
    op.execute("DROP TRIGGER IF EXISTS update_flashcards_updated_at ON flashcards")
    op.execute("DROP TRIGGER IF EXISTS update_pages_updated_at ON pages")
    op.execute("DROP TRIGGER IF EXISTS update_users_updated_at ON users")
    
    # Drop functions
    op.execute("DROP FUNCTION IF EXISTS assign_first_user_admin()")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column()")
