import { prisma } from "../lib/prisma";

async function main() {
  console.log("Memulai pemeriksaan event untuk backfill lokasi...");
  const events = await prisma.communityEvent.findMany({
    where: {
      location: null,
      content: {
        contains: "📍 Lokasi:",
      },
    },
  });

  console.log(`Ditemukan ${events.length} event yang memiliki teks '📍 Lokasi:' di konten.`);

  for (const event of events) {
    const match = event.content.match(/\n*📍 Lokasi:\s*([\s\S]+)$/);
    if (match) {
      const extractedLocation = match[1].trim();
      const cleanedContent = event.content.replace(/\n*📍 Lokasi:\s*[\s\S]+$/, "").trim();

      console.log(`Event ID ${event.id}:`);
      console.log(`  Lokasi diekstrak: "${extractedLocation}"`);
      console.log(`  Konten diperbarui: "${cleanedContent.slice(0, 60)}..."`);

      await prisma.communityEvent.update({
        where: { id: event.id },
        data: {
          location: extractedLocation,
          content: cleanedContent,
        },
      });
      console.log(`  ✓ Berhasil diupdate.`);
    }
  }

  console.log("Backfill selesai!");
}

main()
  .catch((e) => {
    console.error("Backfill gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
