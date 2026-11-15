/** JSON.parse の結果など、中身の分からない値がオブジェクトかどうかを確かめる（配列も通る） */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
