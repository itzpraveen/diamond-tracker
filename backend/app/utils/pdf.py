from io import BytesIO
from typing import Iterable

import qrcode
from reportlab.lib.pagesizes import A7, A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from app.models import Batch, ItemJob


def generate_label_pdf(job: ItemJob, branch_name: str) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A7)

    c.setFont("Helvetica-Bold", 11)
    c.drawString(10 * mm, 70 * mm, "Diamond Buyback")

    c.setFont("Helvetica", 9)
    c.drawString(10 * mm, 62 * mm, f"Job: {job.job_id}")
    c.drawString(10 * mm, 57 * mm, f"Branch: {branch_name}")
    c.drawString(10 * mm, 52 * mm, f"Created: {job.created_at.date().isoformat()}")

    c.setFont("Helvetica", 8)
    description = (job.item_description or "").strip()
    c.drawString(10 * mm, 46 * mm, f"Item: {description[:40]}")

    qr = qrcode.QRCode(box_size=2, border=1)
    qr.add_data(job.job_id)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    qr_buffer = BytesIO()
    img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)

    c.drawImage(ImageReader(qr_buffer), 10 * mm, 10 * mm, width=30 * mm, height=30 * mm)
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
