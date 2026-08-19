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

export function initializeTelegramLocation(manager: TelegramLocationManager) {
  return new Promise<boolean>((resolve) => {
    manager.init(() => resolve(manager.isLocationAvailable));
  });
}

export function requestTelegramLocation(manager: TelegramLocationManager) {
  return new Promise<TelegramLocationData | null>((resolve) => {
    manager.getLocation((location) => resolve(location));
  });
}
