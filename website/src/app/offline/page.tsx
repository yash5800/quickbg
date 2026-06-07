import { AppLayout } from "@/components/app-layout";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function OfflinePage() {
  const { t } = await getServerTranslations();

  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold">{t("offline.title")}</h1>
        <p className="mt-3 text-muted-foreground">
          {t("offline.description")}
        </p>
      </div>
    </AppLayout>
  );
}
