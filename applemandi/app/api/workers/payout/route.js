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

    const workers = await prisma.worker.findMany({
      where: { merchantId, isActive: true },
      include: {
        attendance: {
          where: {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
        },
      },
    });

    const payroll = workers.map((worker) => {
      let presentDays = 0;
      let halfDays = 0;
      let absentDays = 0;

      worker.attendance.forEach((att) => {
        if (att.status === 'PRESENT') presentDays += 1;
        else if (att.status === 'HALF_DAY') halfDays += 1;
        else if (att.status === 'ABSENT') absentDays += 1;
      });

      const billableDays = presentDays + halfDays * 0.5;
      const grossAmount = billableDays * worker.baseRate;

      return {
        workerId: worker.id,
        workerName: worker.name,
        wageType: worker.wageType,
        baseRate: worker.baseRate,
        presentDays,
        halfDays,
        absentDays,
        billableDays,
        grossAmount,
      };
    });

    const totalGross = payroll.reduce((acc, item) => acc + item.grossAmount, 0);

    return NextResponse.json({
      period: { startDate, endDate },
      totalGrossPayout: totalGross,
      workers: payroll,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate payouts', details: error.message },
      { status: 500 }
    );
  }
}