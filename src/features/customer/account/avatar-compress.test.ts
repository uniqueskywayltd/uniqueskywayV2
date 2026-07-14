import { describe, expect, it, vi } from "vitest";

import { compressAvatarToWebp } from "@/features/customer/account/avatar-compress";

describe("compressAvatarToWebp", () => {
  it("converts selected images to WebP before upload", async () => {
    const close = vi.fn();
    const drawImage = vi.fn();
    const toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(["webp"], { type: "image/webp" }));
    });
    const originalCreateElement = document.createElement.bind(document);

    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 1024,
        height: 512,
        close,
      })),
    );
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({ drawImage })),
          toBlob,
        } as unknown as HTMLCanvasElement;
      }

      return originalCreateElement(tagName);
    });

    const file = new File(["png"], "avatar.png", { type: "image/png" });
    const result = await compressAvatarToWebp(file);

    expect(result.type).toBe("image/webp");
    expect(result.name).toBe("avatar.webp");
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 512, 256);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.82);
    expect(close).toHaveBeenCalled();
  });

  it("rejects non-image files", async () => {
    const file = new File(["text"], "notes.txt", { type: "text/plain" });

    await expect(compressAvatarToWebp(file)).rejects.toThrow("Choose an image file.");
  });
});
