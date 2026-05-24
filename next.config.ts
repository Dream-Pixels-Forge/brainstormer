import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cross-origin requests from the preview panel / sandbox gateway
  allowedDevOrigins: [
    "localhost",
    ".z.ai",
    ".chatglm.cn",
  ],
  serverExternalPackages: [
    "onnxruntime-node",
    "kokoro-js",
    "@huggingface/transformers",
  ],
};

export default nextConfig;
