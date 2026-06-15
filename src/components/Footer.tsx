import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";
import { Instagram, Twitter, Facebook, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Marketplace barang preloved Indonesia. Belanja dan jual barang bekas layak pakai dengan aman, mudah, dan terpercaya.
          </p>
          <div className="flex gap-3 pt-2 text-muted-foreground">
            <a href="#" aria-label="Instagram"><Instagram className="h-5 w-5 hover:text-primary" /></a>
            <a href="#" aria-label="Twitter"><Twitter className="h-5 w-5 hover:text-primary" /></a>
            <a href="#" aria-label="Facebook"><Facebook className="h-5 w-5 hover:text-primary" /></a>
            <a href="#" aria-label="Email"><Mail className="h-5 w-5 hover:text-primary" /></a>
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Jelajahi</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Beranda</Link></li>
            <li><Link to="/kategori" className="hover:text-primary">Kategori</Link></li>
            <li><Link to="/produk" className="hover:text-primary">Produk Preloved</Link></li>
            <li><Link to="/tentang" className="hover:text-primary">Tentang Kami</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Akun</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/login/pembeli" className="hover:text-primary">Masuk Pembeli</Link></li>
            <li><Link to="/register/pembeli" className="hover:text-primary">Daftar Pembeli</Link></li>
            <li><Link to="/login/penjual" className="hover:text-primary">Masuk Penjual</Link></li>
            <li><Link to="/register/penjual" className="hover:text-primary">Daftar Penjual</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Bantuan</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Pusat Bantuan</li>
            <li>Kebijakan Privasi</li>
            <li>Syarat & Ketentuan</li>
            <li>Hubungi Kami</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ReVibe. Marketplace preloved Indonesia.
      </div>
    </footer>
  );
}
