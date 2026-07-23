import React, { useEffect, useState } from "react";
import { Platform } from "react-native";

export default function PortfolioReturnBanner() {
  const [show, setShow] = useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState("https://havenhamelin.work");

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const search = (window.location.search || "").toLowerCase();
    const href = (window.location.href || "").toLowerCase();

    const fromParam =
      urlParams.get("from") === "portfolio" ||
      urlParams.get("ref") === "portfolio" ||
      search.includes("from=portfolio") ||
      search.includes("ref=portfolio") ||
      href.includes("from=portfolio") ||
      href.includes("ref=portfolio");

    const referrer = (document.referrer || "").toLowerCase();
    const host = (window.location.host || "").toLowerCase();

    const isInternalReferrer =
      referrer &&
      (referrer.includes(host) ||
        (referrer.includes("projects.havenhamelin.work") && (host.includes("wasworld.xyz") || host.includes("vercel.app"))) ||
        ((referrer.includes("wasworld.xyz") || referrer.includes("vercel.app")) && host.includes("projects.havenhamelin.work")));

    const fromReferrer =
      !isInternalReferrer &&
      (referrer.includes("havenhamelin.work") ||
        referrer.includes("portfolio") ||
        (referrer.includes("localhost") && !isInternalReferrer) ||
        (referrer.includes("127.0.0.1") && !isInternalReferrer));

    if (fromReferrer || (fromParam && !isInternalReferrer)) {
      sessionStorage.setItem("from_portfolio", "true");
      sessionStorage.removeItem("from_portfolio_dismissed");
      if (fromReferrer) {
        sessionStorage.setItem("portfolio_url", document.referrer);
      }
    } else if (!isInternalReferrer && !fromParam) {
      sessionStorage.removeItem("from_portfolio");
      sessionStorage.removeItem("from_portfolio_dismissed");
    }

    const isDismissed =
      urlParams.get("dismiss_portfolio_banner") === "1" ||
      sessionStorage.getItem("from_portfolio_dismissed") === "true";

    if (isDismissed) {
      setShow(false);
      return;
    }

    const isFromPortfolio = sessionStorage.getItem("from_portfolio") === "true";
    if (isFromPortfolio) {
      const storedUrl = sessionStorage.getItem("portfolio_url");
      if (storedUrl && !storedUrl.includes("projects.havenhamelin.work")) {
        setPortfolioUrl(storedUrl);
      }
      setShow(true);
    } else {
      setShow(false);
    }
  }, []);

  if (!show || Platform.OS !== "web") return null;

  const handleDismiss = () => {
    setShow(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("from_portfolio_dismissed", "true");
      sessionStorage.removeItem("from_portfolio");
    }
  };

  return (
    <div
      id="portfolioReturnBanner"
      style={{
        display: "block",
        background: "linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        borderBottom: "2px solid #38bdf8",
        boxShadow: "0 4px 16px rgba(15, 23, 42, 0.4)",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "8px 12px",
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        zIndex: 999999,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px 12px",
          flexWrap: "wrap",
          position: "relative",
          paddingRight: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px 10px",
            fontSize: "0.85rem",
            color: "#e2e8f0",
            flexWrap: "wrap",
            flex: "1 1 auto",
          }}
        >
          <span
            style={{
              background: "#0284c7",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "2px 8px",
              borderRadius: 20,
              display: "inline-block",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Portfolio Demo
          </span>
          <span style={{ lineHeight: 1.4 }}>
            You are currently viewing a live demo project by <strong>Haven Hamelin</strong>.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <a
            href={portfolioUrl}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(56, 189, 248, 0.12)",
              color: "#38bdf8",
              border: "1px solid #38bdf8",
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: "0.82rem",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Return to Portfolio
          </a>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          style={{
            position: "absolute",
            right: 0,
            top: 2,
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            fontSize: "1.4rem",
            lineHeight: 1,
            cursor: "pointer",
            padding: "4px 6px",
          }}
        >
          &times;
        </button>
      </div>
    </div>
  );
}
