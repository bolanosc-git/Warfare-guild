const queueKey = "warfare-offline-mutations-v1";
const retiredActions = new Set(["need", "signup"]);
let flushing;

function readQueue() {
  try {
    const value = JSON.parse(localStorage.getItem(queueKey) ?? "[]");
    return Array.isArray(value) ? value.filter(entry => !retiredActions.has(entry.body?.action)) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  try {
    localStorage.setItem(queueKey, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent("warfare-offline-queue", { detail: { count: queue.length } }));
    return true;
  } catch {
    return false;
  }
}

export const queuedMutationCount = () => readQueue().length;

export function queueMutation(body) {
  const queue = readQueue();
  if (queue.length >= 100) throw Error("The offline change queue is full. Connect and sync your saved updates first.");
  const saved = saveQueue([...queue, { id: crypto.randomUUID(), body, queuedAt: new Date().toISOString() }]);
  if (!saved) throw Error("This browser could not save the change for offline use.");
}

export async function flushQueuedMutations() {
  if (flushing || !navigator.onLine) return;
  flushing = (async () => {
    const queue = readQueue();
    const remaining = [];
    for (const entry of queue) {
      try {
        const response = await fetch("/api/planning", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry.body)
        });
        if (!response.ok) {
          remaining.push(entry, ...queue.slice(queue.indexOf(entry) + 1));
          break;
        }
      } catch {
        remaining.push(entry, ...queue.slice(queue.indexOf(entry) + 1));
        break;
      }
    }
    saveQueue(remaining);
    if (queue.length && !remaining.length) window.dispatchEvent(new Event("warfare-offline-synced"));
  })().finally(() => { flushing = undefined; });
  return flushing;
}
