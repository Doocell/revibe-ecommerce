import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type BuyerAddress = {
    id: string;
    buyer_id: string;
    recipient_name: string;
    phone: string;
    address: string;
    city: string | null;
    province: string | null;
    district: string | null;
    village: string | null;
    postal_code: string | null;
    notes: string | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
};

export type BuyerAddressPayload = {
    buyer_id: string;
    recipient_name: string;
    phone: string;
    address: string;
    city?: string | null;
    province?: string | null;
    district?: string | null;
    village?: string | null;
    postal_code?: string | null;
    notes?: string | null;
    is_default?: boolean;
};

export type BuyerAddressUpdatePayload = {
    recipient_name?: string;
    phone?: string;
    address?: string;
    city?: string | null;
    province?: string | null;
    district?: string | null;
    village?: string | null;
    postal_code?: string | null;
    notes?: string | null;
    is_default?: boolean;
};

export async function getBuyerAddresses(buyerId: string) {
    const cleanBuyerId = String(buyerId ?? "").trim();

    if (!cleanBuyerId || cleanBuyerId === "undefined") {
        throw new Error("ID buyer tidak valid.");
    }

    const { data, error } = await db
        .from("buyer_addresses")
        .select("*")
        .eq("buyer_id", cleanBuyerId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []) as BuyerAddress[];
}

export async function createBuyerAddress(payload: BuyerAddressPayload) {
    validateAddressPayload(payload);

    if (payload.is_default) {
        await clearDefaultAddress(payload.buyer_id);
    }

    const { data, error } = await db
        .from("buyer_addresses")
        .insert({
            buyer_id: payload.buyer_id,
            recipient_name: cleanRequired(payload.recipient_name),
            phone: cleanRequired(payload.phone),
            address: cleanRequired(payload.address),
            city: cleanText(payload.city),
            province: cleanText(payload.province),
            district: cleanText(payload.district),
            village: cleanText(payload.village),
            postal_code: cleanText(payload.postal_code),
            notes: cleanText(payload.notes),
            is_default: Boolean(payload.is_default),
        })
        .select("*")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as BuyerAddress;
}

export async function updateBuyerAddress({
    addressId,
    buyerId,
    payload,
}: {
    addressId: string;
    buyerId: string;
    payload: BuyerAddressUpdatePayload;
}) {
    const cleanAddressId = String(addressId ?? "").trim();
    const cleanBuyerId = String(buyerId ?? "").trim();

    if (!cleanAddressId || cleanAddressId === "undefined") {
        throw new Error("ID alamat tidak valid.");
    }

    if (!cleanBuyerId || cleanBuyerId === "undefined") {
        throw new Error("ID buyer tidak valid.");
    }

    if (payload.is_default) {
        await clearDefaultAddress(cleanBuyerId);
    }

    const updatePayload = removeUndefined({
        recipient_name:
            payload.recipient_name !== undefined
                ? cleanRequired(payload.recipient_name)
                : undefined,
        phone:
            payload.phone !== undefined ? cleanRequired(payload.phone) : undefined,
        address:
            payload.address !== undefined
                ? cleanRequired(payload.address)
                : undefined,
        city: payload.city !== undefined ? cleanText(payload.city) : undefined,
        province:
            payload.province !== undefined ? cleanText(payload.province) : undefined,
        district:
            payload.district !== undefined ? cleanText(payload.district) : undefined,
        village:
            payload.village !== undefined ? cleanText(payload.village) : undefined,
        postal_code:
            payload.postal_code !== undefined
                ? cleanText(payload.postal_code)
                : undefined,
        notes: payload.notes !== undefined ? cleanText(payload.notes) : undefined,
        is_default:
            payload.is_default !== undefined ? Boolean(payload.is_default) : undefined,
        updated_at: new Date().toISOString(),
    });

    const { data, error } = await db
        .from("buyer_addresses")
        .update(updatePayload)
        .eq("id", cleanAddressId)
        .eq("buyer_id", cleanBuyerId)
        .select("*")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as BuyerAddress;
}

export async function deleteBuyerAddress({
    addressId,
    buyerId,
}: {
    addressId: string;
    buyerId: string;
}) {
    const cleanAddressId = String(addressId ?? "").trim();
    const cleanBuyerId = String(buyerId ?? "").trim();

    if (!cleanAddressId || cleanAddressId === "undefined") {
        throw new Error("ID alamat tidak valid.");
    }

    if (!cleanBuyerId || cleanBuyerId === "undefined") {
        throw new Error("ID buyer tidak valid.");
    }

    const { error } = await db
        .from("buyer_addresses")
        .delete()
        .eq("id", cleanAddressId)
        .eq("buyer_id", cleanBuyerId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function setDefaultBuyerAddress({
    addressId,
    buyerId,
}: {
    addressId: string;
    buyerId: string;
}) {
    const cleanAddressId = String(addressId ?? "").trim();
    const cleanBuyerId = String(buyerId ?? "").trim();

    if (!cleanAddressId || cleanAddressId === "undefined") {
        throw new Error("ID alamat tidak valid.");
    }

    if (!cleanBuyerId || cleanBuyerId === "undefined") {
        throw new Error("ID buyer tidak valid.");
    }

    await clearDefaultAddress(cleanBuyerId);

    const { data, error } = await db
        .from("buyer_addresses")
        .update({
            is_default: true,
            updated_at: new Date().toISOString(),
        })
        .eq("id", cleanAddressId)
        .eq("buyer_id", cleanBuyerId)
        .select("*")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as BuyerAddress;
}

export function buildShippingAddress(address: BuyerAddress) {
    const parts = [
        `Penerima: ${address.recipient_name}`,
        `No. HP: ${address.phone}`,
        `Alamat: ${address.address}`,
        address.village ? `Kelurahan/Desa: ${address.village}` : "",
        address.district ? `Kecamatan: ${address.district}` : "",
        address.city ? `Kota/Kabupaten: ${address.city}` : "",
        address.province ? `Provinsi: ${address.province}` : "",
        address.postal_code ? `Kode Pos: ${address.postal_code}` : "",
        address.notes ? `Catatan: ${address.notes}` : "",
    ].filter(Boolean);

    return parts.join("\n");
}

async function clearDefaultAddress(buyerId: string) {
    const cleanBuyerId = String(buyerId ?? "").trim();

    if (!cleanBuyerId || cleanBuyerId === "undefined") {
        throw new Error("ID buyer tidak valid.");
    }

    const { error } = await db
        .from("buyer_addresses")
        .update({
            is_default: false,
            updated_at: new Date().toISOString(),
        })
        .eq("buyer_id", cleanBuyerId)
        .eq("is_default", true);

    if (error) {
        throw new Error(error.message);
    }
}

function validateAddressPayload(payload: BuyerAddressPayload) {
    if (!cleanText(payload.buyer_id)) {
        throw new Error("ID buyer wajib ada.");
    }

    if (!cleanText(payload.recipient_name)) {
        throw new Error("Nama penerima wajib diisi.");
    }

    if (!cleanText(payload.phone)) {
        throw new Error("Nomor HP wajib diisi.");
    }

    if (!cleanText(payload.address)) {
        throw new Error("Alamat wajib diisi.");
    }

    if (!cleanText(payload.province)) {
        throw new Error("Provinsi wajib dipilih.");
    }

    if (!cleanText(payload.city)) {
        throw new Error("Kota/Kabupaten wajib dipilih.");
    }

    if (!cleanText(payload.district)) {
        throw new Error("Kecamatan wajib dipilih.");
    }

    if (!cleanText(payload.village)) {
        throw new Error("Kelurahan/Desa wajib dipilih.");
    }

    if (!cleanText(payload.postal_code)) {
        throw new Error("Kode pos wajib ada.");
    }
}

function cleanRequired(value: string | null | undefined) {
    const cleanValue = String(value ?? "").trim();

    if (!cleanValue) {
        throw new Error("Data wajib diisi.");
    }

    return cleanValue;
}

function cleanText(value: string | null | undefined) {
    const cleanValue = String(value ?? "").trim();

    return cleanValue.length > 0 ? cleanValue : null;
}

function removeUndefined<T extends Record<string, unknown>>(payload: T) {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
}