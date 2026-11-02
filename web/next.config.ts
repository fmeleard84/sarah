import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,

  // Supabase servi sous /sb sur le même domaine, réécrit vers Kong sur le
  // réseau Docker : aucune route Traefik ni sous-domaine supplémentaire.
  async rewrites() {
    const kong = process.env.SUPABASE_INTERNAL_URL ?? "http://morningcards-kong-1:8000";
    return [{ source: "/sb/:path*", destination: `${kong}/:path*` }];
  },

  async headers() {
    return [
      {
        source: "/decks/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, immutable" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
