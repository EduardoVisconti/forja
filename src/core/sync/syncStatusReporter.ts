import type { SyncStatus } from './types';

type SyncStatusReporter = (status: SyncStatus) => void;

let reporter: SyncStatusReporter | null = null;

export function registerSyncStatusReporter(nextReporter: SyncStatusReporter): void {
  reporter = nextReporter;
}

export function reportSyncStatus(status: SyncStatus): void {
  reporter?.(status);
}
