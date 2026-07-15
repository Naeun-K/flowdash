// export function createStorage(storageName) {
//   return {
//     set(key, value) {
//       const fullKey = `${storageName}:${key}`;
//       localStorage.setItem(fullKey, JSON.stringify(value));
//     },
//     get(key) {
//       const fullKey = `${storageName}:${key}`;
//       const data = localStorage.getItem(fullKey);
//       return data ? JSON.parse(data) : null;
//     },
//     remove(key) {
//       localStorage.removeItem(`${storageName}:${key}`);
//     },
//   };
// }

/**
 * 로컬스토리지의 실제 정상 작동 여부를 사전에 검증하는 헬퍼 함수
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
 * 로컬스토리지에 담긴 현재 프리픽스(storageName) 기반의 데이터를
 * 시각적으로 보여주는 디버깅용 함수
 */
function showCurrentStorageData(storageName) {
  try {
    const storedData = {};
    let hasData = false;

    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      // 현재 스토리지 이름(예: flowdash-theme)으로 시작하는 키만 필터링
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
      console.table(storedData); // 테이블 형식으로 깔끔하게 출력
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

export function createStorage(storageName) {
  // 사용 가능 여부 최초 1회 판별
  const isAvailable = isLocalStorageAvailable();

  if (!isAvailable) {
    console.error(
      `🔴 [LocalStorage] 로컬스토리지 사용이 불가능합니다! (차단됨 또는 용량 초과)`,
    );
  } else {
    console.log(`🟢 [LocalStorage] 로컬스토리지가 활성화되어 있습니다.`);
    // 초기 로드 시 한 번 저장 상태를 콘솔에 보여줍니다.
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

        // 저장될 때마다 실시간으로 로컬스토리지에 담긴 모습을 콘솔에 출력
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
