from __future__ import annotations

from functools import lru_cache
import logging
import smtplib
from datetime import datetime
from decimal import Decimal
from email.message import EmailMessage
from email.utils import formataddr
from io import BytesIO
from typing import TYPE_CHECKING
from types import SimpleNamespace
from xml.sax.saxutils import escape

from app.core.config import settings

if TYPE_CHECKING:
    from app.schemas.order import OrderRead

logger = logging.getLogger(__name__)

PAGE_MARGIN_MM = 18


@lru_cache
def get_reportlab() -> SimpleNamespace:
    try:
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_RIGHT
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import (
            KeepTogether,
            PageBreak,
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )
    except ModuleNotFoundError as exc:
        if exc.name == "reportlab" or exc.name.startswith("reportlab."):
            raise RuntimeError(
                "Invoice PDF generation requires the 'reportlab' package. "
                "Reinstall backend dependencies or run `pip install reportlab` in apps/api/.venv."
            ) from exc
        raise

    return SimpleNamespace(
        A4=A4,
        KeepTogether=KeepTogether,
        PageBreak=PageBreak,
        Paragraph=Paragraph,
        ParagraphStyle=ParagraphStyle,
        SimpleDocTemplate=SimpleDocTemplate,
        Spacer=Spacer,
        TA_RIGHT=TA_RIGHT,
        Table=Table,
        TableStyle=TableStyle,
        colors=colors,
        getSampleStyleSheet=getSampleStyleSheet,
        mm=mm,
    )


def format_currency(value: Decimal) -> str:
    amount = Decimal(value).quantize(Decimal("0.01"))
    return f"${amount:,.2f}"


def format_timestamp(value: datetime | None) -> str:
    if value is None:
        return "Unavailable"

    label = value.strftime("%b %d, %Y %H:%M")
    timezone_name = value.strftime("%Z").strip()
    if timezone_name:
        return f"{label} {timezone_name}"
    return label


def build_invoice_pdf(order: OrderRead) -> bytes:
    reportlab = get_reportlab()
    page_margin = PAGE_MARGIN_MM * reportlab.mm
    buffer = BytesIO()
    document = reportlab.SimpleDocTemplate(
        buffer,
        pagesize=reportlab.A4,
        leftMargin=page_margin,
        rightMargin=page_margin,
        topMargin=page_margin,
        bottomMargin=page_margin,
        title=f"Invoice {order.order_number}",
        author="SUtore",
    )
    styles = build_styles()
    story = build_invoice_story(order, document.width, styles)

    document.build(
        story,
        onFirstPage=lambda canvas, doc: draw_page_footer(canvas, doc, order.order_number),
        onLaterPages=lambda canvas, doc: draw_page_footer(canvas, doc, order.order_number),
    )

    return buffer.getvalue()


def build_invoice_range_pdf(orders: list[OrderRead], title: str = "Invoice range") -> bytes:
    reportlab = get_reportlab()
    page_margin = PAGE_MARGIN_MM * reportlab.mm
    buffer = BytesIO()
    document = reportlab.SimpleDocTemplate(
        buffer,
        pagesize=reportlab.A4,
        leftMargin=page_margin,
        rightMargin=page_margin,
        topMargin=page_margin,
        bottomMargin=page_margin,
        title=title,
        author="SUtore",
    )
    styles = build_styles()
    story = []
    for index, order in enumerate(orders):
        story.extend(build_invoice_story(order, document.width, styles))
        if index < len(orders) - 1:
            story.append(reportlab.PageBreak())

    document.build(
        story,
        onFirstPage=lambda canvas, doc: draw_page_footer(canvas, doc, title),
        onLaterPages=lambda canvas, doc: draw_page_footer(canvas, doc, title),
    )

    return buffer.getvalue()


def build_invoice_story(
    order: OrderRead,
    content_width: float,
    styles: dict[str, object],
) -> list[object]:
    reportlab = get_reportlab()
    return [
        build_header(order, content_width, styles),
        reportlab.Spacer(1, 14),
        build_details_panel(order, content_width, styles),
        reportlab.Spacer(1, 16),
        build_items_table(order, content_width, styles),
        reportlab.Spacer(1, 16),
        build_totals_panel(order, content_width, styles),
        reportlab.Spacer(1, 14),
        build_footer_note(order, content_width, styles),
    ]


def send_order_invoice_email(order: OrderRead) -> bool:
    if not settings.invoice_email_enabled:
        logger.info(
            "Skipping invoice email for order %s because SMTP is not configured.",
            order.order_number,
        )
        return False

    pdf_bytes = build_invoice_pdf(order)
    sender_email = (settings.mail_from_email or "").strip()
    sender_name = settings.mail_from_name.strip() or "SUtore Billing"

    message = EmailMessage()
    message["Subject"] = f"Your SUtore invoice for order {order.order_number}"
    message["From"] = formataddr((sender_name, sender_email))
    message["To"] = str(order.billing_email)
    message.set_content(
        "\n".join(
            [
                f"Hello {order.billing_name},",
                "",
                f"Thank you for your order {order.order_number}.",
                "Your invoice is attached as a PDF for your records.",
                "",
                f"Order total: {format_currency(order.total)}",
                "",
                "SUtore Billing",
            ]
        )
    )
    message.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=f"invoice-{order.order_number}.pdf",
    )

    send_email_message(message)
    logger.info(
        "Sent invoice email for order %s to %s.",
        order.order_number,
        order.billing_email,
    )
    return True


def send_email_message(message: EmailMessage) -> None:
    smtp_host = (settings.smtp_host or "").strip()
    sender_email = (settings.mail_from_email or "").strip()

    if not smtp_host or not sender_email:
        raise RuntimeError("SMTP_HOST and MAIL_FROM_EMAIL are required to send invoices.")

    client_factory = smtplib.SMTP_SSL if settings.smtp_use_ssl else smtplib.SMTP
    with client_factory(
        smtp_host,
        settings.smtp_port,
        timeout=settings.smtp_timeout_seconds,
    ) as client:
        client.ehlo()
        if not settings.smtp_use_ssl and settings.smtp_use_tls:
            client.starttls()
            client.ehlo()

        if settings.smtp_username:
            client.login(settings.smtp_username, settings.smtp_password or "")

        client.send_message(message)


def build_styles() -> dict[str, object]:
    reportlab = get_reportlab()
    sample_styles = reportlab.getSampleStyleSheet()
    return {
        "eyebrow": reportlab.ParagraphStyle(
            "InvoiceEyebrow",
            parent=sample_styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=reportlab.colors.HexColor("#0891B2"),
            spaceAfter=6,
        ),
        "title": reportlab.ParagraphStyle(
            "InvoiceTitle",
            parent=sample_styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=reportlab.colors.HexColor("#0F172A"),
            spaceAfter=6,
        ),
        "body": reportlab.ParagraphStyle(
            "InvoiceBody",
            parent=sample_styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            textColor=reportlab.colors.HexColor("#475569"),
        ),
        "label": reportlab.ParagraphStyle(
            "InvoiceLabel",
            parent=sample_styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=reportlab.colors.HexColor("#64748B"),
        ),
        "section_title": reportlab.ParagraphStyle(
            "InvoiceSectionTitle",
            parent=sample_styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=reportlab.colors.HexColor("#0F172A"),
        ),
        "table_header": reportlab.ParagraphStyle(
            "InvoiceTableHeader",
            parent=sample_styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=reportlab.colors.HexColor("#334155"),
        ),
        "table_cell": reportlab.ParagraphStyle(
            "InvoiceTableCell",
            parent=sample_styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=reportlab.colors.HexColor("#0F172A"),
        ),
        "table_cell_right": reportlab.ParagraphStyle(
            "InvoiceTableCellRight",
            parent=sample_styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=reportlab.colors.HexColor("#0F172A"),
            alignment=reportlab.TA_RIGHT,
        ),
        "totals_label": reportlab.ParagraphStyle(
            "InvoiceTotalsLabel",
            parent=sample_styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=reportlab.colors.HexColor("#475569"),
        ),
        "totals_value": reportlab.ParagraphStyle(
            "InvoiceTotalsValue",
            parent=sample_styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=14,
            textColor=reportlab.colors.HexColor("#0F172A"),
            alignment=reportlab.TA_RIGHT,
        ),
        "totals_value_large": reportlab.ParagraphStyle(
            "InvoiceTotalsValueLarge",
            parent=sample_styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=reportlab.colors.HexColor("#0F172A"),
            alignment=reportlab.TA_RIGHT,
        ),
    }


def build_header(
    order: OrderRead,
    content_width: float,
    styles: dict[str, object],
):
    reportlab = get_reportlab()
    left_column = [
        reportlab.Paragraph("SUtore", styles["eyebrow"]),
        reportlab.Paragraph("Invoice", styles["title"]),
        reportlab.Paragraph(
            "Your order has been confirmed and this PDF summarizes the purchase details recorded at checkout.",
            styles["body"],
        ),
    ]
    right_column = [
        reportlab.Paragraph("ORDER NUMBER", styles["label"]),
        reportlab.Paragraph(escape(order.order_number), styles["section_title"]),
        reportlab.Spacer(1, 6),
        reportlab.Paragraph("ORDER DATE", styles["label"]),
        reportlab.Paragraph(escape(format_timestamp(order.created_at)), styles["body"]),
    ]

    table = reportlab.Table(
        [[left_column, right_column]],
        colWidths=[content_width * 0.62, content_width * 0.38],
    )
    table.setStyle(
        reportlab.TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), reportlab.colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 1, reportlab.colors.HexColor("#D9E4F0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, reportlab.colors.HexColor("#E2E8F0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 16),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
                ("LEFTPADDING", (0, 0), (-1, -1), 18),
                ("RIGHTPADDING", (0, 0), (-1, -1), 18),
            ]
        )
    )
    return table


def build_details_panel(
    order: OrderRead,
    content_width: float,
    styles: dict[str, object],
):
    reportlab = get_reportlab()
    billing_lines = [
        reportlab.Paragraph("BILLING DETAILS", styles["label"]),
        reportlab.Paragraph(escape(order.billing_name), styles["section_title"]),
        reportlab.Spacer(1, 6),
        reportlab.Paragraph(escape(str(order.billing_email)), styles["body"]),
        reportlab.Paragraph(escape(order.billing_phone), styles["body"]),
        reportlab.Paragraph(
            escape(order.billing_address).replace("\n", "<br/>"),
            styles["body"],
        ),
    ]
    payment_lines = [
        reportlab.Paragraph("PAYMENT REFERENCE", styles["label"]),
        reportlab.Paragraph(
            escape(f"{order.payment_brand} ending in {order.payment_last4}"),
            styles["section_title"],
        ),
        reportlab.Spacer(1, 6),
        reportlab.Paragraph(
            "This invoice is attached automatically after a successful checkout.",
            styles["body"],
        ),
        reportlab.Paragraph(
            f"Invoice total: {escape(format_currency(order.total))}",
            styles["body"],
        ),
    ]

    table = reportlab.Table(
        [[billing_lines, payment_lines]],
        colWidths=[content_width * 0.54, content_width * 0.46],
    )
    table.setStyle(
        reportlab.TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), reportlab.colors.white),
                ("BOX", (0, 0), (-1, -1), 1, reportlab.colors.HexColor("#D9E4F0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, reportlab.colors.HexColor("#E2E8F0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                ("LEFTPADDING", (0, 0), (-1, -1), 16),
                ("RIGHTPADDING", (0, 0), (-1, -1), 16),
            ]
        )
    )
    return table


def build_items_table(
    order: OrderRead,
    content_width: float,
    styles: dict[str, object],
):
    reportlab = get_reportlab()
    rows = [
        [
            reportlab.Paragraph("Item", styles["table_header"]),
            reportlab.Paragraph("Qty", styles["table_header"]),
            reportlab.Paragraph("Unit", styles["table_header"]),
            reportlab.Paragraph("Line total", styles["table_header"]),
        ]
    ]

    for item in order.items:
        item_description = escape(item.product_name)
        if item.product_category:
            item_description = (
                f"{item_description}<br/><font size='8' color='#64748B'>"
                f"{escape(item.product_category)}</font>"
            )

        rows.append(
            [
                reportlab.Paragraph(item_description, styles["table_cell"]),
                reportlab.Paragraph(str(item.quantity), styles["table_cell"]),
                reportlab.Paragraph(
                    format_currency(item.unit_price),
                    styles["table_cell_right"],
                ),
                reportlab.Paragraph(
                    format_currency(item.line_total),
                    styles["table_cell_right"],
                ),
            ]
        )

    table = reportlab.Table(
        rows,
        colWidths=[
            content_width * 0.49,
            content_width * 0.11,
            content_width * 0.20,
            content_width * 0.20,
        ],
        repeatRows=1,
    )
    table.setStyle(
        reportlab.TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), reportlab.colors.HexColor("#EFF6FF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), reportlab.colors.HexColor("#0F172A")),
                ("BOX", (0, 0), (-1, -1), 1, reportlab.colors.HexColor("#D9E4F0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, reportlab.colors.HexColor("#E2E8F0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [
                        reportlab.colors.white,
                        reportlab.colors.HexColor("#F8FAFC"),
                    ],
                ),
            ]
        )
    )
    return table


def build_totals_panel(
    order: OrderRead,
    content_width: float,
    styles: dict[str, object],
):
    reportlab = get_reportlab()
    totals_table = reportlab.Table(
        [
            [
                reportlab.Paragraph("Subtotal", styles["totals_label"]),
                reportlab.Paragraph(format_currency(order.subtotal), styles["totals_value"]),
            ],
            [
                reportlab.Paragraph("Shipping", styles["totals_label"]),
                reportlab.Paragraph(
                    "Free" if Decimal(order.shipping) == Decimal("0.00") else format_currency(order.shipping),
                    styles["totals_value"],
                ),
            ],
            [
                reportlab.Paragraph("Estimated tax", styles["totals_label"]),
                reportlab.Paragraph(format_currency(order.tax), styles["totals_value"]),
            ],
            [
                reportlab.Paragraph("Total", styles["section_title"]),
                reportlab.Paragraph(format_currency(order.total), styles["totals_value_large"]),
            ],
        ],
        colWidths=[content_width * 0.22, content_width * 0.16],
        hAlign="RIGHT",
    )
    totals_table.setStyle(
        reportlab.TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), reportlab.colors.HexColor("#FFFFFF")),
                ("BOX", (0, 0), (-1, -1), 1, reportlab.colors.HexColor("#D9E4F0")),
                ("LINEABOVE", (0, 3), (-1, 3), 1, reportlab.colors.HexColor("#CBD5E1")),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    return reportlab.KeepTogether([totals_table])


def build_footer_note(
    order: OrderRead,
    content_width: float,
    styles: dict[str, object],
):
    reportlab = get_reportlab()
    note = reportlab.Paragraph(
        "Keep this invoice with your records. If you need help with this order, contact SUtore support and reference order "
        f"{escape(order.order_number)}.",
        styles["body"],
    )
    table = reportlab.Table([[note]], colWidths=[content_width])
    table.setStyle(
        reportlab.TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), reportlab.colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 1, reportlab.colors.HexColor("#D9E4F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
            ]
        )
    )
    return table


def draw_page_footer(canvas, doc, order_number: str) -> None:
    reportlab = get_reportlab()
    canvas.saveState()
    canvas.setStrokeColor(reportlab.colors.HexColor("#CBD5E1"))
    canvas.line(
        doc.leftMargin,
        12 * reportlab.mm,
        reportlab.A4[0] - doc.rightMargin,
        12 * reportlab.mm,
    )
    canvas.setFillColor(reportlab.colors.HexColor("#64748B"))
    canvas.setFont("Helvetica", 8)
    canvas.drawString(doc.leftMargin, 8 * reportlab.mm, f"SUtore invoice {order_number}")
    canvas.drawRightString(
        reportlab.A4[0] - doc.rightMargin,
        8 * reportlab.mm,
        f"Page {doc.page}",
    )
    canvas.restoreState()
