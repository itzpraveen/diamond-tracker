from fastapi import APIRouter, Depends, File, UploadFile, Request

from app.deps import require_roles
from app.models import Role
from app.schemas import UploadResponse
from app.utils.storage import StorageClient

router = APIRouter(prefix="/uploads", tags=["uploads"])

storage = StorageClient()


@router.post("/image", response_model=UploadResponse)
def upload_image(
    request: Request,
    file: UploadFile = File(...),
    user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY)),
):
    content = file.file.read()
    key, url, thumb_url = storage.upload_file(file.filename, content)
    if url.startswith("/"):
        base_url = str(request.base_url).rstrip("/")
        url = f"{base_url}{url}"
    if thumb_url.startswith("/"):
        base_url = str(request.base_url).rstrip("/")
        thumb_url = f"{base_url}{thumb_url}"
    return UploadResponse(key=key, url=url, thumb_url=thumb_url)
