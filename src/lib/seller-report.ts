import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type SellerReportOrderItem = {
    id: string;
    product_id: string;
    product_title: string;
    product_image: string | null;
    quantity: number;
    price: number;
    line_total: number;
};

export type SellerReportTransaction = {
    id: string;
    buyer_id: string | null;
    order_status: string;
    payment_status: string;
    payment_method: string | null;
    shipping_method: string | null;
    subtotal: number;
    shipping_cost: number;
    total: number;
    courier: string | null;
    tracking_number: string | null;
    created_at: string;
    updated_at: string | null;
    order_items: SellerReportOrderItem[];
};

export type SellerTopProduct = {
    product_id: string;
    product_title: string;
    product_image: string | null;
    quantity_sold: number;
    revenue: number;
};

export type SellerDailySales = {
    date: string;
    label: string;
    revenue: number;
    orders: number;
    units: number;
};

export type SellerSalesReport = {
    summary: {
        total_orders: number;
        completed_orders: number;
        processing_orders: number;
        shipped_orders: number;
        cancelled_orders: number;
        paid_orders: number;
        total_units_sold: number;
        gross_revenue: number;
        completed_revenue: number;
        cancelled_value: number;
    };
    daily_sales: SellerDailySales[];
    top_products: SellerTopProduct[];
    transactions: SellerReportTransaction[];
};

export type SellerReportFilter = {
    sellerId: string;
    startDate: string;
    endDate: string;
};

export async function getSellerSalesReport(filters: SellerReportFilter) {
    const sellerId = String(filters.sellerId ?? "").trim();

    if (!sellerId || sellerId === "undefined") {
        throw new Error("ID seller tidak valid.");
    }

    const startDate = filters.startDate
        ? `${filters.startDate}T00:00:00.000Z`
        : null;

    const endDate = filters.endDate
        ? `${filters.endDate}T23:59:59.999Z`
        : null;

    let query = db
        .from("orders")
        .select(
            `
      id,
      buyer_id,
      order_status,
      payment_status,
      payment_method,
      shipping_method,
      subtotal,
      shipping_cost,
      total,
      courier,
      tracking_number,
      created_at,
      updated_at,
      order_items(
        id,
        product_id,
        quantity,
        price,
        products(
          id,
          title,
          images
        )
      )
    `,
        )
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

    if (startDate) {
        query = query.gte("created_at", startDate);
    }

    if (endDate) {
        query = query.lte("created_at", endDate);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    const rows = (data ?? []) as any[];

    const transactions: SellerReportTransaction[] = rows.map((order) => {
        const orderItems = Array.isArray(order.order_items)
            ? order.order_items
            : [];

        return {
            id: order.id,
            buyer_id: order.buyer_id ?? null,
            order_status: String(order.order_status ?? ""),
            payment_status: String(order.payment_status ?? ""),
            payment_method: order.payment_method ?? null,
            shipping_method: order.shipping_method ?? null,
            subtotal: Number(order.subtotal ?? 0),
            shipping_cost: Number(order.shipping_cost ?? 0),
            total: Number(order.total ?? 0),
            courier: order.courier ?? null,
            tracking_number: order.tracking_number ?? null,
            created_at: order.created_at,
            updated_at: order.updated_at ?? null,
            order_items: orderItems.map((item: any) => {
                const product = Array.isArray(item.products)
                    ? item.products[0]
                    : item.products;

                const quantity = Number(item.quantity ?? 0);
                const price = Number(item.price ?? 0);

                return {
                    id: item.id,
                    product_id: item.product_id,
                    product_title: product?.title ?? "Produk",
                    product_image: product?.images?.[0] ?? null,
                    quantity,
                    price,
                    line_total: quantity * price,
                };
            }),
        };
    });

    const completedOrders = transactions.filter(
        (order) =>
            order.order_status === "selesai" && order.payment_status === "dibayar",
    );

    const processingOrders = transactions.filter((order) =>
        ["menunggu_konfirmasi_penjual", "diproses_penjual"].includes(
            order.order_status,
        ),
    );

    const shippedOrders = transactions.filter(
        (order) => order.order_status === "dikirim",
    );

    const cancelledOrders = transactions.filter(
        (order) => order.order_status === "dibatalkan",
    );

    const paidOrders = transactions.filter(
        (order) => order.payment_status === "dibayar",
    );

    const grossRevenue = paidOrders
        .filter((order) => order.order_status !== "dibatalkan")
        .reduce((sum, order) => sum + Number(order.total), 0);

    const completedRevenue = completedOrders.reduce((sum, order) => {
        return sum + Number(order.total);
    }, 0);

    const cancelledValue = cancelledOrders.reduce((sum, order) => {
        return sum + Number(order.total);
    }, 0);

    const totalUnitsSold = completedOrders.reduce((sum, order) => {
        return (
            sum +
            order.order_items.reduce((itemSum, item) => {
                return itemSum + Number(item.quantity);
            }, 0)
        );
    }, 0);

    const topProductMap = new Map<string, SellerTopProduct>();

    completedOrders.forEach((order) => {
        order.order_items.forEach((item) => {
            const current = topProductMap.get(item.product_id);

            if (current) {
                current.quantity_sold += Number(item.quantity);
                current.revenue += Number(item.line_total);
            } else {
                topProductMap.set(item.product_id, {
                    product_id: item.product_id,
                    product_title: item.product_title,
                    product_image: item.product_image,
                    quantity_sold: Number(item.quantity),
                    revenue: Number(item.line_total),
                });
            }
        });
    });

    const topProducts = Array.from(topProductMap.values())
        .sort((a, b) => b.quantity_sold - a.quantity_sold)
        .slice(0, 10);

    const dailySales = buildDailySales({
        startDate: filters.startDate,
        endDate: filters.endDate,
        completedOrders,
    });

    return {
        summary: {
            total_orders: transactions.length,
            completed_orders: completedOrders.length,
            processing_orders: processingOrders.length,
            shipped_orders: shippedOrders.length,
            cancelled_orders: cancelledOrders.length,
            paid_orders: paidOrders.length,
            total_units_sold: totalUnitsSold,
            gross_revenue: grossRevenue,
            completed_revenue: completedRevenue,
            cancelled_value: cancelledValue,
        },
        daily_sales: dailySales,
        top_products: topProducts,
        transactions,
    } as SellerSalesReport;
}

function buildDailySales({
    startDate,
    endDate,
    completedOrders,
}: {
    startDate: string;
    endDate: string;
    completedOrders: SellerReportTransaction[];
}) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    const map = new Map<string, SellerDailySales>();

    const current = new Date(start);

    while (current <= end) {
        const dateKey = toDateKey(current);

        map.set(dateKey, {
            date: dateKey,
            label: formatShortDate(dateKey),
            revenue: 0,
            orders: 0,
            units: 0,
        });

        current.setDate(current.getDate() + 1);
    }

    completedOrders.forEach((order) => {
        const dateKey = String(order.created_at).slice(0, 10);

        if (!map.has(dateKey)) {
            map.set(dateKey, {
                date: dateKey,
                label: formatShortDate(dateKey),
                revenue: 0,
                orders: 0,
                units: 0,
            });
        }

        const row = map.get(dateKey);

        if (!row) return;

        row.revenue += Number(order.total);
        row.orders += 1;
        row.units += order.order_items.reduce((sum, item) => {
            return sum + Number(item.quantity);
        }, 0);
    });

    return Array.from(map.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
    );
}

function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatShortDate(date: string) {
    const parsed = new Date(`${date}T00:00:00`);

    return parsed.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
    });
}

export function formatIDR(value: number) {
    if (!Number.isFinite(value)) return "Rp 0";

    return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}

export function orderStatusLabel(status: string | null) {
    const labels: Record<string, string> = {
        menunggu_pembayaran: "Menunggu Pembayaran",
        menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
        diproses_penjual: "Diproses Penjual",
        dikirim: "Dikirim",
        pesanan_diterima: "Pesanan Diterima",
        selesai: "Selesai",
        dibatalkan: "Dibatalkan",
    };

    if (!status) return "-";

    return labels[status] ?? status;
}

export function paymentStatusLabel(status: string | null) {
    const labels: Record<string, string> = {
        menunggu_pembayaran: "Menunggu Pembayaran",
        dibayar: "Dibayar",
        gagal: "Gagal",
        dikembalikan: "Dikembalikan",
    };

    if (!status) return "-";

    return labels[status] ?? status;
}