import ModuleDetailsPageClient from "./_components/moduleDetailsPageClient";

const ModuleDetailsPage = async ({
  params,
}: {
  params: { moduleId: string };
}) => {
  // Unwrapping params asynchronously in the Server Component
  const resolvedParams = await params; // If it's not already resolved

  return <ModuleDetailsPageClient moduleId={resolvedParams.moduleId} />;
};

export default ModuleDetailsPage;
