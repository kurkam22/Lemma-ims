import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Lemma IMS — AI-assisted ISO compliance",
    template: "%s · Lemma IMS",
  },
  description:
    "Lemma IMS helps companies build, document, and maintain ISO 9001 compliance with AI-assisted gap assessment, document generation, and audit preparation.",
  openGraph: {
    title: "Lemma IMS — AI-assisted ISO compliance",
    description:
      "Gap assessment, compliant document generation, CAPA, audits, and management review — in one integrated management system.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
