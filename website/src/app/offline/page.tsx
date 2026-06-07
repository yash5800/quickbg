import { AppLayout } from "@/components/app-layout";

export default function OfflinePage() {
  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold">You are offline</h1>
        <p className="mt-3 text-muted-foreground">
          QuickBG needs a connection for AI processing, but saved pages and the editor shell will come back as soon as you reconnect.
        </p>
      </div>
    </AppLayout>
  );
}
