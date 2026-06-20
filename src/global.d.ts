// global types

// 百度地图GL版本全局类型声明
/// <reference types="bmapgl" />

interface Pendo {
  trackAgent: (eventType: string, metadata: object) => void;
  [key: string]: unknown;
}

interface Window {
  pendo?: Pendo;
}
declare var pendo: any;
