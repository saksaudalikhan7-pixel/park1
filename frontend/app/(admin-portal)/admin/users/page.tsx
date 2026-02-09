import { getAdminUsers, getUserStats, getRecentActivity } from "@/app/actions/users";
import { getAdminSession } from "../../../lib/admin-auth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const [users, stats, recentActivity] = await Promise.all([
        getAdminUsers(),
        getUserStats(),
        getRecentActivity(5)
    ]);

    return (
        <UsersClient
            users={users}
            stats={stats}
            recentActivity={recentActivity}
            currentUserRole={session.user.role}
        />
    );
}
