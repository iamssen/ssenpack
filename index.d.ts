import { MiddlewareHandler, PerRouteMiddleware } from 'browser-sync';

declare module 'ssenpack' {
  export interface Options {
    web: {
      entry: {[name: string]: string | string[]};
      dll: {[name: string]: string[]};
      externals: {[name: string]: string};
      static: string[];
      port: number;
    }
    
    server?: {
      entry: string;
      port: number;
      middleware?: (MiddlewareHandler | PerRouteMiddleware)[];
    }
    
    libs?: {
      entry: {[name: string]: {group?: string}}
    }
  }
  
  export interface Web {
    build(): void;
    
    dev: {
      build(): void;
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
    
    dll: {
      build(): void;
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
  
  const main: (options: Options) => {
    web: Web;
    electron: Electron;
    libs: Libs;
    messages: Messages;
    editor: Editor;
  };
  
  export = main;
}