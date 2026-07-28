import { prisma } from '@/lib/prisma';
import { LinkHubClient, PublicCategory } from '@/components/public/link-hub-client';

export const revalidate = 0; // Dynamic server rendering for live links & schedule updates

const FALLBACK_CATEGORIES: PublicCategory[] = [
  {
    id: 'cat-1',
    name_id: 'Operasional Pertambangan & Equipment',
    name_en: 'Mining Operations & Equipment',
    icon: 'truck',
    order: 1,
    links: [
      {
        id: 'link-1',
        title_id: 'LINK ORDER VOTP by UT',
        title_en: 'LINK ORDER VOTP by UT',
        description_id: 'Dashboard & Portal Pemesanan Order VOTP resmi United Tractors',
        description_en: 'Official United Tractors VOTP Order Dashboard & Portal',
        url: 'https://votp.my.id/app/dashboard',
        icon: 'gauge',
        clickCount: 620,
        isActive: true,
      },
      {
        id: 'link-2',
        title_id: 'Fleet Management System (FMS)',
        title_en: 'Fleet Management System (FMS)',
        description_id: 'Monitoring real-time alat berat (Excavator, Haul Truck, Dozer)',
        description_en: 'Real-time heavy equipment tracking (Excavators, Haulers, Dozers)',
        url: 'https://fms.ppa.co.id',
        icon: 'truck',
        clickCount: 412,
        isActive: true,
      },
    ],
  },
  {
    id: 'cat-2',
    name_id: 'K3, Safety & Traffic (SHE)',
    name_en: 'Safety, Health & Traffic (SHE)',
    icon: 'shield-alert',
    order: 2,
    links: [
      {
        id: 'link-3',
        title_id: 'Pemesanan Sticker & Rambu Traffic PPA BIB',
        title_en: 'PPA BIB Traffic Sticker & Signage Ordering',
        description_id: 'Sistem pemesanan satu pintu & upload evidence dokumentasi pemasangan sticker/rambu',
        description_en: 'Integrated ordering portal & installation evidence upload for traffic signs',
        url: 'https://linktr.ee/TrafficPPABIB',
        icon: 'shield-check',
        clickCount: 540,
        isActive: true,
      },
      {
        id: 'link-4',
        title_id: 'Cek Masa Aktif MCU, Permit & Danger Tag (BJM - PPA)',
        title_en: 'MCU Expiry, Permit & Danger Tag Check (BJM - PPA)',
        description_id: 'Monitoring status kelaikan kerja, masa aktif permit, danger tag & followup MCU',
        description_en: 'Monitoring fitness status, permit expiry, danger tags & MCU followup',
        url: 'https://docs.google.com/spreadsheets/d/1mntr-jgVtwXi0Yq4_lCQLK-9FtkJdlvTQVR22KMiaUs/edit?gid=1221848520#gid=1221848520',
        icon: 'heart-pulse',
        clickCount: 480,
        isActive: true,
      },
    ],
  },
  {
    id: 'cat-3',
    name_id: 'Pengajuan Visitor & Manpower',
    name_en: 'Visitor & Manpower Applications',
    icon: 'users',
    order: 3,
    links: [
      {
        id: 'link-5',
        title_id: 'Pengajuan Izin Visitor (SHERA & PPA ONE)',
        title_en: 'Visitor Permit Application (SHERA & PPA ONE)',
        description_id: 'Proses pengajuan izin visitor terintegrasi SHERA dan PPA ONE',
        description_en: 'Integrated SHERA & PPA ONE visitor permit application process',
        url: 'https://shera.ppabib.com/form-visitor',
        icon: 'user-check',
        clickCount: 390,
        isActive: true,
      },
      {
        id: 'link-6',
        title_id: 'Form Izin Visitor (Bitly Direct)',
        title_en: 'Visitor Permit Direct Form',
        description_id: 'Tautan langsung formulir pengajuan izin visitor site',
        description_en: 'Direct link for site visitor permit application form',
        url: 'https://bit.ly/FormIzinVisitor',
        icon: 'clipboard-check',
        clickCount: 310,
        isActive: true,
      },
      {
        id: 'link-7',
        title_id: 'Form Pengajuan Akomodasi Visitor',
        title_en: 'Visitor Accommodation Request Form',
        description_id: 'Pengajuan fasilitas mess, akomodasi & penginapan visitor',
        description_en: 'Visitor mess & accommodation facility booking request',
        url: 'https://bit.ly/PENGAJUAN_AKOMODASI_VISITOR',
        icon: 'building-2',
        clickCount: 275,
        isActive: true,
      },
      {
        id: 'link-8',
        title_id: 'Monitoring Manpower & Cek Fatigue',
        title_en: 'Manpower Monitoring & Fatigue Tracking',
        description_id: 'Spreadsheet monitoring harian jam kerja, manpower & tingkat fatigue karyawan',
        description_en: 'Daily spreadsheet tracking working hours, manpower & employee fatigue levels',
        url: 'https://docs.google.com/spreadsheets/d/1xtNh9Lggh8kpswJJvFG6L4CG2nMsrFGxT2iZPPI6zxs/edit?usp=sharing',
        icon: 'bar-chart-3',
        clickCount: 430,
        isActive: true,
      },
    ],
  },
  {
    id: 'cat-4',
    name_id: 'HC & HRIS System',
    name_en: 'Human Capital & HRIS',
    icon: 'badge-check',
    order: 4,
    links: [
      {
        id: 'link-9',
        title_id: 'PPA MyHRIS Portal',
        title_en: 'PPA MyHRIS Portal',
        description_id: 'Presensi online, pengajuan cuti, slip gaji & data kepegawaian',
        description_en: 'Online attendance, leave requests, payslip & employee profile',
        url: 'https://hris.ppa.co.id',
        icon: 'badge-check',
        clickCount: 520,
        isActive: true,
      },
      {
        id: 'link-10',
        title_id: 'Pengajuan Cuti & Roster Kerja',
        title_en: 'Leave & Field Roster Request',
        description_id: 'Manajemen jadwal roster site & tiket penerbangan cuti',
        description_en: 'Site roster schedule management & travel ticket claims',
        url: 'https://hris.ppa.co.id/roster',
        icon: 'calendar-days',
        clickCount: 198,
        isActive: true,
      },
    ],
  },
];

export default async function PublicPage() {
  let categories: PublicCategory[] = [];
  let siteSettings = null;

  try {
    siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    }).catch(() => null);

    categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        links: {
          orderBy: { order: 'asc' },
        },
      },
    }).catch(() => []);
  } catch {
    // Silent fallback
  }

  // Fallback to default categories if database is initializing or offline
  const activeCategories = (categories && categories.length > 0) ? categories : FALLBACK_CATEGORIES;

  return <LinkHubClient categories={activeCategories} siteSettings={siteSettings} />;
}
