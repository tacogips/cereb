import {
  readFileBytes,
  readFileBase64,
  writeToPath,
  readFileString,
  uint8ArrayToBase64,
} from "./reader";
import {
  type MessageBody,
  type ImageType,
  newTextBody,
  newImageBody,
  detectImageTypeFromFilePathOrUrl,
} from "~/ai-service";

export { readFileBytes, readFileBase64, writeToPath };

type FilePath = {
  type: "file";
  path: string;
  imageType: ImageType | null;
};

type Url = {
  type: "url";
  url: string;
  imageType: ImageType | null;
};

export type Attachment = FilePath | Url;

export function isUrl(maybeUrl: string): boolean {
  // TODO(tacogips) very naive implementation for now
  return (
    maybeUrl.startsWith("http:") ||
    maybeUrl.startsWith("https:") ||
    maybeUrl.startsWith("ftp:")
  );
}

export async function isFilePath(maybePath: string): Promise<boolean> {
  return Bun.file(maybePath).exists();
}

//TODO(tacogips) consider the case the webp binary is passed
export async function detectAttachmentType(
  pathOrUrl: string,
): Promise<Attachment> {
  const imageType = detectImageTypeFromFilePathOrUrl(pathOrUrl);

  if (isUrl(pathOrUrl)) {
    return {
      type: "url",
      url: pathOrUrl,
      imageType,
    };
  } else if (await isFilePath(pathOrUrl)) {
    return {
      type: "file",
      path: pathOrUrl,
      imageType,
    };
  }
  throw new Error("Invalid path or url");
}

function isDownloadableUrl(url: string): boolean {
  return url.endsWith("csv") || url.endsWith("json");
}

const fetchText = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Fetching failed:", error);
    throw error;
  }
};

async function downloadImageAsUint8Array(url: string): Promise<Uint8Array> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
}

export async function pathOrUrlToAttachmentMessage(
  pathOrUrl: string,
): Promise<MessageBody> {
  const attachmentType = await detectAttachmentType(pathOrUrl);

  switch (attachmentType.type) {
    case "file":
      if (attachmentType.imageType) {
        const imageBase64 = await readFileBase64(attachmentType.path);
        return newImageBody(attachmentType.imageType, imageBase64);
      }
      // error if the file is binary  so it failed to open the file as text
      const fileText = await readFileString(attachmentType.path);
      return newTextBody(fileText);
    case "url":
      if (attachmentType.imageType) {
        const imageContent = await downloadImageAsUint8Array(
          attachmentType.url,
        );

        return newImageBody(
          attachmentType.imageType,
          uint8ArrayToBase64(imageContent),
        );
      }
      if (isDownloadableUrl(attachmentType.url)) {
        const content = fetchText(attachmentType.url).catch((error) =>
          console.error("Download Error:", error),
        );
        return newTextBody("```" + content + "```");
      }
      return newTextBody(attachmentType.url);
  }
}

export function filePathExists(pattern: string, cwd?: string): boolean {
  return Array.from(new Bun.Glob(pattern).scanSync(cwd)).length > 0;
}
