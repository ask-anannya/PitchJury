// global types

// 百度地图GL版本全局类型声明
/// <reference types="bmapgl" />

// Pendo analytics agent
declare const pendo: { track(eventName: string, properties?: Record<string, unknown>): void } | undefined;
interface Pendo {
  trackAgent: (eventType: string, metadata: object) => void;
  [key: string]: unknown;
}

interface Window {
  pendo?: Pendo;
}
declare var pendo: any;
