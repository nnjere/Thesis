import type { NextConfig } from "next";

// Security headers for the host application. Demo apps run inside sandboxed
// iframes (opaque origin, no access to this app's cookies or storage).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Built-in demo apps: no network access beyond their own files.
        source: "/demos/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-ancestors 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
