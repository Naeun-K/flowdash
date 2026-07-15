/**
 * Checks whether localStorage is available in the current browser environment.
 * @returns {boolean} True when storage access succeeds.
 */
function isLocalStorageAvailable() {
  const testKey = "__storage_test__";
  try {
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Logs the currently stored values for a given storage prefix.
 * @param {string} storageName - Prefix used to group stored entries.
 */
function showCurrentStorageData(storageName) {
  try {
    const storedData = {};
    let hasData = false;

    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (fullKey && fullKey.startsWith(`${storageName}:`)) {
        const subKey = fullKey.replace(`${storageName}:`, "");
        const rawValue = localStorage.getItem(fullKey);
        try {
          storedData[subKey] = JSON.parse(rawValue);
        } catch {
          storedData[subKey] = rawValue;
        }
        hasData = true;
      }
    }

    if (hasData) {
      console.group(`📦 [LocalStorage] '${storageName}' 그룹에 저장된 데이터`);
      console.table(storedData);
      console.groupEnd();
    } else {
      console.log(
        `ℹ️ [LocalStorage] '${storageName}' 그룹에 저장된 데이터가 없습니다.`,
      );
    }
  } catch (e) {
    console.error(
      "🔴 [LocalStorage] 데이터 상태를 읽어오는 도중 오류 발생:",
      e.message,
    );
  }
}

/**
 * Creates a namespaced storage helper for reading and writing values.
 * @param {string} storageName - Prefix applied to all stored keys.
 * @returns {{ get: Function, set: Function, remove: Function }} A storage API instance.
 */
export function createStorage(storageName) {
  const isAvailable = isLocalStorageAvailable();

  if (!isAvailable) {
    console.error(
      `🔴 [LocalStorage] 로컬스토리지 사용이 불가능합니다! (차단됨 또는 용량 초과)`,
    );
  } else {
    console.log(`🟢 [LocalStorage] 로컬스토리지가 활성화되어 있습니다.`);
    showCurrentStorageData(storageName);
  }

  return {
    set(key, value) {
      if (!isAvailable) {
        console.warn(
          `⚠️ [LocalStorage 저장 실패] 로컬스토리지를 사용할 수 없어 '${key}'를 저장하지 못했습니다.`,
        );
        return;
      }

      const fullKey = `${storageName}:${key}`;
      try {
        localStorage.setItem(fullKey, JSON.stringify(value));
        console.log(`💾 [LocalStorage 저장 완료] ${key} ➔`, value);

        showCurrentStorageData(storageName);
      } catch (error) {
        console.error(
          `🔴 [LocalStorage 저장 오류] '${key}' 저장 중 에러 발생:`,
          error.message,
        );
      }
    },

    get(key) {
      if (!isAvailable) {
        console.warn(
          `⚠️ [LocalStorage 읽기 실패] 로컬스토리지를 사용할 수 없어 '${key}'를 읽지 못했습니다.`,
        );
        return null;
      }

      const fullKey = `${storageName}:${key}`;
      try {
        const data = localStorage.getItem(fullKey);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error(
          `🔴 [LocalStorage 읽기 오류] '${key}' 데이터를 가져오는 중 에러 발생:`,
          error.message,
        );
        return null;
      }
    },

    remove(key) {
      if (!isAvailable) return;

      const fullKey = `${storageName}:${key}`;
      try {
        localStorage.removeItem(fullKey);
        console.log(`🗑️ [LocalStorage 삭제 완료] ${key} 키가 삭제되었습니다.`);
        showCurrentStorageData(storageName);
      } catch (error) {
        console.error(
          `🔴 [LocalStorage 삭제 오류] '${key}' 삭제 중 에러 발생:`,
          error.message,
        );
      }
    },
  };
}
