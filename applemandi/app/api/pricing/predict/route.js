// app/api/pricing/predict/route.js
import { NextResponse } from 'next/server';

const PYTHON_ENGINE_URL = process.env.PRICING_ENGINE_URL || 'http://127.0.0.1:8000';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const variety = searchParams.get('variety') || 'Royal Delicious';
  const district = searchParams.get('district') || 'Shimla';

  try {
    const res = await fetch(`${PYTHON_ENGINE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variety, district }),
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('ML microservice returned non-200');
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        variety,
        district,
        prediction: {
          suggestedMinPrice: 75,
          expectedMedianPrice: 95,
          suggestedMaxPrice: 120,
          confidenceInterval: 'fallback',
        },
      },
      { status: 200 }
    );
  }
}