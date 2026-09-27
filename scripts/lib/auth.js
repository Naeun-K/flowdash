import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { firebaseApp } from "./firebase-config";

export const auth = getAuth(firebaseApp);

/**
 * Firebase 로그인 상태를 브라우저에 지속적으로 유지합니다.
 * - 새로고침 후에도 로그인 유지
 * - 브라우저를 종료했다가 다시 실행해도 로그인 유지
 * - 명시적으로 로그아웃할 때까지 인증 상태 유지
 *
 * @returns {Promise<void>}
 */
export const initializeAuthPersistence = () =>
  setPersistence(auth, browserLocalPersistence);

export const signUp = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const observeAuthState = (callback) =>
  onAuthStateChanged(auth, callback);
