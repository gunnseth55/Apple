'use client';

import { useState, useEffect } from 'react';

export default function WorkerManagementPage() {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [workers, setWorkers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [payroll, setPayroll] = useState(null);

  // New worker form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWageType, setNewWageType] = useState('DAILY');
  const [newRate, setNewRate] = useState('500');

  // Load merchants
  useEffect(() => {
    async function loadMerchants() {
      const res = await fetch('/api/merchants');
      const data = await res.json();
      if (data?.data?.length > 0) {
        setMerchants(data.data);
        setSelectedMerchantId(data.data[0].id);
      }
    }
    loadMerchants();
  }, []);

  // Fetch workers when selected merchant changes
  const fetchWorkers = async (mId) => {
    if (!mId) return;
    const res = await fetch(`/api/workers?merchantId=${mId}`);
    const data = await res.json();
    if (data?.data) {
      setWorkers(data.data);
      // Initialize default attendance to PRESENT
      const initial = {};
      data.data.forEach((w) => {
        initial[w.id] = 'PRESENT';
      });
      setAttendanceMap(initial);
    }
  };

  useEffect(() => {
    if (selectedMerchantId) {
      fetchWorkers(selectedMerchantId);
      fetchPayroll(selectedMerchantId);
    }
  }, [selectedMerchantId]);

  // Fetch 30-day payroll summary
  const fetchPayroll = async (mId) => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const start = thirtyDaysAgo.toISOString().split('T')[0];
    const end = today.toISOString().split('T')[0];

    const res = await fetch(`/api/workers/payout?merchantId=${mId}&startDate=${start}&endDate=${end}`);
    const data = await res.json();
    if (data?.workers) setPayroll(data);
  };

  // Add Worker
  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!selectedMerchantId) return;

    const res = await fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId: selectedMerchantId,
        name: newName,
        phone: newPhone,
        wageType: newWageType,
        baseRate: Number(newRate),
      }),
    });

    if (res.ok) {
      setNewName('');
      setNewPhone('');
      fetchWorkers(selectedMerchantId);
      fetchPayroll(selectedMerchantId);
    }
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    const logs = Object.entries(attendanceMap).map(([workerId, status]) => ({
      workerId,
      status,
    }));

    const res = await fetch('/api/workers/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, logs }),
    });

    if (res.ok) {
      alert('Attendance saved successfully!');
      fetchPayroll(selectedMerchantId);
    }
  };

  // Export Payroll to CSV
  const handleExportCSV = () => {
    if (!payroll || !payroll.workers.length) return;

    const headers = ['Worker Name,Phone,Wage Type,Base Rate (₹),Present Days,Half Days,Absent Days,Billable Days,Gross Payout (₹)'];
    const rows = payroll.workers.map((w) =>
      `"${w.name}","${w.phone}","${w.wageType}",${w.baseRate},${w.presentDays},${w.halfDays},${w.absentDays},${w.billableDays},${w.grossPayout}`
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll_${selectedMerchantId}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '860px', margin: '40px auto', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '4px' }}>👷 Worker Operations & Payroll</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Log daily attendance, track wage accruals, and export payroll statements.</p>

      {/* Merchant Selector */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Select Merchant Shop:</label>
        <select
          value={selectedMerchantId}
          onChange={(e) => setSelectedMerchantId(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>
              {m.shopName} ({m.district})
            </option>
          ))}
        </select>
      </div>

      {/* Grid: Register Worker & Attendance Logger */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', marginBottom: '32px' }}>
        {/* Add Worker Card */}
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>➕ Register Worker</h2>
          <form onSubmit={handleAddWorker} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Worker Name"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <select
              value={newWageType}
              onChange={(e) => setNewWageType(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="DAILY">Daily Wage</option>
              <option value="CONTRACT">Contract Rate</option>
            </select>
            <input
              type="number"
              placeholder="Base Rate (₹/day)"
              required
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button
              type="submit"
              style={{ padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Add Worker
            </button>
          </form>
        </div>

        {/* Daily Attendance Card */}
        <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>📅 Daily Attendance</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          {workers.length === 0 ? (
            <p style={{ color: '#888', fontSize: '14px' }}>No workers registered yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {workers.map((w) => {
                const currentStatus = attendanceMap[w.id] || 'PRESENT';
                return (
                  <div
                    key={w.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#f1f5f9',
                      borderRadius: '6px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{w.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>₹{w.baseRate}/{w.wageType.toLowerCase()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['PRESENT', 'HALF_DAY', 'ABSENT'].map((status) => {
                        const isSelected = currentStatus === status;
                        const label = status === 'PRESENT' ? 'P' : status === 'HALF_DAY' ? '½' : 'A';
                        const activeColor = status === 'PRESENT' ? '#16a34a' : status === 'HALF_DAY' ? '#eab308' : '#dc2626';

                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setAttendanceMap({ ...attendanceMap, [w.id]: status })}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              color: isSelected ? '#fff' : '#475569',
                              background: isSelected ? activeColor : '#e2e8f0',
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleSaveAttendance}
                style={{
                  marginTop: '12px',
                  padding: '10px',
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Save {selectedDate} Attendance
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payroll Statement Card */}
      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>💰 Payroll Summary (Last 30 Days)</h2>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Total Accrued Payout:{' '}
              <span style={{ fontWeight: 'bold', color: '#0f172a' }}>
                ₹{payroll ? payroll.totalPayout.toLocaleString('en-IN') : 0}
              </span>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '8px 14px',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            📥 Export CSV
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
              <th style={{ padding: '8px' }}>Worker</th>
              <th style={{ padding: '8px' }}>Rate</th>
              <th style={{ padding: '8px' }}>Full / Half / Absent</th>
              <th style={{ padding: '8px' }}>Billable Days</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Gross Payout</th>
            </tr>
          </thead>
          <tbody>
            {payroll?.workers?.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 8px', fontWeight: '600' }}>{row.name}</td>
                <td style={{ padding: '10px 8px' }}>₹{row.baseRate}</td>
                <td style={{ padding: '10px 8px' }}>{row.presentDays}P / {row.halfDays}H / {row.absentDays}A</td>
                <td style={{ padding: '10px 8px' }}>{row.billableDays} days</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                  ₹{row.grossPayout.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}