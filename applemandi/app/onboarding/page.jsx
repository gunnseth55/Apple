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
    <div className="w-full max-w-[640px] my-10 mx-auto p-6 font-sans">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold mb-2"> Mandi Merchant Onboarding</h1>
        <p className="text-neutral-500">Register your apple orchard or mandi shop to start listing varieties and tracking workers.</p>
      </div>

      {statusMessage && (
        <div
          className={`mb-5 border px-4 py-3 rounded-md ${statusMessage.type === 'success' ? 'border-[#ceead6] bg-[#e6f4ea] text-[#137333]' : 'border-[#fad2cf] bg-[#fce8e6] text-[#c5221f]'}`}
        >
          {statusMessage.text}
        </div>
      )}

      {!createdMerchant ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-semibold mb-1.5">Merchant / Owner Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Ramesh Negi"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2.5 rounded-md border border-neutral-300"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1.5">Phone Number (Used for Login) *</label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="e.g. +919816012345"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2.5 rounded-md border border-neutral-300"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1.5">Shop / Yard Name *</label>
            <input
              type="text"
              name="shopName"
              required
              placeholder="e.g. Kotkhai Apple Yard"
              value={formData.shopName}
              onChange={handleChange}
              className="w-full p-2.5 rounded-md border border-neutral-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1.5">District (Mandi Market) *</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full p-2.5 rounded-md border border-neutral-300"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1.5">Pincode *</label>
              <input
                type="text"
                name="pincode"
                required
                placeholder="e.g. 171202"
                value={formData.pincode}
                onChange={handleChange}
                className="w-full p-2.5 rounded-md border border-neutral-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1.5">State</label>
              <input
                type="text"
                name="state"
                disabled
                value={formData.state}
                className="w-full p-2.5 rounded-md border border-neutral-200 bg-neutral-50"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1.5">Preferred Language</label>
              <select
                name="preferredLang"
                value={formData.preferredLang}
                onChange={handleChange}
                className="w-full p-2.5 rounded-md border border-neutral-300"
              >
                <option value="hi">हिंदी (Hindi)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer rounded-md border-0 bg-emerald-600 p-3 text-base font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {loading ? 'Creating Profile...' : 'Complete Merchant Onboarding'}
          </button>
        </form>
      ) : (
        <div className="border border-gray-200 rounded-lg p-5 bg-[#f9fafb]">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Welcome, {createdMerchant.name}!
          </h2>
          <p className="my-1 mx-0"><strong>Shop:</strong> {createdMerchant.merchant.shopName}</p>
          <p className="my-1 mx-0"><strong>Merchant ID:</strong> <code className="break-all">{createdMerchant.merchant.id}</code></p>
          <p className="my-1 mx-0"><strong>Location:</strong> {createdMerchant.merchant.district}, {createdMerchant.merchant.state}</p>

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
            className="mt-4 py-2 px-4 bg-[#1f2937] text-white border-0 rounded-md cursor-pointer"
          >
            Register Another Merchant
          </button>
        </div>
      )}
    </div>
  );
}