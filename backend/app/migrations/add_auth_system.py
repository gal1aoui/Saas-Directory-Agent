"""
Database Migration: Add Authentication System

This migration adds:
- Users table
- user_id foreign keys to saas_products, directories, submissions
- Encrypts existing directory login_password field
- Removes is_multi_step and step_count from directories (AI auto-detects)

Usage:
    python -m app.migrations.add_auth_system
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from app.config import get_settings
from app.database import engine
from app.utils.auth import encrypt_credential

settings = get_settings()


def upgrade():
    """Apply migration - add auth system"""
    print("\n" + "=" * 60)
    print("MIGRATION: Adding Authentication System")
    print("=" * 60 + "\n")

    with engine.connect() as conn:
        try:
            # 1. Create users table
            print("1. Creating users table...")
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        username VARCHAR(100) UNIQUE NOT NULL,
                        hashed_password VARCHAR(255) NOT NULL,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
                    CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);
                    """
                )
            )
            print("   ✅ Users table created")

            # 2. Add user_id to saas_products
            print("\n2. Adding user_id to saas_products...")
            conn.execute(
                text(
                    """
                    ALTER TABLE saas_products
                    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

                    CREATE INDEX IF NOT EXISTS ix_saas_products_user_id ON saas_products(user_id);
                    """
                )
            )
            print("   ✅ Added user_id to saas_products")

            # 3. Add user_id to directories
            print("\n3. Adding user_id to directories...")
            conn.execute(
                text(
                    """
                    ALTER TABLE directories
                    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

                    CREATE INDEX IF NOT EXISTS ix_directories_user_id ON directories(user_id);

                    -- Update url column to be indexed (not unique per user)
                    DROP INDEX IF EXISTS directories_url_key;
                    CREATE INDEX IF NOT EXISTS ix_directories_url ON directories(url);
                    """
                )
            )
            print("   ✅ Added user_id to directories")

            # 4. Add user_id to submissions
            print("\n4. Adding user_id to submissions...")
            conn.execute(
                text(
                    """
                    ALTER TABLE submissions
                    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

                    CREATE INDEX IF NOT EXISTS ix_submissions_user_id ON submissions(user_id);
                    """
                )
            )
            print("   ✅ Added user_id to submissions")

            # 5. Remove multi-step fields from directories (AI auto-detects)
            print("\n5. Removing manual multi-step fields (AI will auto-detect)...")
            conn.execute(
                text(
                    """
                    ALTER TABLE directories DROP COLUMN IF EXISTS is_multi_step;
                    ALTER TABLE directories DROP COLUMN IF EXISTS step_count;
                    """
                )
            )
            print("   ✅ Removed is_multi_step and step_count columns")

            # 6. Encrypt existing directory passwords
            print("\n6. Encrypting existing directory passwords...")
            result = conn.execute(
                text("SELECT id, login_password FROM directories WHERE login_password IS NOT NULL")
            )
            directories_with_passwords = result.fetchall()

            if directories_with_passwords:
                print(f"   Found {len(directories_with_passwords)} directories with passwords")
                for dir_id, plain_password in directories_with_passwords:
                    if plain_password:
                        encrypted = encrypt_credential(plain_password)
                        conn.execute(
                            text("UPDATE directories SET login_password = :encrypted WHERE id = :id"),
                            {"encrypted": encrypted, "id": dir_id},
                        )
                print(f"   ✅ Encrypted {len(directories_with_passwords)} passwords")
            else:
                print("   ℹ️  No directories with passwords to encrypt")

            conn.commit()

            print("\n" + "=" * 60)
            print("✅ Migration completed successfully!")
            print("=" * 60)
            print("\n⚠️  IMPORTANT NEXT STEPS:")
            print("\n1. Create a default admin user (via API or SQL):")
            print("   POST /api/auth/register")
            print("   {")
            print('     "email": "admin@example.com",')
            print('     "username": "admin",')
            print('     "password": "YourSecurePassword123"')
            print("   }")
            print("\n2. Assign existing data to this user:")
            print("   UPDATE saas_products SET user_id = 1;")
            print("   UPDATE directories SET user_id = 1;")
            print("   UPDATE submissions SET user_id = 1;")
            print("\n3. Make user_id NOT NULL (after assigning):")
            print("   ALTER TABLE saas_products ALTER COLUMN user_id SET NOT NULL;")
            print("   ALTER TABLE directories ALTER COLUMN user_id SET NOT NULL;")
            print("   ALTER TABLE submissions ALTER COLUMN user_id SET NOT NULL;")
            print("\n" + "=" * 60 + "\n")

        except Exception as e:
            conn.rollback()
            print(f"\n❌ Migration failed: {str(e)}")
            raise


def downgrade():
    """Rollback migration - remove auth system"""
    print("\n" + "=" * 60)
    print("ROLLBACK: Removing Authentication System")
    print("=" * 60 + "\n")

    with engine.connect() as conn:
        try:
            print("1. Removing user_id from submissions...")
            conn.execute(text("ALTER TABLE submissions DROP COLUMN IF EXISTS user_id;"))

            print("2. Removing user_id from directories...")
            conn.execute(text("ALTER TABLE directories DROP COLUMN IF EXISTS user_id;"))

            print("3. Removing user_id from saas_products...")
            conn.execute(text("ALTER TABLE saas_products DROP COLUMN IF EXISTS user_id;"))

            print("4. Dropping users table...")
            conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))

            print("5. Re-adding multi-step fields...")
            conn.execute(
                text(
                    """
                    ALTER TABLE directories
                    ADD COLUMN IF NOT EXISTS is_multi_step BOOLEAN DEFAULT FALSE;

                    ALTER TABLE directories
                    ADD COLUMN IF NOT EXISTS step_count INTEGER DEFAULT 1;
                    """
                )
            )

            conn.commit()

            print("\n✅ Rollback completed successfully\n")

        except Exception as e:
            conn.rollback()
            print(f"\n❌ Rollback failed: {str(e)}")
            raise


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Database migration for authentication system")
    parser.add_argument("--rollback", action="store_true", help="Rollback the migration")

    args = parser.parse_args()

    if args.rollback:
        downgrade()
    else:
        upgrade()
