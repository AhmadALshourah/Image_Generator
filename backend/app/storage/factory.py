from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from app.config import get_settings
from app.storage.base import StorageBackend


@lru_cache(maxsize=1)
def get_storage_backend() -> StorageBackend:
    """Select the storage backend based on STORAGE_BACKEND.

    Returns a singleton (lru_cache) so all callers share the same client and
    connection pool.
    """
    settings = get_settings()

    if settings.storage_backend == "s3":
        if not settings.s3_bucket:
            raise RuntimeError(
                "STORAGE_BACKEND=s3 requires S3_BUCKET to be set in the environment."
            )
        from app.storage.s3 import S3Storage

        return S3Storage(
            bucket=settings.s3_bucket,
            region=settings.s3_region,
            endpoint_url=settings.s3_endpoint_url,
            access_key_id=settings.s3_access_key_id,
            secret_access_key=settings.s3_secret_access_key,
            public_base_url=settings.s3_public_base_url,
        )

    # Default: local disk.
    from app.storage.local import LocalDiskStorage

    base = Path(settings.data_dir) if settings.data_dir else _default_images_dir()
    return LocalDiskStorage(directory=base / "images")


def _default_images_dir() -> Path:
    # backend/app/storage/factory.py  →  parent.parent.parent = backend/
    return Path(__file__).resolve().parent.parent.parent
