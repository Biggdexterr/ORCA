// Redis not configured — no caching in development
export const redis = null;
export const cacheGet = async (_key: string) => null;
export const cacheSet = async (_key: string, _value: any) => null;
export const cacheDel = async (_key: string) => null;
