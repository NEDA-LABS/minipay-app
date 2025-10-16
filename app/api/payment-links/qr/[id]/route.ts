// app/api/payment-links/qr/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const link = await prisma.paymentLink.findUnique({ where: { linkId: id } });
  if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

  // Generate PNG
  const qrDataURL = await QRCode.toDataURL(link.url, { width: 600, margin: 2 });
  
  return new Response(Buffer.from(qrDataURL.split(',')[1], 'base64'), {
    headers: { 'Content-Type': 'image/png' },
  });
}