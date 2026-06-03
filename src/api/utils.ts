export const toSnakeCase = <T>(obj: T): any => {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj === null || typeof obj !== "object" || obj instanceof Date) return obj;
  return Object.keys(obj as object).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    (acc as any)[snakeKey] = toSnakeCase((obj as any)[key]);
    return acc;
  }, {} as any);
};

export const toCamelCase = <T = any>(obj: any): T => {
  if (Array.isArray(obj)) return obj.map(toCamelCase) as any;
  if (obj === null || typeof obj !== "object" || obj instanceof Date) return obj;
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/([-_][a-z])/g, group => group.toUpperCase().replace("-", "").replace("_", ""));
    (acc as any)[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any) as T;
};
