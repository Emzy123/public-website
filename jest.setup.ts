import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof (global as unknown as { TextDecoder: unknown }).TextDecoder === 'undefined') {
  (global as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;
}

if (typeof (global as unknown as { structuredClone: unknown }).structuredClone === 'undefined') {
  (global as unknown as { structuredClone: <T>(obj: T) => T }).structuredClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  };
}

if (typeof (global as any).setImmediate === 'undefined') {
  (global as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) => setTimeout(fn, 0, ...args);
}

if (typeof (global as any).clearImmediate === 'undefined') {
  (global as any).clearImmediate = (id: any) => clearTimeout(id);
}

