import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { date, logs } = await req.json();

    if (!date || !Array.isArray(logs)) {
      return NextResponse.json(
        { error: 'A valid date string and a logs array are required.' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);

    // Upsert each worker's attendance record for this day
    const transactions = logs.map((log) =>
      prisma.attendance.upsert({
        where: {
          workerId_date: {
            workerId: log.workerId,
            date: parsedDate,
          },
        },
        update: { status: log.status },
        create: {
          workerId: log.workerId,
          date: parsedDate,
          status: log.status,
        },
      })
    );

    const result = await prisma.$transaction(transactions);

    return NextResponse.json({ success: true, count: result.length });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to log attendance', details: error.message },
      { status: 500 }
    );
  }
}