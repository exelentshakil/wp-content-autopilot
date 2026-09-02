"use client";

import { useEffect, useState } from "react";
import { Settings } from "./types";

const STORAGE_KEY = "wp_autopilot_settings";

export function defaultSettings(): Settings {
  return Settings.parse({});
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    return Settings.parse(JSON.parse(raw));
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setReady(true);
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = Settings.parse({ ...prev, ...patch });
      saveSettings(next);
      return next;
    });
  };

  return { settings, update, ready };
}
