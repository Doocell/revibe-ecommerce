import logo from "@/assets/Revibe-logo.png";
import { Link } from "@tanstack/react-router";

export function Logo({ className = "h-8 md:h-9" }: { className?: string }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img src={logo} alt="ReVibe" className={`${className} w-auto object-contain`} />
    </Link>
  );
}
