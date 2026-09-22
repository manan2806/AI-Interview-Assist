from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle
)
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether
)

import os


def generate_interview_pdf(interview, file_path):
    """
    Generate a professional colourful AI Interview Performance Report.
    """

    # ============================================================
    # CREATE REPORT DIRECTORY
    # ============================================================

    directory = os.path.dirname(file_path)

    if directory:
        os.makedirs(directory, exist_ok=True)

    # ============================================================
    # COLORS
    # ============================================================

    PRIMARY = colors.HexColor("#4F46E5")
    PRIMARY_DARK = colors.HexColor("#3730A3")
    PRIMARY_LIGHT = colors.HexColor("#EEF2FF")

    PURPLE = colors.HexColor("#7C3AED")
    PURPLE_LIGHT = colors.HexColor("#F5F3FF")

    GREEN = colors.HexColor("#16A34A")
    GREEN_LIGHT = colors.HexColor("#F0FDF4")

    ORANGE = colors.HexColor("#EA580C")
    ORANGE_LIGHT = colors.HexColor("#FFF7ED")

    RED = colors.HexColor("#DC2626")
    RED_LIGHT = colors.HexColor("#FEF2F2")

    BLUE = colors.HexColor("#2563EB")
    BLUE_LIGHT = colors.HexColor("#EFF6FF")

    DARK = colors.HexColor("#1F2937")
    TEXT = colors.HexColor("#374151")
    MUTED = colors.HexColor("#6B7280")

    BORDER = colors.HexColor("#D1D5DB")
    LIGHT_BG = colors.HexColor("#F9FAFB")
    WHITE = colors.white

    # ============================================================
    # PDF DOCUMENT
    # ============================================================

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm
    )

    # ============================================================
    # STYLES
    # ============================================================

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=WHITE,
        spaceAfter=5
    )

    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#E0E7FF")
    )

    section_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=WHITE,
        spaceAfter=0
    )

    normal_style = ParagraphStyle(
        "ReportNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=TEXT,
        spaceAfter=4
    )

    label_style = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=DARK
    )

    value_style = ParagraphStyle(
        "Value",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=TEXT
    )

    small_style = ParagraphStyle(
        "Small",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=TEXT
    )

    question_style = ParagraphStyle(
        "Question",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=DARK
    )

    score_style = ParagraphStyle(
        "Score",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=WHITE
    )

    analysis_heading_style = ParagraphStyle(
        "AnalysisHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=DARK
    )

    # ============================================================
    # HELPER FUNCTIONS
    # ============================================================

    def safe_text(value, default="-"):
        """
        Convert values safely for ReportLab Paragraph.
        """
        if value is None:
            return default

        text = str(value)

        if not text.strip():
            return default

        # Escape characters that can break ReportLab markup.
        text = (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )

        return text

    def score_number(value):
        """
        Safely convert score to float.
        """
        try:
            return float(value)
        except (TypeError, ValueError):
            return 0.0

    def score_color(score):
        """
        Score color:
        8-10 = green
        6-7.9 = orange
        below 6 = red
        """
        score = score_number(score)

        if score >= 8:
            return GREEN

        if score >= 6:
            return ORANGE

        return RED

    def score_bg(score):
        score = score_number(score)

        if score >= 8:
            return GREEN_LIGHT

        if score >= 6:
            return ORANGE_LIGHT

        return RED_LIGHT

    def section_header(title):
        """
        Purple section heading.
        """

        table = Table(
            [
                [
                    Paragraph(
                        safe_text(title),
                        section_style
                    )
                ]
            ],
            colWidths=[182 * mm]
        )

        table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    PRIMARY
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    10
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    10
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                )
            ])
        )

        return table

    def bullet_list(items, bullet_color=PRIMARY):
        """
        Create a clean bullet list.
        """

        result = []

        if not isinstance(items, list):
            items = [items] if items else []

        if not items:
            result.append(
                Paragraph(
                    "Not available",
                    small_style
                )
            )
            return result

        for item in items:

            bullet_table = Table(
                [
                    [
                        Paragraph(
                            "●",
                            ParagraphStyle(
                                "Bullet",
                                parent=small_style,
                                textColor=bullet_color,
                                fontSize=7
                            )
                        ),
                        Paragraph(
                            safe_text(item),
                            small_style
                        )
                    ]
                ],
                colWidths=[
                    6 * mm,
                    164 * mm
                ]
            )

            bullet_table.setStyle(
                TableStyle([
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP"
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        0
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        0
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        1
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        1
                    )
                ])
            )

            result.append(bullet_table)

        return result

    # ============================================================
    # PAGE HEADER / FOOTER
    # ============================================================

    def draw_page(canvas, doc):
        canvas.saveState()

        width, height = A4

        # Footer line
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.5)

        canvas.line(
            14 * mm,
            11 * mm,
            width - 14 * mm,
            11 * mm
        )

        # Footer left
        canvas.setFont(
            "Helvetica",
            7
        )

        canvas.setFillColor(MUTED)

        canvas.drawString(
            14 * mm,
            6.5 * mm,
            "AI Interview Assist"
        )

        # Footer right
        canvas.drawRightString(
            width - 14 * mm,
            6.5 * mm,
            f"Page {doc.page}"
        )

        canvas.restoreState()

    # ============================================================
    # STORY
    # ============================================================

    story = []

    # ============================================================
    # COVER / TITLE HEADER
    # ============================================================

    header_table = Table(
        [
            [
                Paragraph(
                    "AI Interview Assist",
                    title_style
                )
            ],
            [
                Paragraph(
                    "Interview Performance Report",
                    subtitle_style
                )
            ]
        ],
        colWidths=[182 * mm],
        rowHeights=[18 * mm, 10 * mm]
    )

    header_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                PRIMARY_DARK
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                5
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                5
            )
        ])
    )

    story.append(header_table)
    story.append(Spacer(1, 8))

    # ============================================================
    # INTERVIEW INFORMATION
    # ============================================================

    story.append(
        section_header(
            "Interview Information"
        )
    )

    story.append(Spacer(1, 5))

    interview_id = str(
        interview.get("_id", "")
    )

    interview_info = [
        [
            Paragraph(
                "<b>Interview ID</b>",
                label_style
            ),
            Paragraph(
                safe_text(interview_id),
                value_style
            )
        ],
        [
            Paragraph(
                "<b>Job Role</b>",
                label_style
            ),
            Paragraph(
                safe_text(
                    interview.get(
                        "job_role",
                        "-"
                    )
                ),
                value_style
            )
        ],
        [
            Paragraph(
                "<b>Experience Level</b>",
                label_style
            ),
            Paragraph(
                safe_text(
                    interview.get(
                        "experience_level",
                        "-"
                    )
                ),
                value_style
            )
        ],
        [
            Paragraph(
                "<b>Interview Type</b>",
                label_style
            ),
            Paragraph(
                safe_text(
                    interview.get(
                        "interview_type",
                        "-"
                    )
                ),
                value_style
            )
        ],
        [
            Paragraph(
                "<b>Difficulty</b>",
                label_style
            ),
            Paragraph(
                safe_text(
                    interview.get(
                        "difficulty",
                        "-"
                    )
                ),
                value_style
            )
        ],
        [
            Paragraph(
                "<b>Total Questions</b>",
                label_style
            ),
            Paragraph(
                safe_text(
                    interview.get(
                        "number_of_questions",
                        0
                    )
                ),
                value_style
            )
        ]
    ]

    info_table = Table(
        interview_info,
        colWidths=[
            55 * mm,
            127 * mm
        ]
    )

    info_table.setStyle(
        TableStyle([
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                BORDER
            ),
            (
                "BACKGROUND",
                (0, 0),
                (0, -1),
                PRIMARY_LIGHT
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP"
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                7
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                7
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                6
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                6
            )
        ])
    )

    story.append(info_table)
    story.append(Spacer(1, 10))

    # ============================================================
    # OVERALL PERFORMANCE
    # ============================================================

    overall_result = interview.get(
        "overall_result",
        {}
    )

    overall_score = score_number(
        overall_result.get(
            "overall_score",
            0
        )
    )

    average_score = score_number(
        overall_result.get(
            "average_score",
            0
        )
    )

    total_score = overall_result.get(
        "total_score",
        0
    )

    max_score = overall_result.get(
        "max_score",
        0
    )

    performance_level = safe_text(
        overall_result.get(
            "performance_level",
            "-"
        )
    )

    # ============================================================
    # SCORE HERO CARD
    # ============================================================

    score_table = Table(
        [
            [
                Paragraph(
                    f"{overall_score:.1f}%",
                    ParagraphStyle(
                        "BigScore",
                        parent=score_style,
                        fontSize=26,
                        leading=30
                    )
                ),
                [
                    Paragraph(
                        "<b>OVERALL PERFORMANCE</b>",
                        ParagraphStyle(
                            "ScoreLabel",
                            parent=normal_style,
                            fontSize=9,
                            textColor=colors.HexColor("#E0E7FF")
                        )
                    ),
                    Spacer(1, 3),
                    Paragraph(
                        performance_level,
                        ParagraphStyle(
                            "PerformanceLevel",
                            parent=normal_style,
                            fontName="Helvetica-Bold",
                            fontSize=16,
                            textColor=WHITE
                        )
                    ),
                    Spacer(1, 3),
                    Paragraph(
                        f"Average Score: {average_score:.1f}/10",
                        ParagraphStyle(
                            "Average",
                            parent=normal_style,
                            fontSize=9,
                            textColor=colors.HexColor("#E0E7FF")
                        )
                    )
                ]
            ]
        ],
        colWidths=[
            58 * mm,
            124 * mm
        ],
        rowHeights=[34 * mm]
    )

    score_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (0, 0),
                PRIMARY_DARK
            ),
            (
                "BACKGROUND",
                (1, 0),
                (1, 0),
                PRIMARY
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "ALIGN",
                (0, 0),
                (0, 0),
                "CENTER"
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                8
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                8
            )
        ])
    )

    story.append(
        section_header(
            "Overall Performance"
        )
    )

    story.append(Spacer(1, 5))
    story.append(score_table)
    story.append(Spacer(1, 7))

    # ============================================================
    # SCORE SUMMARY CARDS
    # ============================================================

    summary_cards = Table(
        [
            [
                Paragraph(
                    f"<b>Total Score</b><br/>{safe_text(total_score)} / {safe_text(max_score)}",
                    ParagraphStyle(
                        "Card",
                        parent=normal_style,
                        alignment=TA_CENTER,
                        fontSize=10,
                        leading=15,
                        textColor=DARK
                    )
                ),
                Paragraph(
                    f"<b>Average</b><br/>{average_score:.1f} / 10",
                    ParagraphStyle(
                        "Card2",
                        parent=normal_style,
                        alignment=TA_CENTER,
                        fontSize=10,
                        leading=15,
                        textColor=DARK
                    )
                ),
                Paragraph(
                    f"<b>Percentage</b><br/>{overall_score:.1f}%",
                    ParagraphStyle(
                        "Card3",
                        parent=normal_style,
                        alignment=TA_CENTER,
                        fontSize=10,
                        leading=15,
                        textColor=DARK
                    )
                )
            ]
        ],
        colWidths=[
            60.5 * mm,
            60.5 * mm,
            60.5 * mm
        ],
        rowHeights=[18 * mm]
    )

    summary_cards.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (0, 0),
                BLUE_LIGHT
            ),
            (
                "BACKGROUND",
                (1, 0),
                (1, 0),
                PURPLE_LIGHT
            ),
            (
                "BACKGROUND",
                (2, 0),
                (2, 0),
                GREEN_LIGHT
            ),
            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.5,
                BORDER
            ),
            (
                "INNERGRID",
                (0, 0),
                (-1, -1),
                0.5,
                BORDER
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "ALIGN",
                (0, 0),
                (-1, -1),
                "CENTER"
            )
        ])
    )

    story.append(summary_cards)
    story.append(Spacer(1, 12))

    # ============================================================
    # AI PERFORMANCE ANALYSIS
    # ============================================================

    story.append(
        section_header(
            "AI Performance Analysis"
        )
    )

    story.append(Spacer(1, 6))

    def add_analysis_card(
        title,
        value,
        background,
        title_color=PRIMARY
    ):

        content = []

        content.append(
            Paragraph(
                safe_text(title),
                ParagraphStyle(
                    "AnalysisTitle",
                    parent=analysis_heading_style,
                    textColor=title_color
                )
            )
        )

        content.append(Spacer(1, 3))

        if isinstance(value, list):

            if value:

                content.extend(
                    bullet_list(
                        value,
                        title_color
                    )
                )

            else:

                content.append(
                    Paragraph(
                        "Not available",
                        small_style
                    )
                )

        else:

            content.append(
                Paragraph(
                    safe_text(
                        value,
                        "Not available"
                    ),
                    small_style
                )
            )

        inner = Table(
            [
                [content]
            ],
            colWidths=[174 * mm]
        )

        inner.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    background
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    BORDER
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    9
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    9
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                )
            ])
        )

        story.append(inner)
        story.append(Spacer(1, 5))

    add_analysis_card(
        "Summary",
        overall_result.get(
            "summary",
            ""
        ),
        BLUE_LIGHT,
        BLUE
    )

    add_analysis_card(
        "Strengths",
        overall_result.get(
            "strengths",
            []
        ),
        GREEN_LIGHT,
        GREEN
    )

    add_analysis_card(
        "Weaknesses",
        overall_result.get(
            "weaknesses",
            []
        ),
        RED_LIGHT,
        RED
    )

    add_analysis_card(
        "Recommendations",
        overall_result.get(
            "recommendations",
            []
        ),
        ORANGE_LIGHT,
        ORANGE
    )

    add_analysis_card(
        "Technical Skill Assessment",
        overall_result.get(
            "technical_skill_assessment",
            ""
        ),
        PURPLE_LIGHT,
        PURPLE
    )

    add_analysis_card(
        "Readiness Assessment",
        overall_result.get(
            "readiness_assessment",
            ""
        ),
        PRIMARY_LIGHT,
        PRIMARY
    )

    # ============================================================
    # QUESTIONS DATA
    # ============================================================

    questions = interview.get(
        "questions",
        []
    )

    answers = interview.get(
        "answers",
        []
    )

    evaluations = interview.get(
        "evaluations",
        []
    )

    # ============================================================
    # ANSWER MAP
    # ============================================================

    answer_map = {}

    for answer in answers:

        question_number = answer.get(
            "question_number"
        )

        answer_map[
            question_number
        ] = answer

    # ============================================================
    # EVALUATION MAP
    # ============================================================

    evaluation_map = {}

    for evaluation in evaluations:

        question_number = evaluation.get(
            "question_number"
        )

        evaluation_map[
            question_number
        ] = evaluation

    # ============================================================
    # QUESTION-WISE PERFORMANCE
    # ============================================================

    story.append(PageBreak())

    story.append(
        section_header(
            "Question-wise Performance"
        )
    )

    story.append(Spacer(1, 7))

    for index, question in enumerate(
        questions,
        start=1
    ):

        question_number = question.get(
            "question_number",
            index
        )

        question_text = question.get(
            "question",
            "Question not available"
        )

        answer_data = answer_map.get(
            question_number,
            {}
        )

        evaluation = evaluation_map.get(
            question_number,
            {}
        )

        score = score_number(
            evaluation.get(
                "score",
                0
            )
        )

        current_score_color = score_color(score)
        current_score_bg = score_bg(score)

        # ========================================================
        # QUESTION HEADER
        # ========================================================

        question_header = Table(
            [
                [
                    Paragraph(
                        f"Question {question_number}",
                        ParagraphStyle(
                            "QHeader",
                            parent=normal_style,
                            fontName="Helvetica-Bold",
                            fontSize=11,
                            textColor=WHITE
                        )
                    ),
                    Paragraph(
                        f"{score:.1f}/10",
                        score_style
                    )
                ]
            ],
            colWidths=[
                150 * mm,
                32 * mm
            ],
            rowHeights=[11 * mm]
        )

        question_header.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, 0),
                    PRIMARY_DARK
                ),
                (
                    "BACKGROUND",
                    (1, 0),
                    (1, 0),
                    current_score_color
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE"
                ),
                (
                    "ALIGN",
                    (1, 0),
                    (1, 0),
                    "CENTER"
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                )
            ])
        )

        # ========================================================
        # QUESTION BODY
        # ========================================================

        question_body = []

        question_body.append(
            Paragraph(
                "<b>Question</b>",
                label_style
            )
        )

        question_body.append(
            Paragraph(
                safe_text(question_text),
                normal_style
            )
        )

        question_body.append(
            Spacer(1, 4)
        )

        question_body.append(
            Paragraph(
                "<b>Candidate Answer</b>",
                label_style
            )
        )

        question_body.append(
            Paragraph(
                safe_text(
                    answer_data.get(
                        "answer",
                        "No answer"
                    )
                ),
                normal_style
            )
        )

        question_body.append(
            Spacer(1, 5)
        )

        # ========================================================
        # EVALUATION SUMMARY
        # ========================================================

        evaluation_data = [
            [
                Paragraph(
                    "<b>Correctness</b>",
                    small_style
                ),
                Paragraph(
                    safe_text(
                        evaluation.get(
                            "correctness",
                            "-"
                        )
                    ),
                    small_style
                ),
                Paragraph(
                    "<b>Relevance</b>",
                    small_style
                ),
                Paragraph(
                    safe_text(
                        evaluation.get(
                            "relevance",
                            "-"
                        )
                    ),
                    small_style
                )
            ],
            [
                Paragraph(
                    "<b>Technical Accuracy</b>",
                    small_style
                ),
                Paragraph(
                    safe_text(
                        evaluation.get(
                            "technical_accuracy",
                            "-"
                        )
                    ),
                    small_style
                ),
                Paragraph(
                    "<b>Score</b>",
                    small_style
                ),
                Paragraph(
                    f"{score:.1f}/10",
                    ParagraphStyle(
                        "SmallScore",
                        parent=small_style,
                        fontName="Helvetica-Bold",
                        textColor=current_score_color
                    )
                )
            ]
        ]

        evaluation_table = Table(
            evaluation_data,
            colWidths=[
                32 * mm,
                58 * mm,
                32 * mm,
                50 * mm
            ]
        )

        evaluation_table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    current_score_bg
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    BORDER
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.3,
                    BORDER
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP"
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    5
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    5
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5
                )
            ])
        )

        question_body.append(
            evaluation_table
        )

        question_body.append(
            Spacer(1, 6)
        )

        # ========================================================
        # STRENGTHS
        # ========================================================

        question_body.append(
            Paragraph(
                "Strengths",
                ParagraphStyle(
                    "StrengthTitle",
                    parent=analysis_heading_style,
                    textColor=GREEN
                )
            )
        )

        for item in bullet_list(
            evaluation.get(
                "strengths",
                []
            ),
            GREEN
        ):
            question_body.append(item)

        question_body.append(
            Spacer(1, 4)
        )

        # ========================================================
        # WEAKNESSES
        # ========================================================

        question_body.append(
            Paragraph(
                "Weaknesses",
                ParagraphStyle(
                    "WeaknessTitle",
                    parent=analysis_heading_style,
                    textColor=RED
                )
            )
        )

        for item in bullet_list(
            evaluation.get(
                "weaknesses",
                []
            ),
            RED
        ):
            question_body.append(item)

        question_body.append(
            Spacer(1, 4)
        )

        # ========================================================
        # MISSING CONCEPTS
        # ========================================================

        question_body.append(
            Paragraph(
                "Missing Concepts",
                ParagraphStyle(
                    "MissingTitle",
                    parent=analysis_heading_style,
                    textColor=ORANGE
                )
            )
        )

        missing_concepts = evaluation.get(
            "missing_concepts",
            []
        )

        if missing_concepts:

            for item in bullet_list(
                missing_concepts,
                ORANGE
            ):
                question_body.append(item)

        else:

            question_body.append(
                Paragraph(
                    "None",
                    small_style
                )
            )

        question_body.append(
            Spacer(1, 4)
        )

        # ========================================================
        # AI FEEDBACK
        # ========================================================

        question_body.append(
            Paragraph(
                "AI Feedback",
                ParagraphStyle(
                    "FeedbackTitle",
                    parent=analysis_heading_style,
                    textColor=BLUE
                )
            )
        )

        question_body.append(
            Paragraph(
                safe_text(
                    evaluation.get(
                        "feedback",
                        "Not available"
                    )
                ),
                small_style
            )

        )

        # ========================================================
        # BODY TABLE
        # ========================================================

        body_table = Table(
            [
                [question_body]
            ],
            colWidths=[182 * mm]
        )

        body_table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    LIGHT_BG
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.6,
                    BORDER
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    9
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    9
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                )
            ])
        )

        question_block = Table(
            [
                [question_header],
                [body_table]
            ],
            colWidths=[182 * mm]
        )

        question_block.setStyle(
            TableStyle([
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    0
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    0
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    0
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    0
                )
            ])
        )

        story.append(
            KeepTogether(
                question_block
            )
        )

        story.append(
            Spacer(1, 9)
        )

    # ============================================================
    # FINAL FOOTER MESSAGE
    # ============================================================

    story.append(Spacer(1, 8))

    final_message = Table(
        [
            [
                Paragraph(
                    "<b>AI Interview Assist</b><br/>"
                    "This report was generated based on the "
                    "candidate's interview responses and AI evaluation.",
                    ParagraphStyle(
                        "FinalMessage",
                        parent=small_style,
                        alignment=TA_CENTER,
                        textColor=PRIMARY_DARK,
                        leading=13
                    )
                )
            ]
        ],
        colWidths=[182 * mm]
    )

    final_message.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                PRIMARY_LIGHT
            ),
            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.5,
                PRIMARY
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                8
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                8
            )
        ])
    )

    story.append(final_message)

    # ============================================================
    # BUILD PDF
    # ============================================================

    doc.build(
        story,
        onFirstPage=draw_page,
        onLaterPages=draw_page
    )

    return file_path