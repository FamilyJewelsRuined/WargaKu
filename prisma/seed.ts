import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database WargaKu...");

  // =========================================================
  // HAPUS DATA LAMA
  // =========================================================
  await prisma.pushSubscription.deleteMany();
  await prisma.panicAlert.deleteMany();
  await prisma.communityEvent.deleteMany();
  await prisma.iplPayment.deleteMany();
  await prisma.cctvCamera.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Data lama dihapus");

  // =========================================================
  // HASH PASSWORD
  // =========================================================
  const hashPassword = (pwd: string) => bcrypt.hashSync(pwd, 10);

  // =========================================================
  // BUAT AKUN DEMO
  // =========================================================
  const admin = await prisma.user.create({
    data: {
      name: "Pak RT Suharto",
      email: "admin@wargaku.demo",
      password: hashPassword("admin123"),
      phone: "081234567890",
      address: "Blok A No. 1 (Rumah RT)",
      houseNumber: "A-01",
      role: "ADMIN",
    },
  });

  const petugas = await prisma.user.create({
    data: {
      name: "Pak Rudi (Petugas Sampah)",
      email: "petugas@wargaku.demo",
      password: hashPassword("petugas123"),
      phone: "082345678901",
      address: "Blok C No. 5",
      houseNumber: "C-05",
      role: "PETUGAS_SAMPAH",
    },
  });

  const budi = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "budi@wargaku.demo",
      password: hashPassword("warga123"),
      phone: "083456789012",
      address: "Blok A No. 2",
      houseNumber: "A-02",
      role: "WARGA",
    },
  });

  const siti = await prisma.user.create({
    data: {
      name: "Siti Rahayu",
      email: "siti@wargaku.demo",
      password: hashPassword("warga123"),
      phone: "084567890123",
      address: "Blok A No. 3",
      houseNumber: "A-03",
      role: "WARGA",
    },
  });

  const ahmad = await prisma.user.create({
    data: {
      name: "Ahmad Fauzi",
      email: "ahmad@wargaku.demo",
      password: hashPassword("warga123"),
      phone: "085678901234",
      address: "Blok B No. 1",
      houseNumber: "B-01",
      role: "WARGA",
    },
  });

  const dewi = await prisma.user.create({
    data: {
      name: "Dewi Lestari",
      email: "dewi@wargaku.demo",
      password: hashPassword("warga123"),
      phone: "086789012345",
      address: "Blok B No. 2",
      houseNumber: "B-02",
      role: "WARGA",
    },
  });

  console.log("👥 Akun demo dibuat:", { admin, petugas, budi, siti, ahmad, dewi });

  // =========================================================
  // CCTV CAMERAS
  // =========================================================
  await prisma.cctvCamera.createMany({
    data: [
      {
        name: "Gerbang Utama",
        location: "Depan Pos Satpam - Pintu Masuk",
        youtubeUrl: "https://www.youtube.com/embed/rnfOrIFHOtE?autoplay=1&mute=1",
        order: 1,
      },
      {
        name: "Pos Satpam",
        location: "Area Pos Keamanan 24 Jam",
        youtubeUrl: "https://www.youtube.com/embed/K93RFnJnuJE?autoplay=1&mute=1",
        order: 2,
      },
      {
        name: "Area Parkir",
        location: "Parkir Terbuka Blok A-B",
        youtubeUrl: "https://www.youtube.com/embed/1EiC9bvVGnk?autoplay=1&mute=1",
        order: 3,
      },
      {
        name: "Jalan Utama",
        location: "Jalan Komplek Blok A - C",
        youtubeUrl: "https://www.youtube.com/embed/Lu56xVKqFxU?autoplay=1&mute=1",
        order: 4,
      },
    ],
  });

  console.log("📹 CCTV cameras dibuat");

  // =========================================================
  // IPL PAYMENTS (bulan Juli - September 2025)
  // =========================================================
  const wargas = [budi, siti, ahmad, dewi];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const iplData = [];
  for (const warga of wargas) {
    for (let m = currentMonth - 2; m <= currentMonth; m++) {
      const month = m <= 0 ? m + 12 : m;
      const year = m <= 0 ? currentYear - 1 : currentYear;

      // Buat status bervariasi untuk demo
      const isOldMonth = m < currentMonth;
      const isPaid = isOldMonth ? Math.random() > 0.3 : Math.random() > 0.7;
      const isOverdue = isOldMonth && !isPaid;

      iplData.push({
        userId: warga.id,
        amount: 30000,
        month,
        year,
        status: isPaid
          ? ("PAID" as const)
          : isOverdue
          ? ("OVERDUE" as const)
          : ("UNPAID" as const),
        paymentDate: isPaid
          ? new Date(year, month - 1, Math.floor(Math.random() * 20) + 1)
          : null,
        receiptNumber: isPaid
          ? `WK-${year}-${String(month).padStart(2, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`
          : null,
        method: isPaid ? "MOCK_TRANSFER" : null,
      });
    }
  }

  await prisma.iplPayment.createMany({ data: iplData });
  console.log(`💰 ${iplData.length} data IPL dibuat`);

  // =========================================================
  // COMMUNITY EVENTS / PENGUMUMAN
  // =========================================================
  await prisma.communityEvent.createMany({
    data: [
      {
        authorId: admin.id,
        title: "Jadwal Pengambilan Sampah Minggu Ini",
        content:
          "Warga yang terhormat,\n\nPengambilan sampah minggu ini akan dilakukan pada:\n- Senin & Kamis: Pukul 06.00 - 08.00 WIB\n- Sabtu: Pukul 07.00 - 09.00 WIB\n\nMohon sampah sudah disiapkan di depan rumah sebelum jam tersebut.\n\nTerima kasih atas kerjasamanya.",
        category: "PENGUMUMAN",
        eventDate: null,
      },
      {
        authorId: budi.id,
        title: "Innalillahi - Bapak Subagyo Telah Berpulang",
        content:
          "Assalamu'alaikum Wr. Wb.\n\nDengan penuh kesedihan kami sampaikan bahwa Bapak Subagyo (Ayahanda dari Ibu Marlina - Blok C No. 3) telah berpulang ke Rahmatullah pada hari ini.\n\nRencana pemakaman: Besok pagi pukul 08.00 WIB.\nTahlilan & Yasin: Malam ini pukul 20.00 WIB di rumah duka Blok C No. 3.\n\nMohon do'a dan kehadiran warga komplek.\n\nInnalillahi wa inna ilaihi raji'un.",
        category: "DUKA_CITA",
        eventDate: new Date(Date.now() + 86400000), // besok
      },
      {
        authorId: siti.id,
        title: "Kerja Bakti Komplek - Minggu Depan",
        content:
          "Halo warga komplek!\n\nMari kita adakan kerja bakti bersama untuk menjaga kebersihan lingkungan komplek kita.\n\n📅 Hari: Minggu, " +
          new Date(Date.now() + 7 * 86400000).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }) +
          "\n⏰ Pukul: 07.00 - 10.00 WIB\n📍 Kumpul di: Pos Satpam\n\nMohon partisipasi seluruh warga. Bawa peralatan kebersihan masing-masing.\n\nSnack dan minum disediakan! 😊",
        category: "KEGIATAN",
        eventDate: new Date(Date.now() + 7 * 86400000),
      },
      {
        authorId: ahmad.id,
        title: "Dijual: Kulkas 2 Pintu Sharp",
        content:
          "Mau jual kulkas 2 pintu merk Sharp, kondisi masih bagus dan berfungsi normal.\n\nDetail:\n- Kapasitas: 315 liter\n- Usia: 3 tahun\n- Kondisi: 85%\n- Harga: Rp 1.800.000 (nego)\n\nHubungi Ahmad - Blok B No. 1\nWA: 085678901234",
        category: "LAINNYA",
        eventDate: null,
      },
      {
        authorId: dewi.id,
        title: "Arisan RT Bulan Ini",
        content:
          "Reminder untuk semua ibu-ibu peserta arisan RT!\n\nArisan bulan ini akan diadakan di rumah Bu Dewi (Blok B No. 2).\n\n📅 Hari: Kamis, " +
          new Date(Date.now() + 3 * 86400000).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
          }) +
          "\n⏰ Pukul: 14.00 WIB\n\nMohon hadir tepat waktu. Iuran arisan Rp 50.000/bulan.\n\nSampai jumpa! 🌸",
        category: "KEGIATAN",
        eventDate: new Date(Date.now() + 3 * 86400000),
      },
    ],
  });

  console.log("📢 Community events dibuat");

  // =========================================================
  // PANIC ALERTS (history untuk demo)
  // =========================================================
  await prisma.panicAlert.create({
    data: {
      userId: siti.id,
      triggeredAt: new Date(Date.now() - 3 * 86400000), // 3 hari lalu
      isResolved: true,
      resolvedAt: new Date(Date.now() - 3 * 86400000 + 900000), // 15 menit setelah
      note: "Situasi sudah aman. Terima kasih atas respon cepat warga.",
    },
  });

  console.log("🚨 Panic alert history dibuat");

  console.log("\n✅ Seeding selesai!");
  console.log("\n📋 Akun Demo:");
  console.log("  Admin     : admin@wargaku.demo / admin123");
  console.log("  Petugas   : petugas@wargaku.demo / petugas123");
  console.log("  Warga 1   : budi@wargaku.demo / warga123");
  console.log("  Warga 2   : siti@wargaku.demo / warga123");
  console.log("  Warga 3   : ahmad@wargaku.demo / warga123");
  console.log("  Warga 4   : dewi@wargaku.demo / warga123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
