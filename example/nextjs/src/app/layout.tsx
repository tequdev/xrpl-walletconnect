"use client";
import "./globals.css";
import { Inter } from "next/font/google";
import { ClientContextProvider } from "@xrpl-walletconnect/react";

const inter = Inter({ subsets: ["latin"] });

const walletConnectMetadata = {
  name: "XRPL WalletConnect Demo",
  description: "XRPL WalletConnect Demo",
  url: "",
  icons: [],
};
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;
const relayUrl = process.env.NEXT_PUBLIC_RELAY_URL!;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ClientContextProvider
        projectId={projectId}
        metadata={walletConnectMetadata}
        relayUrl={relayUrl}
      >
        <body className={inter.className}>{children}</body>
      </ClientContextProvider>
    </html>
  );
}
