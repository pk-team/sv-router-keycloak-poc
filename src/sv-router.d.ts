declare module 'sv-router' {
  export * from 'sv-router/src/index';
}

declare module 'sv-router' {
  interface RouteMeta {
    requireAuth?: boolean;
  }
}