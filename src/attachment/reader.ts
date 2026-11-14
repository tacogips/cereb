export async function readFileBytes(path: string): Promise<Uint8Array> {
  //TODO(tacogips) error occured with .bytes()
  //TypeError: Bun.file(path).bytes is not a function. (In 'Bun.file(path).bytes()', 'Bun.file(path).bytes' is undefined)
  //const content = await Bun.file(path).bytes();

  const buffer = await Bun.file(path).arrayBuffer();
  return new Uint8Array(buffer);
}

export async function readFileBase64(path: string): Promise<string> {
  const content = await readFileBytes(path);
  return uint8ArrayToBase64(content);
}

export async function readFileString(path: string): Promise<string> {
  return await Bun.file(path).text();
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

export async function writeToPath(content: ArrayBuffer, path: string) {
  Bun.write(path, content);
}

export function base64ToImage(base64String: string): Uint8Array {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
