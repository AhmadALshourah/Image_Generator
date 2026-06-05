"""Migration v2: add role/owner_id/is_gallery columns, create Mordax admin,
mark existing images as Gallery.

Run once from backend/:
    python migrate_v2.py
"""
import asyncio

MORDAX_PASSWORD = "Mordax@2026"


async def run() -> None:
    from sqlalchemy import func, select, text, update

    from app.database import AsyncSessionLocal, engine
    from app.models import Image, User
    from app.services.auth_service import create_user, get_user, hash_password

    # 1. Add new columns (SQLite ALTER TABLE — safe to re-run).
    async with engine.begin() as conn:
        for stmt in [
            "ALTER TABLE users ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'user'",
            "ALTER TABLE images ADD COLUMN is_gallery BOOLEAN NOT NULL DEFAULT 0",
            "ALTER TABLE images ADD COLUMN owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL",
        ]:
            try:
                await conn.execute(text(stmt))
                print(f"  OK: {stmt[:55]}")
            except Exception as exc:
                print(f"  SKIP (already exists?): {exc}")

    # 2. Create Mordax admin account.
    async with AsyncSessionLocal() as db:
        mordax = await get_user(db, "Mordax")
        if mordax is None:
            mordax = await create_user(db, "Mordax", MORDAX_PASSWORD, role="admin")
            print(f"  Created admin Mordax (id={mordax.id})")
        else:
            # Ensure role is admin even if account existed before.
            mordax.role = "admin"
            await db.commit()
            print(f"  Mordax already exists (id={mordax.id}), role set to admin")

        # 3. Mark all existing is_gallery=False images as Gallery, owned by Mordax.
        await db.execute(
            update(Image)
            .where(Image.is_gallery == False)  # noqa: E712
            .values(is_gallery=True, owner_id=mordax.id)
        )
        await db.commit()

        count = await db.scalar(
            select(func.count()).select_from(Image).where(Image.is_gallery == True)  # noqa: E712
        )
        print(f"  Gallery images: {count}")

    print("\nMigration complete.")
    print(f"  Admin login → username: Mordax | password: {MORDAX_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(run())
