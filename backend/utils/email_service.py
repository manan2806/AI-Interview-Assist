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
    Send interview report PDF through Gmail SMTP.
    """

    # GMAIL SMTP CONFIGURATION
    sender_email = os.getenv(
        "MAIL_EMAIL"
    )

    sender_password = os.getenv(
        "MAIL_PASSWORD"
    )

    smtp_server = os.getenv(
        "MAIL_SERVER",
        "smtp.gmail.com"
    )

    smtp_port = int(
        os.getenv(
            "MAIL_PORT",
            "587"
        )
    )

    # VALIDATION
    if not sender_email:
        raise Exception(
            "MAIL_EMAIL is not configured."
        )

    if not sender_password:
        raise Exception(
            "MAIL_PASSWORD is not configured."
        )

    if not recipient_email:
        raise Exception(
            "Recipient email is missing."
        )

    if not pdf_path:
        raise Exception(
            "PDF path is missing."
        )

    if not os.path.exists(pdf_path):
        raise Exception(
            "PDF file was not found."
        )

    # EMAIL DETAILS
    name = recipient_name or "Candidate"

    subject = (
        f"AI Interview Report - {job_role}"
    )

    # ==========================================
    # HTML EMAIL
    # ==========================================
    html_content = f"""
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>
        AI Interview Report
    </title>

</head>

<body
    style="
        margin:0;
        padding:0;
        background:#f5f5f5;
        font-family:Arial,Helvetica,sans-serif;
    "
>

    <div
        style="
            max-width:650px;
            margin:30px auto;
            background:#ffffff;
            padding:35px;
            border-radius:12px;
            box-sizing:border-box;
        "
    >

        <h2
            style="
                margin-top:0;
                color:#4a148c;
            "
        >
            AI Interview Assist
        </h2>

        <p>
            Hello <strong>{name}</strong>,
        </p>

        <p>
            Your AI Interview has been completed successfully.
        </p>

        <p>
            Please find your complete interview performance
            report attached as a PDF.
        </p>

        <div
            style="
                margin:25px 0;
                padding:20px;
                background:#f7f3fa;
                border-radius:8px;
            "
        >

            <p style="margin-top:0;">

                <strong>
                    Job Role:
                </strong>

                {job_role}

            </p>

            <p style="margin-bottom:0;">

                <strong>
                    📎 Interview Performance Report
                </strong>

            </p>

        </div>

        <p>
            The report contains:
        </p>

        <ul>

            <li>
                Interview details
            </li>

            <li>
                Overall score
            </li>

            <li>
                Performance level
            </li>

            <li>
                AI analysis
            </li>

            <li>
                Strengths
            </li>

            <li>
                Weaknesses
            </li>

            <li>
                Recommendations
            </li>

            <li>
                Technical skill assessment
            </li>

            <li>
                Readiness assessment
            </li>

            <li>
                Question-wise performance
            </li>

            <li>
                Answer evaluation
            </li>

            <li>
                AI feedback
            </li>

        </ul>

        <p>
            Thank you for using
            <strong>
                AI Interview Assist
            </strong>.
        </p>

        <p>

            Best Regards,<br>

            <strong>
                AI Interview Assist
            </strong>

        </p>

    </div>

</body>

</html>
"""

    # ==========================================
    # CREATE EMAIL
    # ==========================================

    message = EmailMessage()

    message["Subject"] = subject

    message["From"] = sender_email

    message["To"] = recipient_email

    # PLAIN TEXT VERSION
    message.set_content(
        f"""
Hello {name},

Your AI Interview has been completed successfully.

Please find your complete interview performance
report attached as a PDF.

Job Role:
{job_role}

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

    # HTML VERSION
    message.add_alternative(
        html_content,
        subtype="html"
    )

    # ATTACH PDF
    try:

        with open(
            pdf_path,
            "rb"
        ) as pdf_file:

            pdf_data = pdf_file.read()

        message.add_attachment(
            pdf_data,
            maintype="application",
            subtype="pdf",
            filename="AI_Interview_Report.pdf"
        )

    except Exception as error:

        print(
            "❌ PDF Attachment Error:",
            str(error)
        )

        raise Exception(
            f"Unable to attach PDF: {str(error)}"
        )

    # SEND EMAIL
    print(
        "=========================================="
    )

    print(
        "📧 Sending interview report using Gmail SMTP..."
    )

    print(
        f"RECIPIENT EMAIL: {recipient_email}"
    )

    print(
        f"SENDER EMAIL: {sender_email}"
    )

    print(
        "PDF FILE: AI_Interview_Report.pdf"
    )

    print(
        f"PDF SIZE: {len(pdf_data)} bytes"
    )

    print(
        f"SMTP SERVER: {smtp_server}"
    )

    print(
        f"SMTP PORT: {smtp_port}"
    )

    print(
        "=========================================="
    )

    try:

        with smtplib.SMTP(
            smtp_server,
            smtp_port
        ) as server:

            server.ehlo()

            server.starttls()

            server.ehlo()

            server.login(
                sender_email,
                sender_password
            )

            server.send_message(
                message
            )

        print(
            "=========================================="
        )

        print(
            "✅ INTERVIEW REPORT EMAIL SENT SUCCESSFULLY"
        )

        print(
            "=========================================="
        )

        return True

    except Exception as error:

        print(
            "=========================================="
        )

        print(
            "❌ GMAIL SMTP REPORT ERROR:",
            str(error)
        )

        print(
            "=========================================="
        )

        raise Exception(
            f"Gmail SMTP email sending failed: {str(error)}"
        )