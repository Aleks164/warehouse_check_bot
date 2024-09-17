function splitToNChunks<T>(array: T[], n: number) {
  const result: T[][] = [];
  if (!array.length) return result;
  const arrayCopy = [...array];
  const rows = Math.ceil(arrayCopy.length / n);
  for (let i = rows; i > 0; i--) {
    const chunk = arrayCopy.splice(0, n);
    if (chunk) result.push(chunk);
  }
  return result;
}

export default splitToNChunks;
