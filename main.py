import os
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv; load_dotenv() #1. import load_dotenv
from google import genai
import uvicorn
#from pathlib import Path

# 2. Load environment
load_dotenv() # Load environment 

app = FastAPI()

# Configure allowed origins
origins = [
    "https://virtue.co-id.id/info",  # Replace with you actual URL
    "http://localhost:8000",         # Useful if you test your frontend locally
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

# 3. Access the key using os.environ.get("GEMINI")
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")
#print("API Key loaded:", bool(os.getenv("GEMINI_API_KEY")))

# Initialize Google GenAI client (picks up GEMINI_API_KEY from environment variables)
client = genai.Client(api_key=api_key)

# Load catalog
#BASE_DIR = Path(__file__).resolve().parent
#csv_path = BASE_DIR / "frames_catalog.csv"

try:
    catalog_df = pd.read_csv("frames_catalog.csv")
except Exception:
    catalog_df = pd.DataFrame()

class ChatRequest(BaseModel):
    message: str

def search_catalog(query: str) -> str:
    if catalog_df.empty:
        return "No product catalog available."
    query_lower = query.lower()
    match_mask = catalog_df.apply(lambda row: row.astype(str).str.lower().str.contains(query_lower).any(), axis=1)
    matched_rows = catalog_df[match_mask]
    if matched_rows.empty:
        matched_rows = catalog_df.head(5)
    return matched_rows.to_string(index=False)

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    
    try:
        # 1. PRint
        print(f"Received message to process: {request.message}")

        product_context = search_catalog(request.message)

        system_prompt = f"""
        You are an expert customer service assistant for an online frame store. 
        Here is the relevant product inventory data from our store database:
        {product_context}

        RULES:

        - Use ONLY the product details provided above to answer questions about stock, pricing, and sizes.
        - If a customer asks for something not in the inventory, politely offer the closest alternative from the list.
        - Keep answers concise and helpful.
        
        OUTPUT FORMATTING RULES:

        - Use actual line breaks between sections.
        - Never display escaped newline characters such as \n.
        - Use simple plain text formatting.
        - Keep headings and paragraphs clearly separated.
        - Use bullet points for key findings.
        """

        # Combine system prompt and user message for Gemini
        full_prompt = f"{system_prompt}\n\nCustomer Message: {request.message}"

        response = client.models.generate_content(
            model='gemini-3.5-flash', # Fast, high-performing, and free-tier friendly
            contents=full_prompt,
        )

        return {"reply": response.text}
#        return {"test": "Test backend."}

    except Exception as e:
        print("---Crash Detected---")
#        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


