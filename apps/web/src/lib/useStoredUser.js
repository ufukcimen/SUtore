import { useSyncExternalStore } from "react";
import { readStoredUser, subscribeStoredUser } from "./authStorage";

function getServerSnapshot() {
  return null;
}

export function useStoredUser() {
  return useSyncExternalStore(subscribeStoredUser, readStoredUser, getServerSnapshot);
}
