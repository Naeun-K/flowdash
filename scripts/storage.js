export function createStorage(storageName) {
  return {
    set(key, value) {
      const fullKey = `${storageName}:${key}`;
      localStorage.setItem(fullKey, JSON.stringify(value));
    },
    get(key) {
      const fullKey = `${storageName}:${key}`;
      const data = localStorage.getItem(fullKey);
      return data ? JSON.parse(data) : null;
    },
    remove(key) {
      localStorage.removeItem(`${storageName}:${key}`);
    },
  };
}
