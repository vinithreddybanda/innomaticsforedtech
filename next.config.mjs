/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude pdf-parse and mammoth from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        zlib: false,
        buffer: false,
      }
    }
    
    // Exclude pdf-parse from client-side bundling entirely
    config.externals = config.externals || []
    if (!isServer) {
      config.externals.push('pdf-parse', 'mammoth')
    }
    
    return config
  },
}

export default nextConfig
