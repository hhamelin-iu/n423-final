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
        padding: "10px 20px",
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
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: "0.9rem",
            color: "#e2e8f0",
          }}
        >
          <span
            style={{
              background: "#0284c7",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "3px 10px",
              borderRadius: 20,
              display: "inline-block",
            }}
          >
            Portfolio Demo
          </span>
          <span>
            You are currently viewing a live demo project by <strong>Haven Hamelin</strong>.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <a
            href={portfolioUrl}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(56, 189, 248, 0.12)",
              color: "#38bdf8",
              border: "1px solid #38bdf8",
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
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
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "1.3rem",
              lineHeight: 1,
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}
