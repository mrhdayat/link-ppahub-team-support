import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Overall stats
    const totalClicksResult = await prisma.link.aggregate({
      _sum: { clickCount: true },
    });
    const totalClicks = totalClicksResult._sum.clickCount || 0;

    const activeLinks = await prisma.link.count({ where: { isActive: true } });
    const totalCategories = await prisma.category.count();

    // 2. Top 5 clicked links
    const topLinks = await prisma.link.findMany({
      take: 5,
      orderBy: { clickCount: 'desc' },
      select: {
        id: true,
        title_id: true,
        clickCount: true,
      },
    });

    // 3. Daily click trends for the past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const clickLogs = await prisma.clickLog.findMany({
      where: {
        timestamp: { gte: sevenDaysAgo },
      },
      select: {
        timestamp: true,
      },
    });

    // Group logs by day
    const dayMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      dayMap[key] = 0;
    }

    clickLogs.forEach((log) => {
      const key = new Date(log.timestamp).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      if (dayMap[key] !== undefined) {
        dayMap[key] += 1;
      }
    });

    const dailyTrends = Object.entries(dayMap).map(([day, clicks]) => ({
      day,
      clicks,
    }));

    return NextResponse.json({
      totalClicks,
      activeLinks,
      totalCategories,
      topLinks,
      dailyTrends,
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
