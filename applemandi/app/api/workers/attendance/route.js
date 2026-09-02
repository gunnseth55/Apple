// app/api/workers/attendance/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { date, logs } = await req.json();

    if (!date || !Array.isArray(logs)) {
      return NextResponse.json(
        { error: 'date string and logs array are required.' },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const ops = logs.map((log) =>
      prisma.attendance.upsert({
        where: {
          workerId_date: {
            workerId: log.workerId,
            date: targetDate,
          },
        },
        update: { status: log.status },
        create: {
          workerId: log.workerId,
          date: targetDate,
          status: log.status,
        },
      })
    );

    const result = await prisma.$transaction(ops);
    return NextResponse.json({ success: true, count: result.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}