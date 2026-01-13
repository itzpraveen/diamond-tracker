from fastapi import APIRouter, Depends, File, UploadFile

from app.deps import require_roles
from app.models import Role
from app.schemas import UploadResponse
from app.utils.storage import StorageClient

router = APIRouter(prefix="/uploads", tags=["uploads"])

storage = StorageClient()


@router.post("/image", response_model=UploadResponse)
def upload_image(
    file: UploadFile = File(...),
    user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY)),
):
    content = file.file.read()
    key, url, thumb_url = storage.upload_file(file.filename, content)
    return UploadResponse(key=key, url=url, thumb_url=thumb_url)
