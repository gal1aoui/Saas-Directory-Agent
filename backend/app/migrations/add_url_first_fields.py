"""
Migration: Add URL-first submission fields to directories table

This migration adds support for two-step URL submission pattern (e.g., SaaSHub)
where the website URL is submitted first, then redirects to the full form.

Run this migration after updating the Directory model.
"""

from sqlalchemy import text

from app.database import engine


def upgrade():
    """Add new columns to directories table"""
    with engine.connect() as conn:
        try:
            # Add requires_url_first column
            conn.execute(
                text(
                    """
                    ALTER TABLE directories
                    ADD COLUMN IF NOT EXISTS requires_url_first BOOLEAN DEFAULT FALSE
                    """
                )
            )

            # Add url_field_selector column
            conn.execute(
                text(
                    """
                    ALTER TABLE directories
                    ADD COLUMN IF NOT EXISTS url_field_selector VARCHAR(500)
                    """
                )
            )

            # Add url_submit_selector column
            conn.execute(
                text(
                    """
                    ALTER TABLE directories
                    ADD COLUMN IF NOT EXISTS url_submit_selector VARCHAR(500)
                    """
                )
            )

            conn.commit()
            print("✅ Migration completed successfully")
            print("   - Added requires_url_first column")
            print("   - Added url_field_selector column")
            print("   - Added url_submit_selector column")

        except Exception as e:
            conn.rollback()
            print(f"❌ Migration failed: {str(e)}")
            raise


def downgrade():
    """Remove the columns (rollback)"""
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE directories DROP COLUMN IF EXISTS requires_url_first"))
            conn.execute(text("ALTER TABLE directories DROP COLUMN IF EXISTS url_field_selector"))
            conn.execute(text("ALTER TABLE directories DROP COLUMN IF EXISTS url_submit_selector"))

            conn.commit()
            print("✅ Rollback completed successfully")

        except Exception as e:
            conn.rollback()
            print(f"❌ Rollback failed: {str(e)}")
            raise


if __name__ == "__main__":
    print("Running migration: Add URL-first submission fields")
    upgrade()
