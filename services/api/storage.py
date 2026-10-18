"""Private result storage; every read is authorized by its owning job first."""

import os
from pathlib import Path


class AssetStorage:
    def __init__(self, root: Path, mode: str):
        self.root = root
        self.mode = mode

    def put(self, job, index, data):
        key = f"jobs/{job}/{index}.bin"
        if self.mode == "live":
            import boto3

            bucket = os.getenv("S3_PRIVATE_BUCKET")
            if not bucket:
                raise ValueError("private_storage_unavailable")
            # Bucket must additionally enable Block Public Access; no public ACL.
            boto3.client("s3").put_object(
                Bucket=bucket,
                Key=key,
                Body=data,
                ServerSideEncryption="AES256",
                ContentType="application/octet-stream",
            )
        else:
            folder = self.root / job
            folder.mkdir(exist_ok=True)
            p = folder / f"{index}.bin"
            p.write_bytes(data)
            p.chmod(0o600)

    def get(self, job, index):
        if self.mode == "live":
            import boto3

            return (
                boto3.client("s3")
                .get_object(
                    Bucket=os.environ["S3_PRIVATE_BUCKET"],
                    Key=f"jobs/{job}/{index}.bin",
                )["Body"]
                .read(8 * 1024 * 1024 + 1)
            )
        return (self.root / job / f"{index}.bin").read_bytes()
