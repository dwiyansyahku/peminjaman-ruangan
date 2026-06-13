import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/users";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AutoLogout } from "@/components/AutoLogout";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-50">
            <AutoLogout />
            <Sidebar
                userRole={user.role as "ADMIN" | "STUDENT"}
                userName={user.fullName}
                nim={user.nim}
                prodi={user.prodi}
            />
            <div className="pl-64 flex flex-col min-h-screen">
                <Header userName={user.fullName} userRole={user.role} showAuth={true} />
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

