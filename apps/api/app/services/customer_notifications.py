from __future__ import annotations

import logging
from decimal import Decimal
from email.message import EmailMessage
from email.utils import formataddr

from app.core.config import settings
from app.services.invoices import format_currency, send_email_message

logger = logging.getLogger(__name__)


def _base_message(subject: str, recipient_email: str) -> EmailMessage:
    sender_email = (settings.mail_from_email or "").strip()
    sender_name = settings.mail_from_name.strip() or "SUtore"

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr((sender_name, sender_email))
    message["To"] = recipient_email
    return message


def send_discount_notification_email(
    *,
    recipient_email: str,
    product_name: str,
    discount_rate: Decimal,
    old_price: Decimal,
    new_price: Decimal,
) -> bool:
    if not settings.email_enabled:
        logger.info("Skipping discount email to %s because SMTP is not configured.", recipient_email)
        return False

    message = _base_message(
        subject=f"SUtore wishlist discount: {product_name}",
        recipient_email=recipient_email,
    )
    message.set_content(
        "\n".join(
            [
                "Hello,",
                "",
                f"A product on your SUtore wishlist is now {discount_rate:g}% off:",
                product_name,
                "",
                f"Previous price: {format_currency(old_price)}",
                f"New price: {format_currency(new_price)}",
                "",
                "Sign in to SUtore to review your wishlist.",
                "",
                "SUtore Sales Team",
            ]
        )
    )
    send_email_message(message)
    logger.info("Sent discount email for %s to %s.", product_name, recipient_email)
    return True


def send_refund_approved_email(
    *,
    recipient_email: str,
    order_number: str,
    total: Decimal,
    product_names: list[str],
) -> bool:
    if not settings.email_enabled:
        logger.info("Skipping refund approval email to %s because SMTP is not configured.", recipient_email)
        return False

    message = _base_message(
        subject=f"SUtore refund approved for order {order_number}",
        recipient_email=recipient_email,
    )
    product_label = ", ".join(product_names) if product_names else "your returned item"
    message.set_content(
        "\n".join(
            [
                "Hello,",
                "",
                f"Your refund request for order {order_number} has been approved.",
                f"Item(s): {product_label}",
                f"Refund amount: {format_currency(total)}",
                "",
                "The product stock has been updated in SUtore.",
                "",
                "SUtore Sales Team",
            ]
        )
    )
    send_email_message(message)
    logger.info("Sent refund approval email for order %s to %s.", order_number, recipient_email)
    return True
