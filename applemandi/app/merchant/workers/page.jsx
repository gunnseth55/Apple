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
    <div className="w-full max-w-[860px] my-10 mx-auto p-6 font-sans">
      <h1 className="text-[26px] font-bold mb-1"> Worker Operations & Payroll</h1>
      <p className="text-neutral-500 mb-6">Log daily attendance, track wage accruals, and export payroll statements.</p>

      {/* Merchant Selector */}
      <div className="mb-6">
        <label className="font-semibold block mb-1.5">Select Merchant Shop:</label>
        <select
          value={selectedMerchantId}
          onChange={(e) => setSelectedMerchantId(e.target.value)}
          className="w-full p-2.5 rounded-md border border-neutral-300"
        >
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>
              {m.shopName} ({m.district})
            </option>
          ))}
        </select>
      </div>

      {/* Grid: Register Worker & Attendance Logger */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-6 mb-8">
        {/* Add Worker Card */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold mb-3"> Register Worker</h2>
          <form onSubmit={handleAddWorker} className="flex flex-col gap-2.5">
            <input
              type="text"
              placeholder="Worker Name"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="p-2 rounded-sm border border-neutral-300"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="p-2 rounded-sm border border-neutral-300"
            />
            <select
              value={newWageType}
              onChange={(e) => setNewWageType(e.target.value)}
              className="p-2 rounded-sm border border-neutral-300"
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
              className="p-2 rounded-sm border border-neutral-300"
            />
            <button
              type="submit"
              className="p-2.5 bg-blue-600 text-white border-0 rounded-sm cursor-pointer font-bold"
            >
              Add Worker
            </button>
          </form>
        </div>

        {/* Daily Attendance Card */}
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <div className="flex flex-wrap gap-3 justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Daily Attendance</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-1.5 rounded-sm border border-neutral-300"
            />
          </div>

          {workers.length === 0 ? (
            <p className="text-neutral-500 text-sm">No workers registered yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {workers.map((w) => {
                const currentStatus = attendanceMap[w.id] || 'PRESENT';
                return (
                  <div
                    key={w.id}
                    className="flex flex-wrap gap-3 justify-between items-center py-2 px-3 bg-slate-100 rounded-md"
                  >
                    <div>
                      <div className="font-semibold text-sm">{w.name}</div>
                      <div className="text-xs text-slate-500">₹{w.baseRate}/{w.wageType.toLowerCase()}</div>
                    </div>
                    <div className="flex gap-1">
                      {['PRESENT', 'HALF_DAY', 'ABSENT'].map((status) => {
                        const isSelected = currentStatus === status;
                        const label = status === 'PRESENT' ? 'P' : status === 'HALF_DAY' ? '½' : 'A';
                        const activeClass = status === 'PRESENT' ? 'bg-green-600 text-white' : status === 'HALF_DAY' ? 'bg-yellow-500 text-white' : 'bg-red-600 text-white';

                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setAttendanceMap({ ...attendanceMap, [w.id]: status })}
                            className={`h-8 w-8 cursor-pointer rounded-sm border-0 font-bold ${isSelected ? activeClass : 'bg-slate-200 text-slate-600'}`}
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
                className="mt-3 p-2.5 bg-emerald-600 text-white border-0 rounded-sm font-bold cursor-pointer"
              >
                Save {selectedDate} Attendance
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payroll Statement Card */}
      <div className="p-5 bg-white rounded-lg border border-slate-200">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold"> Payroll Summary (Last 30 Days)</h2>
            <div className="text-[13px] text-slate-500">
              Total Accrued Payout:{' '}
              <span className="font-bold text-slate-900">
                ₹{payroll ? payroll.totalPayout.toLocaleString('en-IN') : 0}
              </span>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="py-2 px-3.5 bg-slate-900 text-white border-0 rounded-md cursor-pointer font-semibold text-[13px]"
          >
             Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-600">
                <th className="p-2">Worker</th>
                <th className="p-2">Rate</th>
                <th className="p-2">Full / Half / Absent</th>
                <th className="p-2">Billable Days</th>
                <th className="p-2 text-right">Gross Payout</th>
              </tr>
            </thead>
            <tbody>
              {payroll?.workers?.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-2.5 px-2 font-semibold">{row.name}</td>
                  <td className="py-2.5 px-2">₹{row.baseRate}</td>
                  <td className="py-2.5 px-2">{row.presentDays}P / {row.halfDays}H / {row.absentDays}A</td>
                  <td className="py-2.5 px-2">{row.billableDays} days</td>
                  <td className="py-2.5 px-2 text-right font-bold text-emerald-600">
                    ₹{row.grossPayout.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}