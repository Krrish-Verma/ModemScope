import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ModemScope", template: "%s · ModemScope" },
  description: "Interactive 5G NR PUSCH link-level simulation and signal analysis powered by NVIDIA Sionna PHY.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
