declare module '@modelcontextprotocol/sdk' {
  export interface Mcp {
    registerTool(name: string, fn: (params?: any) => any, meta?: any): void;
    startStdio(): Promise<void>;
    on(event: string, cb: (...args: any[]) => void): void;
  }

  export function createMcp(opts?: { name?: string; version?: string }): Mcp;
}
