import ModuleDetailsPageClient from "./_components/moduleDetailsPageClient";

// Correctly typed page component for Next.js App Router
const ModuleDetailsPage = ({
  params,
}: {
  params: { moduleId: string };
}) => {
  // No need to await params, it's already a resolved object
  return <ModuleDetailsPageClient moduleId={params.moduleId} />;
};

export default ModuleDetailsPage;

