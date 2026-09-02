'use client';

import { useState, useEffect } from 'react';

const VARIETIES = [
  { id: 'Royal Delicious', name: 'Royal Delicious', badge: 'High Demand' },
  { id: 'Golden Delicious', name: 'Golden Delicious', badge: 'Standard' },
  { id: 'Red Delicious', name: 'Red Delicious', badge: 'Classic' },
  { id: 'Kinnaur Red', name: 'Kinnaur Red', badge: 'Premium' },
  { id: 'Gala', name: 'Gala', badge: 'Early Season' },
];

export default function NewListingPage() {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [selectedVariety, setSelectedVariety] = useState(VARIETIES[0]);
  const [pricePrediction, setPricePrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  // 1. Load merchants
  useEffect(() => {
    async function loadMerchants() {
      try {
        const res = await fetch('/api/merchants');
        const json = await res.json();
        if (json?.data?.length > 0) {
          setMerchants(json.data);
          setSelectedMerchant(json.data[0]);
        }
      } catch (err) {
        console.error('Failed to load merchants:', err);
      }
    }
    loadMerchants();
  }, []);

  // 2. Fetch live ML prediction whenever Variety or District changes
  useEffect(() => {
    if (!selectedMerchant) return;

    async function getPrediction() {
      setPredicting(true);
      try {
        const res = await fetch(
          `/api/pricing/predict?variety=${encodeURIComponent(selectedVariety.id)}&district=${encodeURIComponent(selectedMerchant.district)}`
        );
        const data = await res.json();
        setPricePrediction(data.prediction);
      } catch (err) {
        console.error('Failed to fetch prediction:', err);
      } finally {
        setPredicting(false);
      }
    }

    getPrediction();
  }, [selectedVariety, selectedMerchant]);

  // 3. Real-time Anomaly Calculation
  const numPrice = Number(price);
  const minLimit = pricePrediction?.suggestedMinPrice || 70;
  const maxLimit = pricePrediction?.suggestedMaxPrice || 120;
  const isAnomalyLow = price && numPrice < minLimit * 0.6;
  const isAnomalyHigh = price && numPrice > maxLimit * 1.4;
  const isAnomaly = isAnomalyLow || isAnomalyHigh;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMerchant) return;

    setSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: selectedMerchant.id,
          cropType: 'Apple',
          variety: selectedVariety.id,
          quantity: Number(quantity),
          unit,
          askingPricePerUnit: numPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit listing');

      setStatus({
        type: 'success',
        text: data.modelDetails?.isAnomaly
          ? '⚠️ Listing published, but flagged as a price anomaly based on model bounds.'
          : '✅ Listing published successfully within normal mandi limits!',
      });
      setQuantity('');
      setPrice('');
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '8px' }}>🍎 New Apple Listing</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Dynamic pricing powered by Quantile Gradient Boosting regression models.
      </p>

      {status && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: status.type === 'success' ? '#e6f4ea' : '#fce8e6',
            color: status.type === 'success' ? '#137333' : '#c5221f',
            border: `1px solid ${status.type === 'success' ? '#ceead6' : '#fad2cf'}`,
          }}
        >
          {status.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Merchant Selector */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Merchant / Yard:</label>
          <select
            value={selectedMerchant?.id || ''}
            onChange={(e) => {
              const m = merchants.find((item) => item.id === e.target.value);
              setSelectedMerchant(m);
            }}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.shopName} — {m.district}, {m.state}
              </option>
            ))}
          </select>
        </div>

        {/* Visual Variety Selector */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px' }}>Variety:</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {VARIETIES.map((v) => {
              const isSelected = selectedVariety.id === v.id;
              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => setSelectedVariety(v)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #059669' : '1px solid #e5e7eb',
                    backgroundColor: isSelected ? '#ecfdf5' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🍏</div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{v.name}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{v.badge}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic ML Pricing Intelligence Card */}
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', color: '#334155' }}>
              Mandi Pricing Intelligence ({selectedMerchant?.district || 'Market'})
            </span>
            <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px' }}>
              80% Quantile Band
            </span>
          </div>

          <div style={{ marginTop: '8px' }}>
            {predicting ? (
              <div style={{ color: '#64748b' }}>Running regression inference...</div>
            ) : pricePrediction ? (
              <div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>
                  ₹{pricePrediction.suggestedMinPrice} – ₹{pricePrediction.suggestedMaxPrice}{' '}
                  <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b' }}>/ kg expected</span>
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                  Expected Median: <strong>₹{pricePrediction.expectedMedianPrice}/kg</strong>
                </div>
              </div>
            ) : (
              <div style={{ color: '#94a3b8' }}>Prediction unavailable</div>
            )}
          </div>
        </div>

        {/* Quantity & Unit */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Quantity Available *</label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 1500"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="kg">kg</option>
              <option value="quintal">quintal (100 kg)</option>
              <option value="crate">crate (20-25 kg)</option>
            </select>
          </div>
        </div>

        {/* Asking Price Input */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Your Asking Price (₹ per {unit}) *</label>
          <input
            type="number"
            required
            step="0.5"
            placeholder={pricePrediction ? `Expected: ₹${pricePrediction.expectedMedianPrice}` : 'Enter price'}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: isAnomaly ? '2px solid #ef4444' : '1px solid #ccc',
            }}
          />

          {/* Anomaly Badge */}
          {isAnomaly && (
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#dc2626', fontWeight: '500' }}>
              ⚠️ Statistical Anomaly: Price ₹{price} deviates significantly from the model's 80% interval (₹{minLimit}–{maxLimit}).
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '14px',
            backgroundColor: submitting ? '#9ca3af' : '#059669',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}