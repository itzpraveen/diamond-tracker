from io import BytesIO
from pathlib import Path
from typing import Iterable

import httpx
import qrcode
from reportlab.lib.pagesizes import A7, A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from app.config import get_settings
from app.models import Batch, ItemJob

settings = get_settings()
LOGO_PATH = Path(__file__).resolve().parent.parent / "assets" / "majestic-logo.png"


def _format_number(value: float | None, suffix: str = "") -> str:
    if value is None:
        return "-"
    return f"{value:g}{suffix}"


def _load_logo_image() -> ImageReader | None:
    if not LOGO_PATH.exists():
        return None
    try:
        return ImageReader(str(LOGO_PATH))
    except Exception:
        return None


def _load_photo_bytes(photo: dict) -> bytes | None:
    if not isinstance(photo, dict):
        return None
    key = photo.get("key")
    url = photo.get("thumb_url") or photo.get("url")
    if settings.storage_backend.lower() == "local":
        path = None
        if key:
            path = Path(settings.local_storage_path) / key
        elif url and url.startswith("/storage/"):
            path = Path(settings.local_storage_path) / url.removeprefix("/storage/")
        if path and path.exists():
            return path.read_bytes()
    if not url or url.startswith("/"):
        return None
    try:
        response = httpx.get(url, timeout=5.0)
        response.raise_for_status()
        return response.content
    except Exception:
        return None


def _draw_image(c: canvas.Canvas, image: ImageReader, x: float, y: float, width: float, height: float) -> None:
    c.drawImage(
        image,
        x,
        y,
        width=width,
        height=height,
        preserveAspectRatio=True,
        anchor="c",
        mask="auto",
    )


def generate_label_pdf(job: ItemJob, branch_name: str) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A7)

    page_width, page_height = A7
    left_margin = 8 * mm
    right_margin = 8 * mm
    top_margin = 6 * mm
    line_gap = 4 * mm

    logo = _load_logo_image()
    header_text = "Majestic Tracking"
    cursor_y = page_height - top_margin
    if logo:
        logo_box_w = 18 * mm
        logo_box_h = 12 * mm
        logo_x = left_margin
        logo_y = cursor_y - logo_box_h
        _draw_image(c, logo, logo_x, logo_y, logo_box_w, logo_box_h)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(logo_x + logo_box_w + 3 * mm, logo_y + logo_box_h - 4 * mm, header_text)
        cursor_y = logo_y - 2 * mm
    else:
        c.setFont("Helvetica-Bold", 11)
        c.drawString(left_margin, cursor_y - 8 * mm, header_text)
        cursor_y -= 12 * mm

    c.setFont("Helvetica", 8)
    source = job.item_source.value if job.item_source else "-"
    lines = [
        f"Job: {job.job_id}",
        f"Branch: {branch_name}",
        f"Created: {job.created_at.date().isoformat()}",
        f"Source: {source}",
    ]

    customer = (job.customer_name or "").strip()
    if customer:
        lines.append(f"Customer: {customer[:22]}")
    phone = (job.customer_phone or "").strip()
    if phone:
        lines.append(f"Phone: {phone[:20]}")

    weight = _format_number(job.approximate_weight, "g")
    value = _format_number(job.purchase_value)
    lines.append(f"Weight: {weight}  Value (INR): {value}")
    diamond = _format_number(job.diamond_cent, "c")
    lines.append(f"Diamond Cent: {diamond}")

    description = (job.item_description or "").strip()
    lines.append(f"Item: {description[:36]}")

    line_y = cursor_y
    for line in lines:
        c.drawString(left_margin, line_y, line)
        line_y -= line_gap

    photos = job.photos or []
    photo_reader = None
    if isinstance(photos, list) and photos:
        photo_bytes = _load_photo_bytes(photos[0])
        if photo_bytes:
            photo_reader = ImageReader(BytesIO(photo_bytes))

    qr = qrcode.QRCode(box_size=2, border=1)
    qr.add_data(job.job_id)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    qr_buffer = BytesIO()
    img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)

    qr_size = 30 * mm
    qr_x = left_margin
    qr_y = 8 * mm
    _draw_image(c, ImageReader(qr_buffer), qr_x, qr_y, qr_size, qr_size)

    if photo_reader:
        photo_box = 24 * mm
        photo_x = page_width - right_margin - photo_box
        photo_y = 8 * mm
        _draw_image(c, photo_reader, photo_x, photo_y, photo_box, photo_box)
    c.showPage()
    c.save()
    return buffer.getvalue()


def generate_manifest_pdf(batch: Batch, jobs: Iterable[ItemJob]) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(20 * mm, 280 * mm, f"Batch Manifest: {batch.batch_code}")

    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, 272 * mm, f"Status: {batch.status}")
    c.drawString(20 * mm, 266 * mm, f"Item Count: {batch.item_count}")

    y = 250 * mm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, y, "Job ID")
    c.drawString(60 * mm, y, "Description")
    c.drawString(150 * mm, y, "Status")

    c.setFont("Helvetica", 9)
    y -= 8 * mm
    for job in jobs:
        if y < 20 * mm:
            c.showPage()
            y = 270 * mm
        c.drawString(20 * mm, y, job.job_id)
        c.drawString(60 * mm, y, (job.item_description or "")[:40])
        c.drawString(150 * mm, y, job.current_status)
        y -= 6 * mm

    c.showPage()
    c.save()
    return buffer.getvalue()
