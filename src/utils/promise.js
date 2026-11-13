export class TimeoutError extends Error {
  constructor(ms) {
    super(`Timed out after ${ms} ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * 在 `ms` 毫秒內沒有結果就以 TimeoutError reject。
 * 只是停止等待，不會取消原本的操作：Firestore 寫入仍可能在之後完成。
 */
export const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};
