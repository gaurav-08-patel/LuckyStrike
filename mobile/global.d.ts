/// <reference types="nativewind/types" />

declare module '*.css' {
  const content: { [key: string]: unknown };
  export default content;
}
