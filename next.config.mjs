/** @type {import('next').NextConfig} */
const isGithubPages = 'true';
const nextConfig = {
  output: 'export',
  basePath: isGithubPages ? '/passwordgen' : '',
  assetPrefix: isGithubPages ? '/passwordgen/' : '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
