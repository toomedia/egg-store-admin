
import "./globals.css";
import ClientWrapper from "./ClientWrapper";
import Topbar from "./components/Topbar";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientWrapper>
          <Topbar />
          {children}
        </ClientWrapper>
      
      </body>
    </html>
  );
}
