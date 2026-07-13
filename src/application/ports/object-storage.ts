export interface StoredObject {
  bucket: string;
  path: string;
  publicUrl: string | null;
}

export interface ObjectStorageUploadInput {
  bucket: string;
  path: string;
  body: ArrayBuffer;
  contentType: string;
  cacheControl?: string;
  upsert?: boolean;
}

export interface ObjectStorage {
  upload(input: ObjectStorageUploadInput): Promise<StoredObject>;
  getPublicUrl(bucket: string, path: string): string | null;
}
