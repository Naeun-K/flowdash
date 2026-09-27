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

/**
 * 현재 로그인한 사용자의 UID를 반환합니다.
 *
 * @returns {string}
 * @throws {Error} 로그인한 사용자가 없는 경우
 */
function getCurrentUserId() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("로그인한 사용자가 없습니다.");
  }

  return user.uid;
}

/**
 * 현재 로그인한 사용자의 Todo 컬렉션을 반환합니다.
 *
 * Firestore 구조:
 * users/{uid}/todos/{taskId}
 *
 * @returns {CollectionReference}
 */
function getTodosCollection() {
  const uid = getCurrentUserId();

  return collection(db, "users", uid, "todos");
}

/**
 * 현재 사용자의 모든 Todo를 가져옵니다.
 *
 * @returns {Promise<Array>}
 */
export async function getTodos() {
  const snapshot = await getDocs(getTodosCollection());

  return snapshot.docs.map((todoDoc) => todoDoc.data());
}

/**
 * Todo를 생성하거나 수정합니다.
 *
 * @param {Object} task
 */
export async function saveTodo(task) {
  const uid = getCurrentUserId();

  const todoRef = doc(db, "users", uid, "todos", task.id);

  await setDoc(todoRef, task);
}

/**
 * Todo 하나를 삭제합니다.
 *
 * @param {string} taskId
 */
export async function deleteTodo(taskId) {
  const uid = getCurrentUserId();

  const todoRef = doc(db, "users", uid, "todos", taskId);

  await deleteDoc(todoRef);
}
/**
 * 현재 로그인한 사용자의 모든 Todo를 삭제합니다.
 *
 * @returns {Promise<void>}
 */
export async function deleteAllTodos() {
  const snapshot = await getDocs(getTodosCollection());

  await Promise.all(snapshot.docs.map((todoDoc) => deleteDoc(todoDoc.ref)));
}
/**
 * 현재 로그인한 사용자의 프로필 정보를 가져옵니다.
 *
 * Firestore 구조:
 * users/{uid}
 *
 * @returns {Promise<Object|null>}
 */
export async function getUserProfile() {
  const uid = getCurrentUserId();
  const userRef = doc(db, "users", uid);

  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}

/**
 * 현재 로그인한 사용자의 프로필 정보를 저장하거나 수정합니다.
 *
 * 기존 사용자 문서의 다른 필드는 유지합니다.
 *
 * @param {Object} profile
 * @returns {Promise<void>}
 */
export async function saveUserProfile(profile) {
  const uid = getCurrentUserId();
  const userRef = doc(db, "users", uid);

  await setDoc(userRef, profile, {
    merge: true,
  });
}
