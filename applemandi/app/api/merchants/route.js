
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, phone, shopName, district, state, pincode } = body;

    if (!name || !phone || !shopName || !district || !state || !pincode) {
      return NextResponse.json(
        { error: 'All fields (name, phone, shopName, district, state, pincode) are required.' },
        { status: 400 }
      );
    }

    const newMerchant = await prisma.user.create({
      data: {
        name,
        phone,
        role: 'MERCHANT',
        merchant: {
          create: {
            shopName,
            district,
            state,
            pincode,
          },
        },
      },
      include: {
        merchant: true,
      },
    });

    return NextResponse.json({ success: true, data: newMerchant }, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A merchant with this phone number already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const merchants = await prisma.merchant.findMany({
      include: {
        user: {
          select: { name: true, phone: true, preferredLang: true },
        },
        _count: {
          select: { listings: true, workers: true },
        },
      },
    });

    return NextResponse.json({ data: merchants });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch merchants', details: error.message },
      { status: 500 }
    );
  }
}