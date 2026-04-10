/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async headers() {
    return [{
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET,POST,DELETE,OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization,Mcp-Session-Id" },
      ],
    }];
  },
};
