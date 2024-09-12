function getChunkedString(str: string, length: number): string[] {
  return str.match(new RegExp(".{1," + length + "}", "g")) || [];
}

export default getChunkedString;
