"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  ProfileImageUploader,
} from "@/components/ui";

import { getCustomerJson, patchCustomerJson, postCustomerForm } from "../api-client";
import type { CustomerSummary } from "../types";

export function ProfileManagement() {
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const result = await getCustomerJson<CustomerSummary>("/api/customer/summary");
    if (result.error) setError(result.error);
    else setSummary(result.data ?? null);
  }

  useEffect(() => {
    let active = true;

    void getCustomerJson<CustomerSummary>("/api/customer/summary").then((result) => {
      if (!active) return;

      if (result.error) setError(result.error);
      else setSummary(result.data ?? null);
    });

    return () => {
      active = false;
    };
  }, []);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await patchCustomerJson("/api/customer/profile", {
      legalName: String(formData.get("legalName") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      country: String(formData.get("country") ?? "").toUpperCase(),
      stateRegion: String(formData.get("stateRegion") ?? ""),
      dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    });

    if (result.error) setError(result.error);
    else {
      setMessage("Profile updated.");
      await load();
    }

    setPending(false);
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const webp = await compressAvatarToWebp(file);
      const formData = new FormData();
      formData.set("avatar", webp, "avatar.webp");
      const result = await postCustomerForm("/api/customer/avatar", formData);

      if (result.error) setError(result.error);
      else {
        setMessage("Avatar updated.");
        await load();
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Avatar upload failed.");
    }

    setUploading(false);
  }

  const profile = summary?.profile;
  const fallback = getInitials(
    profile?.displayName ?? profile?.legalName ?? summary?.user.email ?? "US",
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Profile image</CardTitle>
          <CardDescription>Compressed to WebP before upload.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProfileImageUploader
            fallback={fallback}
            label={uploading ? "Uploading" : "Upload image"}
            onFileSelected={(file) => void uploadAvatar(file)}
            {...(profile?.avatarUrl ? { imageUrl: profile.avatarUrl } : {})}
          />
          {uploading ? <p className="text-sm text-muted-foreground">Optimizing image...</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>Keep your account identity details current.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Legal name" name="legalName" defaultValue={profile?.legalName ?? ""} />
            <Field
              label="Display name"
              name="displayName"
              defaultValue={profile?.displayName ?? ""}
            />
            <Field label="Phone" name="phone" defaultValue={profile?.phone ?? ""} />
            <Field
              label="Country"
              name="country"
              maxLength={2}
              defaultValue={profile?.country ?? ""}
            />
            <Field
              label="State / region"
              name="stateRegion"
              defaultValue={profile?.stateRegion ?? ""}
            />
            <Field
              label="Date of birth"
              name="dateOfBirth"
              type="date"
              defaultValue={profile?.dateOfBirth ?? ""}
            />
            {error ? (
              <Alert variant="destructive" className="sm:col-span-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {message ? (
              <Alert className="sm:col-span-2">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving" : "Save profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} maxLength={maxLength} />
    </div>
  );
}

export async function compressAvatarToWebp(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }

  const bitmap = await createImageBitmap(file);
  const maxSize = 512;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image compression is unavailable.");

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82),
  );
  if (!blob) throw new Error("Image compression failed.");

  return new File([blob], "avatar.webp", { type: "image/webp" });
}

function getInitials(value: string): string {
  return (
    value
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "US"
  );
}
