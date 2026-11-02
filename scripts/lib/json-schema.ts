// イベントデータのスキーマで使っている範囲だけに絞った、JSON Schema のチェッカー。
// 依存パッケージを増やさないために自前で持つ。対応するキーワード:
// $ref（同じファイル内の #/$defs/...）, type, const, enum, pattern, minLength,
// required, properties, additionalProperties, items, minItems
// それ以外のキーワード（description など）は読み飛ばす。

export interface JsonSchema {
  $ref?: string;
  type?: string | string[];
  const?: unknown;
  enum?: unknown[];
  pattern?: string;
  minLength?: number;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  minItems?: number;
  $defs?: Record<string, JsonSchema>;
  [key: string]: unknown;
}

export interface SchemaError {
  /** days[0].stages[1].slots[2].start のような場所 */
  path: string;
  message: string;
}

const typeOf = (v: unknown): string => {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (Number.isInteger(v)) return "integer";
  return typeof v;
};

const matchesType = (v: unknown, type: string): boolean => {
  const actual = typeOf(v);
  return actual === type || (type === "number" && actual === "integer");
};

const join = (path: string, key: string | number): string =>
  typeof key === "number" ? `${path}[${key}]` : path ? `${path}.${key}` : key;

const show = (v: unknown): string => JSON.stringify(v);

export function checkSchema(root: JsonSchema, value: unknown): SchemaError[] {
  const errors: SchemaError[] = [];

  const resolve = (ref: string): JsonSchema => {
    const prefix = "#/$defs/";
    const def = ref.startsWith(prefix) ? root.$defs?.[ref.slice(prefix.length)] : undefined;
    if (!def) throw new Error(`スキーマの $ref "${ref}" を解決できません`);
    return def;
  };

  const visit = (schema: JsonSchema, v: unknown, path: string): void => {
    const at = path || "(ルート)";
    if (schema.$ref) visit(resolve(schema.$ref), v, path);

    if (schema.type !== undefined) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      if (!types.some((t) => matchesType(v, t))) {
        errors.push({ path: at, message: `${types.join(" または ")} が必要です（実際は ${typeOf(v)}）` });
        return;
      }
    }
    if ("const" in schema && v !== schema.const) {
      errors.push({ path: at, message: `${show(schema.const)} にしてください（実際は ${show(v)}）` });
    }
    if (schema.enum && !schema.enum.includes(v)) {
      errors.push({ path: at, message: `${schema.enum.map(show).join(" / ")} のいずれかにしてください（実際は ${show(v)}）` });
    }

    if (typeof v === "string") {
      if (schema.minLength !== undefined && v.length < schema.minLength) {
        errors.push({ path: at, message: "空文字にはできません" });
      }
      if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(v)) {
        errors.push({ path: at, message: `形式が正しくありません（${show(v)}）` });
      }
    }

    if (Array.isArray(v)) {
      if (schema.minItems !== undefined && v.length < schema.minItems) {
        errors.push({ path: at, message: `${schema.minItems}件以上必要です` });
      }
      if (schema.items) {
        const itemSchema = schema.items;
        v.forEach((item, i) => visit(itemSchema, item, join(path, i)));
      }
    }

    if (typeOf(v) === "object") {
      const obj = v as Record<string, unknown>;
      for (const key of schema.required ?? []) {
        if (!(key in obj)) errors.push({ path: at, message: `${key} は必須です` });
      }
      for (const [key, child] of Object.entries(obj)) {
        const propSchema = schema.properties?.[key];
        if (propSchema) visit(propSchema, child, join(path, key));
        else if (schema.additionalProperties === false) {
          errors.push({ path: join(path, key), message: "スキーマにない項目です" });
        } else if (typeof schema.additionalProperties === "object") {
          visit(schema.additionalProperties, child, join(path, key));
        }
      }
    }
  };

  visit(root, value, "");
  return errors;
}
