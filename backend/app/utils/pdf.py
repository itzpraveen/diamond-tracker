from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Iterable

import httpx
import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from app.config import get_settings
from app.models import Batch, ItemJob

settings = get_settings()
LOGO_PATH = Path(__file__).resolve().parent.parent / "assets" / "majestic-logo.png"
HTTP_CLIENT = httpx.Client(timeout=5.0, follow_redirects=True)
LABEL_SHEET_COLUMNS = 2
LABEL_SHEET_ROWS = 3
LABEL_SHEET_MARGIN_X = 2 * mm
LABEL_SHEET_MARGIN_Y = 2 * mm
LABEL_SHEET_GAP_X = 2 * mm
LABEL_SHEET_GAP_Y = 4 * mm


def _label_dimensions(
    columns: int = LABEL_SHEET_COLUMNS,
    rows: int = LABEL_SHEET_ROWS,
    margin_x: float = LABEL_SHEET_MARGIN_X,
    margin_y: float = LABEL_SHEET_MARGIN_Y,
    gap_x: float = LABEL_SHEET_GAP_X,
    gap_y: float = LABEL_SHEET_GAP_Y,
) -> tuple[float, float]:
    page_width, page_height = A4
    usable_width = page_width - (2 * margin_x) - ((columns - 1) * gap_x)
    usable_height = page_height - (2 * margin_y) - ((rows - 1) * gap_y)
    if usable_width <= 0 or usable_height <= 0:
        raise ValueError("Label grid does not fit on A4 with the configured margins/gaps.")
    return usable_width / columns, usable_height / rows


def _format_number(value: float | None, suffix: str = "") -> str:
    if value is None:
        return "-"
    return f"{value:g}{suffix}"


def _normalize_text(value: str | None) -> str:
    text = (value or "").strip()
    return text if text else "-"


def _trim_text(text: str, max_width: float, font_name: str, font_size: int) -> str:
    if pdfmetrics.stringWidth(text, font_name, font_size) <= max_width:
        return text
    suffix = "..."
    trimmed = text
    while trimmed and pdfmetrics.stringWidth(f"{trimmed}{suffix}", font_name, font_size) > max_width:
        trimmed = trimmed[:-1]
    return f"{trimmed}{suffix}" if trimmed else suffix


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
        response = HTTP_CLIENT.get(url)
        response.raise_for_status()
        return response.content
    except Exception:
        return None


@lru_cache(maxsize=512)
def _qr_png_bytes(payload: str) -> bytes:
    qr = qrcode.QRCode(box_size=2, border=1)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    qr_buffer = BytesIO()
    img.save(qr_buffer, format="PNG")
    return qr_buffer.getvalue()


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

def _draw_label(
    c: canvas.Canvas,
    job: ItemJob,
    branch_name: str,
    factory_name: str | None,
    x: float,
    y: float,
    width: float,
    height: float,
    scale: float = 1.0,
) -> None:
    c.saveState()
    c.translate(x, y)
    if scale != 1.0:
        c.scale(scale, scale)

    page_width = width
    page_height = height
    c.setStrokeColor(colors.HexColor("#d1d5db"))
    c.setLineWidth(0.5)
    c.rect(0, 0, page_width, page_height, stroke=1, fill=0)
    left_margin = 4 * mm
    right_margin = 4 * mm
    top_margin = 4 * mm
    header_height = 13 * mm
    header_y = page_height - top_margin - header_height

    c.setFillColor(colors.HexColor("#f3efe7"))
    c.rect(0, header_y, page_width, header_height, stroke=0, fill=1)
    c.setFillColor(colors.black)

    logo = _load_logo_image()
    logo_size = 10 * mm
    logo_x = left_margin
    logo_y = header_y + (header_height - logo_size) / 2
    if logo:
        _draw_image(c, logo, logo_x, logo_y, logo_size, logo_size)
    title_x = logo_x + logo_size + 3 * mm
    c.setFont("Helvetica-Bold", 9)
    c.drawString(title_x, header_y + header_height - 5 * mm, "Majestic Tracking")
    c.setFont("Helvetica", 6.5)
    c.setFillColor(colors.HexColor("#4b5563"))
    c.drawString(title_x, header_y + header_height - 9.5 * mm, f"Job {job.job_id}")
    c.setFillColor(colors.black)

    source = job.item_source.value if job.item_source else "-"
    if job.repair_type:
        repair_type = job.repair_type.value
    elif job.item_source:
        repair_type = "Customer Repair" if job.item_source.value == "Repair" else "Stock Repair"
    else:
        repair_type = "-"
    factory_label = _normalize_text(factory_name or job.factory_name)
    work_narration = _normalize_text(job.work_narration)
    weight = _format_number(job.approximate_weight, "g")
    value = _format_number(job.purchase_value)
    voucher_no = _normalize_text(job.voucher_no)
    diamond = _format_number(job.diamond_cent, "c")
    customer = _normalize_text(job.customer_name)
    phone = _normalize_text(job.customer_phone)
    description = _normalize_text(job.item_description)
    target_return = job.target_return_date.date().isoformat() if job.target_return_date else "-"

    left_fields = [
        ("Branch", _normalize_text(branch_name)),
        ("Repair Type", repair_type),
        ("Factory", factory_label),
        ("Work", work_narration),
        ("Item", description),
        ("Customer", customer),
        ("Phone", phone),
    ]
    right_fields = [
        ("Created", job.created_at.date().isoformat()),
        ("Target Return", target_return),
        ("Source", source),
        ("Weight", weight),
        ("Value (INR)", value),
        ("Voucher No", voucher_no),
        ("Diamond Cent", diamond),
    ]

    content_width = page_width - left_margin - right_margin
    col_gap = 3 * mm
    col_width = (content_width - col_gap) / 2
    left_x = left_margin
    right_x = left_margin + col_width + col_gap

    qr_size = 22 * mm
    photo_box = 22 * mm
    bottom_area_top = left_margin + photo_box + 8 * mm
    info_top = header_y - 2 * mm
    max_rows = max(len(left_fields), len(right_fields))
    info_height = max(info_top - bottom_area_top, 30 * mm)
    row_height = info_height / max_rows
    value_offset = max(2.0 * mm, row_height * 0.55)

    def draw_field(label: str, value: str, x: float, y: float) -> None:
        label_font = "Helvetica"
        value_font = "Helvetica-Bold"
        label_size = min(5.5, row_height * 0.35)
        value_size = min(7.5, row_height * 0.45)
        c.setFillColor(colors.HexColor("#6b7280"))
        c.setFont(label_font, label_size)
        c.drawString(x, y, label.upper())
        c.setFillColor(colors.black)
        c.setFont(value_font, value_size)
        fitted = _trim_text(value, col_width, value_font, value_size)
        c.drawString(x, y - value_offset, fitted)

    row_y = info_top
    for index in range(max_rows):
        if index < len(left_fields):
            label, value = left_fields[index]
            draw_field(label, value, left_x, row_y)
        if index < len(right_fields):
            label, value = right_fields[index]
            draw_field(label, value, right_x, row_y)
        row_y -= row_height

    c.setStrokeColor(colors.HexColor("#e5e7eb"))
    c.setLineWidth(0.6)
    c.line(left_margin, bottom_area_top, page_width - right_margin, bottom_area_top)

    photos = job.photos or []
    photo_reader = None
    if isinstance(photos, list) and photos:
        photo_bytes = _load_photo_bytes(photos[0])
        if photo_bytes:
            photo_reader = ImageReader(BytesIO(photo_bytes))

    qr_buffer = BytesIO(_qr_png_bytes(job.job_id))
    qr_buffer.seek(0)

    qr_x = left_margin
    qr_y = left_margin
    photo_x = page_width - right_margin - photo_box
    photo_y = left_margin

    c.setFont("Helvetica", 5.5)
    c.setFillColor(colors.HexColor("#6b7280"))
    c.drawString(qr_x, bottom_area_top - 5 * mm, "SCAN")
    c.drawString(photo_x, bottom_area_top - 5 * mm, "PHOTO")
    c.setFillColor(colors.black)

    c.setStrokeColor(colors.HexColor("#d1d5db"))
    c.setLineWidth(0.5)
    c.roundRect(qr_x - 1 * mm, qr_y - 1 * mm, qr_size + 2 * mm, qr_size + 2 * mm, 2 * mm, stroke=1, fill=0)
    c.roundRect(photo_x - 1 * mm, photo_y - 1 * mm, photo_box + 2 * mm, photo_box + 2 * mm, 2 * mm, stroke=1, fill=0)

    _draw_image(c, ImageReader(qr_buffer), qr_x, qr_y, qr_size, qr_size)

    if photo_reader:
        _draw_image(c, photo_reader, photo_x, photo_y, photo_box, photo_box)
    else:
        c.setFont("Helvetica", 6)
        c.setFillColor(colors.HexColor("#9ca3af"))
        c.drawCentredString(photo_x + photo_box / 2, photo_y + photo_box / 2, "No photo")
        c.setFillColor(colors.black)

    c.restoreState()


def _label_positions(
    page_width: float,
    page_height: float,
    label_width: float,
    label_height: float,
    columns: int = 2,
    rows: int = 3,
    gap_x: float = 6 * mm,
    gap_y: float = 6 * mm,
) -> list[tuple[float, float]]:
    if columns <= 0 or rows <= 0:
        return []
    grid_width = columns * label_width + (columns - 1) * gap_x
    grid_height = rows * label_height + (rows - 1) * gap_y
    start_x = max((page_width - grid_width) / 2, 0)
    start_y = max((page_height - grid_height) / 2, 0)

    positions = []
    for row in range(rows):
        for col in range(columns):
            x = start_x + col * (label_width + gap_x)
            y = start_y + (rows - 1 - row) * (label_height + gap_y)
            positions.append((x, y))
    return positions


def generate_label_pdf(job: ItemJob, branch_name: str, factory_name: str | None = None) -> bytes:
    buffer = BytesIO()
    label_width, label_height = _label_dimensions()
    c = canvas.Canvas(buffer, pagesize=(label_width, label_height))

    _draw_label(c, job, branch_name, factory_name, 0, 0, label_width, label_height)
    c.showPage()
    c.save()
    return buffer.getvalue()


def generate_label_sheet_pdf(
    labels: Iterable[tuple[ItemJob, str, str | None]],
    columns: int = LABEL_SHEET_COLUMNS,
    rows: int = LABEL_SHEET_ROWS,
    start_position: int = 1,
) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    page_width, page_height = A4
    label_width, label_height = _label_dimensions(columns=columns, rows=rows)
    positions = _label_positions(
        page_width,
        page_height,
        label_width,
        label_height,
        columns=columns,
        rows=rows,
        gap_x=LABEL_SHEET_GAP_X,
        gap_y=LABEL_SHEET_GAP_Y,
    )
    if not positions:
        c.save()
        return buffer.getvalue()

    label_list = list(labels)
    labels_per_page = len(positions)
    start_position = max(start_position, 1)
    if start_position > labels_per_page:
        raise ValueError(f"start_position must be between 1 and {labels_per_page}")

    start_index = start_position - 1
    first_page_capacity = labels_per_page - start_index
    current_page = 0
    for index, (job, branch_name, factory_name) in enumerate(label_list):
        if index < first_page_capacity:
            page_index = 0
            position_index = start_index + index
        else:
            adjusted = index - first_page_capacity
            page_index = 1 + adjusted // labels_per_page
            position_index = adjusted % labels_per_page
        while current_page < page_index:
            c.showPage()
            current_page += 1
        x, y = positions[position_index]
        _draw_label(c, job, branch_name, factory_name, x, y, label_width, label_height)

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
    if batch.factory_name:
        c.drawString(20 * mm, 260 * mm, f"Factory: {batch.factory_name}")

    y = 246 * mm
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
