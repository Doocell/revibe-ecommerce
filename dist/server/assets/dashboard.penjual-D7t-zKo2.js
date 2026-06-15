import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { BarChart3, Boxes, Package, Truck, Store, PlusCircle, ShoppingBag, Loader2, RefreshCw, UserRound, MessageCircle, Bell, Settings, Upload, Search, Save, ImageIcon, Trash2, XCircle, CheckCircle2 } from "lucide-react";
import { s as supabase, u as useAuth, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { L as Label } from "./label-C-XjeFUt.js";
import { T as Textarea } from "./textarea-DDCz9iDe.js";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "@radix-ui/react-label";
const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;
async function uploadProductImages({
  sellerId,
  files
}) {
  const cleanSellerId = String(sellerId ?? "").trim();
  if (!cleanSellerId || cleanSellerId === "undefined") {
    throw new Error("ID seller tidak valid.");
  }
  const safeFiles = Array.from(files ?? []);
  if (safeFiles.length === 0) {
    return [];
  }
  if (safeFiles.length > MAX_FILES) {
    throw new Error(`Maksimal upload ${MAX_FILES} foto produk.`);
  }
  validateImageFiles(safeFiles);
  const uploadedUrls = [];
  for (const [index, file] of safeFiles.entries()) {
    const fileExt = getFileExtension(file.name);
    const fileName = `${Date.now()}-${index}-${randomText()}.${fileExt}`;
    const filePath = `${cleanSellerId}/${fileName}`;
    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });
    if (error) {
      throw new Error(error.message);
    }
    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(filePath);
    if (!data?.publicUrl) {
      throw new Error("Gagal mengambil URL foto produk.");
    }
    uploadedUrls.push(data.publicUrl);
  }
  return uploadedUrls;
}
function validateImageFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`File ${file.name} bukan gambar.`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File ${file.name} melebihi 5 MB.`);
    }
  }
}
function getFileExtension(fileName) {
  const ext = String(fileName).split(".").pop()?.toLowerCase();
  if (!ext) return "jpg";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return ext;
  }
  return "jpg";
}
function randomText() {
  return Math.random().toString(36).slice(2, 10);
}
const db = supabase;
const emptyProfileForm = {
  full_name: "",
  whatsapp: "",
  avatar_url: "",
  address: "",
  city: "",
  bio: "",
  shop_name: "",
  shop_description: "",
  shop_location: "",
  shop_logo_url: ""
};
const COURIER_OPTIONS = ["JNE", "J&T", "SiCepat", "Anteraja", "Pos Indonesia", "TIKI", "Wahana", "Ninja Xpress", "GrabExpress", "GoSend", "Lainnya"];
function isSellerTab(value) {
  return value === "overview" || value === "add" || value === "products" || value === "orders" || value === "report" || value === "profile" || value === "settings";
}
function getInitialSellerTab() {
  if (typeof window === "undefined") return "overview";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (isSellerTab(tab)) return tab;
  return "overview";
}
function SellerDashboardPage() {
  const {
    user
  } = useAuth();
  const [activeTab, setActiveTab] = useState(getInitialSellerTab);
  const [highlightOrderId, setHighlightOrderId] = useState("");
  const [highlightProductId, setHighlightProductId] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  function applyUrlState() {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get("tab");
    const orderId = searchParams.get("order") ?? "";
    const productId = searchParams.get("product") ?? "";
    if (isSellerTab(tab)) {
      setActiveTab(tab);
    }
    setHighlightOrderId(orderId);
    setHighlightProductId(productId);
  }
  async function loadDashboardData() {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [categoryResult, productResult, orderResult, profileResult] = await Promise.all([db.from("categories").select("id, name, slug").order("name"), db.from("products").select(`
              *,
              categories(id, name, slug)
            `).eq("seller_id", user.id).order("created_at", {
        ascending: false
      }), db.from("orders").select(`
              *,
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
            `).eq("seller_id", user.id).order("created_at", {
        ascending: false
      }), db.from("profiles").select("*").eq("id", user.id).maybeSingle()]);
      if (categoryResult.error) throw new Error(categoryResult.error.message);
      if (productResult.error) throw new Error(productResult.error.message);
      if (orderResult.error) throw new Error(orderResult.error.message);
      if (profileResult.error) throw new Error(profileResult.error.message);
      setCategories(categoryResult.data ?? []);
      setProducts(productResult.data ?? []);
      setOrders(orderResult.data ?? []);
      const profile = profileResult.data;
      if (profile) {
        setProfileForm({
          full_name: profile.full_name ?? "",
          whatsapp: profile.whatsapp ?? "",
          avatar_url: profile.avatar_url ?? "",
          address: profile.address ?? "",
          city: profile.city ?? "",
          bio: profile.bio ?? "",
          shop_name: profile.shop_name ?? "",
          shop_description: profile.shop_description ?? "",
          shop_location: profile.shop_location ?? "",
          shop_logo_url: profile.shop_logo_url ?? ""
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat dashboard penjual.");
      console.error("[Seller Dashboard Load Error]", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    applyUrlState();
  }, []);
  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);
  useEffect(() => {
    function handlePopState() {
      applyUrlState();
    }
    function handleSellerTabChange(event) {
      const customEvent = event;
      const tab = customEvent.detail?.tab ?? "";
      const orderId = customEvent.detail?.orderId ?? "";
      const productId = customEvent.detail?.productId ?? "";
      if (isSellerTab(tab)) {
        setActiveTab(tab);
      }
      setHighlightOrderId(orderId);
      setHighlightProductId(productId);
      window.setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }, 50);
    }
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("revibe:seller-tab-change", handleSellerTabChange);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("revibe:seller-tab-change", handleSellerTabChange);
    };
  }, []);
  useEffect(() => {
    if (!user?.id) return;
    const channel = db.channel(`seller_orders_${user.id}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "orders",
      filter: `seller_id=eq.${user.id}`
    }, () => {
      loadDashboardData();
    }).subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [user?.id]);
  const completedOrders = useMemo(() => {
    return orders.filter((order) => ["selesai", "pesanan_diterima"].includes(order.order_status) && order.payment_status === "dibayar");
  }, [orders]);
  const processingOrders = useMemo(() => {
    return orders.filter((order) => ["menunggu_konfirmasi_penjual", "menunggu_konfirmasi", "diproses_penjual", "diproses"].includes(order.order_status));
  }, [orders]);
  const shippedOrders = useMemo(() => {
    return orders.filter((order) => order.order_status === "dikirim");
  }, [orders]);
  const sevenDaySales = useMemo(() => {
    const end = /* @__PURE__ */ new Date();
    const start = /* @__PURE__ */ new Date();
    start.setDate(start.getDate() - 6);
    return buildDailySales({
      orders: completedOrders,
      start,
      end
    });
  }, [completedOrders]);
  const stats = useMemo(() => {
    const revenue = completedOrders.reduce((sum, order) => {
      return sum + getOrderTotal(order);
    }, 0);
    return [{
      label: "Omzet Selesai",
      value: formatIDR(revenue),
      icon: BarChart3
    }, {
      label: "Produk Saya",
      value: String(products.length),
      icon: Boxes
    }, {
      label: "Pesanan Diproses",
      value: String(processingOrders.length),
      icon: Package
    }, {
      label: "Pesanan Dikirim",
      value: String(shippedOrders.length),
      icon: Truck
    }];
  }, [completedOrders, products, processingOrders, shippedOrders]);
  async function handleSaveProfile(event) {
    event.preventDefault();
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      const {
        error
      } = await db.from("profiles").upsert({
        id: user.id,
        full_name: cleanText(profileForm.full_name),
        whatsapp: cleanText(profileForm.whatsapp),
        avatar_url: cleanText(profileForm.avatar_url),
        address: cleanText(profileForm.address),
        city: cleanText(profileForm.city),
        bio: cleanText(profileForm.bio),
        shop_name: cleanText(profileForm.shop_name),
        shop_description: cleanText(profileForm.shop_description),
        shop_location: cleanText(profileForm.shop_location),
        shop_logo_url: cleanText(profileForm.shop_logo_url),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }, {
        onConflict: "id"
      });
      if (error) throw new Error(error.message);
      toast.success("Profil toko berhasil disimpan.");
      await loadDashboardData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan profil toko.");
    } finally {
      setSavingProfile(false);
    }
  }
  function updateProfileField(key, value) {
    setProfileForm((current) => ({
      ...current,
      [key]: value
    }));
  }
  function openSellerTab(tab) {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      if (tab !== "orders") {
        url.searchParams.delete("order");
      }
      if (tab !== "products") {
        url.searchParams.delete("product");
      }
      window.history.pushState({}, "", url.toString());
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }
  const menuItems = [{
    key: "add",
    title: "Tambah Produk",
    description: "Tambahkan produk preloved baru agar bisa diverifikasi admin dan tampil ke pembeli.",
    icon: PlusCircle,
    primary: true
  }, {
    key: "products",
    title: "Produk Saya",
    description: "Kelola daftar produk, edit stok, edit detail, dan nonaktifkan produk.",
    icon: Boxes
  }, {
    key: "orders",
    title: "Pesanan Masuk",
    description: "Kelola order buyer, proses pesanan, dan input resi.",
    icon: ShoppingBag
  }, {
    key: "voucher",
    title: "Voucher / Kupon",
    description: "Buat dan kelola kode diskon untuk pembeli.",
    icon: Package
  }, {
    key: "invoice",
    title: "Invoice / Bukti Pesanan",
    description: "Lihat dan cetak bukti transaksi dari pesanan toko.",
    icon: Package
  }, {
    key: "tracking",
    title: "Tracking Pesanan",
    description: "Lihat kurir, nomor resi, status kirim, dan alamat pengiriman.",
    icon: Package
  }, {
    key: "report",
    title: "Laporan Penjualan",
    description: "Lihat omzet, order selesai, produk terjual, produk paling laku, dan grafik penjualan.",
    icon: BarChart3
  }, {
    key: "profile",
    title: "Profil Toko",
    description: "Edit nama toko, lokasi toko, logo, dan deskripsi toko.",
    icon: UserRound
  }, {
    key: "chat",
    title: "Chat Buyer",
    description: "Balas pertanyaan buyer tentang produk.",
    icon: MessageCircle
  }, {
    key: "notification",
    title: "Notifikasi",
    description: "Lihat notifikasi order, pembayaran, ulasan, dan chat.",
    icon: Bell
  }, {
    key: "complaints",
    title: "Komplain Buyer",
    description: "Lihat dan respons komplain yang diajukan pembeli.",
    icon: Bell
  }, {
    key: "settings",
    title: "Pengaturan Seller",
    description: "Pengaturan tambahan untuk toko dan akun seller.",
    icon: Settings
  }];
  function handleMenuClick(key) {
    if (key === "chat") {
      window.location.href = "/chat";
      return;
    }
    if (key === "notification") {
      window.location.href = "/notifikasi";
      return;
    }
    if (key === "complaints") {
      window.location.href = "/komplain/penjual";
      return;
    }
    if (key === "voucher") {
      window.location.href = "/voucher/penjual";
      return;
    }
    if (key === "tracking") {
      window.location.href = "/tracking";
      return;
    }
    if (key === "invoice") {
      window.location.href = "/invoice";
      return;
    }
    if (isSellerTab(key)) {
      openSellerTab(key);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-3xl border border-border bg-card p-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-5 md:flex-row md:items-center md:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary", children: [
            /* @__PURE__ */ jsx(Store, { className: "h-4 w-4" }),
            "Seller Panel"
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "mt-4 text-3xl font-bold", children: "Dashboard Penjual" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-muted-foreground", children: "Kelola produk, tambah barang baru, pantau pesanan, balas chat buyer, dan cek laporan penjualan toko kamu di ReVibe." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { type: "button", className: "gradient-brand text-white", onClick: () => openSellerTab("add"), children: [
            /* @__PURE__ */ jsx(PlusCircle, { className: "mr-2 h-4 w-4" }),
            "Tambah Produk"
          ] }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => openSellerTab("products"), children: [
            /* @__PURE__ */ jsx(Boxes, { className: "mr-2 h-4 w-4" }),
            "Produk Saya"
          ] }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => openSellerTab("orders"), children: [
            /* @__PURE__ */ jsx(ShoppingBag, { className: "mr-2 h-4 w-4" }),
            "Pesanan"
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/voucher/penjual", children: "Voucher Seller" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/invoice", children: "Invoice Seller" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/tracking", children: "Tracking Pesanan" }) }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadDashboardData, disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] })
        ] })
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4", children: stats.map((stat) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsx(stat.icon, { className: "h-6 w-6 text-primary" }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 text-2xl font-bold", children: stat.value }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: stat.label })
        ] }, stat.label)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Menu Penjual" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Klik menu untuk membuka fitur tanpa pindah halaman." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-5 grid gap-3", children: menuItems.map((item) => /* @__PURE__ */ jsx(SellerMenuButton, { title: item.title, description: item.description, icon: item.icon, active: isSellerTab(item.key) ? activeTab === item.key : false, primary: item.primary, onClick: () => handleMenuClick(item.key) }, item.title)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
            activeTab === "overview" ? /* @__PURE__ */ jsx(OverviewPanel, { data: sevenDaySales, onOpenReport: () => openSellerTab("report"), onAddProduct: () => openSellerTab("add") }) : null,
            activeTab === "add" ? /* @__PURE__ */ jsx(AddProductPanel, { userId: user?.id ?? "", categories, onSaved: async () => {
              await loadDashboardData();
              openSellerTab("products");
            } }) : null,
            activeTab === "products" ? /* @__PURE__ */ jsx(ProductsPanel, { userId: user?.id ?? "", products, categories, highlightProductId, onReload: loadDashboardData }) : null,
            activeTab === "orders" ? /* @__PURE__ */ jsx(OrdersPanel, { userId: user?.id ?? "", orders, highlightOrderId, onReload: loadDashboardData }) : null,
            activeTab === "report" ? /* @__PURE__ */ jsx(ReportPanel, { orders }) : null,
            activeTab === "profile" ? /* @__PURE__ */ jsx(ProfilePanel, { form: profileForm, saving: savingProfile, onChange: updateProfileField, onSubmit: handleSaveProfile, sellerId: user?.id ?? "" }) : null,
            activeTab === "settings" ? /* @__PURE__ */ jsx(SettingsPanel, { onOpenProfile: () => openSellerTab("profile"), onOpenProducts: () => openSellerTab("products"), onOpenOrders: () => openSellerTab("orders"), onOpenReport: () => openSellerTab("report") }) : null
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function SellerMenuButton({
  title,
  description,
  icon: Icon,
  active,
  primary,
  onClick
}) {
  return /* @__PURE__ */ jsx("button", { type: "button", onClick, className: `rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-md ${active || primary ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ jsx("div", { className: `rounded-xl p-3 ${active || primary ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: title }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm leading-6 text-muted-foreground", children: description })
    ] })
  ] }) });
}
function OverviewPanel({
  data,
  onOpenReport,
  onAddProduct
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Ringkasan 7 Hari Terakhir" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Grafik sederhana berdasarkan order yang sudah selesai." }),
    /* @__PURE__ */ jsx("div", { className: "mt-5", children: /* @__PURE__ */ jsx(MiniSalesChart, { data }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-2 md:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onOpenReport, children: "Buka Laporan Lengkap" }),
      /* @__PURE__ */ jsx(Button, { type: "button", className: "gradient-brand text-white", onClick: onAddProduct, children: "Tambah Produk Baru" })
    ] })
  ] });
}
function AddProductPanel({
  userId,
  categories,
  onSaved
}) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState("good");
  const [location, setLocation] = useState("");
  const [stock, setStock] = useState("1");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);
  function handleFileChange(event) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 5) {
      toast.error("Maksimal upload 5 foto produk.");
      return;
    }
    const invalidFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      toast.error(`File ${invalidFile.name} bukan gambar.`);
      return;
    }
    const oversizeFile = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversizeFile) {
      toast.error(`File ${oversizeFile.name} melebihi 5 MB.`);
      return;
    }
    setSelectedFiles(files);
  }
  function removeSelectedFile(index) {
    setSelectedFiles((current) => {
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (!userId) return;
    if (!title.trim()) {
      toast.error("Nama produk wajib diisi.");
      return;
    }
    if (Number(price) <= 0) {
      toast.error("Harga produk wajib lebih dari 0.");
      return;
    }
    if (Number(stock) < 0) {
      toast.error("Stok produk tidak valid.");
      return;
    }
    setSaving(true);
    try {
      const uploadedImageUrls = await uploadProductImages({
        sellerId: userId,
        files: selectedFiles
      });
      const {
        error
      } = await db.from("products").insert({
        seller_id: userId,
        title: title.trim(),
        description: cleanText(description),
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : null,
        category_id: categoryId || null,
        condition,
        location: cleanText(location),
        stock: Number(stock || 0),
        images: uploadedImageUrls,
        status: "pending",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (error) throw new Error(error.message);
      toast.success("Produk berhasil ditambahkan dan menunggu verifikasi admin.");
      setTitle("");
      setDescription("");
      setPrice("");
      setOriginalPrice("");
      setCategoryId("");
      setCondition("good");
      setLocation("");
      setStock("1");
      setSelectedFiles([]);
      setFileInputKey((current) => current + 1);
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan produk.");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Tambah Produk" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Upload foto dari perangkat seller. Foto akan disimpan ke Supabase Storage, lalu produk masuk ke admin untuk diverifikasi." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Nama Produk" }),
        /* @__PURE__ */ jsx(Input, { value: title, onChange: (event) => setTitle(event.target.value), placeholder: "Contoh: Jaket Denim Preloved" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Deskripsi Produk" }),
        /* @__PURE__ */ jsx(Textarea, { value: description, onChange: (event) => setDescription(event.target.value), rows: 4, placeholder: "Jelaskan kondisi, ukuran, minus, dan detail produk." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Harga Jual" }),
          /* @__PURE__ */ jsx(Input, { type: "number", value: price, onChange: (event) => setPrice(event.target.value), placeholder: "100000" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Harga Awal/Coret" }),
          /* @__PURE__ */ jsx(Input, { type: "number", value: originalPrice, onChange: (event) => setOriginalPrice(event.target.value), placeholder: "150000" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Kategori" }),
          /* @__PURE__ */ jsxs("select", { value: categoryId, onChange: (event) => setCategoryId(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Pilih kategori" }),
            categories.map((category) => /* @__PURE__ */ jsx("option", { value: category.id, children: category.name }, category.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Kondisi" }),
          /* @__PURE__ */ jsxs("select", { value: condition, onChange: (event) => setCondition(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: [
            /* @__PURE__ */ jsx("option", { value: "like_new", children: "Seperti Baru" }),
            /* @__PURE__ */ jsx("option", { value: "very_good", children: "Sangat Baik" }),
            /* @__PURE__ */ jsx("option", { value: "good", children: "Baik" }),
            /* @__PURE__ */ jsx("option", { value: "fair", children: "Cukup" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Lokasi Produk" }),
          /* @__PURE__ */ jsx(Input, { value: location, onChange: (event) => setLocation(event.target.value), placeholder: "Contoh: Bandung" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Stok" }),
          /* @__PURE__ */ jsx(Input, { type: "number", min: 0, value: stock, onChange: (event) => setStock(event.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Foto Produk" }),
        /* @__PURE__ */ jsxs("label", { className: "flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background p-6 text-center transition hover:bg-accent", children: [
          /* @__PURE__ */ jsx(Upload, { className: "h-8 w-8 text-primary" }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 font-medium", children: "Klik untuk upload foto produk" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: "Maksimal 5 foto, format JPG, PNG, atau WEBP, maksimal 5 MB per foto." }),
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/jpeg,image/png,image/webp,image/jpg", multiple: true, onChange: handleFileChange, className: "hidden" }, fileInputKey)
        ] }),
        previewUrls.length > 0 ? /* @__PURE__ */ jsx(ImagePreviewGrid, { title: "Preview Foto", urls: previewUrls, files: selectedFiles, onRemove: removeSelectedFile }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 flex justify-end", children: /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving, className: "gradient-brand text-white", children: [
      saving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(PlusCircle, { className: "mr-2 h-4 w-4" }),
      "Simpan Produk"
    ] }) })
  ] });
}
function ProductsPanel({
  userId,
  products,
  categories,
  highlightProductId,
  onReload
}) {
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  useEffect(() => {
    if (!highlightProductId) return;
    window.setTimeout(() => {
      document.getElementById(`seller-product-${highlightProductId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 250);
  }, [highlightProductId, products.length]);
  const filteredProducts = products.filter((product) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return product.title.toLowerCase().includes(keyword) || String(product.description ?? "").toLowerCase().includes(keyword) || String(product.location ?? "").toLowerCase().includes(keyword);
  });
  async function handleUpdateStock(productId, stock) {
    if (!userId) {
      toast.error("ID seller tidak valid.");
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      toast.error("Stok produk tidak valid.");
      return;
    }
    setUpdatingId(productId);
    try {
      const {
        error
      } = await db.from("products").update({
        stock,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", productId).eq("seller_id", userId);
      if (error) throw new Error(error.message);
      toast.success("Stok produk berhasil diperbarui.");
      await onReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui stok.");
    } finally {
      setUpdatingId(null);
    }
  }
  async function handleInactive(productId) {
    if (!userId) {
      toast.error("ID seller tidak valid.");
      return;
    }
    const confirmed = window.confirm("Nonaktifkan produk ini?");
    if (!confirmed) return;
    setUpdatingId(productId);
    try {
      const {
        error
      } = await db.from("products").update({
        status: "inactive",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", productId).eq("seller_id", userId);
      if (error) throw new Error(error.message);
      toast.success("Produk berhasil dinonaktifkan.");
      await onReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menonaktifkan produk.");
    } finally {
      setUpdatingId(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Produk Saya" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Kelola produk, edit detail produk, ubah stok, dan nonaktifkan produk." }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-5", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Cari produk...", className: "pl-9" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-5", children: filteredProducts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-border p-8 text-center", children: [
      /* @__PURE__ */ jsx(Boxes, { className: "mx-auto h-9 w-9 text-primary" }),
      /* @__PURE__ */ jsx("h3", { className: "mt-3 font-semibold", children: "Belum ada produk" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Tambahkan produk pertama dari menu Tambah Produk." })
    ] }) : /* @__PURE__ */ jsx("div", { className: "max-h-[720px] space-y-3 overflow-y-auto pr-1", children: filteredProducts.map((product) => /* @__PURE__ */ jsx(SellerProductCard, { product, highlighted: highlightProductId === product.id, updating: updatingId === product.id, onEdit: () => setEditingProduct(product), onUpdateStock: (stock) => handleUpdateStock(product.id, stock), onInactive: () => handleInactive(product.id) }, product.id)) }) }),
    editingProduct ? /* @__PURE__ */ jsx(EditProductModal, { userId, product: editingProduct, categories, onClose: () => setEditingProduct(null), onSaved: async () => {
      setEditingProduct(null);
      await onReload();
    } }) : null
  ] });
}
function SellerProductCard({
  product,
  highlighted,
  updating,
  onEdit,
  onUpdateStock,
  onInactive
}) {
  const [stock, setStock] = useState(String(product.stock ?? 0));
  const image = product.images?.[0];
  const category = getCategoryName(product);
  return /* @__PURE__ */ jsx("div", { id: `seller-product-${product.id}`, className: `rounded-xl border bg-background p-4 transition ${highlighted ? "border-primary ring-2 ring-primary/20" : "border-border"}`, children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-[90px_1fr]", children: [
    /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${product.id}`, className: "h-24 w-full overflow-hidden rounded-xl bg-muted md:w-24", children: image ? /* @__PURE__ */ jsx("img", { src: image, alt: product.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-muted-foreground", children: "No Image" }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${product.id}`, children: /* @__PURE__ */ jsx("h3", { className: "font-semibold hover:text-primary", children: product.title }) }),
        /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary", children: productStatusLabel(product.status) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 line-clamp-2 text-sm text-muted-foreground", children: product.description || "Tidak ada deskripsi." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-1 text-sm text-muted-foreground md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "Harga:",
          " ",
          /* @__PURE__ */ jsx("b", { className: "text-foreground", children: formatIDR(Number(product.price)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Kategori: ",
          category
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Kondisi: ",
          conditionLabel(product.condition)
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Lokasi: ",
          product.location ?? "-"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Terjual: ",
          product.sold ?? 0
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]", children: [
        /* @__PURE__ */ jsx(Input, { type: "number", min: 0, value: stock, onChange: (event) => setStock(event.target.value) }),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", disabled: updating, onClick: () => onUpdateStock(Number(stock)), children: [
          updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
          "Simpan Stok"
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", disabled: updating, onClick: onEdit, children: "Edit Produk" }),
        product.status !== "inactive" ? /* @__PURE__ */ jsxs(Button, { type: "button", variant: "destructive", disabled: updating, onClick: onInactive, children: [
          /* @__PURE__ */ jsx(XCircle, { className: "mr-2 h-4 w-4" }),
          "Nonaktifkan"
        ] }) : null
      ] })
    ] })
  ] }) });
}
function EditProductModal({
  userId,
  product,
  categories,
  onClose,
  onSaved
}) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(product.title ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(String(product.price ?? ""));
  const [originalPrice, setOriginalPrice] = useState(product.original_price ? String(product.original_price) : "");
  const [categoryId, setCategoryId] = useState(product.category_id ?? "");
  const [condition, setCondition] = useState(product.condition ?? "good");
  const [location, setLocation] = useState(product.location ?? "");
  const [stock, setStock] = useState(String(product.stock ?? 0));
  const [existingImages, setExistingImages] = useState(Array.isArray(product.images) ? product.images.filter(Boolean) : []);
  const [newFiles, setNewFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  useEffect(() => {
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFiles]);
  function handleFileChange(event) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const totalImages = existingImages.length + newFiles.length + files.length;
    if (totalImages > 5) {
      toast.error("Maksimal total 5 foto produk.");
      return;
    }
    const invalidFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      toast.error(`File ${invalidFile.name} bukan gambar.`);
      return;
    }
    const oversizeFile = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversizeFile) {
      toast.error(`File ${oversizeFile.name} melebihi 5 MB.`);
      return;
    }
    setNewFiles((current) => [...current, ...files]);
    setFileInputKey((current) => current + 1);
  }
  function removeExistingImage(index) {
    setExistingImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }
  function removeNewFile(index) {
    setNewFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }
  async function handleSave(event) {
    event.preventDefault();
    if (!userId) {
      toast.error("ID seller tidak valid.");
      return;
    }
    if (!title.trim()) {
      toast.error("Nama produk wajib diisi.");
      return;
    }
    if (Number(price) <= 0) {
      toast.error("Harga produk wajib lebih dari 0.");
      return;
    }
    if (Number(stock) < 0) {
      toast.error("Stok produk tidak valid.");
      return;
    }
    setSaving(true);
    try {
      const uploadedUrls = newFiles.length > 0 ? await uploadProductImages({
        sellerId: userId,
        files: newFiles
      }) : [];
      const nextImages = [...existingImages, ...uploadedUrls];
      const nextStatus = product.status === "inactive" ? "inactive" : "pending";
      const {
        error
      } = await db.from("products").update({
        title: title.trim(),
        description: cleanText(description),
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : null,
        category_id: categoryId || null,
        condition,
        location: cleanText(location),
        stock: Number(stock || 0),
        images: nextImages,
        status: nextStatus,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", product.id).eq("seller_id", userId);
      if (error) throw new Error(error.message);
      if (nextStatus === "pending") {
        toast.success("Produk berhasil diperbarui dan kembali menunggu verifikasi admin.");
      } else {
        toast.success("Produk berhasil diperbarui.");
      }
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui produk.");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Edit Produk" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Ubah informasi produk. Jika produk aktif diedit, status akan kembali menunggu verifikasi admin." })
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Tutup" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "mt-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Nama Produk" }),
          /* @__PURE__ */ jsx(Input, { value: title, onChange: (event) => setTitle(event.target.value), placeholder: "Nama produk" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Deskripsi Produk" }),
          /* @__PURE__ */ jsx(Textarea, { value: description, onChange: (event) => setDescription(event.target.value), rows: 4, placeholder: "Deskripsi produk" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Harga Jual" }),
            /* @__PURE__ */ jsx(Input, { type: "number", value: price, onChange: (event) => setPrice(event.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Harga Awal/Coret" }),
            /* @__PURE__ */ jsx(Input, { type: "number", value: originalPrice, onChange: (event) => setOriginalPrice(event.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Kategori" }),
            /* @__PURE__ */ jsxs("select", { value: categoryId, onChange: (event) => setCategoryId(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Pilih kategori" }),
              categories.map((category) => /* @__PURE__ */ jsx("option", { value: category.id, children: category.name }, category.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Kondisi" }),
            /* @__PURE__ */ jsxs("select", { value: condition, onChange: (event) => setCondition(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: [
              /* @__PURE__ */ jsx("option", { value: "like_new", children: "Seperti Baru" }),
              /* @__PURE__ */ jsx("option", { value: "very_good", children: "Sangat Baik" }),
              /* @__PURE__ */ jsx("option", { value: "good", children: "Baik" }),
              /* @__PURE__ */ jsx("option", { value: "fair", children: "Cukup" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Lokasi Produk" }),
            /* @__PURE__ */ jsx(Input, { value: location, onChange: (event) => setLocation(event.target.value), placeholder: "Contoh: Bandung" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Stok" }),
            /* @__PURE__ */ jsx(Input, { type: "number", min: 0, value: stock, onChange: (event) => setStock(event.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Foto Produk" }),
          /* @__PURE__ */ jsxs("label", { className: "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background p-6 text-center transition hover:bg-accent", children: [
            /* @__PURE__ */ jsx(Upload, { className: "h-7 w-7 text-primary" }),
            /* @__PURE__ */ jsx("div", { className: "mt-3 font-medium", children: "Upload foto tambahan produk" }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: "Maksimal total 5 foto, format JPG, PNG, atau WEBP, maksimal 5 MB per foto." }),
            /* @__PURE__ */ jsx("input", { type: "file", accept: "image/jpeg,image/png,image/webp,image/jpg", multiple: true, onChange: handleFileChange, className: "hidden" }, fileInputKey)
          ] }),
          existingImages.length > 0 ? /* @__PURE__ */ jsx(ImagePreviewGrid, { title: "Foto Saat Ini", urls: existingImages, onRemove: removeExistingImage }) : null,
          previewUrls.length > 0 ? /* @__PURE__ */ jsx(ImagePreviewGrid, { title: "Foto Baru", urls: previewUrls, files: newFiles, onRemove: removeNewFile }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Batal" }),
        /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving, className: "gradient-brand text-white", children: [
          saving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
          "Simpan Perubahan"
        ] })
      ] })
    ] })
  ] }) });
}
function ImagePreviewGrid({
  title,
  urls,
  files,
  onRemove
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-2 text-sm font-medium", children: title }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-3", children: urls.map((url, index) => /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-2xl border border-border bg-background", children: [
      /* @__PURE__ */ jsx("div", { className: "aspect-square bg-muted", children: /* @__PURE__ */ jsx("img", { src: url, alt: `Foto produk ${index + 1}`, className: "h-full w-full object-cover" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx(ImageIcon, { className: "h-4 w-4 shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "truncate", children: files?.[index]?.name ?? `Foto ${index + 1}` })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onRemove(index), className: "rounded-md p-1 text-destructive hover:bg-destructive/10", "aria-label": "Hapus foto", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
      ] })
    ] }, `${url}-${index}`)) })
  ] });
}
function OrdersPanel({
  userId,
  orders,
  highlightOrderId,
  onReload
}) {
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(highlightOrderId || null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [trackingDrafts, setTrackingDrafts] = useState({});
  useEffect(() => {
    const nextDrafts = {};
    orders.forEach((order) => {
      nextDrafts[order.id] = {
        courier: order.courier ?? "",
        trackingNumber: order.tracking_number ?? ""
      };
    });
    setTrackingDrafts((current) => ({
      ...nextDrafts,
      ...current
    }));
  }, [orders.length]);
  useEffect(() => {
    if (!highlightOrderId) return;
    setExpandedOrderId(highlightOrderId);
    window.setTimeout(() => {
      document.getElementById(`seller-order-${highlightOrderId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 250);
  }, [highlightOrderId, orders.length]);
  const filteredOrders = orders.filter((order) => {
    const matchStatus = statusFilter === "all" ? true : order.order_status === statusFilter;
    if (!matchStatus) return false;
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    const orderText = [order.id, order.order_status, order.payment_status, order.payment_method, order.shipping_method, order.tracking_number, order.courier, order.shipping_address, ...(order.order_items ?? []).map((item) => {
      const product = getOrderItemProduct(item);
      return product?.title ?? "";
    })].filter(Boolean).join(" ").toLowerCase();
    return orderText.includes(keyword);
  });
  async function updateOrderStatus(orderId, nextStatus) {
    if (!userId) {
      toast.error("ID seller tidak valid.");
      return;
    }
    setUpdatingId(orderId);
    try {
      const {
        error
      } = await db.from("orders").update({
        order_status: nextStatus,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", orderId).eq("seller_id", userId);
      if (error) throw new Error(error.message);
      toast.success("Status pesanan berhasil diperbarui.");
      await onReload();
      if (nextStatus === "diproses_penjual") {
        setExpandedOrderId(orderId);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui pesanan.");
    } finally {
      setUpdatingId(null);
    }
  }
  async function saveTracking(orderId) {
    if (!userId) {
      toast.error("ID seller tidak valid.");
      return;
    }
    const draft = trackingDrafts[orderId];
    if (!draft?.courier?.trim()) {
      toast.error("Pilih jasa kirim terlebih dahulu.");
      return;
    }
    if (!draft?.trackingNumber?.trim()) {
      toast.error("Nomor resi wajib diisi.");
      return;
    }
    setUpdatingId(orderId);
    try {
      const {
        error
      } = await db.from("orders").update({
        courier: draft.courier.trim(),
        tracking_number: draft.trackingNumber.trim(),
        shipped_at: (/* @__PURE__ */ new Date()).toISOString(),
        order_status: "dikirim",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", orderId).eq("seller_id", userId);
      if (error) throw new Error(error.message);
      toast.success("Resi berhasil disimpan. Pesanan berubah menjadi dikirim.");
      await onReload();
      setExpandedOrderId(orderId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan resi.");
    } finally {
      setUpdatingId(null);
    }
  }
  function setTrackingDraft(orderId, key, value) {
    setTrackingDrafts((current) => ({
      ...current,
      [orderId]: {
        courier: current[orderId]?.courier ?? "",
        trackingNumber: current[orderId]?.trackingNumber ?? "",
        [key]: value
      }
    }));
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Pesanan Masuk" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Proses pesanan buyer, input kurir dan nomor resi, lalu kirim pesanan. Jika status sudah Diproses Penjual, form resi akan tampil langsung." })
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: onReload, disabled: Boolean(updatingId), children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
        "Refresh"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 md:grid-cols-[1fr_220px]", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Cari order ID, nama produk, resi, kurir...", className: "pl-9" })
      ] }),
      /* @__PURE__ */ jsxs("select", { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "all", children: "Semua Status" }),
        /* @__PURE__ */ jsx("option", { value: "menunggu_konfirmasi_penjual", children: "Menunggu Konfirmasi" }),
        /* @__PURE__ */ jsx("option", { value: "diproses_penjual", children: "Diproses Penjual" }),
        /* @__PURE__ */ jsx("option", { value: "dikirim", children: "Dikirim" }),
        /* @__PURE__ */ jsx("option", { value: "pesanan_diterima", children: "Pesanan Diterima" }),
        /* @__PURE__ */ jsx("option", { value: "selesai", children: "Selesai" }),
        /* @__PURE__ */ jsx("option", { value: "dibatalkan", children: "Dibatalkan" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-5", children: filteredOrders.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-border p-8 text-center", children: [
      /* @__PURE__ */ jsx(Package, { className: "mx-auto h-9 w-9 text-primary" }),
      /* @__PURE__ */ jsx("h3", { className: "mt-3 font-semibold", children: "Belum ada pesanan" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Pesanan buyer akan muncul di sini setelah checkout berhasil." })
    ] }) : /* @__PURE__ */ jsx("div", { className: "max-h-[820px] space-y-4 overflow-y-auto pr-1", children: filteredOrders.map((order) => /* @__PURE__ */ jsx(SellerOrderCard, { order, highlighted: highlightOrderId === order.id, expanded: expandedOrderId === order.id, updating: updatingId === order.id, draft: trackingDrafts[order.id], onToggleExpanded: () => setExpandedOrderId((current) => current === order.id ? null : order.id), onProcess: () => updateOrderStatus(order.id, "diproses_penjual"), onSaveTracking: () => saveTracking(order.id), onTrackingChange: (key, value) => setTrackingDraft(order.id, key, value) }, order.id)) }) })
  ] });
}
function SellerOrderCard({
  order,
  highlighted,
  expanded,
  updating,
  draft,
  onToggleExpanded,
  onProcess,
  onSaveTracking,
  onTrackingChange
}) {
  const canProcess = canProcessSellerOrder(order);
  const canInputTracking = canInputSellerTracking(order);
  const alreadyShipped = Boolean(order.tracking_number) || order.order_status === "dikirim";
  const firstItem = order.order_items?.[0] ?? null;
  const firstProduct = firstItem ? getOrderItemProduct(firstItem) : null;
  const itemCount = order.order_items?.length ?? 0;
  return /* @__PURE__ */ jsxs("div", { id: `seller-order-${order.id}`, className: `rounded-xl border bg-background p-4 transition ${highlighted ? "border-primary ring-2 ring-primary/20" : "border-border"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted", children: firstProduct?.images?.[0] ? /* @__PURE__ */ jsx("img", { src: firstProduct.images[0], alt: firstProduct.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-muted-foreground", children: "No Image" }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs font-semibold md:text-sm", children: order.id }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 line-clamp-1 text-sm font-medium", children: [
            firstProduct?.title ?? "Produk",
            itemCount > 1 ? ` +${itemCount - 1} produk lain` : ""
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
            "Dibuat: ",
            new Date(order.created_at).toLocaleString("id-ID")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-end gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: sellerOrderStatusClass(order.order_status), children: orderStatusLabel(order.order_status) }),
        /* @__PURE__ */ jsx("span", { className: "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700", children: paymentStatusLabel(order.payment_status) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 rounded-xl bg-accent p-4 text-sm md:grid-cols-4", children: [
      /* @__PURE__ */ jsx(Info, { label: "Total", value: formatIDR(getOrderTotal(order)), strong: true }),
      /* @__PURE__ */ jsx(Info, { label: "Metode Kirim", value: order.shipping_method || "-" }),
      /* @__PURE__ */ jsx(Info, { label: "Metode Bayar", value: paymentMethodLabel(order.payment_method) }),
      /* @__PURE__ */ jsx(Info, { label: "Produk", value: `${itemCount} item` })
    ] }),
    canInputTracking ? /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4", children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold text-primary", children: "Input Resi Pengiriman" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Pilih kurir dan isi nomor resi untuk mengubah pesanan menjadi Dikirim." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-3 md:grid-cols-[180px_1fr_auto]", children: [
        /* @__PURE__ */ jsxs("select", { value: draft?.courier ?? "", onChange: (event) => onTrackingChange("courier", event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Pilih Kurir" }),
          COURIER_OPTIONS.map((courier) => /* @__PURE__ */ jsx("option", { value: courier, children: courier }, courier))
        ] }),
        /* @__PURE__ */ jsx(Input, { value: draft?.trackingNumber ?? "", onChange: (event) => onTrackingChange("trackingNumber", event.target.value), placeholder: "Nomor resi, contoh: JN123456789" }),
        /* @__PURE__ */ jsxs(Button, { type: "button", disabled: updating, onClick: onSaveTracking, className: "gradient-brand text-white", children: [
          updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Truck, { className: "mr-2 h-4 w-4" }),
          "Simpan Resi"
        ] })
      ] })
    ] }) : null,
    alreadyShipped ? /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-950", children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Detail Pengiriman" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 grid gap-2 md:grid-cols-3", children: [
        /* @__PURE__ */ jsx(Info, { label: "Jasa Kirim", value: order.courier || "-" }),
        /* @__PURE__ */ jsx(Info, { label: "Nomor Resi", value: order.tracking_number || "-" }),
        /* @__PURE__ */ jsx(Info, { label: "Tanggal Kirim", value: order.shipped_at ? new Date(order.shipped_at).toLocaleString("id-ID") : "-" })
      ] })
    ] }) : null,
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap justify-end gap-2", children: [
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: `/invoice?order=${order.id}`, children: "Invoice" }) }),
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: `/tracking?order=${order.id}`, children: "Lacak Pesanan" }) }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onToggleExpanded, children: expanded ? "Tutup Detail" : "Lihat Detail" }),
      canProcess ? /* @__PURE__ */ jsxs(Button, { type: "button", disabled: updating, onClick: onProcess, className: "gradient-brand text-white", children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-2 h-4 w-4" }),
        "Proses Pesanan"
      ] }) : null
    ] }),
    expanded ? /* @__PURE__ */ jsxs("div", { className: "mt-4 border-t border-border pt-4", children: [
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children: order.order_items?.map((item) => {
        const product = getOrderItemProduct(item);
        return /* @__PURE__ */ jsxs("div", { className: "flex gap-3 rounded-xl border border-border p-3", children: [
          /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.product_id}`, className: "h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted", children: product?.images?.[0] ? /* @__PURE__ */ jsx("img", { src: product.images[0], alt: product.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-muted-foreground", children: "No Image" }) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.product_id}`, className: "line-clamp-1 font-medium hover:text-primary", children: product?.title ?? "Produk" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
              item.quantity,
              " x ",
              formatIDR(Number(item.price))
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm font-semibold", children: formatIDR(Number(item.price) * Number(item.quantity)) })
          ] })
        ] }, item.id);
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 border-t border-border pt-4 text-sm md:grid-cols-2", children: [
        /* @__PURE__ */ jsx(Info, { label: "Subtotal", value: formatIDR(Number(order.subtotal ?? 0)) }),
        /* @__PURE__ */ jsx(Info, { label: "Ongkir", value: formatIDR(Number(order.shipping_cost ?? 0)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl bg-accent p-4 text-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: "Alamat Pengiriman" }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-muted-foreground", children: order.shipping_address || "-" })
      ] })
    ] }) : null
  ] });
}
function ReportPanel({
  orders
}) {
  const [range, setRange] = useState("7");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const dateRange = useMemo(() => {
    const end = /* @__PURE__ */ new Date();
    const start = /* @__PURE__ */ new Date();
    if (range === "custom") {
      const customStartDate = customStart ? /* @__PURE__ */ new Date(`${customStart}T00:00:00`) : null;
      const customEndDate = customEnd ? /* @__PURE__ */ new Date(`${customEnd}T23:59:59`) : null;
      return {
        start: customStartDate,
        end: customEndDate,
        label: customStart && customEnd ? `${customStart} sampai ${customEnd}` : "Custom tanggal"
      };
    }
    const days = Number(range);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return {
      start,
      end,
      label: `${days} hari terakhir`
    };
  }, [range, customStart, customEnd]);
  const completedOrders = useMemo(() => {
    return orders.filter((order) => {
      const validStatus = ["selesai", "pesanan_diterima"].includes(String(order.order_status ?? ""));
      const validPayment = String(order.payment_status ?? "") === "dibayar";
      if (!validStatus || !validPayment) return false;
      if (!dateRange.start || !dateRange.end) return true;
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);
  const salesData = useMemo(() => {
    const fallbackEnd = /* @__PURE__ */ new Date();
    const fallbackStart = /* @__PURE__ */ new Date();
    fallbackStart.setDate(fallbackStart.getDate() - 6);
    return buildDailySales({
      orders: completedOrders,
      start: dateRange.start ?? fallbackStart,
      end: dateRange.end ?? fallbackEnd
    });
  }, [completedOrders, dateRange]);
  const productSummary = useMemo(() => {
    return buildProductSalesSummaryForExport(completedOrders);
  }, [completedOrders]);
  const revenue = useMemo(() => {
    return completedOrders.reduce((sum, order) => {
      return sum + getOrderTotal(order);
    }, 0);
  }, [completedOrders]);
  const totalSoldItems = useMemo(() => {
    return completedOrders.reduce((sum, order) => {
      return sum + (order.order_items ?? []).reduce((itemSum, item) => {
        return itemSum + Number(item.quantity ?? 0);
      }, 0);
    }, 0);
  }, [completedOrders]);
  const averageOrderValue = completedOrders.length > 0 ? revenue / completedOrders.length : 0;
  function handleExportOrdersCsv() {
    if (completedOrders.length === 0) {
      toast.error("Belum ada order selesai untuk diexport.");
      return;
    }
    const csv = toCsvForExport([["Order ID", "Tanggal", "Status Order", "Status Pembayaran", "Metode Bayar", "Metode Kirim", "Kurir", "Resi", "Produk", "Subtotal", "Ongkir", "Total"], ...completedOrders.map((order) => {
      const productNames = (order.order_items ?? []).map((item) => {
        const product = getOrderItemProduct(item);
        return `${product?.title ?? "Produk"} x${item.quantity}`;
      }).join(" | ");
      return [order.id, new Date(order.created_at).toLocaleString("id-ID"), orderStatusLabel(order.order_status), paymentStatusLabel(order.payment_status), paymentMethodLabel(order.payment_method), order.shipping_method ?? "-", order.courier ?? "-", order.tracking_number ?? "-", productNames, Number(order.subtotal ?? 0), Number(order.shipping_cost ?? 0), getOrderTotal(order)];
    })]);
    downloadTextFileForExport({
      filename: `revibe-laporan-order-${safeFileDateForExport()}.csv`,
      content: csv,
      mimeType: "text/csv;charset=utf-8;"
    });
    toast.success("CSV laporan order berhasil dibuat.");
  }
  function handleExportProductsCsv() {
    if (productSummary.length === 0) {
      toast.error("Belum ada produk terjual untuk diexport.");
      return;
    }
    const csv = toCsvForExport([["Produk", "Product ID", "Jumlah Terjual", "Omzet"], ...productSummary.map((item) => [item.title, item.productId, item.quantity, item.revenue])]);
    downloadTextFileForExport({
      filename: `revibe-laporan-produk-${safeFileDateForExport()}.csv`,
      content: csv,
      mimeType: "text/csv;charset=utf-8;"
    });
    toast.success("CSV ringkasan produk berhasil dibuat.");
  }
  function handleExportPdf() {
    if (completedOrders.length === 0) {
      toast.error("Belum ada order selesai untuk dibuat PDF.");
      return;
    }
    const html = buildSellerReportPrintHtmlForExport({
      title: "Laporan Penjualan Seller ReVibe",
      period: dateRange.label,
      revenue,
      totalOrders: completedOrders.length,
      totalSoldItems,
      averageOrderValue,
      orders: completedOrders,
      productSummary
    });
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      toast.error("Popup browser diblokir. Izinkan popup untuk export PDF.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
    toast.success("Jendela PDF dibuka. Pilih Save as PDF di dialog print.");
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Laporan Penjualan" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Lihat omzet, order selesai, barang terjual, grafik penjualan, dan export laporan seller." })
      ] }),
      /* @__PURE__ */ jsxs("select", { value: range, onChange: (event) => setRange(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "7", children: "7 hari" }),
        /* @__PURE__ */ jsx("option", { value: "14", children: "14 hari" }),
        /* @__PURE__ */ jsx("option", { value: "30", children: "30 hari" }),
        /* @__PURE__ */ jsx("option", { value: "custom", children: "Custom tanggal" })
      ] })
    ] }),
    range === "custom" ? /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Tanggal Mulai" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: customStart, onChange: (event) => setCustomStart(event.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Tanggal Akhir" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: customEnd, onChange: (event) => setCustomEnd(event.target.value) })
      ] })
    ] }) : null,
    /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-background p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Omzet Selesai" }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 text-xl font-bold", children: formatIDR(revenue) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-background p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Order Selesai" }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 text-xl font-bold", children: completedOrders.length })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-background p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Produk Terjual" }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 text-xl font-bold", children: totalSoldItems })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-background p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Rata-rata Order" }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 text-xl font-bold", children: formatIDR(averageOrderValue) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-3 font-semibold text-primary", children: "Export Laporan" }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:grid-cols-3", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: handleExportOrdersCsv, children: "Export CSV Order" }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: handleExportProductsCsv, children: "Export CSV Produk" }),
        /* @__PURE__ */ jsx(Button, { type: "button", className: "gradient-brand text-white", onClick: handleExportPdf, children: "Export PDF" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-5", children: /* @__PURE__ */ jsx(MiniSalesChart, { data: salesData }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl border border-border bg-background p-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Produk Terlaris" }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-2", children: productSummary.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Belum ada produk terjual pada periode ini." }) : productSummary.slice(0, 10).map((item, index) => /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card p-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
            index + 1,
            ". ",
            item.title
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
            "Terjual ",
            item.quantity,
            " produk"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "font-bold", children: formatIDR(item.revenue) })
      ] }, item.productId)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl border border-border bg-background p-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Ringkasan Order Selesai" }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-2", children: completedOrders.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Belum ada order selesai pada periode ini." }) : completedOrders.slice(0, 10).map((order) => /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card p-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
            "Order ",
            order.id
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: new Date(order.created_at).toLocaleString("id-ID") })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "font-bold", children: formatIDR(getOrderTotal(order)) })
      ] }, order.id)) })
    ] })
  ] });
}
function buildProductSalesSummaryForExport(orders) {
  const map = /* @__PURE__ */ new Map();
  orders.forEach((order) => {
    (order.order_items ?? []).forEach((item) => {
      const product = getOrderItemProduct(item);
      const productId = String(item.product_id ?? "");
      const title = product?.title ?? "Produk";
      const quantity = Number(item.quantity ?? 0);
      const revenue = Number(item.price ?? 0) * quantity;
      const existing = map.get(productId);
      if (existing) {
        existing.quantity += quantity;
        existing.revenue += revenue;
      } else {
        map.set(productId, {
          productId,
          title,
          quantity,
          revenue
        });
      }
    });
  });
  return Array.from(map.values()).sort((a, b) => {
    if (b.quantity !== a.quantity) return b.quantity - a.quantity;
    return b.revenue - a.revenue;
  });
}
function toCsvForExport(rows) {
  return "\uFEFF" + rows.map((row) => row.map((cell) => {
    const value = String(cell ?? "");
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }).join(",")).join("\n");
}
function downloadTextFileForExport({
  filename,
  content,
  mimeType
}) {
  const blob = new Blob([content], {
    type: mimeType
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
function safeFileDateForExport() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function buildSellerReportPrintHtmlForExport({
  title,
  period,
  revenue,
  totalOrders,
  totalSoldItems,
  averageOrderValue,
  orders,
  productSummary
}) {
  const orderRows = orders.map((order) => {
    const productNames = (order.order_items ?? []).map((item) => {
      const product = getOrderItemProduct(item);
      return `${escapeHtmlForExport(product?.title ?? "Produk")} x${Number(item.quantity ?? 0)}`;
    }).join("<br />");
    return `
        <tr>
          <td>${escapeHtmlForExport(order.id)}</td>
          <td>${escapeHtmlForExport(new Date(order.created_at).toLocaleString("id-ID"))}</td>
          <td>${productNames}</td>
          <td>${escapeHtmlForExport(orderStatusLabel(order.order_status))}</td>
          <td>${escapeHtmlForExport(paymentStatusLabel(order.payment_status))}</td>
          <td>${escapeHtmlForExport(formatIDR(getOrderTotal(order)))}</td>
        </tr>
      `;
  }).join("");
  const productRows = productSummary.map((item, index) => {
    return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtmlForExport(item.title)}</td>
          <td>${item.quantity}</td>
          <td>${escapeHtmlForExport(formatIDR(item.revenue))}</td>
        </tr>
      `;
  }).join("");
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtmlForExport(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            color: #111827;
            margin: 32px;
          }
          h1 { margin: 0; font-size: 24px; }
          h2 { margin-top: 28px; font-size: 18px; }
          .muted { color: #6b7280; font-size: 13px; }
          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-top: 20px;
          }
          .card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 14px;
          }
          .label { color: #6b7280; font-size: 12px; }
          .value { margin-top: 6px; font-size: 18px; font-weight: 700; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          th { background: #f9fafb; }
          @media print {
            body { margin: 16px; }
            .no-print { display: none; }
          }
        </style>
      </head>

      <body>
        <button class="no-print" onclick="window.print()" style="margin-bottom:16px;padding:10px 14px;border:1px solid #ddd;border-radius:8px;background:white;cursor:pointer;">
          Print / Save as PDF
        </button>

        <h1>${escapeHtmlForExport(title)}</h1>
        <div class="muted">Periode: ${escapeHtmlForExport(period)}</div>
        <div class="muted">Dibuat: ${escapeHtmlForExport((/* @__PURE__ */ new Date()).toLocaleString("id-ID"))}</div>

        <div class="summary">
          <div class="card">
            <div class="label">Omzet</div>
            <div class="value">${escapeHtmlForExport(formatIDR(revenue))}</div>
          </div>

          <div class="card">
            <div class="label">Order Selesai</div>
            <div class="value">${totalOrders}</div>
          </div>

          <div class="card">
            <div class="label">Produk Terjual</div>
            <div class="value">${totalSoldItems}</div>
          </div>

          <div class="card">
            <div class="label">Rata-rata Order</div>
            <div class="value">${escapeHtmlForExport(formatIDR(averageOrderValue))}</div>
          </div>
        </div>

        <h2>Produk Terlaris</h2>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Produk</th>
              <th>Jumlah Terjual</th>
              <th>Omzet</th>
            </tr>
          </thead>
          <tbody>
            ${productRows || `<tr><td colspan="4">Belum ada produk terjual.</td></tr>`}
          </tbody>
        </table>

        <h2>Daftar Order Selesai</h2>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Tanggal</th>
              <th>Produk</th>
              <th>Status</th>
              <th>Pembayaran</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderRows || `<tr><td colspan="6">Belum ada order selesai.</td></tr>`}
          </tbody>
        </table>
      </body>
    </html>
  `;
}
function escapeHtmlForExport(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function ProfilePanel({
  form,
  saving,
  onChange,
  onSubmit,
  sellerId
}) {
  return /* @__PURE__ */ jsxs("form", { onSubmit, children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Profil Toko" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Atur identitas seller dan informasi toko." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Nama Pemilik" }),
          /* @__PURE__ */ jsx(Input, { value: form.full_name, onChange: (event) => onChange("full_name", event.target.value), placeholder: "Nama lengkap" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "WhatsApp" }),
          /* @__PURE__ */ jsx(Input, { value: form.whatsapp, onChange: (event) => onChange("whatsapp", event.target.value), placeholder: "08xxxxxxxxxx" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "URL Avatar" }),
        /* @__PURE__ */ jsx(Input, { value: form.avatar_url, onChange: (event) => onChange("avatar_url", event.target.value), placeholder: "https://..." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Alamat Seller" }),
        /* @__PURE__ */ jsx(Textarea, { value: form.address, onChange: (event) => onChange("address", event.target.value), rows: 3, placeholder: "Alamat seller" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Kota" }),
        /* @__PURE__ */ jsx(Input, { value: form.city, onChange: (event) => onChange("city", event.target.value), placeholder: "Kota" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Bio Seller" }),
        /* @__PURE__ */ jsx(Textarea, { value: form.bio, onChange: (event) => onChange("bio", event.target.value), rows: 3, placeholder: "Deskripsi singkat seller" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-border pt-4", children: /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Informasi Toko" }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Nama Toko" }),
        /* @__PURE__ */ jsx(Input, { value: form.shop_name, onChange: (event) => onChange("shop_name", event.target.value), placeholder: "Nama toko" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Deskripsi Toko" }),
        /* @__PURE__ */ jsx(Textarea, { value: form.shop_description, onChange: (event) => onChange("shop_description", event.target.value), rows: 3, placeholder: "Deskripsi toko" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Lokasi Toko" }),
        /* @__PURE__ */ jsx(Input, { value: form.shop_location, onChange: (event) => onChange("shop_location", event.target.value), placeholder: "Contoh: Bandung" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "URL Logo Toko" }),
        /* @__PURE__ */ jsx(Input, { value: form.shop_logo_url, onChange: (event) => onChange("shop_logo_url", event.target.value), placeholder: "https://..." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 flex justify-end", children: /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving || !sellerId, className: "gradient-brand text-white", children: [
      saving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
      "Simpan Profil"
    ] }) })
  ] });
}
function SettingsPanel({
  onOpenProfile,
  onOpenProducts,
  onOpenOrders,
  onOpenReport
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Pengaturan Seller" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Shortcut untuk mengelola area penting toko." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: onOpenProfile, children: [
        /* @__PURE__ */ jsx(UserRound, { className: "mr-2 h-4 w-4" }),
        "Edit Profil Toko"
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: onOpenProducts, children: [
        /* @__PURE__ */ jsx(Boxes, { className: "mr-2 h-4 w-4" }),
        "Kelola Produk"
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: onOpenOrders, children: [
        /* @__PURE__ */ jsx(ShoppingBag, { className: "mr-2 h-4 w-4" }),
        "Kelola Pesanan"
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: onOpenReport, children: [
        /* @__PURE__ */ jsx(BarChart3, { className: "mr-2 h-4 w-4" }),
        "Laporan Penjualan"
      ] })
    ] })
  ] });
}
function MiniSalesChart({
  data
}) {
  const maxValue = Math.max(...data.map((item) => Number(item.total ?? 0)), 1);
  const hasData = data.some((item) => Number(item.total ?? 0) > 0);
  return /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-background p-5", children: !hasData ? /* @__PURE__ */ jsxs("div", { className: "flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center", children: [
    /* @__PURE__ */ jsx(BarChart3, { className: "h-10 w-10 text-primary" }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 font-semibold", children: "Belum ada data grafik" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Data akan muncul setelah ada order selesai." })
  ] }) : /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: "Grafik Penjualan" }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Berdasarkan omzet order selesai per hari." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary", children: [
        "Max ",
        formatIDR(maxValue)
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative h-72 rounded-xl border border-border bg-card px-4 pb-8 pt-6", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-x-4 top-6 border-t border-dashed border-border" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-x-4 top-1/2 border-t border-dashed border-border" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-x-4 bottom-16 border-t border-dashed border-border" }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 flex h-full items-end gap-3", children: data.map((item) => {
        const total = Number(item.total ?? 0);
        const percentage = total > 0 ? total / maxValue * 100 : 0;
        const height = total > 0 ? Math.max(percentage, 8) : 0;
        return /* @__PURE__ */ jsxs("div", { className: "flex h-full min-w-0 flex-1 flex-col items-center justify-end", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-2 h-5 text-center text-[10px] font-medium text-foreground", children: total > 0 ? formatIDR(total) : "-" }),
          /* @__PURE__ */ jsx("div", { className: "flex h-44 w-full items-end justify-center", children: total > 0 ? /* @__PURE__ */ jsx("div", { className: "w-full max-w-12 rounded-t-xl bg-primary shadow-sm transition-all duration-300 hover:bg-primary/80", style: {
            height: `${height}%`,
            minHeight: "14px"
          }, title: `${item.label}: ${formatIDR(total)}` }) : /* @__PURE__ */ jsx("div", { className: "h-1 w-full max-w-12 rounded-full bg-muted" }) }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 truncate text-center text-[11px] text-muted-foreground", children: item.label })
        ] }, item.label);
      }) })
    ] })
  ] }) });
}
function buildDailySales({
  orders,
  start,
  end
}) {
  const result = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const safeEnd = new Date(end);
  safeEnd.setHours(23, 59, 59, 999);
  while (cursor <= safeEnd) {
    const label = cursor.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short"
    });
    const dayStart = new Date(cursor);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(23, 59, 59, 999);
    const total = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dayStart && orderDate <= dayEnd;
    }).reduce((sum, order) => {
      return sum + getOrderTotal(order);
    }, 0);
    result.push({
      label,
      total
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}
function getCategoryName(product) {
  if (Array.isArray(product.categories)) {
    return product.categories[0]?.name ?? "-";
  }
  return product.categories?.name ?? "-";
}
function getOrderItemProduct(item) {
  if (Array.isArray(item.products)) {
    return item.products[0] ?? null;
  }
  return item.products ?? null;
}
function getOrderTotal(order) {
  return Number(order.total ?? 0);
}
function canProcessSellerOrder(order) {
  const status = String(order.order_status ?? "");
  const payment = String(order.payment_status ?? "");
  return payment === "dibayar" && ["menunggu_konfirmasi_penjual", "menunggu_konfirmasi", "paid", "baru", "order_baru"].includes(status);
}
function canInputSellerTracking(order) {
  const status = String(order.order_status ?? "");
  const payment = String(order.payment_status ?? "");
  return payment === "dibayar" && !order.tracking_number && ["diproses_penjual", "diproses", "processing", "processed"].includes(status);
}
function sellerOrderStatusClass(status) {
  const safeStatus = String(status ?? "");
  if (safeStatus === "dikirim") {
    return "rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700";
  }
  if (safeStatus === "selesai" || safeStatus === "pesanan_diterima") {
    return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700";
  }
  if (safeStatus === "dibatalkan") {
    return "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700";
  }
  if (safeStatus === "diproses_penjual" || safeStatus === "diproses") {
    return "rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700";
  }
  return "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary";
}
function productStatusLabel(status) {
  const labels = {
    pending: "Menunggu Verifikasi",
    approved: "Aktif",
    active: "Aktif",
    rejected: "Ditolak",
    inactive: "Nonaktif"
  };
  return labels[String(status ?? "")] ?? status ?? "-";
}
function orderStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    menunggu_konfirmasi: "Menunggu Konfirmasi",
    diproses_penjual: "Diproses Penjual",
    diproses: "Diproses",
    dikirim: "Dikirim",
    pesanan_diterima: "Pesanan Diterima",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan"
  };
  return labels[String(status ?? "")] ?? status ?? "-";
}
function paymentStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    dibayar: "Dibayar",
    gagal: "Gagal",
    dikembalikan: "Dikembalikan"
  };
  return labels[String(status ?? "")] ?? status ?? "-";
}
function paymentMethodLabel(method) {
  const labels = {
    cod: "COD",
    transfer_bank: "Transfer Bank",
    qris: "QRIS"
  };
  return labels[String(method ?? "")] ?? method ?? "-";
}
function conditionLabel(condition) {
  const labels = {
    like_new: "Seperti Baru",
    very_good: "Sangat Baik",
    good: "Baik",
    fair: "Cukup"
  };
  return labels[String(condition ?? "")] ?? condition ?? "-";
}
function cleanText(value) {
  const cleanValue = value.trim();
  return cleanValue.length > 0 ? cleanValue : null;
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
function Info({
  label,
  value,
  strong
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: strong ? "text-lg font-bold text-primary" : "font-medium", children: value || "-" })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "seller", children: /* @__PURE__ */ jsx(SellerDashboardPage, {}) });
export {
  SplitComponent as component
};
