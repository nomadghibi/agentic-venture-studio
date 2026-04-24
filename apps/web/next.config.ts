import type { NextConfig } from "next";
import path from "node:path";

const isDocker = process.env.DOCKER_BUILD === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isDocker
    ? { output: "standalone", outputFileTracingRoot: path.join(process.cwd(), "../../") }
    : {})
};

export default nextConfig;
