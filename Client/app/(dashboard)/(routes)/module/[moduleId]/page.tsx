import ModuleDetailsPageClient from "./_components/moduleDetailsPageClient";

const ModuleDetailsPage = ({
  params,
}: {
  params: { moduleId: string };
}) => {
  // Remove the async keyword from the function
  // Remove the await for params since it's not a Promise

  return <ModuleDetailsPageClient moduleId={params.moduleId} />;
};

export default ModuleDetailsPage;