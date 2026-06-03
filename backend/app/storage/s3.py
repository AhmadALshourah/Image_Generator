"""S3 / S3-compatible storage backend.

Works with AWS S3, Cloudflare R2, MinIO, Backblaze B2, etc. — anything that
speaks the S3 API. boto3 is only imported when this backend is selected, so
local dev deployments don't pay the import cost.
"""
from __future__ import annotations

import asyncio
import logging

logger = logging.getLogger(__name__)


class S3Storage:
    def __init__(
        self,
        *,
        bucket: str,
        region: str = "",
        endpoint_url: str = "",
        access_key_id: str = "",
        secret_access_key: str = "",
        public_base_url: str = "",
    ) -> None:
        # Lazy import so projects on `STORAGE_BACKEND=local` never need boto3.
        import boto3

        kwargs: dict[str, str] = {}
        if region:
            kwargs["region_name"] = region
        if endpoint_url:
            kwargs["endpoint_url"] = endpoint_url
        if access_key_id:
            kwargs["aws_access_key_id"] = access_key_id
        if secret_access_key:
            kwargs["aws_secret_access_key"] = secret_access_key

        self._client = boto3.client("s3", **kwargs)
        self._bucket = bucket
        self._public_base_url = (public_base_url or "").rstrip("/")
        self._endpoint_url = endpoint_url.rstrip("/")

    async def save(self, filename: str, content: bytes, content_type: str) -> None:
        def _put() -> None:
            self._client.put_object(
                Bucket=self._bucket,
                Key=filename,
                Body=content,
                ContentType=content_type or "application/octet-stream",
                CacheControl="public, max-age=31536000, immutable",
            )

        await asyncio.to_thread(_put)

    async def delete(self, filename: str) -> None:
        if not filename:
            return

        def _del() -> None:
            try:
                self._client.delete_object(Bucket=self._bucket, Key=filename)
            except Exception:  # noqa: BLE001 — best-effort
                logger.warning("Failed to delete S3 object: %s", filename)

        await asyncio.to_thread(_del)

    def public_url(self, filename: str) -> str:
        if self._public_base_url:
            return f"{self._public_base_url}/{filename}"
        if self._endpoint_url:
            return f"{self._endpoint_url}/{self._bucket}/{filename}"
        return f"https://{self._bucket}.s3.amazonaws.com/{filename}"
