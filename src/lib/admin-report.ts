import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type AdminReportSummary = {
    total_users: number;
    total_buyers: number;
    total_sellers: number;
    total_products: number;
    approved_products: number;
    pending_products: number;
    total_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    gross_revenue: number;
    cancelled_value: number;
};

export type AdminTopProduct = {
    product_id: string;
    product_title: string;
    product_image: string | null;
    quantity_sold: number;
    revenue: number;
};

export type AdminTopSeller = {
    seller_id: string;
    seller_name: string;
    email: string;
    order_count: number;
    revenue: number;
};

export type AdminDailySale = {
    date: string;
    label: string;
    orders: number;
    revenue: number;
};

export type AdminMarketplaceReport = {
    summary: AdminReportSummary;
    top_products: AdminTopProduct[];
    top_sellers: AdminTopSeller[];
    daily_sales: AdminDailySale[];
};

export type AdminReportFilter = {
    startDate?: string;
    endDate?: string;
};

export async function getAdminMarketplaceReport(
    filters: AdminReportFilter = {},
): Promise<AdminMarketplaceReport> {
    const { data, error } = await db.rpc("get_admin_marketplace_report", {
        p_start_date: filters.startDate || null,
        p_end_date: filters.endDate || null,
    });

    if (error) {
        throw new Error(
            error.message.includes("get_admin_marketplace_report")
                ? "RPC get_admin_marketplace_report belum tersedia. Jalankan migration SQL fitur admin terlebih dahulu."
                : error.message,
        );
    }

    const report = Array.isArray(data) ? data[0] : data;

    return {
        summary: {
            total_users: Number(report?.summary?.total_users ?? 0),
            total_buyers: Number(report?.summary?.total_buyers ?? 0),
            total_sellers: Number(report?.summary?.total_sellers ?? 0),
            total_products: Number(report?.summary?.total_products ?? 0),
            approved_products: Number(report?.summary?.approved_products ?? 0),
            pending_products: Number(report?.summary?.pending_products ?? 0),
            total_orders: Number(report?.summary?.total_orders ?? 0),
            completed_orders: Number(report?.summary?.completed_orders ?? 0),
            cancelled_orders: Number(report?.summary?.cancelled_orders ?? 0),
            gross_revenue: Number(report?.summary?.gross_revenue ?? 0),
            cancelled_value: Number(report?.summary?.cancelled_value ?? 0),
        },
        top_products: Array.isArray(report?.top_products)
            ? report.top_products.map((item: any) => ({
                product_id: String(item.product_id ?? ""),
                product_title: String(item.product_title ?? "Produk"),
                product_image: item.product_image ? String(item.product_image) : null,
                quantity_sold: Number(item.quantity_sold ?? 0),
                revenue: Number(item.revenue ?? 0),
            }))
            : [],
        top_sellers: Array.isArray(report?.top_sellers)
            ? report.top_sellers.map((item: any) => ({
                seller_id: String(item.seller_id ?? ""),
                seller_name: String(item.seller_name ?? "Seller"),
                email: String(item.email ?? ""),
                order_count: Number(item.order_count ?? 0),
                revenue: Number(item.revenue ?? 0),
            }))
            : [],
        daily_sales: Array.isArray(report?.daily_sales)
            ? report.daily_sales.map((item: any) => ({
                date: String(item.date ?? ""),
                label: String(item.label ?? ""),
                orders: Number(item.orders ?? 0),
                revenue: Number(item.revenue ?? 0),
            }))
            : [],
    };
}

export function formatIDR(value: number | string | null | undefined) {
    const numberValue = Number(value ?? 0);

    if (!Number.isFinite(numberValue)) {
        return "Rp 0";
    }

    return "Rp " + new Intl.NumberFormat("id-ID").format(numberValue);
}