import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/application/errors";
import type { ObjectStorage, ObjectStorageUploadInput, StoredObject } from "@/application/ports";

export class SupabaseObjectStorage implements ObjectStorage {
  constructor(private readonly client: SupabaseClient) {}

  async upload(input: ObjectStorageUploadInput): Promise<StoredObject> {
    const { error } = await this.client.storage.from(input.bucket).upload(input.path, input.body, {
      cacheControl: input.cacheControl ?? "31536000",
      contentType: input.contentType,
      upsert: input.upsert ?? true,
    });

    if (error) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: error.message,
        details: { provider: "supabase-storage", operation: "upload" },
      });
    }

    const { data } = this.client.storage.from(input.bucket).getPublicUrl(input.path);

    return {
      bucket: input.bucket,
      path: input.path,
      publicUrl: data.publicUrl ?? null,
    };
  }

  getPublicUrl(bucket: string, path: string): string | null {
    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl ?? null;
  }
}
