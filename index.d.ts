import { MiddlewareHandler, PerRouteMiddleware } from 'browser-sync';

declare module 'ssenpack' {
  export interface Options {
    style?: {
      styleFileName?: string;
      themeFilePrefixName?: string;
      themes?: string[];
    }
    
    web?: {
      entry: {[name: string]: string | string[]};
      externals: {[name: string]: string};
      static: string[];
      publicPath?: string;
      vendorChunkName?: string;
      chunkFileDirectory?: string;
      port: number;
      https?: boolean | {key: string, cert: string};
    }
    
    server?: {
      entry: string;
      port: number;
      middleware?: (MiddlewareHandler | PerRouteMiddleware)[];
    }
    
    libs?: {
      entry: {[name: string]: {group?: string}}
    }

    tsc?: {
      entry: {
        file: string;
        outFile: string;
        includeNodeExternals?: boolean;
        libraryTarget?: string;
      }[];
    }
    
    webpackConfig?: (command: string, config: object) => object;
  }
  
  export interface Web {
    build(): void;
    
    dev: {
      build: {
        (): void;
        watch(): void;
      };
      start(): void;
    }
    
    server: {
      build(): void;
      
      dev: {
        build: {
          (): void;
          watch(): void;
        };
        start(): void;
      }
    }
  }
  
  export interface Electron {
    dev: {
      build: {
        (): void;
        watch(): void;
      };
    }
  }
  
  export interface Libs {
    build(): void;
    
    publish(): void;
  }
  
  export interface Messages {
    build(): void;
  }
  
  export interface Editor {
    alias(): object;
  }

  export interface TSC {
    build(): void;
  }
  
  const createSSenpack: (options: Options) => {
    web: Web;
    electron: Electron;
    libs: Libs;
    messages: Messages;
    editor: Editor;
    tsc: TSC;
  };
  
  export = createSSenpack;
}