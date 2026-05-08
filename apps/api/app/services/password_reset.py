from email.message import EmailMessage
from email.utils import formataddr
from urllib.parse import urlencode

from app.core.config import settings
from app.services.invoices import send_email_message


def build_password_reset_url(token: str) -> str:
    frontend_base_url = settings.frontend_base_url.rstrip("/")
    query = urlencode({"token": token})
    return f"{frontend_base_url}/reset-password?{query}"


def send_password_reset_email(email: str, token: str) -> bool:
    if not settings.email_enabled:
        return False

    reset_url = build_password_reset_url(token)
    sender_email = (settings.mail_from_email or "").strip()
    sender_name = settings.password_reset_mail_from_name.strip() or "SUtore Support"

    message = EmailMessage()
    message["Subject"] = "Reset your SUtore password"
    message["From"] = formataddr((sender_name, sender_email))
    message["To"] = email
    message.set_content(
        "\n".join(
            [
                "Hello,",
                "",
                "We received a request to reset the password for your SUtore account.",
                f"Open this link to choose a new password: {reset_url}",
                "",
                f"This link expires in {settings.password_reset_token_minutes} minutes.",
                "If you did not request this, you can ignore this email.",
                "",
                "SUtore Support",
            ]
        )
    )

    send_email_message(message)
    return True
