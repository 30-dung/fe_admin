    import PageBreadcrumb from "../components/common/PageBreadCrumb";
import AdminInfoCard from "../components/UserProfile/AdminInfoCard";
import PageMeta from "../components/common/PageMeta";

export default function AdminProfiles() {
  return (
    <>
      <PageMeta
        title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-6">
          {/* <UserMetaCard /> */}
          <AdminInfoCard />

        </div>
      </div>
    </>
  );
}
