import os
import uuid
import shutil
from pathlib import Path
from app.core.config import settings


async def upload_image(file, folder: str = "cuartoya", public_id: str = None) -> str:
    """Upload image to Cloudinary or local fallback."""
    if settings.CLOUDINARY_API_KEY:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
        )
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            public_id=public_id or str(uuid.uuid4()),
            overwrite=True,
            resource_type="image",
        )
        return result["secure_url"]

    # Local fallback for development
    upload_dir = Path("uploads") / folder
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{public_id or uuid.uuid4()}.jpg"
    file_path = upload_dir / filename

    if hasattr(file, "read"):
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    else:
        shutil.copy2(file, file_path)

    return f"/uploads/{folder}/{filename}"


async def delete_image(public_id: str) -> bool:
    """Delete image from Cloudinary or local."""
    if settings.CLOUDINARY_API_KEY:
        import cloudinary.uploader

        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"

    # Local fallback
    file_path = Path(f"uploads/{public_id}.jpg")
    if file_path.exists():
        file_path.unlink()
        return True
    return False


def generate_thumbnail(url: str, width: int = 300, height: int = 300) -> str:
    """Generate thumbnail URL."""
    if "cloudinary" in url:
        return url.replace("/upload/", f"/upload/w_{width},h_{height},c_fill/")
    return url
