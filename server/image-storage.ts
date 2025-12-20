import { objectStorageClient, ObjectStorageService } from "./replit_integrations/object_storage";
import { nanoid } from "nanoid";

const objectStorageService = new ObjectStorageService();

/**
 * Uploads a base64 image to object storage and returns the public URL path.
 */
export async function uploadImageToStorage(
  base64Data: string,
  prefix: string = "designs"
): Promise<string> {
  // Extract the actual base64 data and mime type
  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 image data");
  }

  const extension = matches[1] === "jpeg" ? "jpg" : matches[1];
  const base64Content = matches[2];
  const buffer = Buffer.from(base64Content, "base64");

  // Generate unique filename
  const filename = `${nanoid()}.${extension}`;
  
  // Get bucket ID from environment variable (set by Replit object storage setup)
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID environment variable not set");
  }
  
  // Use the public directory for serving images
  const objectPath = `public/${prefix}/${filename}`;
  
  const bucket = objectStorageClient.bucket(bucketId);
  const file = bucket.file(objectPath);

  // Upload the buffer
  await file.save(buffer, {
    metadata: {
      contentType: `image/${matches[1]}`,
    },
  });

  // Return the object path for serving via /objects route
  return `/objects/${objectPath}`;
}

/**
 * Generates a presigned URL for direct image upload.
 */
export async function getImageUploadUrl(): Promise<{ uploadUrl: string; objectPath: string }> {
  const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
  const objectPath = objectStorageService.normalizeObjectEntityPath(uploadUrl);
  return { uploadUrl, objectPath };
}

/**
 * Gets the full URL path for an image stored in object storage.
 */
export function getImageUrl(objectPath: string): string {
  // Object paths are already in the format /objects/...
  // which our routes.ts will serve
  return objectPath;
}
