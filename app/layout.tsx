import type { Metadata } from "next";
import Navbar from "../components/navbar";
// import Navbar from "@/components/testcomponent";
import Footer from "../components/footer";
import { Geist, Geist_Mono, Montserrat_Alternates } from "next/font/google";
import "./globals.css";
import Contact from "@/components/contact";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserratAlternates = Montserrat_Alternates({
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat-alternates",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Aye Chan Pyae Thu's Portfolio",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${montserratAlternates.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <Navbar />
        {children}
        <Contact />
      </body>
    </html>
  );
}
