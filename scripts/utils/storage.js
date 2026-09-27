/**
 * @file storage.js
 * @description 브라우저 로컬 스토리지를 안전하게 그룹화(Namespace)하여 CRUD 작업을 수행하는 헬퍼 모듈입니다.
 */

/**
 * 현재 브라우저 환경에서 로컬 스토리지(localStorage) 사용이 가능한지 검증합니다.
 * - 시크릿 모드 또는 브라우저 설정에 의해 스토리지가 차단되었거나 용량이 가득 찬 경우 등을 진단합니다.
 *
 * @function isLocalStorageAvailable
 * @returns {boolean} 로컬 스토리지에 값을 정상적으로 쓰고 지울 수 있으면 true, 실패하면 false를 반환합니다.
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
 * 특정 네임스페이스(Prefix)로 묶인 로컬 스토리지의 모든 키-값 쌍을 수집하여 콘솔에 테이블 형태로 출력합니다.
 * - 저장된 원본 JSON 데이터를 복원하여 정형화된 데이터 상태를 시각화합니다.
 *
 * @function showCurrentStorageData
 * @param {string} storageName - 로컬 스토리지 키를 분류할 접두사(Prefix) 그룹 이름
 * @returns {void}
 */
function showCurrentStorageData(storageName) {
  try {
    const storedData = {};
    let hasData = false;

    // 로컬 스토리지의 모든 요소를 순회하며 지정된 접두사로 시작하는 데이터만 추출
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (fullKey && fullKey.startsWith(`${storageName}:`)) {
        const subKey = fullKey.replace(`${storageName}:`, "");
        const rawValue = localStorage.getItem(fullKey);

        // JSON 파싱 시도 (문자열인 경우 그대로 유지)
        try {
          storedData[subKey] = JSON.parse(rawValue);
        } catch {
          storedData[subKey] = rawValue;
        }
        hasData = true;
      }
    }

    // 콘솔 테이블 뷰 출력 조작
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
 * @typedef {Object} StorageInstance
 * @property {function(string, *): void} set - 데이터를 JSON 문자열로 인코딩하여 로컬 스토리지에 저장하는 함수
 * @property {function(string): (*|null)} get - 데이터를 조회하고 JSON 객체로 자동 디코딩하여 반환하는 함수
 * @property {function(string): void} remove - 지정된 키에 대응하는 데이터를 스토리지에서 파괴하는 함수
 */

/**
 * 지정된 네임스페이스명을 기준으로 동작하는 독립된 로컬 스토리지 제어 객체(API Instance)를 생성합니다.
 *
 * @function createStorage
 * @param {string} storageName - 생성되는 저장소 인스턴스가 사용할 고유 접두사 (식별 구분자)
 * @returns {StorageInstance} 지정된 네임스페이스를 관리하는 가상의 스토리지 입출력 제어 객체
 */
export function createStorage(storageName) {
  const isAvailable = isLocalStorageAvailable();

  // 초기화 시점의 활성화 상태 체크 및 로그 출력
  if (!isAvailable) {
    console.error(
      `🔴 [LocalStorage] 로컬스토리지 사용이 불가능합니다! (차단됨 또는 용량 초과)`,
    );
  } else {
    console.log(`🟢 [LocalStorage] 로컬스토리지가 활성화되어 있습니다.`);
    showCurrentStorageData(storageName);
  }

  return {
    /**
     * 로컬 스토리지에 직렬화된 데이터를 안전하게 기록합니다.
     *
     * @memberof StorageInstance
     * @param {string} key - 네임스페이스 뒤에 붙을 세부 저장 Key 이름
     * @param {*} value - 저장할 실제 자바스크립트 값 (객체, 배열, 기본 타입 모두 지원)
     */
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

        // 업데이트 이후 현황 시각화
        showCurrentStorageData(storageName);
      } catch (error) {
        console.error(
          `🔴 [LocalStorage 저장 오류] '${key}' 저장 중 에러 발생:`,
          error.message,
        );
      }
    },

    /**
     * 로컬 스토리지에서 데이터를 읽어와 원본 타입으로 자동 복원합니다.
     *
     * @memberof StorageInstance
     * @param {string} key - 네임스페이스 뒤에 붙은 상세 조회 Key 이름
     * @returns {*|null} 역직렬화(Parsing) 완료된 자바스크립트 값 또는 데이터가 없는 경우 null
     */
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

    /**
     * 로컬 스토리지에서 해당 키에 속하는 데이터를 지우고 현황을 동기화합니다.
     *
     * @memberof StorageInstance
     * @param {string} key - 네임스페이스에서 제거할 Key 이름
     */
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
