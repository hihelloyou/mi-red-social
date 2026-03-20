import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deshabilitar Turbopack (opcional)
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;