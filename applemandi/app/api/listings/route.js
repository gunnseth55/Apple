// app/api/listings/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PYTHON_ENGINE_URL = process.env.PRICING_ENGINE_URL || 'http://127.0.0.1:8000';

async function fetchModelPrediction(variety, district) {
  try {
    const res = await fetch(`${PYTHON_ENGINE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variety, district }),
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Model service error: ${res.statusText}`);
    const data = await res.json();
    return data.prediction;
  } catch (err) {
    console.warn('Falling back to default band due to ML service downtime:', err.message);
    // Graceful degradation fallback
    return { suggestedMinPrice: 70, expectedMedianPrice: 90, suggestedMaxPrice: 110 };
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { merchantId, cropType = 'Apple', variety, quantity, unit = 'kg', askingPricePerUnit } = body;

    if (!merchantId || !variety || !quantity || !askingPricePerUnit) {
      return NextResponse.json(
        { error: 'merchantId, variety, quantity, and asking price are required.' },
        { status: 400 }
      );
    }

    // 1. Get merchant's registered district
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // 2. Call ML regression model for dynamic predictions
    const prediction = await fetchModelPrediction(variety, merchant.district);
    const { suggestedMinPrice, suggestedMaxPrice, expectedMedianPrice } = prediction;

    const price = Number(askingPricePerUnit);

    // 3. Statistical Anomaly Detection:
    // Outlier if asking price is > 1.4x of 90th percentile or < 0.6x of 10th percentile
    let status = 'ACTIVE';
    if (price < suggestedMinPrice * 0.6 || price > suggestedMaxPrice * 1.4) {
      status = 'FLAGGED_ANOMALY';
    }

    // 4. Save to Supabase
    const listing = await prisma.listing.create({
      data: {
        merchantId,
        cropType,
        variety,
        quantity: Number(quantity),
        unit,
        askingPricePerUnit: price,
        suggestedMinPrice,
        suggestedMaxPrice,
        status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: listing,
        modelDetails: {
          district: merchant.district,
          expectedMedian: expectedMedianPrice,
          suggestedRange: [suggestedMinPrice, suggestedMaxPrice],
          isAnomaly: status === 'FLAGGED_ANOMALY',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}