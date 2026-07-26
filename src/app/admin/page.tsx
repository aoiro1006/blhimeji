import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "管理画面",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
