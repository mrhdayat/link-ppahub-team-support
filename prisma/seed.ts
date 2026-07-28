import fs from 'fs';
import path from 'path';

// Automatically load .env.local if DATABASE_URL is not set in environment
if (!process.env.DATABASE_URL) {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envConfig = fs.readFileSync(envLocalPath, 'utf-8');
    envConfig.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Support Berjaya PPA LinkHub database seed...');

  // 1. Seed Site Settings
  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
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
    },
  });
  console.log('✅ SiteSettings seeded.');

  // 2. Seed Default Admin
  const passwordHash = await bcrypt.hash('PPA@Safety1st!', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@ppa.co.id' },
    update: { passwordHash },
    create: {
      email: 'admin@ppa.co.id',
      name: 'Administrator Support Berjaya',
      passwordHash,
      role: 'SUPERADMIN',
    },
  });
  console.log(`✅ Admin seeded: ${admin.email} (Password: PPA@Safety1st!)`);

  // 3. Seed Categories & Real Company Links (Clean 0 Click Counts)
  const categoriesData = [
    {
      name_id: 'Operasional Pertambangan & Equipment',
      name_en: 'Mining Operations & Equipment',
      icon: 'truck',
      order: 1,
      links: [
        {
          title_id: 'LINK ORDER VOTP by UT',
          title_en: 'LINK ORDER VOTP by UT',
          description_id: 'Dashboard & Portal Pemesanan Order VOTP resmi United Tractors',
          description_en: 'Official United Tractors VOTP Order Dashboard & Portal',
          url: 'https://votp.my.id/app/dashboard',
          icon: 'gauge',
          order: 1,
          clickCount: 0,
        },
        {
          title_id: 'Fleet Management System (FMS)',
          title_en: 'Fleet Management System (FMS)',
          description_id: 'Monitoring real-time alat berat (Excavator, Haul Truck, Dozer)',
          description_en: 'Real-time heavy equipment tracking (Excavators, Haulers, Dozers)',
          url: 'https://fms.ppa.co.id',
          icon: 'truck',
          order: 2,
          clickCount: 0,
        },
      ],
    },
    {
      name_id: 'K3, Safety & Traffic (SHE)',
      name_en: 'Safety, Health & Traffic (SHE)',
      icon: 'shield-alert',
      order: 2,
      links: [
        {
          title_id: 'Pemesanan Sticker & Rambu Traffic PPA BIB',
          title_en: 'PPA BIB Traffic Sticker & Signage Ordering',
          description_id: 'Sistem pemesanan satu pintu & upload evidence dokumentasi pemasangan sticker/rambu',
          description_en: 'Integrated ordering portal & installation evidence upload for traffic signs',
          url: 'https://linktr.ee/TrafficPPABIB',
          icon: 'shield-check',
          order: 1,
          clickCount: 0,
        },
        {
          title_id: 'Cek Masa Aktif MCU, Permit & Danger Tag (BJM - PPA)',
          title_en: 'MCU Expiry, Permit & Danger Tag Check (BJM - PPA)',
          description_id: 'Monitoring status kelaikan kerja, masa aktif permit, danger tag & followup MCU',
          description_en: 'Monitoring fitness status, permit expiry, danger tags & MCU followup',
          url: 'https://docs.google.com/spreadsheets/d/1mntr-jgVtwXi0Yq4_lCQLK-9FtkJdlvTQVR22KMiaUs/edit?gid=1221848520#gid=1221848520',
          icon: 'heart-pulse',
          order: 2,
          clickCount: 0,
        },
      ],
    },
    {
      name_id: 'Pengajuan Visitor & Manpower',
      name_en: 'Visitor & Manpower Applications',
      icon: 'users',
      order: 3,
      links: [
        {
          title_id: 'Pengajuan Izin Visitor (SHERA & PPA ONE)',
          title_en: 'Visitor Permit Application (SHERA & PPA ONE)',
          description_id: 'Proses pengajuan izin visitor terintegrasi SHERA dan PPA ONE',
          description_en: 'Integrated SHERA & PPA ONE visitor permit application process',
          url: 'https://shera.ppabib.com/form-visitor',
          icon: 'user-check',
          order: 1,
          clickCount: 0,
        },
        {
          title_id: 'Form Izin Visitor (Bitly Direct)',
          title_en: 'Visitor Permit Direct Form',
          description_id: 'Tautan langsung formulir pengajuan izin visitor site',
          description_en: 'Direct link for site visitor permit application form',
          url: 'https://bit.ly/FormIzinVisitor',
          icon: 'clipboard-check',
          order: 2,
          clickCount: 0,
        },
        {
          title_id: 'Form Pengajuan Akomodasi Visitor',
          title_en: 'Visitor Accommodation Request Form',
          description_id: 'Pengajuan fasilitas mess, akomodasi & penginapan visitor',
          description_en: 'Visitor mess & accommodation facility booking request',
          url: 'https://bit.ly/PENGAJUAN_AKOMODASI_VISITOR',
          icon: 'building-2',
          order: 3,
          clickCount: 0,
        },
        {
          title_id: 'Monitoring Manpower & Cek Fatigue',
          title_en: 'Manpower Monitoring & Fatigue Tracking',
          description_id: 'Spreadsheet monitoring harian jam kerja, manpower & tingkat fatigue karyawan',
          description_en: 'Daily spreadsheet tracking working hours, manpower & employee fatigue levels',
          url: 'https://docs.google.com/spreadsheets/d/1xtNh9Lggh8kpswJJvFG6L4CG2nMsrFGxT2iZPPI6zxs/edit?usp=sharing',
          icon: 'bar-chart-3',
          order: 4,
          clickCount: 0,
        },
      ],
    },
    {
      name_id: 'HC & HRIS System',
      name_en: 'Human Capital & HRIS',
      icon: 'badge-check',
      order: 4,
      links: [
        {
          title_id: 'PPA MyHRIS Portal',
          title_en: 'PPA MyHRIS Portal',
          description_id: 'Presensi online, pengajuan cuti, slip gaji & data kepegawaian',
          description_en: 'Online attendance, leave requests, payslip & employee profile',
          url: 'https://hris.ppa.co.id',
          icon: 'badge-check',
          order: 1,
          clickCount: 0,
        },
        {
          title_id: 'Pengajuan Cuti & Roster Kerja',
          title_en: 'Leave & Field Roster Request',
          description_id: 'Manajemen jadwal roster site & tiket penerbangan cuti',
          description_en: 'Site roster schedule management & travel ticket claims',
          url: 'https://hris.ppa.co.id/roster',
          icon: 'calendar-days',
          order: 2,
          clickCount: 0,
        },
      ],
    },
  ];

  for (const catData of categoriesData) {
    const { links, ...catMeta } = catData;
    const category = await prisma.category.create({
      data: {
        ...catMeta,
        links: {
          create: links,
        },
      },
    });
    console.log(`📂 Created Category: ${category.name_id} (${links.length} links)`);
  }

  console.log('🎉 Support Berjaya PPA LinkHub database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
