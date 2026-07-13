"use client";

import * as React from "react";
import { Upload } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ProfileImageUploaderProps {
  label?: string;
  imageUrl?: string;
  fallback: string;
  onFileSelected?: (file: File) => void;
  className?: string;
}

export function ProfileImageUploader({
  label = "Upload profile image",
  imageUrl,
  fallback,
  onFileSelected,
  className,
}: ProfileImageUploaderProps) {
  const inputId = React.useId();

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Avatar className="size-14">
        {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div>
        <Button asChild variant="outline" size="sm">
          <label htmlFor={inputId} className="cursor-pointer">
            <Upload className="size-4" aria-hidden="true" />
            {label}
          </label>
        </Button>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onFileSelected?.(file);
            }
          }}
        />
      </div>
    </div>
  );
}
