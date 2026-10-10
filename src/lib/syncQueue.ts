import { SyncState } from '../types/canvas';

type TaskFn = () => Promise<void>;

interface QueueItem {
  id: string;
  action: TaskFn;
  retries: number;
  description: string;
}

class SyncQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private statusListeners: ((status: SyncState, queueLength: number) => void)[] = [];
  private currentStatus: SyncState = 'synced';
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setStatus('syncing');
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });
    }
  }

  public subscribeStatus(listener: (status: SyncState, queueLength: number) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.currentStatus, this.queue.length);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private setStatus(status: SyncState) {
    this.currentStatus = status;
    this.statusListeners.forEach(listener => listener(status, this.queue.length));
  }

  public getStatus(): { status: SyncState; pendingCount: number } {
    return { status: this.currentStatus, pendingCount: this.queue.length };
  }

  /**
   * Add a synchronization task. If not currently processing, starts execution immediately.
   */
  public enqueue(id: string, action: TaskFn, description: string = 'Sync task') {
    // If a task with the same ID is already pending, replace it with the latest action
    const existingIndex = this.queue.findIndex(item => item.id === id);
    if (existingIndex !== -1) {
      this.queue[existingIndex] = { id, action, retries: 0, description };
    } else {
      this.queue.push({ id, action, retries: 0, description });
    }

    this.setStatus('syncing');
    this.processQueue();
  }

  public async retryAll() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.setStatus('syncing');
    await this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    if (this.queue.length === 0) {
      this.setStatus('synced');
      return;
    }

    this.isProcessing = true;
    this.setStatus('syncing');

    while (this.queue.length > 0) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.setStatus('offline');
        this.isProcessing = false;
        return;
      }

      const item = this.queue[0];
      try {
        await item.action();
        // Success: remove from queue
        this.queue.shift();
      } catch (err) {
        console.warn(`[SyncQueue] Task failed: ${item.description}`, err);
        item.retries += 1;
        this.setStatus(navigator.onLine ? 'error' : 'offline');

        // Exponential backoff retry
        const delay = Math.min(1000 * Math.pow(2, Math.min(item.retries, 4)), 10000);
        this.isProcessing = false;

        if (this.retryTimeout) clearTimeout(this.retryTimeout);
        this.retryTimeout = setTimeout(() => {
          this.processQueue();
        }, delay);
        return;
      }
    }

    this.isProcessing = false;
    this.setStatus('synced');
  }
}

export const syncQueue = new SyncQueue();
