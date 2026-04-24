import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.DOCKER_BUILD === "true"
    ? {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        output: "standalone" as const,
        outputFileTracingRoot: require("path").join(process.cwd(), "../../")
      }
    : {})
};

export default nextConfig;
