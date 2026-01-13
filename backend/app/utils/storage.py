import os
import uuid
from pathlib import Path
from typing import Tuple

import boto3

from app.config import get_settings

settings = get_settings()


class StorageClient:
    def __init__(self) -> None:
        self.backend = settings.storage_backend.lower()
        self._s3 = None
        if self.backend == "s3":
            self._s3 = boto3.client(
                "s3",
                endpoint_url=settings.s3_endpoint_url,
                aws_access_key_id=settings.s3_access_key,
                aws_secret_access_key=settings.s3_secret_key,
                region_name=settings.s3_region,
            )
            self._ensure_bucket()
        else:
            Path(settings.local_storage_path).mkdir(parents=True, exist_ok=True)

    def _ensure_bucket(self) -> None:
        if not self._s3:
            return
        buckets = [bucket["Name"] for bucket in self._s3.list_buckets().get("Buckets", [])]
        if settings.s3_bucket not in buckets:
            self._s3.create_bucket(Bucket=settings.s3_bucket)

    def upload_file(self, filename: str, content: bytes) -> Tuple[str, str, str]:
        ext = Path(filename).suffix.lower().lstrip(".")
        key = f"uploads/{uuid.uuid4().hex}.{ext or 'bin'}"
        if self.backend == "s3":
            assert self._s3
            self._s3.put_object(Bucket=settings.s3_bucket, Key=key, Body=content)
            url = f"{settings.s3_endpoint_url.rstrip('/')}/{settings.s3_bucket}/{key}"
            return key, url, url
        path = Path(settings.local_storage_path) / key
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("wb") as handle:
            handle.write(content)
        url = f"/storage/{key}"
        return key, url, url
