/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle for the Docker image.
  output: "standalone",
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
