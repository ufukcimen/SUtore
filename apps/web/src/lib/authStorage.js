const USER_STORAGE_KEY = "sutoreUser";
const AUTH_STORAGE_EVENT = "sutore-auth-change";
let cachedStoredUser = null;
let cachedParsedUser = null;
let hasCachedSnapshot = false;

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function updateCachedSnapshot(storedUser) {
  cachedStoredUser = storedUser;
  cachedParsedUser = storedUser ? JSON.parse(storedUser) : null;
  hasCachedSnapshot = true;
  return cachedParsedUser;
}

function notifyAuthChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_STORAGE_EVENT));
}

export function readStoredUser() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
    if (hasCachedSnapshot && storedUser === cachedStoredUser) {
      return cachedParsedUser;
    }

    return updateCachedSnapshot(storedUser);
  } catch {
    cachedStoredUser = null;
    cachedParsedUser = null;
    hasCachedSnapshot = true;
    return null;
  }
}

export function writeStoredUser(user) {
  if (!canUseLocalStorage()) {
    return;
  }

  const serializedUser = JSON.stringify(user);
  window.localStorage.setItem(USER_STORAGE_KEY, serializedUser);
  updateCachedSnapshot(serializedUser);
  notifyAuthChange();
}

export function clearStoredUser() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(USER_STORAGE_KEY);
  cachedStoredUser = null;
  cachedParsedUser = null;
  hasCachedSnapshot = true;
  notifyAuthChange();
}

export function subscribeStoredUser(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleStorageChange(event) {
    if (event?.type === "storage" && event.key && event.key !== USER_STORAGE_KEY) {
      return;
    }

    listener();
  }

  window.addEventListener(AUTH_STORAGE_EVENT, handleStorageChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener(AUTH_STORAGE_EVENT, handleStorageChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}
