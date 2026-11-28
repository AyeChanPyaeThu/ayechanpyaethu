"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Download, Menu, X, ArrowUpRight } from "lucide-react";

const navLinks = [
  { name: "Home", href: "/#home" },
  { name: "About", href: "/#about" },
  { name: "Skills", href: "/#skills" },
  { name: "Projects", href: "/#projects" },
  { name: "Achievements", href: "/#achievements" },
  { name: "Interests", href: "/#interests" },
  { name: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Detect scrolling
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    onScroll();

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu when pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;

    if (menuOpen) root.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);

    // Return keyboard focus to the hamburger button
    menuButtonRef.current?.focus();
  };
  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "nav-shadow bg-white/85 backdrop-blur-xl" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-14">
        {/* NAVBAR HEADER */}
        <div className="flex justify-between items-center py-4 md:py-5">
          {/* LOGO / NAME */}
          <Link
            href="/#home"
            onClick={closeMenu}
            className="font-mon font-bold text-base sm:text-lg
            text-black leading-tight tracking-tight
            transition-opacity hover:opacity-70"
          >
            <span className="block">Aye Chan Pyae Thu</span>

            {/* Small subtitle for mobile branding */}
            <span
              className="block text-[9px] sm:text-[10px]
            tracking-[2px] font-black text-amber-900/70"
            >
              PORTFOLIO
            </span>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="font-mon text-sm text-black
                transition-all duration-200
                hover:text-amber-800 hover:-translate-y-0.5
                relative group"
              >
                {link.name}

                <span
                  className="absolute left-0 -bottom-1
                w-0 h-0.5 bg-amber-800
                transition-all duration-300 group-hover:w-full"
                />
              </Link>
            ))}
          </div>

          {/* DESKTOP RESUME BUTTON */}
          <div className="hidden lg:block">
            <a
              href="/pf9.jfif"
              download="Aye-Chan-Pyae-Thu-Resume.jfif"
              aria-label="Download resume"
              className="inline-flex items-center gap-2 rounded-full
              border-2 border-amber-900 px-3 py-2
              font-mon text-sm font-bold text-black
              transition-all duration-300
              hover:bg-amber-900 hover:text-white"
            >
              <Download size={16} />
              Resume
            </a>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="lg:hidden flex items-center justify-center
            w-11 h-11 rounded-xl text-black
            transition-all duration-300
            hover:bg-black/10
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-gray-800"
          >
            <span className="relative flex items-center justify-center">
              <Menu
                size={27}
                strokeWidth={2.8}
                className={`absolute transition-all duration-300 ${
                  menuOpen
                    ? "rotate-90 opacity-0 scale-75"
                    : "rotate-0 opacity-100 scale-100"
                }`}
              />

              <X
                size={27}
                strokeWidth={2.5}
                className={`transition-all duration-300 ${
                  menuOpen
                    ? "rotate-0 opacity-100 scale-100"
                    : "-rotate-90 opacity-0 scale-75"
                }`}
              />
            </span>
          </button>
        </div>

        {/* MOBILE DROPDOWN MENU */}
        <div
          id="mobile-navigation"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
          className={`lg:hidden absolute inset-x-0 top-full z-50 overflow-hidden transition-all
          duration-500 ease-in-out ${
            menuOpen
              ? "max-h-150 opacity-100 pb-6"
              : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="mobile-menu-panel rounded-2xl border border-emerald-900/10 bg-white/95 backdrop-blur-3xl shadow-lg shadow-emerald-950/5 p-4 sm:p-5">
            {/* MENU HEADING */}
            <div
              className="flex justify-between items-center
            mb-3 px-2"
            >
              <span
                className="font-mon text-xs font-bold
              uppercase tracking-[3px] text-amber-900/70"
              >
                Navigation
              </span>

              <span className="font-mon text-xs text-amber-400">
                Explore my portfolio
              </span>
            </div>

            {/* NAVIGATION LINKS */}
            <div className="flex flex-col">
              {navLinks.map((link, index) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMenu}
                  tabIndex={menuOpen ? 0 : -1}
                  className="mobile-nav-link group flex
                  justify-between items-center
                  px-3 py-3.5 rounded-xl
                  font-mon text-sm sm:text-base
                  text-gray-800 transition-all duration-300
                  hover:bg-amber-900/5
                  hover:text-amber-900"
                  style={{
                    transitionDelay: menuOpen ? `${index * 45}ms` : "0ms",
                  }}
                >
                  <span className="flex items-center gap-3">
                    {/* <span
                      className="text-[10px] font-semibold
                    text-emerald-900/40 w-5"
                    >
                      0{index + 1}
                    </span> */}

                    {link.name}
                  </span>

                  <ArrowUpRight
                    size={17}
                    className="text-amber-900/40
                    transition-transform duration-300
                    group-hover:-translate-y-1
                    group-hover:translate-x-1"
                  />
                </Link>
              ))}
            </div>

            {/* MOBILE RESUME BUTTON */}
            <div
              className="mt-4 pt-4 border-t
            border-emerald-900/10"
            >
              <a
                href="/profile/Aye_Chan_Pyae_Thu_Resume.pdf"
                download="Aye_Chan_Pyae_Thu_Resume.pdf"
                onClick={closeMenu}
                tabIndex={menuOpen ? 0 : -1}
                className="flex items-center justify-center
                gap-2 w-full rounded-full
                border-2 border-amber-900
                bg-amber-900/5 px-4 py-3
                font-mon text-sm font-bold text-amber-950
                transition-all duration-300
                hover:bg-amber-900 hover:text-white"
              >
                <Download size={17} />
                Download Resume
              </a>
            </div>

            {/* FOOTER */}
            <p
              className="text-center text-[10px]
            tracking-widest text-gray-400 mt-5"
            >
              THANK YOU FOR VISITING ✦
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
}
