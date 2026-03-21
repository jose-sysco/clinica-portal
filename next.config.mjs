/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera imagen Docker mínima (sólo los archivos necesarios para producción)
  output: "standalone",
};

export default nextConfig;
