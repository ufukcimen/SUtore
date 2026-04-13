import {
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Mic2,
  Monitor,
  Router,
  Sparkles,
} from "lucide-react";

/**
 * Maps icon name strings (stored in the categories table) to
 * lucide-react components. lucide icons cannot be dynamic-imported
 * at runtime so this bounded map is the standard approach.
 */
export const ICON_MAP = {
  sparkles: Sparkles,
  laptop: Laptop,
  monitor: Monitor,
  cpu: Cpu,
  "hard-drive": HardDrive,
  keyboard: Keyboard,
  gamepad2: Gamepad2,
  headphones: Headphones,
  router: Router,
  mic2: Mic2,
};

/** Resolve an icon string to a component, with a fallback. */
export function resolveIcon(name) {
  return ICON_MAP[name] || Sparkles;
}
