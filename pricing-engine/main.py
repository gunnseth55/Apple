import os
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd

# The attribute name MUST be "app" so `uvicorn main:app` can find it
app = FastAPI(title="Mandi Price Intelligence Service")

model_low = None
model_median = None
model_high = None

# Load models if they exist in the current folder
try:
    if os.path.exists("model_q10.joblib"):
        model_low = joblib.load("model_q10.joblib")
        model_median = joblib.load("model_q50.joblib")
        model_high = joblib.load("model_q90.joblib")
        print("✅ Quantile regression models loaded successfully!")
    else:
        print("⚠️ Warning: .joblib files not found. Did you run `python train.py`?")
except Exception as e:
    print(f"❌ Error loading model files: {e}")

class PricePredictionRequest(BaseModel):
    district: str
    variety: str
    month: Optional[int] = None
    arrivals_quintal: Optional[float] = 250.0

@app.get("/")
def read_root():
    return {"status": "running", "service": "Mandi Price Intelligence Engine"}

@app.post("/predict")
def predict_price(payload: PricePredictionRequest):
    if not model_low or not model_median or not model_high:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded into memory. Please run `python train.py` first."
        )

    current_month = payload.month or datetime.now().month

    input_df = pd.DataFrame([{
        "district": payload.district,
        "variety": payload.variety,
        "month": current_month,
        "arrivals_quintal": payload.arrivals_quintal
    }])

    try:
        min_pred = float(model_low.predict(input_df)[0])
        med_pred = float(model_median.predict(input_df)[0])
        max_pred = float(model_high.predict(input_df)[0])

        return {
            "variety": payload.variety,
            "district": payload.district,
            "month": current_month,
            "prediction": {
                "suggestedMinPrice": round(min_pred, 1),
                "expectedMedianPrice": round(med_pred, 1),
                "suggestedMaxPrice": round(max_pred, 1),
                "confidenceInterval": "80%"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))