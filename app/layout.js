import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import StoreProvider from "@/redux/AuthProvider";
import {
  ThemeProvider,
  themeInitScript,
} from "@/components/theme/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: {
    default: "QR-Dine",
    template: "%s · QR-Dine",
  },
  description:
    "Contactless ordering, kitchen display and billing for restaurants.",
  applicationName: "QR-Dine",
  // The app is used on tablets on a restaurant floor, so it should behave
  // like an installed app rather than a web page.
  appleWebApp: { capable: true, title: "QR-Dine", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom stays enabled: pinch-to-zoom is an accessibility affordance, and
  // disabling it on a data-dense app is a real barrier.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#16150f" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Runs before paint so the correct theme is applied on first frame. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground">
        {/* Keyboard users land here first and can jump past the navigation. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <StoreProvider>
            {children}
            <Toaster />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
