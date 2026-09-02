import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

def generate_synthetic_mandi_data(n_samples=5000):
    """
    Simulates realistic multi-year Himachal Mandi trade records
    (Mimics Agmarknet schema: District, Variety, Month, Arrival Volume -> Modal Price)
    """
    np.random.seed(42)
    districts = ['Shimla', 'Kinnaur', 'Kullu', 'Mandi', 'Chamba']
    varieties = ['Royal Delicious', 'Golden Delicious', 'Red Delicious', 'Gala', 'Kinnaur Red']

    data = {
        'district': np.random.choice(districts, n_samples),
        'variety': np.random.choice(varieties, n_samples),
        'month': np.random.randint(1, 13, n_samples), # Seasonality indicator (peak harvest: Aug-Oct)
        'arrivals_quintal': np.random.exponential(scale=300, size=n_samples) + 50
    }
    
    df = pd.DataFrame(data)

    # Underlying pricing physics:
    # Variety base weights
    variety_base = {
        'Royal Delicious': 105,
        'Golden Delicious': 75,
        'Red Delicious': 95,
        'Gala': 125,
        'Kinnaur Red': 130
    }

    # District elevation/quality premiums
    district_premium = {
        'Kinnaur': 18,
        'Shimla': 10,
        'Kullu': 5,
        'Mandi': 0,
        'Chamba': -5
    }

    def compute_price(row):
        base = variety_base[row['variety']] + district_premium[row['district']]
        # Harvest supply glut discount during peak season (Months 8, 9, 10)
        glut_effect = -15 if row['month'] in [8, 9, 10] else 12
        # Price elasticity on arrival volume
        volume_penalty = - (row['arrivals_quintal'] / 200)
        noise = np.random.normal(0, 8)
        return max(40, round(base + glut_effect + volume_penalty + noise, 2))

    df['modal_price_per_kg'] = df.apply(compute_price, axis=1)
    return df

def train_and_export_models():
    print("Generating training dataset...")
    df = generate_synthetic_mandi_data()
    
    X = df[['district', 'variety', 'month', 'arrivals_quintal']]
    y = df['modal_price_per_kg']

    categorical_features = ['district', 'variety']
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ],
        remainder='passthrough'
    )

    print("Training Quantile Regressors for prediction intervals...")
    
    # 1. Lower Bound (10th percentile)
    model_low = Pipeline([
        ('prep', preprocessor),
        ('reg', GradientBoostingRegressor(loss='quantile', alpha=0.10, n_estimators=100, random_state=42))
    ])
    model_low.fit(X, y)

    # 2. Median Prediction (50th percentile)
    model_median = Pipeline([
        ('prep', preprocessor),
        ('reg', GradientBoostingRegressor(loss='quantile', alpha=0.50, n_estimators=100, random_state=42))
    ])
    model_median.fit(X, y)

    # 3. Upper Bound (90th percentile)
    model_high = Pipeline([
        ('prep', preprocessor),
        ('reg', GradientBoostingRegressor(loss='quantile', alpha=0.90, n_estimators=100, random_state=42))
    ])
    model_high.fit(X, y)

    print("Saving models to disk...")
    joblib.dump(model_low, 'model_q10.joblib')
    joblib.dump(model_median, 'model_q50.joblib')
    joblib.dump(model_high, 'model_q90.joblib')
    print("Training completed successfully. Artifacts ready.")

if __name__ == '__main__':
    train_and_export_models()