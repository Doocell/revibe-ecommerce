import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type ComplaintRow = {
    id: string;
    order_id: string;
    buyer_id: string;
    seller_id: string;
    reason: string;
    description: string;
    status: string;
    seller_response: string | null;
    created_at: string;
    updated_at: string | null;
    resolved_at: string | null;
};

export type ComplaintOrderItem = {
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    title: string;
    image: string | null;
};

export type ComplaintOrder = {
    id: string;
    buyer_id: string;
    seller_id: string;
    order_status: string;
    payment_status: string;
    total: number;
    tracking_number: string | null;
    courier: string | null;
    created_at: string;
    order_items: ComplaintOrderItem[];
    complaint: ComplaintRow | null;
};

export const COMPLAINT_REASONS = [
    {
        value: "barang_tidak_sesuai",
        label: "Barang tidak sesuai deskripsi",
    },
    {
        value: "barang_rusak",
        label: "Barang rusak",
    },
    {
        value: "belum_sampai",
        label: "Barang belum sampai",
    },
    {
        value: "resi_bermasalah",
        label: "Nomor resi bermasalah",
    },
    {
        value: "barang_kurang",
        label: "Barang kurang",
    },
    {
        value: "lainnya",
        label: "Lainnya",
    },
];

export async function getBuyerComplaintOrders(
    buyerId: string,
): Promise<ComplaintOrder[]> {
    if (!buyerId) return [];

    const { data: orders, error: ordersError } = await db
        .from("orders")
        .select(
            `
      id,
      buyer_id,
      seller_id,
      order_status,
      payment_status,
      total,
      tracking_number,
      courier,
      created_at,
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
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false });

    if (ordersError) {
        throw new Error(ordersError.message);
    }

    const orderRows = (orders ?? [])
        .map(normalizeComplaintOrder)
        .filter((order: ComplaintOrder) => canBuyerComplainOrder(order));

    const orderIds = orderRows.map((order: ComplaintOrder) => order.id);

    if (orderIds.length === 0) return [];

    const { data: complaints, error: complaintsError } = await db
        .from("order_complaints")
        .select("*")
        .eq("buyer_id", buyerId)
        .in("order_id", orderIds);

    if (complaintsError) {
        throw new Error(complaintsError.message);
    }

    const complaintMap = new Map(
        (complaints ?? []).map((complaint: any) => [
            String(complaint.order_id),
            normalizeComplaint(complaint),
        ]),
    );

    return orderRows.map((order: ComplaintOrder) => ({
        ...order,
        complaint: complaintMap.get(order.id) ?? null,
    }));
}

export async function getBuyerComplaints(
    buyerId: string,
): Promise<ComplaintRow[]> {
    if (!buyerId) return [];

    const { data, error } = await db
        .from("order_complaints")
        .select("*")
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []).map(normalizeComplaint);
}

export async function getSellerComplaints(
    sellerId: string,
): Promise<ComplaintRow[]> {
    if (!sellerId) return [];

    const { data, error } = await db
        .from("order_complaints")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []).map(normalizeComplaint);
}

export async function submitOrderComplaint({
    buyerId,
    orderId,
    sellerId,
    reason,
    description,
}: {
    buyerId: string;
    orderId: string;
    sellerId: string;
    reason: string;
    description: string;
}) {
    if (!buyerId || !orderId || !sellerId) {
        throw new Error("Data komplain tidak lengkap.");
    }

    if (!reason) {
        throw new Error("Alasan komplain wajib dipilih.");
    }

    if (!description.trim()) {
        throw new Error("Deskripsi komplain wajib diisi.");
    }

    const { data: order, error: orderError } = await db
        .from("orders")
        .select("id, buyer_id, seller_id, order_status, payment_status")
        .eq("id", orderId)
        .eq("buyer_id", buyerId)
        .maybeSingle();

    if (orderError) {
        throw new Error(orderError.message);
    }

    if (!order) {
        throw new Error("Order tidak ditemukan.");
    }

    if (!canBuyerComplainStatus(order.order_status)) {
        throw new Error("Order ini belum bisa dikomplain.");
    }

    const { data: existing, error: existingError } = await db
        .from("order_complaints")
        .select("*")
        .eq("buyer_id", buyerId)
        .eq("order_id", orderId)
        .in("status", ["open", "seller_responded"])
        .maybeSingle();

    if (existingError) {
        throw new Error(existingError.message);
    }

    if (existing) {
        throw new Error("Order ini masih memiliki komplain aktif.");
    }

    const { data, error } = await db
        .from("order_complaints")
        .insert({
            order_id: orderId,
            buyer_id: buyerId,
            seller_id: sellerId,
            reason,
            description: description.trim(),
            status: "open",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return normalizeComplaint(data);
}

export async function updateSellerComplaintResponse({
    sellerId,
    complaintId,
    response,
}: {
    sellerId: string;
    complaintId: string;
    response: string;
}) {
    if (!sellerId || !complaintId) {
        throw new Error("Data respons tidak lengkap.");
    }

    if (!response.trim()) {
        throw new Error("Respons seller wajib diisi.");
    }

    const { data, error } = await db
        .from("order_complaints")
        .update({
            seller_response: response.trim(),
            status: "seller_responded",
            updated_at: new Date().toISOString(),
        })
        .eq("id", complaintId)
        .eq("seller_id", sellerId)
        .select("*")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return normalizeComplaint(data);
}

export async function resolveComplaint({
    userId,
    complaintId,
}: {
    userId: string;
    complaintId: string;
}) {
    if (!userId || !complaintId) {
        throw new Error("Data komplain tidak lengkap.");
    }

    const { data, error } = await db
        .from("order_complaints")
        .update({
            status: "resolved",
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", complaintId)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .select("*")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return normalizeComplaint(data);
}

export async function cancelComplaint({
    buyerId,
    complaintId,
}: {
    buyerId: string;
    complaintId: string;
}) {
    if (!buyerId || !complaintId) {
        throw new Error("Data komplain tidak lengkap.");
    }

    const { data, error } = await db
        .from("order_complaints")
        .update({
            status: "cancelled",
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", complaintId)
        .eq("buyer_id", buyerId)
        .select("*")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return normalizeComplaint(data);
}

export function canBuyerComplainOrder(order: {
    order_status?: string | null;
    payment_status?: string | null;
}) {
    const payment = normalizeStatus(order.payment_status);

    const paid =
        payment === "dibayar" ||
        payment === "paid" ||
        payment === "settlement" ||
        payment === "success";

    return paid && canBuyerComplainStatus(order.order_status);
}

export function canBuyerComplainStatus(status: string | null | undefined) {
    const safeStatus = normalizeStatus(status);

    return (
        safeStatus === "dikirim" ||
        safeStatus === "shipped" ||
        safeStatus === "selesai" ||
        safeStatus === "pesanan_diterima" ||
        safeStatus === "completed" ||
        safeStatus === "delivered"
    );
}

export function complaintStatusLabel(status: string | null | undefined) {
    const labels: Record<string, string> = {
        open: "Menunggu Respons Seller",
        seller_responded: "Seller Sudah Merespons",
        resolved: "Selesai",
        cancelled: "Dibatalkan",
    };

    return labels[normalizeStatus(status)] ?? status ?? "-";
}

export function complaintReasonLabel(reason: string | null | undefined) {
    const item = COMPLAINT_REASONS.find(
        (reasonItem) => reasonItem.value === reason,
    );

    return item?.label ?? reason ?? "-";
}

function normalizeComplaintOrder(row: any): ComplaintOrder {
    return {
        id: String(row.id),
        buyer_id: String(row.buyer_id),
        seller_id: String(row.seller_id ?? ""),
        order_status: String(row.order_status ?? ""),
        payment_status: String(row.payment_status ?? ""),
        total: Number(row.total ?? 0),
        tracking_number: row.tracking_number ?? null,
        courier: row.courier ?? null,
        created_at: row.created_at ?? new Date().toISOString(),
        order_items: (row.order_items ?? []).map((item: any) => {
            const product = Array.isArray(item.products)
                ? item.products[0]
                : item.products;

            const images = Array.isArray(product?.images) ? product.images : [];

            return {
                id: String(item.id),
                product_id: String(item.product_id),
                quantity: Number(item.quantity ?? 0),
                price: Number(item.price ?? 0),
                title: String(product?.title ?? "Produk"),
                image: images[0] ?? null,
            };
        }),
        complaint: null,
    };
}

function normalizeComplaint(row: any): ComplaintRow {
    return {
        id: String(row.id),
        order_id: String(row.order_id),
        buyer_id: String(row.buyer_id),
        seller_id: String(row.seller_id),
        reason: String(row.reason ?? ""),
        description: String(row.description ?? ""),
        status: String(row.status ?? "open"),
        seller_response: row.seller_response ?? null,
        created_at: row.created_at ?? new Date().toISOString(),
        updated_at: row.updated_at ?? null,
        resolved_at: row.resolved_at ?? null,
    };
}

function normalizeStatus(value: string | null | undefined) {
    return String(value ?? "").trim().toLowerCase();
}