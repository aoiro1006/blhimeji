import { AsyncLocalStorage } from "async_hooks";

/** 管理APIリクエスト単位で expectedVersion を渡すための一時コンテキスト */
const storage = new AsyncLocalStorage<{ expectedVersion?: number }>();

export function runWithExpectedDocumentVersion<T>(
  version: number | undefined,
  fn: () => Promise<T>
): Promise<T> {
  return storage.run({ expectedVersion: version }, fn);
}

export function peekExpectedDocumentVersion(): number | undefined {
  return storage.getStore()?.expectedVersion;
}
