import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { firebaseApp } from "./firebase-config";
import { auth } from "./auth";

export const db = getFirestore(firebaseApp);
const workerUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL?.replace(
  /\/$/,
  "",
);

function getCurrentUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("로그인한 사용자가 없습니다.");
  }

  return user;
}

function getTodosCollection() {
  return collection(db, "users", getCurrentUser().uid, "todos");
}

/**
 * 로그인한 사용자의 Firebase ID 토큰을 Worker에 전달합니다.
 * Worker가 이 토큰을 검증하여 사용자 UID를 확인합니다.
 */
async function requestWorker(user, path, options = {}) {
  if (!workerUrl) {
    throw new Error("VITE_WORKER_URL이 설정되지 않았습니다.");
  }

  const token = await user.getIdToken();

  const response = await fetch(`${workerUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `알림 서버 요청 실패 (${response.status})${detail ? `: ${detail}` : ""}`,
    );
  }
}

/**
 * 하나의 Todo에 설정된 알림 일정을 Worker에 동기화합니다.
 */
async function syncTodoNotifications(user, task) {
  const path = `/todos/${encodeURIComponent(task.id)}/notifications`;
  const now = Date.now();

  const notifications = (task.notifications ?? [])
    .filter(
      (notification) =>
        typeof notification.id === "string" &&
        Number.isFinite(notification.notifyAt) &&
        notification.notifyAt > now,
    )
    .map(({ id, notifyAt }) => ({ id, notifyAt }));

  await requestWorker(user, path, {
    method: "PUT",
    body: JSON.stringify({
      title: task.title,
      status: task.status,
      notifications: task.status === "DONE" ? [] : notifications,
    }),
  });
}

/**
 * 현재 사용자의 모든 Todo를 가져오고 알림 일정을 동기화합니다.
 */
export async function getTodos() {
  const user = getCurrentUser();
  const snapshot = await getDocs(collection(db, "users", user.uid, "todos"));

  const tasks = snapshot.docs.map((todoDoc) => todoDoc.data());

  const results = await Promise.allSettled(
    tasks.map((task) => syncTodoNotifications(user, task)),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`Todo ${tasks[index].id} 알림 동기화 실패:`, result.reason);
    }
  });

  return tasks;
}

/**
 * Todo를 저장한 다음 알림 일정을 Worker에 반영합니다.
 */
export async function saveTodo(task) {
  const user = getCurrentUser();
  const todoRef = doc(db, "users", user.uid, "todos", task.id);

  await setDoc(todoRef, task);

  try {
    await syncTodoNotifications(user, task);
  } catch (error) {
    console.error("Todo는 저장됐지만 알림 예약에 실패했습니다:", error);
    throw new Error(
      "할 일은 저장됐지만 알림 예약에 실패했습니다. 잠시 후 다시 시도해주세요.",
      { cause: error },
    );
  }
}

/**
 * Worker의 예약 알림을 제거한 뒤 Todo를 삭제합니다.
 */
export async function deleteTodo(taskId) {
  const user = getCurrentUser();
  const path = `/todos/${encodeURIComponent(taskId)}/notifications`;

  await requestWorker(user, path, { method: "DELETE" });

  const todoRef = doc(db, "users", user.uid, "todos", taskId);
  await deleteDoc(todoRef);
}

/**
 * 현재 사용자의 모든 Todo를 삭제합니다.
 */
export async function deleteAllTodos() {
  const snapshot = await getDocs(getTodosCollection());

  await Promise.all(snapshot.docs.map((todoDoc) => deleteTodo(todoDoc.id)));
}

/**
 * 현재 로그인한 사용자의 프로필을 가져옵니다.
 */
export async function getUserProfile() {
  const userRef = doc(db, "users", getCurrentUser().uid);
  const snapshot = await getDoc(userRef);

  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * 현재 로그인한 사용자의 프로필을 저장합니다.
 */
export async function saveUserProfile(profile) {
  const userRef = doc(db, "users", getCurrentUser().uid);

  await setDoc(userRef, profile, { merge: true });
}
// /**
//  * 현재 로그인한 사용자의 UID를 반환합니다.
//  *
//  * @returns {string}
//  * @throws {Error} 로그인한 사용자가 없는 경우
//  */
// function getCurrentUserId() {
//   const user = auth.currentUser;

//   if (!user) {
//     throw new Error("로그인한 사용자가 없습니다.");
//   }

//   return user.uid;
// }

// /**
//  * 현재 로그인한 사용자의 Todo 컬렉션을 반환합니다.
//  *
//  * Firestore 구조:
//  * users/{uid}/todos/{taskId}
//  *
//  * @returns {CollectionReference}
//  */
// function getTodosCollection() {
//   const uid = getCurrentUserId();

//   return collection(db, "users", uid, "todos");
// }

// /**
//  * 현재 사용자의 모든 Todo를 가져옵니다.
//  *
//  * @returns {Promise<Array>}
//  */
// export async function getTodos() {
//   const snapshot = await getDocs(getTodosCollection());

//   return snapshot.docs.map((todoDoc) => todoDoc.data());
// }

// /**
//  * Todo를 생성하거나 수정합니다.
//  *
//  * @param {Object} task
//  */
// export async function saveTodo(task) {
//   const uid = getCurrentUserId();

//   const todoRef = doc(db, "users", uid, "todos", task.id);

//   await setDoc(todoRef, task);
// }

// /**
//  * Todo 하나를 삭제합니다.
//  *
//  * @param {string} taskId
//  */
// export async function deleteTodo(taskId) {
//   const uid = getCurrentUserId();

//   const todoRef = doc(db, "users", uid, "todos", taskId);

//   await deleteDoc(todoRef);
// }
// /**
//  * 현재 로그인한 사용자의 모든 Todo를 삭제합니다.
//  *
//  * @returns {Promise<void>}
//  */
// export async function deleteAllTodos() {
//   const snapshot = await getDocs(getTodosCollection());

//   await Promise.all(snapshot.docs.map((todoDoc) => deleteDoc(todoDoc.ref)));
// }
// /**
//  * 현재 로그인한 사용자의 프로필 정보를 가져옵니다.
//  *
//  * Firestore 구조:
//  * users/{uid}
//  *
//  * @returns {Promise<Object|null>}
//  */
// export async function getUserProfile() {
//   const uid = getCurrentUserId();
//   const userRef = doc(db, "users", uid);

//   const snapshot = await getDoc(userRef);

//   if (!snapshot.exists()) {
//     return null;
//   }

//   return snapshot.data();
// }

// /**
//  * 현재 로그인한 사용자의 프로필 정보를 저장하거나 수정합니다.
//  *
//  * 기존 사용자 문서의 다른 필드는 유지합니다.
//  *
//  * @param {Object} profile
//  * @returns {Promise<void>}
//  */
// export async function saveUserProfile(profile) {
//   const uid = getCurrentUserId();
//   const userRef = doc(db, "users", uid);

//   await setDoc(userRef, profile, {
//     merge: true,
//   });
// }
