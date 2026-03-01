"""add circular reference prevention trigger

Revision ID: 003
Revises: 002
Create Date: 2024-01-01 00:00:02.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create function to check for circular references in page hierarchy
    op.execute("""
        CREATE OR REPLACE FUNCTION check_page_hierarchy_cycle()
        RETURNS TRIGGER AS $$
        DECLARE
            current_parent_id UUID;
            depth INTEGER := 0;
            max_depth INTEGER := 100;
        BEGIN
            -- If no parent, no cycle possible
            IF NEW.parent_id IS NULL THEN
                RETURN NEW;
            END IF;

            -- Cannot be own parent (also checked by constraint)
            IF NEW.id = NEW.parent_id THEN
                RAISE EXCEPTION 'Page cannot be its own parent';
            END IF;

            -- Traverse up the tree to check for cycles
            current_parent_id := NEW.parent_id;

            WHILE current_parent_id IS NOT NULL AND depth < max_depth LOOP
                -- If we encounter the current page ID, we have a cycle
                IF current_parent_id = NEW.id THEN
                    RAISE EXCEPTION 'Circular reference detected in page hierarchy';
                END IF;

                -- Move up to next parent
                SELECT parent_id INTO current_parent_id
                FROM pages
                WHERE id = current_parent_id;

                depth := depth + 1;
            END LOOP;

            -- If we hit max depth, something is wrong
            IF depth >= max_depth THEN
                RAISE EXCEPTION 'Page hierarchy exceeds maximum depth of %', max_depth;
            END IF;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Create trigger on pages table
    op.execute("""
        CREATE TRIGGER check_page_cycle 
        BEFORE INSERT OR UPDATE ON pages
        FOR EACH ROW 
        EXECUTE FUNCTION check_page_hierarchy_cycle();
    """)


def downgrade() -> None:
    # Drop trigger
    op.execute("DROP TRIGGER IF EXISTS check_page_cycle ON pages")
    
    # Drop function
    op.execute("DROP FUNCTION IF EXISTS check_page_hierarchy_cycle()")
