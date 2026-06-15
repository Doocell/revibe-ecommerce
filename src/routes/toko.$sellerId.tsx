import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  getPublicSellerProducts,
  getPublicSellerProfile,
  type PublicSellerProfile,
} from "@/lib/profile";
import { Loader2, MapPin, Package, Store, UserRound } from "lucide-react";

export const Route = createFileRoute("/toko/$sellerId")({
  component: SellerPublicProfilePage,
});

function SellerPublicProfilePage() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const { user, roles, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<PublicSellerProfile | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const safeRoles = roles ?? [];
  const isSeller = safeRoles.includes("seller");

  const sellerIdFromRoute = useMemo(() => {
    return cleanRouteId(params?.sellerId);
  }, [params?.sellerId]);

  const sellerId = useMemo(() => {
    if (sellerIdFromRoute) {
      return sellerIdFromRoute;
    }

    if (isSeller && user?.id) {
      return user.id;
    }

    return "";
  }, [sellerIdFromRoute, isSeller, user?.id]);

  useEffect(() => {
    if (authLoading) return;

    if (!sellerIdFromRoute && isSeller && user?.id) {
      navigate({
        to: "/profil",
      });
    }
  }, [authLoading, sellerIdFromRoute, isSeller, user?.id, navigate]);

  async function loadSellerData() {
    if (authLoading) return;

    if (!sellerId) {
      setProfile(null);
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [profileRow, productRows] = await Promise.all([
        getPublicSellerProfile(sellerId),
        getPublicSellerProducts(sellerId),
      ]);

      setProfile(profileRow);
      setProducts(productRows);
    } catch (error) {
      console.error("[Load Public Seller Profile Error]", error);

      setProfile({
        id: sellerId,
        full_name: "Seller ReVibe",
        avatar_url: null,
        city: null,
        bio: null,
        shop_name: "Toko ReVibe",
        shop_description: null,
        shop_location: "Indonesia",
        shop_logo_url: null,
      });

      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSellerData();
  }, [sellerId, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </main>

        <Footer />
      </div>
    );
  }

  if (!sellerId) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          <section className="container mx-auto px-4 py-10">
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <Store className="mx-auto h-10 w-10 text-primary" />

              <h1 className="mt-4 text-xl font-semibold">
                ID toko tidak valid
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Untuk mengedit toko, buka halaman profil toko dari dashboard
                penjual.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <a href="/profil">Buka Profil Toko</a>
                </Button>

                <Button asChild variant="outline">
                  <a href="/dashboard/penjual">Dashboard Penjual</a>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />

            <div className="-mt-12 p-6 md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-background bg-muted shadow-sm">
                    {profile?.shop_logo_url || profile?.avatar_url ? (
                      <img
                        src={profile.shop_logo_url || profile.avatar_url || ""}
                        alt={profile.shop_name || profile.full_name || "Toko"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Store className="h-9 w-9" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h1 className="text-3xl font-bold">
                      {profile?.shop_name || profile?.full_name || "Toko ReVibe"}
                    </h1>

                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserRound className="h-4 w-4" />
                        {profile?.full_name || "Seller ReVibe"}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile?.shop_location ||
                          profile?.city ||
                          "Indonesia"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                    {products.length} Produk Aktif
                  </div>

                  {isSeller && user?.id === sellerId ? (
                    <Button asChild variant="outline">
                      <a href="/profil">Edit Profil Toko</a>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-accent p-5">
                <h2 className="font-semibold">Tentang Toko</h2>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {profile?.shop_description ||
                    profile?.bio ||
                    "Seller belum menambahkan deskripsi toko."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div>
              <h2 className="text-2xl font-bold">Produk Toko</h2>

              <p className="mt-1 text-muted-foreground">
                Produk aktif yang dijual oleh seller ini.
              </p>
            </div>

            <div className="mt-6">
              {products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                  <Package className="mx-auto h-10 w-10 text-primary" />

                  <h3 className="mt-4 text-lg font-semibold">
                    Belum ada produk aktif
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Seller ini belum memiliki produk aktif yang tampil di
                    marketplace.
                  </p>

                  {isSeller && user?.id === sellerId ? (
                    <Button asChild className="mt-6">
                      <a href="/profil">Lengkapi Profil Toko</a>
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function cleanRouteId(value: unknown) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) return "";
  if (cleanValue === "undefined") return "";
  if (cleanValue === "null") return "";
  if (cleanValue === "$sellerId") return "";
  if (cleanValue === ":sellerId") return "";

  return cleanValue;
}