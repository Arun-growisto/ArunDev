import Head from "next/head";
import { useState } from "react";
import Connect   from "../components/Connect";
import Dashboard from "../components/Dashboard";

export default function Home({ mcpUrl }) {
  const [session, setSession] = useState(null);

  return (
    <>
      <Head>
        <title>Shopify Theme Auditor</title>
        <meta name="description" content="Shopify theme code audit dashboard — powered by Claude MCP" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {!session ? (
        <Connect onConnected={({ shop, storeUrl, accessToken }) => setSession({ shop, storeUrl, accessToken })} />
      ) : (
        <Dashboard
          shop={session.shop}
          storeUrl={session.storeUrl}
          accessToken={session.accessToken}
          mcpUrl={mcpUrl}
          onDisconnect={() => setSession(null)}
        />
      )}
    </>
  );
}

export function getServerSideProps({ req }) {
  const host  = req.headers.host || "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  return { props: { mcpUrl: `${proto}://${host}/api/mcp` } };
}
