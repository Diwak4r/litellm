import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MCPConnect from "./mcp_connect";
import { fetchProxySettings } from "@/utils/proxyUtils";

vi.mock("@/utils/proxyUtils", () => ({
  fetchProxySettings: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn().mockReturnValue("http://localhost:4000"),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const renderMCPConnect = (accessToken?: string | null) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MCPConnect accessToken={accessToken ?? null} />
    </QueryClientProvider>,
  );

describe("MCPConnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses LITELLM_UI_API_DOC_BASE_URL for displayed MCP URLs when set", async () => {
    vi.mocked(fetchProxySettings).mockResolvedValue({
      PROXY_BASE_URL: "http://proxy.example.com",
      PROXY_LOGOUT_URL: "",
      LITELLM_UI_API_DOC_BASE_URL: "https://docs.example.com",
    });

    renderMCPConnect("token-123");

    await waitFor(() => {
      expect(screen.getAllByText(/https:\/\/docs\.example\.com\/mcp/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/https:\/\/docs\.example\.com\/v1\/responses/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/localhost:4000/).length).toBe(0);
  });

  it("falls back to the proxy base URL when LITELLM_UI_API_DOC_BASE_URL is not set", async () => {
    vi.mocked(fetchProxySettings).mockResolvedValue({
      PROXY_BASE_URL: "http://proxy.example.com",
      PROXY_LOGOUT_URL: "",
      LITELLM_UI_API_DOC_BASE_URL: null,
    });

    renderMCPConnect("token-123");

    await waitFor(() => {
      expect(screen.getAllByText(/http:\/\/localhost:4000\/mcp/).length).toBeGreaterThan(0);
    });
    expect(screen.queryAllByText(/docs\.example\.com/).length).toBe(0);
  });

  it("falls back to the proxy base URL when no access token is provided", async () => {
    renderMCPConnect(null);

    await waitFor(() => {
      expect(screen.getAllByText(/http:\/\/localhost:4000\/mcp/).length).toBeGreaterThan(0);
    });
  });
});
