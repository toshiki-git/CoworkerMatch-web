export async function enableMocking() {
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_ENABLE_MSW === 'true' &&
    typeof window !== 'undefined'
  ) {
    const { worker } = require('@/mocks/browser');

    // `worker.start()` returns a Promise that resolves
    // once the Service Worker is up and ready to intercept requests.
    return worker.start({ onUnhandledRequest: 'bypass' });
  }
  return;
}
