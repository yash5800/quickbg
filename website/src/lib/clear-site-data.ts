"use client";

export async function clearSiteData(): Promise<void> {
  localStorage.clear();

  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;
  });

  try {
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map((db) => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }),
    );
  } catch {
    // indexedDB.databases() not supported in all browsers
  }

  try {
    const registrations = await navigator.serviceWorker?.getRegistrations();
    if (registrations) {
      await Promise.all(registrations.map((r) => r.unregister()));
    }
  } catch {
    // service worker may not be available
  }
}
