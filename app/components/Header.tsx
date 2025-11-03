"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  Sun,
  Moon,
  Zap,
  HelpCircle,
  Menu,
  X,
  Repeat,
  Wallet,
  Banknote,
  Coins,
  Link as LinkIcon,
  Receipt,
} from "lucide-react";
import Image from "next/image";

// Import your actual components
import { MinipayWalletSelector } from "./minipay/MinipayWalletSelector";
import { FaGear } from "react-icons/fa6";
import { Badge } from "@/components/ui/badge";
import { isMiniPay } from "@/utils/minipay-detection";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle FAQ navigation
  const handleFAQClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === "/") {
      const faqSection = document.getElementById("faq");
      if (faqSection) {
        faqSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push("/?scrollTo=faq");
    }
  };

  if (!mounted) return null;

  return (
    <header
      className={`
        sticky top-0 z-50 
        transition-all duration-300
        ${isLanding ? (scrolled ? "shadow-lg bg-[#004a6d]/50" : "shadow-sm") : "shadow-none bg-transparent"}
      `}
    >
      {/* Simple top border */}
      {isLanding && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
      )}

      <div className="mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center gap-2">
              {/* Logo */}
              <div className="relative flex items-center">
                <Image src="/logo.svg" alt="NEDAPay" width={40} height={40} className="rounded-lg" />
              </div>
              {/* NEDAPay Text - Always visible */}
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base sm:text-lg">NEDAPay</span>
                <Badge variant="default" className="text-[0.6rem] font-bold px-1.5 py-0 bg-blue-600 text-white">
                  BETA
                </Badge>
              </div>
            </Link>
          </div>

          {/* Navigation and Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            {/* Navigation Links */}
            {pathname === "/" && (
              <nav className="flex items-center space-x-2">
                <a
                  href="#faq"
                  onClick={handleFAQClick}
                  className="relative overflow-hidden px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-lg text-slate-700 font-medium bg-slate-200 shadow-sm group hidden md:!flex"
                >
                  <span className="relative z-10 flex items-center">FAQ</span>
                </a>
              </nav>
            )}

            {/* Action Buttons Container */}
            <div className="flex items-center space-x-0.5 sm:space-x-2 md:space-x-3 px-0 sm:px-2 md:px-3 py-1 sm:py-2">
              {/* Minipay-only wallet selector */}
              <MinipayWalletSelector />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
