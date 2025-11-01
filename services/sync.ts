import { db, SyncOperation } from './db';
import { performApiFetch, formDataToObject } from './api';

export function objectToFormData(obj: Record<string, any>): FormData {
    const formData = new FormData();
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (Array.isArray(value)) {
                value.forEach(item => formData.append(`${key}[]`, item));
            } else {
                formData.append(key, value);
            }
        }
    }
    return formData;
}

export async function syncOfflineOperations() {
    if (!navigator.onLine) {
        console.log("Offline, skipping sync.");
        return;
    }

    console.log("Online, attempting to sync offline operations.");
    const operations = await db.syncQueue.orderBy('timestamp').toArray();

    if (operations.length === 0) {
        console.log("No offline operations to sync.");
        return;
    }

    console.log(`Found ${operations.length} operations to sync.`);

    for (const op of operations) {
        try {
            console.log(`Syncing operation: ${op.method} ${op.endpoint}`);
            const formData = objectToFormData(op.payload);
            
            await performApiFetch(op.endpoint, {
                method: op.method,
                body: formData,
            });

            // If successful, remove from queue
            await db.syncQueue.delete(op.id!);
            console.log(`Successfully synced and removed operation ${op.id}.`);
        } catch (error) {
            console.error(`Failed to sync operation ${op.id}:`, error);
            // Don't delete, it will be retried on next sync attempt
        }
    }
    
    // After syncing, we might need a way to tell the app to refresh its data from the server.
    // A custom event could work here.
    window.dispatchEvent(new CustomEvent('operations-synced'));
}

export function setupSyncListeners() {
    window.addEventListener('online', syncOfflineOperations);

    // Initial sync check in case the app loads while online
    syncOfflineOperations();
}
