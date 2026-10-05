import os
import base64
from email.message import EmailMessage
from utils.gmail_service import get_gmail_service


def send_interview_report_email(
    recipient_email,
    recipient_name,
    pdf_path,
    job_role
):

    # VALIDATION
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

    message["To"] = recipient_email

    message["Subject"] = subject

    # ==========================================
    # PLAIN TEXT VERSION
    # ==========================================

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

    # ==========================================
    # HTML VERSION
    # ==========================================

    message.add_alternative(
        html_content,
        subtype="html"
    )

    # ==========================================
    # ATTACH PDF
    # ==========================================

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
            filename=os.path.basename(pdf_path)
        )

    except Exception as error:

        print(
            "❌ PDF Attachment Error:",
            str(error)
        )

        raise Exception(
            f"Unable to attach PDF: {str(error)}"
        )

    # ==========================================
    # GMAIL API SEND
    # ==========================================

    print("==========================================")
    print("📧 Sending interview report using Gmail API...")
    print(f"RECIPIENT EMAIL: {recipient_email}")
    print("PDF FILE:",os.path.basename(pdf_path))
    print(f"PDF SIZE: {len(pdf_data)} bytes")
    print("==========================================")

    try:

        # Get Gmail API service
        gmail_service = get_gmail_service()

        # Convert email to Gmail API format
        encoded_message = (
            base64.urlsafe_b64encode(
                message.as_bytes()
            )
            .decode()
        )

        # Send email
        result = (
            gmail_service
            .users()
            .messages()
            .send(
                userId="me",
                body={
                    "raw": encoded_message
                }
            )
            .execute()
        )

        print(
            "=========================================="
        )

        print(
            "✅ INTERVIEW REPORT EMAIL SENT SUCCESSFULLY"
        )

        print(
            "📨 Gmail Message ID:",
            result.get("id")
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
            "❌ GMAIL API REPORT ERROR:",
            str(error)
        )

        print(
            "=========================================="
        )

        raise Exception(
            f"Gmail API email sending failed: {str(error)}"
        )

def send_problem_report_email(
    sender_name,
    sender_email,
    problem_type,
    subject,
    description
):
    # VALIDATION
    if not sender_email:
        raise Exception("User email is missing.")

    if not subject:
        raise Exception("Problem report subject is missing.")

    if not description:
        raise Exception("Problem report description is missing.")

    # USER DETAILS
    name = sender_name or "User"
    problem = problem_type or "Other"

    # EMAIL DETAILS
    email_subject = (f"AI Interview Assist - Problem Report: {subject}")

    # ==========================================
    # HTML EMAIL
    # ==========================================

    html_content = f"""
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>
        Problem Report
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

        <h3>
            New Problem Report
        </h3>

        <p>
            A user has reported a problem from the
            AI Interview Assist application.
        </p>

        <div
            style="
                margin:25px 0;
                padding:20px;
                background:#f7f3fa;
                border-radius:8px;
            "
        >

            <p>
                <strong>User Name:</strong>
                {name}
            </p>

            <p>
                <strong>User Email:</strong>
                {sender_email}
            </p>

            <p>
                <strong>Problem Type:</strong>
                {problem}
            </p>

            <p>
                <strong>Subject:</strong>
                {subject}
            </p>

        </div>

        <h4>
            Problem Description
        </h4>

        <div
            style="
                padding:18px;
                background:#f8f9fc;
                border-left:4px solid #6366f1;
                border-radius:6px;
                line-height:1.6;
                white-space:pre-wrap;
            "
        >
            {description}
        </div>

        <p
            style="
                margin-top:30px;
                color:#777777;
                font-size:13px;
            "
        >
            This Problem Report was submitted through
            the Help & Support section of AI Interview Assist.
        </p>

        <p
            style="
                margin-top:20px;
                color:#777777;
                font-size:13px;
            "
        >
            You can reply directly to this email to
            contact the user.
        </p>

    </div>

</body>

</html>
"""

    # ==========================================
    # CREATE EMAIL
    # ==========================================
    message = EmailMessage()

    # Problem Report recipient
    message["To"] = "my.project.service78@gmail.com"

    # User email for direct reply
    message["Reply-To"] = sender_email
    message["Subject"] = email_subject

    # ==========================================
    # PLAIN TEXT VERSION
    # ==========================================
    message.set_content(
        f"""
New Problem Report - AI Interview Assist

User Name:
{name}

User Email:
{sender_email}

Problem Type:
{problem}

Subject:
{subject}

Problem Description:
{description}

------------------------------------------

This Problem Report was submitted through
the Help & Support section of AI Interview Assist.

You can reply directly to this email to
contact the user.
"""
    )

    # ==========================================
    # HTML VERSION
    # ==========================================
    message.add_alternative(html_content,subtype="html")

    # GMAIL API SEND
    print("==========================================")
    print("📧 Sending Problem Report using Gmail API...")
    print(f"USER EMAIL: {sender_email}")
    print(f"PROBLEM TYPE: {problem}")
    print(f"SUBJECT: {subject}")
    print("==========================================")

    try:
        # Existing Gmail API service
        gmail_service = get_gmail_service()

        # Convert email to Gmail API format
        encoded_message = (base64.urlsafe_b64encode(message.as_bytes()).decode())

        # Send email
        result = (
            gmail_service
            .users()
            .messages()
            .send(userId="me",body={"raw": encoded_message})
            .execute()
        )
        print("==========================================")
        print("✅ PROBLEM REPORT EMAIL SENT SUCCESSFULLY")
        print("📨 Gmail Message ID:",result.get("id"))
        print("==========================================")
        return True

    except Exception as error:
        print("==========================================")
        print("❌ GMAIL API PROBLEM REPORT ERROR:",str(error))
        raise Exception(f"Gmail API Problem Report failed: {str(error)}")