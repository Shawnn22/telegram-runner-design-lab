export type TelegramLocationData = {
  latitude: number;
  longitude: number;
  horizontal_accuracy?: number | null;
  speed?: number | null;
};

export type TelegramLocationManager = {
  isLocationAvailable: boolean;
  isAccessGranted: boolean;
  init: (callback?: () => void) => TelegramLocationManager;
  getLocation: (callback: (location: TelegramLocationData | null) => void) => TelegramLocationManager;
  openSettings: () => TelegramLocationManager;
};

export type TelegramWebApp = {
  LocationManager?: TelegramLocationManager;
  initData?: string;
  ready?: () => void;
  expand?: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp() {
  return window.Telegram?.WebApp ?? null;
}

export function initializeTelegramWebApp() {
  const webApp = getTelegramWebApp();
  webApp?.ready?.();
  webApp?.expand?.();
  return Boolean(webApp?.initData);
}

export function getTelegramLocationManager() {
  return getTelegramWebApp()?.LocationManager ?? null;
}

export function initializeTelegramLocation(manager: TelegramLocationManager, timeoutMs = 2500) {
  return new Promise<boolean>((resolve) => {
    const timeout = window.setTimeout(() => resolve(false), timeoutMs);
    manager.init(() => {
      window.clearTimeout(timeout);
      resolve(manager.isLocationAvailable);
    });
  });
}

export function requestTelegramLocation(manager: TelegramLocationManager, timeoutMs = 6000) {
  return new Promise<TelegramLocationData | null>((resolve) => {
    let settled = false;
    const finish = (location: TelegramLocationData | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(location);
    };
    const timeout = window.setTimeout(() => finish(null), timeoutMs);
    manager.getLocation(finish);
  });
}
