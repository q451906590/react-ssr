
declare var window: Window;
declare var __SSR__: string;
declare var module: any;
declare var manifest: any;
declare module "*.json" {
  const value: any;
  export default value;
 }
interface Window {
  [p: string]: any
}

declare module '*.css' {
  const content: any;
  export default content;
}
declare module '*.scss' {
  const content: any;
  export default content;
}

declare module 'isomorphic-style-loader/withStyles' {
  import withStyles from 'isomorphic-style-loader/withStyles';
  export default withStyles;
}

declare module 'isomorphic-style-loader/StyleContext' {
  import StyleContext from 'isomorphic-style-loader/StyleContext';
  export default StyleContext;
}