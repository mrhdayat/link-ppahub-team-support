import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkId } = body;

    if (!linkId) {
      return NextResponse.json({ error: 'Missing linkId' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || undefined;
    const referer = request.headers.get('referer') || undefined;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    try {
      // 1. Increment link click count in DB
      await prisma.link.update({
        where: { id: linkId },
        data: { clickCount: { increment: 1 } },
      });

      // 2. Log click entry for analytics
      await prisma.clickLog.create({
        data: {
          linkId,
          userAgent,
          referer,
          ipHash: ip,
        },
      });
    } catch (dbError) {
      // Gracefully handle DB offline / unavailable without throwing 500 error
      console.warn('DB offline during click log, continuing gracefully:', dbError);
      return NextResponse.json({ success: true, dbOffline: true }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Click route error:', error);
    // Always return 200 OK so client UI does not crash or throw red 500 errors
    return NextResponse.json({ success: true, error: 'Handled' }, { status: 200 });
  }
}
