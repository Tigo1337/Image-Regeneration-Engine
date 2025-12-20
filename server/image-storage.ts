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
  const filename = `${prefix}/${nanoid()}.${extension}`;
  
  // Get the bucket from the private object directory
  const privateDir = objectStorageService.getPrivateObjectDir();
  const bucketName = privateDir.split("/")[1]; // Extract bucket name from path
  
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(`designs/${filename}`);

  // Upload the buffer
  await file.save(buffer, {
    metadata: {
      contentType: `image/${matches[1]}`,
    },
  });

  // Return the object path for serving
  return `/objects/designs/${filename}`;
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
