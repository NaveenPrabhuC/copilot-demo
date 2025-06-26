from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np
import os

app = FastAPI()

# Allow CORS for all origins (for development/testing only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
AIRPORTS_PATH = os.path.join(os.path.dirname(__file__), "airports.csv")

# Load model and airport data at startup
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    model = None
    print(f"Error loading model: {e}")

try:
    airports_df = pd.read_csv(AIRPORTS_PATH)
except Exception as e:
    airports_df = pd.DataFrame()
    print(f"Error loading airports: {e}")

@app.get("/predict")
def predict_delay(day_of_week_id: int = Query(..., alias="day_of_week_id"), airport_id: int = Query(..., alias="airport_id")):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded.")
    try:
        # Prepare input for prediction
        X_input = np.array([[day_of_week_id, airport_id]])
        proba = model.predict_proba(X_input)[0][1]  # Probability of delay > 15 min
        confidence = float(np.max(model.predict_proba(X_input)[0]))
        return JSONResponse(
            status_code=200,
            content={
                "delay_probability_percent": round(proba * 100, 2),
                "confidence_score": round(confidence, 4)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {e}")

@app.get("/airports")
def get_airports():
    if airports_df.empty:
        raise HTTPException(status_code=500, detail="Airport data not loaded.")
    try:
        airports_list = airports_df[['OriginAirportID', 'OriginAirportName']].sort_values('OriginAirportName')
        airports_json = airports_list.to_dict(orient="records")
        return JSONResponse(status_code=200, content=airports_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Airport data error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
