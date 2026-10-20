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

  useEffect(() => {
    if (!selectedMerchant) return;

    async function getPrediction() {
      setPredicting(true);

      try {
        const res = await fetch(
          `/api/pricing/predict?variety=${encodeURIComponent(
            selectedVariety.id
          )}&district=${encodeURIComponent(selectedMerchant.district)}`
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

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit listing');
      }

      setStatus({
        type: 'success',
        text: data.modelDetails?.isAnomaly
          ? 'Listing published, but flagged as a price anomaly.'
          : 'Listing published successfully!',
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
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-stone-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">
              AppleMandi / Marketplace
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              New apple listing
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">
              Bring your harvest to market. Add your stock, choose a variety,
              and set your asking price.
            </p>
          </div>

          <span className="self-start rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 sm:self-auto">
            Merchant workspace
          </span>
        </header>

        {status && (
          <div
            role="status"
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {status.text}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid items-start gap-6 lg:grid-cols-3"
        >
          <div className="space-y-6 lg:col-span-2">
            <section
              aria-labelledby="stock-heading"
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"
            >
              <div className="mb-7 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                  01
                </span>
                <div>
                  <h2 id="stock-heading" className="text-lg font-semibold">
                    Your shop &amp; harvest
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Choose where you sell and what you grow.
                  </p>
                </div>
              </div>

              <label
                htmlFor="merchant"
                className="mb-2 block text-sm font-semibold"
              >
                Merchant / yard
              </label>
              <select
                id="merchant"
                value={selectedMerchant?.id || ''}
                onChange={(e) => {
                  const merchant = merchants.find(
                    (item) => item.id === e.target.value
                  );
                  setSelectedMerchant(merchant);
                }}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {!merchants.length && (
                  <option value="">No merchant shops available</option>
                )}
                {merchants.map((merchant) => (
                  <option key={merchant.id} value={merchant.id}>
                    {merchant.shopName} — {merchant.district}, {merchant.state}
                  </option>
                ))}
              </select>

              <fieldset className="mt-7">
                <legend className="mb-3 text-sm font-semibold">
                  Apple variety
                </legend>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {VARIETIES.map((variety) => {
                    const isSelected = selectedVariety.id === variety.id;

                    return (
                      <button
                        type="button"
                        key={variety.id}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedVariety(variety)}
                        className={`relative cursor-pointer rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                            : 'border-stone-200 bg-white hover:border-emerald-300 hover:bg-stone-50'
                        }`}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <span
                            aria-hidden="true"
                            className={`h-3 w-3 rounded-full ${
                              isSelected
                                ? 'bg-emerald-600'
                                : 'bg-stone-200'
                            }`}
                          />
                          <span
                            aria-hidden="true"
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-stone-300 text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                        </div>

                        <div className="text-sm font-semibold">
                          {variety.name}
                        </div>
                        <div
                          className={`mt-1 text-xs ${
                            isSelected
                              ? 'text-emerald-700'
                              : 'text-stone-500'
                          }`}
                        >
                          {variety.badge}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </section>

            <section
              aria-labelledby="price-heading"
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"
            >
              <div className="mb-7 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                  02
                </span>
                <div>
                  <h2 id="price-heading" className="text-lg font-semibold">
                    Quantity &amp; pricing
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Let buyers know what is available.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="quantity"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Available quantity{' '}
                    <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 1500"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm transition placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="unit"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Unit
                  </label>
                  <select
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="quintal">Quintal (100 kg)</option>
                    <option value="crate">Crate (20–25 kg)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="asking-price"
                  className="mb-2 block text-sm font-semibold"
                >
                  Asking price per {unit}{' '}
                  <span className="text-emerald-700">*</span>
                </label>

                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-stone-500"
                  >
                    ₹
                  </span>
                  <input
                    id="asking-price"
                    type="number"
                    required
                    step="0.5"
                    placeholder="Enter your price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    aria-invalid={Boolean(isAnomaly)}
                    aria-describedby={
                      isAnomaly ? 'price-warning' : 'price-help'
                    }
                    className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm transition placeholder:text-stone-400 focus:outline-none focus:ring-2 ${
                      isAnomaly
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-stone-300 focus:border-emerald-600 focus:ring-emerald-100'
                    }`}
                  />
                </div>

                {isAnomaly ? (
                  <p
                    id="price-warning"
                    className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                  >
                    This price is outside the usual range. Your listing may
                    be flagged for review.
                  </p>
                ) : (
                  <p
                    id="price-help"
                    className="mt-2 text-xs leading-5 text-stone-500"
                  >
                    Use the market guidance as a reference when setting your
                    price.
                  </p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <section
              aria-labelledby="guidance-heading"
              className="overflow-hidden rounded-3xl border border-emerald-900 bg-emerald-950 text-white shadow-sm"
            >
              <div className="border-b border-emerald-800 p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                  Market guidance
                </p>
                <h2
                  id="guidance-heading"
                  className="mt-3 text-xl font-semibold"
                >
                  A starting point for your price.
                </h2>
                <p className="mt-2 text-sm text-emerald-200">
                  {selectedVariety.name} ·{' '}
                  {selectedMerchant?.district || 'Select a merchant'}
                </p>
              </div>

              <div
                className="p-6"
                aria-live="polite"
                aria-busy={predicting}
              >
                {predicting ? (
                  <p className="py-4 text-sm text-emerald-200">
                    Finding your suggested price range...
                  </p>
                ) : pricePrediction ? (
                  <>
                    <p className="text-xs text-emerald-200">
                      Suggested range per kg
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      ₹{pricePrediction.suggestedMinPrice}–₹
                      {pricePrediction.suggestedMaxPrice}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-emerald-900 px-4 py-3 text-sm">
                      <span className="text-emerald-200">
                        Expected median
                      </span>
                      <span className="font-semibold">
                        ₹{pricePrediction.expectedMedianPrice}/kg
                      </span>
                    </div>

                    <p className="mt-4 text-xs leading-5 text-emerald-200">
                      Guidance is per kilogram. Convert it to your selected
                      unit before setting a price.
                    </p>
                  </>
                ) : (
                  <p className="py-4 text-sm leading-6 text-emerald-200">
                    Price guidance will appear here when available for your
                    merchant and variety.
                  </p>
                )}
              </div>
            </section>

            <section
              aria-labelledby="summary-heading"
              className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <h2 id="summary-heading" className="text-base font-semibold">
                Your listing at a glance
              </h2>

              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Variety</dt>
                  <dd className="text-right font-medium">
                    {selectedVariety.name}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Quantity</dt>
                  <dd className="font-medium">
                    {quantity ? `${quantity} ${unit}` : 'Not set'}
                  </dd>
                </div>

                <div className="flex justify-between gap-4 border-t border-stone-100 pt-4">
                  <dt className="text-stone-500">Asking price</dt>
                  <dd className="font-semibold text-emerald-700">
                    {price ? `₹${price}/${unit}` : 'Not set'}
                  </dd>
                </div>
              </dl>

              <button
                type="submit"
                disabled={submitting || !selectedMerchant}
                className="mt-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
              >
                {submitting ? 'Publishing...' : 'Publish listing'}
                <span aria-hidden="true">→</span>
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-stone-500">
                {!selectedMerchant
                  ? 'Register a merchant shop to publish a listing.'
                  : 'Review your details before publishing.'}
              </p>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}