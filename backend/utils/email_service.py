import os
import base64
import resend


def send_interview_report_email(
    recipient_email,
    recipient_name,
    pdf_path,
    job_role
):
    """Send interview report PDF through Resend API."""

    resend_api_key = os.getenv("RESEND_API_KEY")
    sender_email = os.getenv(
        "RESEND_FROM_EMAIL",
        "onboarding@resend.dev"
    )

    if not resend_api_key:
        raise Exception("RESEND_API_KEY is not configured.")

    if not recipient_email:
        raise Exception("Recipient email is missing.")

    if not pdf_path:
        raise Exception("PDF path is missing.")

    if not os.path.exists(pdf_path):
        raise Exception("PDF file was not found.")

    resend.api_key = resend_api_key

    name = recipient_name or "Candidate"
    subject = f"AI Interview Report - {job_role}"

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI Interview Report</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:650px;margin:30px auto;background:#ffffff;padding:35px;border-radius:12px;box-sizing:border-box;">
        <h2 style="margin-top:0;color:#4a148c;">AI Interview Assist</h2>

        <p>Hello <strong>{name}</strong>,</p>

        <p>Your AI Interview has been completed successfully.</p>

        <p>
            Please find your complete interview performance report
            attached as a PDF.
        </p>

        <div style="margin:25px 0;padding:20px;background:#f7f3fa;border-radius:8px;">
            <p style="margin-top:0;">
                <strong>Job Role:</strong> {job_role}
            </p>
            <p style="margin-bottom:0;">
                <strong>📎 Interview Performance Report</strong>
            </p>
        </div>

        <p>The report contains:</p>

        <ul>
            <li>Interview details</li>
            <li>Overall score</li>
            <li>Performance level</li>
            <li>AI analysis</li>
            <li>Strengths</li>
            <li>Weaknesses</li>
            <li>Recommendations</li>
            <li>Technical skill assessment</li>
            <li>Readiness assessment</li>
            <li>Question-wise performance</li>
            <li>Answer evaluation</li>
            <li>AI feedback</li>
        </ul>

        <p>
            Thank you for using <strong>AI Interview Assist</strong>.
        </p>

        <p>
            Best Regards,<br>
            <strong>AI Interview Assist</strong>
        </p>
    </div>
</body>
</html>
"""

    try:
        with open(pdf_path, "rb") as pdf_file:
            pdf_data = pdf_file.read()
    except Exception as error:
        print("❌ PDF Read Error:", str(error))
        raise Exception(f"Unable to read PDF file: {str(error)}")

    try:
        pdf_base64 = base64.b64encode(pdf_data).decode("utf-8")
    except Exception as error:
        print("❌ PDF Base64 Conversion Error:", str(error))
        raise Exception(f"Unable to encode PDF: {str(error)}")

    pdf_file_name = "AI_Interview_Report.pdf"

    print("==========================================")
    print("📧 Sending interview report using Resend API...")
    print(f"RECIPIENT EMAIL: {recipient_email}")
    print(f"SENDER EMAIL: {sender_email}")
    print(f"PDF FILE: {pdf_file_name}")
    print(f"PDF SIZE: {len(pdf_data)} bytes")
    print("==========================================")

    try:
        response = resend.Emails.send({
            "from": sender_email,
            "to": [recipient_email],
            "subject": subject,
            "html": html_content,
            "attachments": [
                {
                    "filename": pdf_file_name,
                    "content": pdf_base64
                }
            ]
        })

        print("==========================================")
        print("✅ INTERVIEW REPORT EMAIL SENT")
        print("RESEND RESPONSE:", response)
        print("==========================================")

        return True

    except Exception as error:
        print("==========================================")
        print("❌ RESEND EMAIL ERROR:", str(error))
        print("==========================================")
        raise Exception(
            f"Resend email sending failed: {str(error)}"
        )
