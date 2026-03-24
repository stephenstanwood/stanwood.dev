export function logEvent(event: string, data: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...data, timestamp: new Date().toISOString() }));
}
