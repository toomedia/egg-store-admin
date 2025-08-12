
import "./globals.css";
import ClientWrapper from "./ClientWrapper";
import Topbar from "./components/Topbar";
import { ThemeProvider } from "next-themes";
// Import and configure the Manrope font

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
         <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <ClientWrapper>
          <Topbar />
          {children}
        </ClientWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
