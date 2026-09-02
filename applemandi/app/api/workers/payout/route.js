// app/api/workers/payout/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!merchantId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'merchantId, startDate, and endDate query parameters are required.' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const workers = await prisma.worker.findMany({
      where: { merchantId, isActive: true },
      include: {
        attendance: {
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
        },
      },
    });

    const summary = workers.map((w) => {
      let present = 0;
      let half = 0;
      let absent = 0;

      w.attendance.forEach((att) => {
        if (att.status === 'PRESENT') present += 1;
        else if (att.status === 'HALF_DAY') half += 1;
        else if (att.status === 'ABSENT') absent += 1;
      });

      const billable = present + half * 0.5;
      const gross = billable * w.baseRate;

      return {
        id: w.id,
        name: w.name,
        phone: w.phone || 'N/A',
        wageType: w.wageType,
        baseRate: w.baseRate,
        presentDays: present,
        halfDays: half,
        absentDays: absent,
        billableDays: billable,
        grossPayout: gross,
      };
    });

    const totalPayout = summary.reduce((acc, curr) => acc + curr.grossPayout, 0);

    return NextResponse.json({
      period: { startDate, endDate },
      totalPayout,
      workers: summary,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}