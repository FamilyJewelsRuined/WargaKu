import { z } from "zod";

export const DBCategoryEnum = z.enum([
  "DUKA_CITA",
  "PENGUMUMAN",
  "KEGIATAN",
  "LAINNYA",
]);
export type DBCategory = z.infer<typeof DBCategoryEnum>;

export const attachmentItemSchema = z
  .string()
  .min(1, "URL lampiran tidak valid")
  .max(2048, "URL lampiran terlalu panjang")
  .refine(
    (val) => {
      const trimmed = val.trim();
      return (
        trimmed.startsWith("/") ||
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("events/")
      );
    },
    { message: "URL lampiran tidak valid" }
  );

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Judul event wajib diisi")
      .max(200, "Judul maksimal 200 karakter"),
    content: z
      .string()
      .trim()
      .min(1, "Konten/deskripsi wajib diisi")
      .max(500, "Deskripsi maksimal 500 karakter"),
    category: DBCategoryEnum.default("PENGUMUMAN"),
    eventDate: z.string().nullable().optional(),
    location: z
      .string()
      .trim()
      .max(200, "Lokasi maksimal 200 karakter")
      .nullable()
      .optional(),
    attachments: z
      .array(attachmentItemSchema)
      .max(5, "Maksimal 5 foto per event")
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.category === "KEGIATAN") {
      if (!data.eventDate || !data.eventDate.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal & waktu wajib diisi untuk kategori Kegiatan",
          path: ["eventDate"],
        });
      }
      if (!data.location || !data.location.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Lokasi wajib diisi untuk kategori Kegiatan",
          path: ["location"],
        });
      }
    }
  });

export type EventInput = z.infer<typeof eventSchema>;
