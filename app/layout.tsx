import "./globals.css";
import ClientWrapper from "./ClientWrapper";
import { Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata = {
  title: "Egg Store Admin",
  description: "Admin dashboard for Egg Store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="antialiased">
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
