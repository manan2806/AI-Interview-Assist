import os
import smtplib

from email.message import EmailMessage


def send_interview_report_email(
    recipient_email,
    recipient_name,
    pdf_path,
    job_role
):
    """
    Send interview report PDF through SMTP.
    """

    # ==========================================
    # SMTP CONFIGURATION
    # ==========================================

    smtp_host = os.getenv(
        "SMTP_HOST",
        "smtp.gmail.com"
    )

    smtp_port = int(
        os.getenv(
            "SMTP_PORT",
            "587"
        )
    )

    smtp_email = os.getenv(
        "SMTP_EMAIL"
    )

    smtp_password = os.getenv(
        "SMTP_PASSWORD"
    )

    # ==========================================
    # VALIDATION
    # ==========================================

    if not smtp_email:

        raise Exception(
            "SMTP_EMAIL is not configured."
        )

    if not smtp_password:

        raise Exception(
            "SMTP_PASSWORD is not configured."
        )

    if not recipient_email:

        raise Exception(
            "Recipient email is missing."
        )

    if not os.path.exists(pdf_path):

        raise Exception(
            "PDF file was not found."
        )

    # ==========================================
    # EMAIL MESSAGE
    # ==========================================

    message = EmailMessage()

    message["Subject"] = (
        f"AI Interview Report - {job_role}"
    )

    message["From"] = smtp_email

    message["To"] = recipient_email

    name = recipient_name or "Candidate"

    message.set_content(
        f"""
Hello {name},

Your AI Interview has been completed successfully.

Please find your complete interview performance report attached as a PDF.

Job Role: {job_role}

The report contains:

- Interview details
- Overall score
- Performance level
- AI analysis
- Strengths
- Weaknesses
- Recommendations
- Technical skill assessment
- Readiness assessment
- Question-wise performance
- Answer evaluation
- AI feedback

Thank you for using AI Interview Assist.

Best Regards,
AI Interview Assist
"""
    )

    # ==========================================
    # READ PDF
    # ==========================================

    with open(
        pdf_path,
        "rb"
    ) as pdf_file:

        pdf_data = pdf_file.read()

    # ==========================================
    # ATTACH PDF
    # ==========================================

    message.add_attachment(
        pdf_data,
        maintype="application",
        subtype="pdf",
        filename="AI_Interview_Report.pdf"
    )

    # ==========================================
    # SEND EMAIL
    # ==========================================

    with smtplib.SMTP(
        smtp_host,
        smtp_port
    ) as server:

        server.starttls()

        server.login(
            smtp_email,
            smtp_password
        )

        server.send_message(
            message
        )

    return True