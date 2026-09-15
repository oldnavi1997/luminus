import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./lib/cloudinary-loader.ts",
    // Next's defaults generate up to 16 billable derived widths per image.
    // Trimmed to the breakpoints this site actually renders at.
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Miniaturas de Bunny Stream (BUNNY_STREAM_HOST). Si la biblioteca usa
        // un dominio propio en vez del vz-xxxx.b-cdn.net, agregarlo acá.
        protocol: "https",
        hostname: "*.b-cdn.net",
      },
    ],
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "bcryptjs", "mercadopago"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
