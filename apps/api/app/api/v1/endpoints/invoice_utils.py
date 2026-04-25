from fastapi import Response


def invoice_pdf_response(pdf_bytes: bytes, filename: str) -> Response:
    safe_filename = filename.replace('"', "")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'},
    )
