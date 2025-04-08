// app/(dashboard)/(routes)/module/[moduleId]/page.tsx

import { Suspense } from 'react';
import ModuleDetailsPageClient from "./_components/moduleDetailsPageClient";

export default function ModuleDetailsPage({
  params,
}: {
  params: { moduleId: string }
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ModuleDetailsPageClient moduleId={params.moduleId} />
    </Suspense>
  );
}