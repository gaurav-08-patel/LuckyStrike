declare namespace JSX {
  interface IntrinsicAttributes {
    className?: string;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      className?: string;
    }
  }
}

export {};

declare module '*.css' {
  const content: { [key: string]: unknown };
  export default content;
}
