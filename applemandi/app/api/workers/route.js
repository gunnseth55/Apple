import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { merchantId, name, phone, wageType = 'DAILY', baseRate } = await req.json();

    if (!merchantId || !name || !baseRate) {
      return NextResponse.json(
        { error: 'merchantId, name, and baseRate are required.' },
        { status: 400 }
      );
    }

    const worker = await prisma.worker.create({
      data: {
        merchantId,
        name,
        phone,
        wageType,
        baseRate: Number(baseRate),
      },
    });

    return NextResponse.json({ success: true, data: worker }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }

    const workers = await prisma.worker.findMany({
      where: { merchantId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ data: workers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}