import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const links = await prisma.link.findMany({
      orderBy: [{ categoryId: 'asc' }, { order: 'asc' }],
      include: {
        category: true,
      },
    });

    return NextResponse.json(links);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title_id, title_en, description_id, description_en, url, icon, categoryId, isActive, startDate, endDate } = body;

    if (!title_id || !title_en || !url || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const maxOrderLink = await prisma.link.findFirst({
      where: { categoryId },
      orderBy: { order: 'desc' },
    });

    const newOrder = (maxOrderLink?.order ?? -1) + 1;

    const link = await prisma.link.create({
      data: {
        title_id,
        title_en,
        description_id,
        description_en,
        url,
        icon: icon || 'link',
        categoryId,
        order: newOrder,
        isActive: isActive !== undefined ? isActive : true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title_id, title_en, description_id, description_en, url, icon, categoryId, isActive, startDate, endDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing link id' }, { status: 400 });
    }

    const updated = await prisma.link.update({
      where: { id },
      data: {
        title_id,
        title_en,
        description_id,
        description_en,
        url,
        icon,
        categoryId,
        isActive,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing link id' }, { status: 400 });
    }

    await prisma.link.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}
