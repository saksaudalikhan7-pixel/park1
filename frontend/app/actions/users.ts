"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";
import { revalidatePath } from "next/cache";

export async function getAdminUsers(): Promise<any[]> {
    await requirePermission('users', 'read');
    const res = await fetchAPI("/core/users/");
    if (!res || !res.ok) return [];
    const users = await res.json();
    return users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        profilePic: u.profile_pic,
        role: { name: u.role, id: u.role }, // Map string role to object for UI compatibility
        isActive: u.is_active,
        lastLoginAt: u.last_login
    }));
}

export async function getUserStats(): Promise<any> {
    await requirePermission('users', 'read');
    const res = await fetchAPI("/core/users/stats/");
    if (!res || !res.ok) {
        return {
            totalUsers: 0,
            activeUsers: 0,
            inactiveUsers: 0,
            recentLogins: 0,
            roleDistribution: []
        };
    }
    return res.json();
}

export async function getRecentActivity(limit: number = 5): Promise<any[]> {
    await requirePermission('users', 'read');
    const res = await fetchAPI(`/core/users/recent_activity/?limit=${limit}`);
    if (!res || !res.ok) return [];

    const users = await res.json();
    // Transform if necessary, or return as is (assumes user object structure)
    return users.map((u: any) => ({
        id: u.id,
        name: u.first_name ? `${u.first_name} ${u.last_name}` : u.username, // Adjust based on serializer
        role: u.role,
        lastLoginAt: u.last_login
    }));
}

export async function getUser(id: string) {
    await requirePermission('users', 'read');
    const res = await fetchAPI(`/core/users/${id}/`);
    if (!res || !res.ok) return null;
    return await res.json();
}

export async function updateUser(id: string, data: {
    name?: string;
    email?: string;
    role?: string;
    password?: string;
    is_active?: boolean;
}) {
    await requirePermission('users', 'write');

    const res = await fetchAPI(`/core/users/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

    if (!res || !res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to update user");
    }

    revalidatePath("/admin/users");
}

export async function deleteUser(id: string) {
    await requirePermission('users', 'delete');

    const res = await fetchAPI(`/core/users/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) {
        throw new Error("Failed to delete user");
    }

    revalidatePath("/admin/users");
}

export async function createAdminUser(data: any) {
    await requirePermission('users', 'write');
    const res = await fetchAPI("/core/users/", {
        method: "POST",
        body: JSON.stringify(data)
    });
    if (!res || !res.ok) {
        const error = await res.json();
        const errorMessage = error.detail ||
            (error.email ? `Email: ${error.email[0]}` : null) ||
            (error.username ? `Username: ${error.username[0]}` : null) ||
            (error.password ? `Password: ${error.password[0]}` : null) ||
            (error.role ? `Role: ${error.role[0]}` : null) ||
            Object.values(error).flat().join(', ') ||
            "Failed to create user";
        throw new Error(errorMessage);
    }
    revalidatePath("/admin/users");
}

export async function getRoles(): Promise<any[]> {
    return [
        { id: 'SUPER_ADMIN', name: 'Super Admin', description: 'Full access to all settings and data' },
        { id: 'ADMIN', name: 'Content Manager', description: 'Manage content and bookings' },
        { id: 'EMPLOYEE', name: 'Employee', description: 'Read-only access to bookings and schedules' }
    ];
}

export async function getAdminUser(id: string) {
    return getUser(id);
}

export async function updateAdminUser(id: string, data: any) {
    return updateUser(id, data);
}

export async function deleteAdminUser(id: string) {
    return deleteUser(id);
}
