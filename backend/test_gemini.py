import os

from dotenv import load_dotenv
from google import genai


load_dotenv()


api_key = os.getenv("GEMINI_API_KEY")


if not api_key:
    print("❌ GEMINI_API_KEY not found in .env")
    exit()


client = genai.Client(
    api_key=api_key
)


print("🔄 Testing Gemini API...")


try:

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents="Say hello in one short sentence."
    )

    print("✅ Gemini API Working!")
    print("Response:")
    print(response.text)


except Exception as e:

    print("❌ Gemini API Error:")
    print(e)