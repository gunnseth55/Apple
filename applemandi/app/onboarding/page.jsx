'use client';

import { useState } from 'react';

export default function MerchantOnboarding() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    shopName: '',
    district: 'Shimla',
    state: 'Himachal Pradesh',
    pincode: '',
    preferredLang: 'hi',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [createdMerchant, setCreatedMerchant] = useState(null);

  const districts = ['Shimla', 'Kinnaur', 'Kullu', 'Mandi', 'Chamba', 'Sirmour'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const rawText = await res.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error('Non-JSON response received:', rawText);
        throw new Error(`Server returned status ${res.status}: ${rawText.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setStatusMessage({ type: 'success', text: 'Merchant account registered successfully!' });
      setCreatedMerchant(data.data);
    } catch (err) {
      console.error('Submission error:', err);  
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>🍎 Mandi Merchant Onboarding</h1>
        <p style={{ color: '#666' }}>Register your apple orchard or mandi shop to start listing varieties and tracking workers.</p>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            backgroundColor: statusMessage.type === 'success' ? '#e6f4ea' : '#fce8e6',
            color: statusMessage.type === 'success' ? '#137333' : '#c5221f',
            border: `1px solid ${statusMessage.type === 'success' ? '#ceead6' : '#fad2cf'}`,
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {!createdMerchant ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Merchant / Owner Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Ramesh Negi"
              value={formData.name}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Phone Number (Used for Login) *</label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="e.g. +919816012345"
              value={formData.phone}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Shop / Yard Name *</label>
            <input
              type="text"
              name="shopName"
              required
              placeholder="e.g. Kotkhai Apple Yard"
              value={formData.shopName}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>District (Mandi Market) *</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Pincode *</label>
              <input
                type="text"
                name="pincode"
                required
                placeholder="e.g. 171202"
                value={formData.pincode}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>State</label>
              <input
                type="text"
                name="state"
                disabled
                value={formData.state}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #eee', background: '#f9f9f9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Preferred Language</label>
              <select
                name="preferredLang"
                value={formData.preferredLang}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="hi">हिंदी (Hindi)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: loading ? '#aaa' : '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating Profile...' : 'Complete Merchant Onboarding'}
          </button>
        </form>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', background: '#f9fafb' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            Welcome, {createdMerchant.name}!
          </h2>
          <p style={{ margin: '4px 0' }}><strong>Shop:</strong> {createdMerchant.merchant.shopName}</p>
          <p style={{ margin: '4px 0' }}><strong>Merchant ID:</strong> <code>{createdMerchant.merchant.id}</code></p>
          <p style={{ margin: '4px 0' }}><strong>Location:</strong> {createdMerchant.merchant.district}, {createdMerchant.merchant.state}</p>

          <button
            onClick={() => {
              setCreatedMerchant(null);
              setFormData({
                name: '',
                phone: '',
                shopName: '',
                district: 'Shimla',
                state: 'Himachal Pradesh',
                pincode: '',
                preferredLang: 'hi',
              });
            }}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#1f2937',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',py
            }}
          >
            Register Another Merchant
          </button>
        </div>
      )}
    </div>
  );
}