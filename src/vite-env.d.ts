/// <reference types="svelte" />
/// <reference types="vite/client" />

// Declare Svelte component modules for TypeScript
declare module "*.svelte" {
  import type { Component } from "svelte";
  const component: Component;
  export default component;
}
