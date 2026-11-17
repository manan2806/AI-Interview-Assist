
import React, {
    useEffect,
    useRef,
    useState,
    type ComponentRef,
} from "react";

import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../services/api";

type AuthStackParamList = {
    Home: undefined;
    Login: undefined;
    Register: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, "Home">;

interface Review {
    review_id: string;
    name?: string;
    rating: number;
    comment: string;
}

const menuItems = [
    { label: "Home", value: "home", icon: "⌂" },
    { label: "About", value: "about", icon: "◉" },
    { label: "Features", value: "features", icon: "✦" },
    { label: "How It Works", value: "how-it-works", icon: "↗" },
    { label: "Contact Us", value: "contact", icon: "✉" },
];

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewStats, setReviewStats] = useState({
        total: 0,
        average_rating: 0,
    });
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);

    const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);
    const sectionPositions = useRef<Record<string, number>>({});

    const scrollToSection = (section: string) => {
        setMenuOpen(false);

        if (section === "home") {
            scrollViewRef.current?.scrollTo({
                y: 0,
                animated: true,
            });
            return;
        }

        const position = sectionPositions.current[section];

        if (typeof position === "number") {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, position - 10),
                animated: true,
            });
        }
    };

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await api.get("/api/reviews");
                const data = response.data;

                if (data.success) {
                    setReviews(data.reviews || []);
                    setReviewStats({
                        total: data.total || 0,
                        average_rating: data.average_rating || 0,
                    });
                }
            } catch (error) {
                console.error("Unable to fetch public reviews:", error);
            } finally {
                setReviewsLoading(false);
            }
        };

        fetchReviews();
    }, []);

    const goToLogin = () => navigation.navigate("Login");
    const goToRegister = () => navigation.navigate("Register");

    const openEmail = async () => {
        try {
            await Linking.openURL(
                "mailto:support@aiinterviewassist.com"
            );
        } catch {
            Alert.alert("Unable to open email application.");
        }
    };

    const SectionHeading = ({
        title,
        description,
    }: {
        title: string;
        description: string;
    }) => (
        <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionDescription}>
                {description}
            </Text>
        </View>
    );

    const FeatureCard = ({
        icon,
        title,
        description,
    }: {
        icon: string;
        title: string;
        description: string;
    }) => (
        <View style={styles.featureCard}>
            <View style={styles.featureIconBox}>
                <Text style={styles.featureIcon}>{icon}</Text>
            </View>

            <Text style={styles.cardTitle}>{title}</Text>

            <Text style={styles.cardDescription}>
                {description}
            </Text>
        </View>
    );

    const steps = [
        {
            number: "01",
            title: "Create Your Account",
            description:
                "Register and create your personal interview preparation profile.",
        },
        {
            number: "02",
            title: "Setup Interview",
            description:
                "Select your job role, experience level, interview type and difficulty.",
        },
        {
            number: "03",
            title: "Answer Questions",
            description:
                "Answer AI-generated questions one by one.",
        },
        {
            number: "04",
            title: "Get Your Results",
            description:
                "Receive scores, strengths, weaknesses and improvement recommendations.",
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.container}>

                {/* FIXED NAVBAR */}

                <View style={styles.navbar}>
                    <TouchableOpacity
                        onPress={() => scrollToSection("home")}
                        activeOpacity={0.8}
                        style={styles.logoContainer}
                    >
                        <View style={styles.logoIcon}>
                            <Text style={styles.logoIconText}>AI</Text>
                        </View>

                        <View>
                            <Text style={styles.logoMain}>Interview</Text>
                            <Text style={styles.logoSub}>ASSIST</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.menuButton,
                            menuOpen && styles.menuButtonActive,
                        ]}
                        onPress={() =>
                            setMenuOpen(previous => !previous)
                        }
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={
                            menuOpen ? "Close menu" : "Open menu"
                        }
                    >
                        {menuOpen ? (
                            <Text style={styles.closeIcon}>✕</Text>
                        ) : (
                            <View style={styles.hamburger}>
                                <View style={styles.hamburgerLine} />
                                <View
                                    style={[
                                        styles.hamburgerLine,
                                        styles.hamburgerLineMiddle,
                                    ]}
                                />
                                <View style={styles.hamburgerLine} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* SINGLE NAVIGATION MENU */}

                {menuOpen && (
                    <View style={styles.navMenu}>
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuHeading}>
                                Explore
                            </Text>

                            <Text style={styles.menuSubtitle}>
                                Discover AI Interview Assist
                            </Text>
                        </View>

                        {menuItems.map(item => (
                            <TouchableOpacity
                                key={item.value}
                                style={styles.navMenuItem}
                                activeOpacity={0.7}
                                onPress={() =>
                                    scrollToSection(item.value)
                                }
                            >
                                <View style={styles.navMenuItemLeft}>
                                    <View style={styles.navMenuIconBox}>
                                        <Text style={styles.navMenuIcon}>
                                            {item.icon}
                                        </Text>
                                    </View>

                                    <Text style={styles.navMenuText}>
                                        {item.label}
                                    </Text>
                                </View>

                                <Text style={styles.navMenuArrow}>
                                    ›
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.navMenuDivider} />

                        <TouchableOpacity
                            style={styles.menuLoginButton}
                            activeOpacity={0.8}
                            onPress={() => {
                                setMenuOpen(false);
                                goToLogin();
                            }}
                        >
                            <Text style={styles.menuLoginText}>
                                Login to Your Account
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.navRegisterButton}
                            activeOpacity={0.85}
                            onPress={() => {
                                setMenuOpen(false);
                                goToRegister();
                            }}
                        >
                            <Text style={styles.navRegisterText}>
                                Create Free Account →
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* SCROLLABLE PAGE CONTENT */}

                <ScrollView
                    ref={scrollViewRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >

                    {/* HERO */}

                    <View style={styles.hero}>
                        <View style={styles.heroBadge}>
                            <Text style={styles.heroBadgeText}>
                                ✦ AI POWERED INTERVIEW PREPARATION
                            </Text>
                        </View>

                        <Text style={styles.heroTitle}>
                            Your Potential.
                            {"\n"}
                            <Text style={styles.heroHighlight}>
                                Your Next Big
                                {"\n"}
                                Opportunity.
                            </Text>
                        </Text>

                        <Text style={styles.heroDescription}>
                            Turn interview preparation into your competitive
                            advantage. Practice with AI-generated questions,
                            get personalized feedback and build the confidence
                            to take on your next opportunity.
                        </Text>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={goToRegister}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.primaryButtonText}>
                                Start Practicing ↗
                            </Text>
                        </TouchableOpacity>

                        {/* AI INTERVIEW STUDIO */}

                        <View style={styles.studioCard}>
                            <View style={styles.studioHeader}>
                                <View>
                                    <Text style={styles.studioBrand}>
                                        AI Interview Studio
                                    </Text>

                                    <Text style={styles.studioSubtitle}>
                                        Your personal practice space
                                    </Text>
                                </View>

                                <View style={styles.liveBadge}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveText}>
                                        LIVE
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.studioWelcome}>
                                <Text style={styles.miniLabel}>
                                    YOUR NEXT CHALLENGE
                                </Text>

                                <Text style={styles.studioTitle}>
                                    Ready to shine?
                                </Text>

                                <Text style={styles.cardDescription}>
                                    Every answer takes you one step closer.
                                </Text>
                            </View>

                            <View style={styles.aiPreview}>
                                <Text style={styles.aiPreviewIcon}>✦</Text>

                                <Text style={styles.aiPreviewTitle}>
                                    AI COACH
                                </Text>

                                <Text style={styles.aiPreviewText}>
                                    Practice. Learn. Improve.
                                </Text>
                            </View>

                            <View style={styles.performancePreview}>
                                <Text style={styles.studioBrand}>
                                    Performance Preview
                                </Text>

                                {[
                                    "Communication",
                                    "Confidence",
                                    "Answer Quality",
                                ].map(item => (
                                    <View
                                        key={item}
                                        style={styles.previewRow}
                                    >
                                        <Text style={styles.previewLabel}>
                                            {item}
                                        </Text>

                                        <Text style={styles.previewValue}>
                                            Improve
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* ABOUT */}

                    <View
                        style={styles.section}
                        onLayout={event => {
                            sectionPositions.current.about =
                                event.nativeEvent.layout.y;
                        }}
                    >
                        <SectionHeading
                            title="Your Personal Interview Preparation Assistant"
                            description="Preparing for an interview can be stressful. AI Interview Assist provides a structured environment where you can practice interviews, evaluate your answers and understand the areas that need improvement."
                        />

                        <FeatureCard
                            icon="🎯"
                            title="Targeted Preparation"
                            description="Practice questions based on your selected job role, experience level, interview type and difficulty."
                        />

                        <FeatureCard
                            icon="🧠"
                            title="AI Intelligence"
                            description="Artificial intelligence helps generate relevant questions and analyze your interview answers."
                        />

                        <FeatureCard
                            icon="📈"
                            title="Continuous Improvement"
                            description="Track your performance and identify strengths, weaknesses and areas where you need more preparation."
                        />
                    </View>

                    {/* FEATURES */}

                    <View
                        style={styles.section}
                        onLayout={event => {
                            sectionPositions.current.features =
                                event.nativeEvent.layout.y;
                        }}
                    >
                        <SectionHeading
                            title="Powerful Features"
                            description="Everything you need to make your interview preparation more effective and organized."
                        />

                        <FeatureCard
                            icon="🤖"
                            title="AI Generated Questions"
                            description="Generate questions according to your job role, experience level, interview type and difficulty."
                        />

                        <FeatureCard
                            icon="📝"
                            title="Interactive Interviews"
                            description="Answer questions one by one in a structured interview practice session."
                        />

                        <FeatureCard
                            icon="📊"
                            title="Answer Evaluation"
                            description="Get AI-based analysis of correctness, relevance, technical accuracy and score."
                        />

                        <FeatureCard
                            icon="💪"
                            title="Strengths & Weaknesses"
                            description="Understand what you are doing well and which areas require more preparation."
                        />

                        <FeatureCard
                            icon="💡"
                            title="Personalized Feedback"
                            description="Receive AI-generated recommendations to improve your interview performance."
                        />

                        <FeatureCard
                            icon="📚"
                            title="Interview History"
                            description="Keep track of previous interviews, results and performance."
                        />
                    </View>

                    {/* HOW IT WORKS */}

                    <View
                        style={styles.section}
                        onLayout={event => {
                            sectionPositions.current["how-it-works"] =
                                event.nativeEvent.layout.y;
                        }}
                    >
                        <SectionHeading
                            title="How AI Interview Assist Works"
                            description="Start preparing for your next interview in four simple steps."
                        />

                        {steps.map(step => (
                            <View
                                style={styles.stepCard}
                                key={step.number}
                            >
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>
                                        {step.number}
                                    </Text>
                                </View>

                                <View style={styles.stepContent}>
                                    <Text style={styles.cardTitle}>
                                        {step.title}
                                    </Text>

                                    <Text style={styles.cardDescription}>
                                        {step.description}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* INTERVIEW TYPES */}

                    <View style={styles.section}>
                        <SectionHeading
                            title="Prepare for Different Types of Interviews"
                            description="Prepare for interviews across different careers and professional fields."
                        />

                        <FeatureCard
                            icon="💻"
                            title="IT & Software"
                            description="Software development, web development, databases, networking and cybersecurity."
                        />

                        <FeatureCard
                            icon="🏥"
                            title="Healthcare"
                            description="Nursing, healthcare, medical support and related positions."
                        />

                        <FeatureCard
                            icon="⚙️"
                            title="Engineering"
                            description="Mechanical, civil, chemical, electrical and other engineering roles."
                        />

                        <FeatureCard
                            icon="💼"
                            title="Business & Management"
                            description="HR, management, finance, marketing and business administration."
                        />

                        <FeatureCard
                            icon="🎓"
                            title="Freshers"
                            description="Build confidence and prepare for your first job interview."
                        />

                        <FeatureCard
                            icon="🚀"
                            title="Experienced Professionals"
                            description="Improve your interview performance and prepare for challenging opportunities."
                        />
                    </View>

                    {/* BENEFITS */}

                    <View style={styles.section}>
                        <SectionHeading
                            title="Why Choose AI Interview Assist?"
                            description="Designed to make interview preparation simple, practical and personalized."
                        />

                        <FeatureCard
                            icon="⚡"
                            title="Easy to Use"
                            description="Simple and user-friendly interface for comfortable interview practice."
                        />

                        <FeatureCard
                            icon="🎯"
                            title="Personalized"
                            description="Questions and feedback tailored to your interview requirements."
                        />

                        <FeatureCard
                            icon="📊"
                            title="Data-Driven Results"
                            description="Understand your performance through scores and detailed analysis."
                        />
                    </View>

                    {/* FAQ */}

                    <View style={styles.section}>
                        <SectionHeading
                            title="Frequently Asked Questions"
                            description="Some common questions about the platform."
                        />

                        <FeatureCard
                            icon="❓"
                            title="Can I practice different job roles?"
                            description="Yes. Select different job roles while setting up your interview."
                        />

                        <FeatureCard
                            icon="🎓"
                            title="Can freshers use the platform?"
                            description="Yes. The platform is suitable for freshers and experienced professionals."
                        />

                        <FeatureCard
                            icon="🤖"
                            title="How are answers evaluated?"
                            description="AI analyzes your answers and provides scores, strengths, weaknesses and improvement feedback."
                        />

                        <FeatureCard
                            icon="📚"
                            title="Can I view previous interviews?"
                            description="Yes. Previous interview sessions are available through Interview History after login."
                        />
                    </View>

                    {/* REVIEWS */}

                    <View style={styles.section}>
                        <SectionHeading
                            title="What Our Users Say"
                            description="Discover how AI Interview Assist helps users practice, improve and prepare for interviews."
                        />

                        {reviewsLoading ? (
                            <ActivityIndicator
                                size="large"
                                color="#2563EB"
                                style={styles.loader}
                            />
                        ) : reviews.length > 0 ? (
                            <>
                                <View style={styles.reviewSummary}>
                                    <Text style={styles.reviewAverage}>
                                        {Number(
                                            reviewStats.average_rating
                                        ).toFixed(1)} / 5
                                    </Text>

                                    <Text style={styles.stars}>
                                        ★★★★★
                                    </Text>

                                    <Text style={styles.cardDescription}>
                                        Based on {reviewStats.total} approved reviews
                                    </Text>
                                </View>

                                {reviews.slice(0, 6).map(review => {
                                    const rating = Math.max(
                                        0,
                                        Math.min(
                                            5,
                                            Number(review.rating) || 0
                                        )
                                    );

                                    return (
                                        <View
                                            style={styles.reviewCard}
                                            key={review.review_id}
                                        >
                                            <Text style={styles.stars}>
                                                {"★".repeat(rating)}
                                                {"☆".repeat(5 - rating)}
                                            </Text>

                                            <Text style={styles.reviewComment}>
                                                “{review.comment}”
                                            </Text>

                                            <Text style={styles.reviewName}>
                                                {review.name || "User"}
                                            </Text>

                                            <Text style={styles.verified}>
                                                ✓ Verified Platform Review
                                            </Text>
                                        </View>
                                    );
                                })}

                                {reviewStats.total > 6 && (
                                    <Text style={styles.reviewCount}>
                                        Showing 6 of {reviewStats.total} approved reviews.
                                    </Text>
                                )}
                            </>
                        ) : (
                            <View style={styles.reviewCard}>
                                <Text style={styles.cardTitle}>
                                    Be the First to Share Your Experience!
                                </Text>

                                <Text style={styles.cardDescription}>
                                    Your feedback can help others prepare for their next interview.
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={goToLogin}
                        >
                            <Text style={styles.primaryButtonText}>
                                Login to Write a Review ↗
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* CONTACT */}

                    <View
                        style={styles.section}
                        onLayout={event => {
                            sectionPositions.current.contact =
                                event.nativeEvent.layout.y;
                        }}
                    >
                        <SectionHeading
                            title="Contact Us"
                            description="Have a question, suggestion or feedback? We would love to hear from you."
                        />

                        <View style={styles.contactCard}>
                            <Text style={styles.cardTitle}>
                                Get In Touch
                            </Text>

                            <Text style={styles.cardDescription}>
                                Our support team is here to help with your account,
                                interviews and results.
                            </Text>

                            <Text style={styles.contactLabel}>
                                📧 Email
                            </Text>

                            <TouchableOpacity onPress={openEmail}>
                                <Text style={styles.email}>
                                    support@aiinterviewassist.com
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.contactLabel}>
                                💬 Support
                            </Text>

                            <Text style={styles.cardDescription}>
                                Get assistance with your account, interviews and results.
                            </Text>

                            <Text style={styles.contactLabel}>
                                ⏰ Support Hours
                            </Text>

                            <Text style={styles.cardDescription}>
                                Monday – Friday{"\n"}
                                9:00 AM – 6:00 PM
                            </Text>
                        </View>
                    </View>

                    {/* FOOTER */}

                    <View style={styles.footer}>
                        <View style={styles.footerLogoBox}>
                            <Text style={styles.footerLogo}>
                                AI Interview Assist
                            </Text>
                        </View>

                        <Text style={styles.footerDescription}>
                            Smart interview preparation powered by AI.
                        </Text>

                        <Text style={styles.footerTagline}>
                            Practice • Analyze • Improve • Succeed
                        </Text>

                        <View style={styles.footerLinks}>
                            <TouchableOpacity onPress={goToLogin}>
                                <Text style={styles.footerLink}>
                                    Login
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={goToRegister}>
                                <Text style={styles.footerLink}>
                                    Register
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.copyright}>
                            © {new Date().getFullYear()} AI Interview Assist.
                            All rights reserved.
                        </Text>
                    </View>

                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    scrollContent: {
        paddingBottom: 20,
    },

    // NAVBAR

    navbar: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 18,
        paddingVertical: 13,
        minHeight: 76,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        elevation: 5,
        zIndex: 20,
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    logoIcon: {
        width: 43,
        height: 43,
        borderRadius: 12,
        backgroundColor: "#6366F1",
        alignItems: "center",
        justifyContent: "center",
    },
    logoIconText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "900",
    },
    logoMain: {
        color: "#312E81",
        fontSize: 16,
        fontWeight: "900",
    },
    logoSub: {
        color: "#818CF8",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 2,
        marginTop: 2,
    },
    menuButton: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: "#EEF2FF",
        borderWidth: 1,
        borderColor: "#C7D2FE",
        alignItems: "center",
        justifyContent: "center",
    },
    menuButtonActive: {
        backgroundColor: "#E0E7FF",
    },
    hamburger: {
        width: 23,
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
    },
    hamburgerLine: {
        width: 22,
        height: 2.5,
        borderRadius: 5,
        backgroundColor: "#4338CA",
    },
    hamburgerLineMiddle: {
        width: 15,
        alignSelf: "flex-end",
    },
    closeIcon: {
        color: "#4338CA",
        fontSize: 23,
        fontWeight: "700",
    },

    // MENU
    navMenu: {
        backgroundColor: "#FFFFFF",
        width: 360,
        alignSelf: "flex-end",
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        elevation: 8,
        zIndex: 15,
    },
    menuHeader: {
        marginBottom: 13,
    },
    menuHeading: {
        color: "#312E81",
        fontSize: 20,
        fontWeight: "900",
    },
    menuSubtitle: {
        color: "#94A3B8",
        fontSize: 12,
        marginTop: 4,
    },
    navMenuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    navMenuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
    },
    navMenuIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#EEF2FF",
        alignItems: "center",
        justifyContent: "center",
    },
    navMenuIcon: {
        color: "#6366F1",
        fontSize: 19,
        fontWeight: "800",
    },
    navMenuText: {
        color: "#334155",
        fontSize: 14,
        fontWeight: "700",
    },
    navMenuArrow: {
        color: "#94A3B8",
        fontSize: 25,
    },
    navMenuDivider: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginVertical: 16,
    },
    menuLoginButton: {
        backgroundColor: "#EEF2FF",
        paddingVertical: 14,
        borderRadius: 11,
        alignItems: "center",
        marginBottom: 10,
    },
    menuLoginText: {
        color: "#4338CA",
        fontSize: 14,
        fontWeight: "800",
    },
    navRegisterButton: {
        backgroundColor: "#6366F1",
        paddingVertical: 15,
        borderRadius: 11,
        alignItems: "center",
        elevation: 2,
    },
    navRegisterText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
    },

    // HERO

    hero: {
        padding: 20,
        paddingTop: 38,
        paddingBottom: 28,
        backgroundColor: "#EFF6FF",
    },
    heroBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#DBEAFE",
        paddingHorizontal: 11,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 21,
    },
    heroBadgeText: {
        color: "#1D4ED8",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.4,
    },
    heroTitle: {
        fontSize: 36,
        lineHeight: 45,
        fontWeight: "900",
        color: "#1E1B4B",
    },
    heroHighlight: {
        color: "#7C3AED",
    },
    heroDescription: {
        color: "#475569",
        fontSize: 14,
        lineHeight: 23,
        marginTop: 17,
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: "#6366F1",
        padding: 16,
        borderRadius: 11,
        alignItems: "center",
        marginTop: 12,
        elevation: 3,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontWeight: "800",
        fontSize: 15,
    },

    // STUDIO

    studioCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: "#DDD6FE",
        elevation: 3,
    },
    studioHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#E9D5FF",
        paddingBottom: 14,
    },
    studioBrand: {
        fontSize: 16,
        fontWeight: "800",
        color: "#312E81",
    },
    studioSubtitle: {
        fontSize: 11,
        color: "#64748B",
        marginTop: 4,
    },
    liveBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 5,
    },
    liveDot: {
        width: 7,
        height: 7,
        backgroundColor: "#16A34A",
        borderRadius: 5,
    },
    liveText: {
        color: "#15803D",
        fontWeight: "900",
        fontSize: 10,
    },
    studioWelcome: {
        paddingVertical: 21,
    },
    miniLabel: {
        fontSize: 10,
        fontWeight: "800",
        color: "#8B5CF6",
        letterSpacing: 1,
    },
    studioTitle: {
        color: "#312E81",
        fontSize: 23,
        fontWeight: "800",
        marginVertical: 7,
    },
    aiPreview: {
        backgroundColor: "#F3E8FF",
        padding: 21,
        borderRadius: 14,
        alignItems: "center",
    },
    aiPreviewIcon: {
        fontSize: 42,
        color: "#9333EA",
    },
    aiPreviewTitle: {
        color: "#7E22CE",
        fontSize: 13,
        fontWeight: "900",
        marginTop: 6,
    },
    aiPreviewText: {
        color: "#64748B",
        marginTop: 5,
        fontSize: 12,
    },
    performancePreview: {
        backgroundColor: "#F0FDFA",
        padding: 14,
        borderRadius: 12,
        marginTop: 14,
    },
    previewRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 13,
    },
    previewLabel: {
        color: "#475569",
        fontSize: 13,
    },
    previewValue: {
        color: "#0D9488",
        fontSize: 12,
        fontWeight: "700",
    },

    // SECTIONS

    section: {
        paddingHorizontal: 18,
        paddingTop: 37,
    },
    sectionHeading: {
        marginBottom: 19,
    },
    sectionTitle: {
        fontSize: 24,
        lineHeight: 32,
        fontWeight: "900",
        color: "#312E81",
        marginBottom: 10,
    },
    sectionDescription: {
        fontSize: 14,
        lineHeight: 22,
        color: "#64748B",
    },

    // FEATURE CARDS

    featureCard: {
        backgroundColor: "#FFFFFF",
        padding: 19,
        borderRadius: 15,
        marginBottom: 13,
        borderWidth: 1,
        borderColor: "#FBCFE8",
        elevation: 2,
    },
    featureIconBox: {
        width: 49,
        height: 49,
        borderRadius: 13,
        backgroundColor: "#FCE7F3",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    featureIcon: {
        fontSize: 26,
    },
    cardTitle: {
        color: "#312E81",
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 7,
    },
    cardDescription: {
        color: "#64748B",
        fontSize: 13,
        lineHeight: 21,
    },

    // STEPS

    stepCard: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#BBF7D0",
        elevation: 1,
    },
    stepNumber: {
        width: 45,
        height: 45,
        borderRadius: 13,
        backgroundColor: "#DCFCE7",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 13,
    },
    stepNumberText: {
        color: "#15803D",
        fontSize: 15,
        fontWeight: "900",
    },
    stepContent: {
        flex: 1,
    },

    // REVIEWS

    loader: {
        marginVertical: 25,
    },
    reviewSummary: {
        alignItems: "center",
        backgroundColor: "#FFFBEB",
        padding: 21,
        borderRadius: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#FDE68A",
    },
    reviewAverage: {
        fontSize: 30,
        fontWeight: "900",
        color: "#92400E",
    },
    stars: {
        color: "#F59E0B",
        fontSize: 20,
        marginVertical: 7,
    },
    reviewCard: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#FDE68A",
        borderRadius: 14,
        padding: 17,
        marginBottom: 12,
    },
    reviewComment: {
        color: "#475569",
        fontSize: 14,
        lineHeight: 22,
        marginVertical: 9,
    },
    reviewName: {
        color: "#312E81",
        fontWeight: "800",
        marginTop: 7,
    },
    verified: {
        color: "#16A34A",
        fontSize: 11,
        marginTop: 5,
        fontWeight: "600",
    },
    reviewCount: {
        color: "#64748B",
        fontSize: 12,
        marginVertical: 8,
    },

    // CONTACT

    contactCard: {
        backgroundColor: "#ECFEFF",
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#A5F3FC",
    },
    contactLabel: {
        fontWeight: "800",
        color: "#155E75",
        marginTop: 19,
        marginBottom: 7,
    },
    email: {
        color: "#0891B2",
        fontSize: 14,
        fontWeight: "600",
        textDecorationLine: "underline",
    },

    // FOOTER

    footer: {
        backgroundColor: "#312E81",
        padding: 26,
        marginTop: 38,
        alignItems: "center",
    },
    footerLogoBox: {
        marginBottom: 10,
    },
    footerLogo: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "900",
    },
    footerDescription: {
        color: "#E0E7FF",
        fontSize: 12,
        marginTop: 6,
        textAlign: "center",
    },
    footerTagline: {
        color: "#C4B5FD",
        fontSize: 12,
        marginTop: 10,
        fontWeight: "700",
    },
    footerLinks: {
        flexDirection: "row",
        gap: 30,
        marginVertical: 22,
    },
    footerLink: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
    },
    copyright: {
        color: "#C7D2FE",
        fontSize: 11,
        textAlign: "center",
        lineHeight: 18,
    },
});

export default HomeScreen;
