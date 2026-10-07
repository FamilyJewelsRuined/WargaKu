import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // diperlukan untuk non-AWS S3 endpoint
});

export const S3_BUCKET = process.env.S3_BUCKET!;

// Public URL untuk mengakses file yang diupload
// Format: https://t3.storage.dev/{bucket}/{key}
export const S3_PUBLIC_URL = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}`;
