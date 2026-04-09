const USER_STORAGE_KEY = "sutoreUser";
const AUTH_STORAGE_EVENT = "sutore-auth-change";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

export function writeStoredUser(user) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  notifyAuthChange();
}

export function clearStoredUser() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(USER_STORAGE_KEY);
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
