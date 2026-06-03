"""Data-access layer.

Repositories abstract DB queries behind small async classes. Routes depend on
them via FastAPI's `Depends`, which makes:

  * tests trivial (swap with an in-memory fake)
  * the routing layer thin (no SQLAlchemy at the edges)
  * future migrations cheap (Postgres? swap the impl; routes don't change)
"""
from app.repositories.image_repository import ImageRepository, get_image_repository
from app.repositories.tag_repository import TagRepository, get_tag_repository

__all__ = [
    "ImageRepository",
    "TagRepository",
    "get_image_repository",
    "get_tag_repository",
]
