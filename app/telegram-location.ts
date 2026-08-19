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

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        LocationManager?: TelegramLocationManager;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

export function getTelegramLocationManager() {
  return window.Telegram?.WebApp?.LocationManager ?? null;
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
