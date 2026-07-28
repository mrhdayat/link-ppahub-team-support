import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    }).catch(() => null);

    return NextResponse.json(settings || {
      id: 'default',
      companyName: 'Support Berjaya',
      companySubtitle: 'PPA Link Hub',
      officialSlogan: 'Support Berjaya, Berjaya di darat, laut dan udara',
      logoUrl: '/brand/logo-ppa.png',
      logoSupportTruck: '/brand/logo-support-truck.svg',
      logoDewatering: '/brand/logo-dewatering.svg',
      logoHighVoltage: '/brand/logo-high-voltage.svg',
      tagline_id: 'Portal Resmi Informasi & Layanan Internal PT Putra Perkasa Abadi',
      tagline_en: 'Official Portal for Internal Services & Information PT Putra Perkasa Abadi',
      themeDefault: 'glass',
      announcementBanner: '',
      isMaintenanceMode: false,
      showFeaturedSection: true,
      contactEmail: 'it.support@ppa.co.id',
      contactPhone: '+62 21 500-PPA',
      footerCopyright: '© 2026 PT Putra Perkasa Abadi — Support Berjaya. All Rights Reserved.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName,
      companySubtitle,
      officialSlogan,
      logoUrl,
      logoSupportTruck,
      logoDewatering,
      logoHighVoltage,
      tagline_id,
      tagline_en,
      themeDefault,
      announcementBanner,
      isMaintenanceMode,
      showFeaturedSection,
      contactEmail,
      contactPhone,
      footerCopyright,
    } = body;

    // Sanitize string inputs (security best practice)
    const sanitizeStr = (str?: string) => (str ? str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') : '');

    const dataPayload = {
      companyName: sanitizeStr(companyName) || 'Support Berjaya',
      companySubtitle: sanitizeStr(companySubtitle) || 'PPA Link Hub',
      officialSlogan: sanitizeStr(officialSlogan) || 'Support Berjaya, Berjaya di darat, laut dan udara',
      logoUrl: sanitizeStr(logoUrl) || '/brand/logo-ppa.png',
      logoSupportTruck: sanitizeStr(logoSupportTruck) || '/brand/logo-support-truck.svg',
      logoDewatering: sanitizeStr(logoDewatering) || '/brand/logo-dewatering.svg',
      logoHighVoltage: sanitizeStr(logoHighVoltage) || '/brand/logo-high-voltage.svg',
      tagline_id: sanitizeStr(tagline_id) || 'Portal Resmi Informasi & Layanan Internal PT Putra Perkasa Abadi',
      tagline_en: sanitizeStr(tagline_en) || 'Official Portal for Internal Services & Information PT Putra Perkasa Abadi',
      themeDefault: ['glass', 'dark', 'light'].includes(themeDefault) ? themeDefault : 'glass',
      announcementBanner: sanitizeStr(announcementBanner),
      isMaintenanceMode: Boolean(isMaintenanceMode),
      showFeaturedSection: showFeaturedSection !== undefined ? Boolean(showFeaturedSection) : true,
      contactEmail: sanitizeStr(contactEmail) || 'it.support@ppa.co.id',
      contactPhone: sanitizeStr(contactPhone) || '+62 21 500-PPA',
      footerCopyright: sanitizeStr(footerCopyright) || '© 2026 PT Putra Perkasa Abadi — Support Berjaya. All Rights Reserved.',
    };

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: dataPayload,
      create: {
        id: 'default',
        ...dataPayload,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
