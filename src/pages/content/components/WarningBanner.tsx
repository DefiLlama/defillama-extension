import React from "react";
import { createRoot } from "react-dom/client";

const bannerStyles = {
  container: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#dc2626",
    color: "#ffffff",
    padding: "16px",
    textAlign: "center" as const,
    zIndex: 2147483647,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "16px",
    fontWeight: 600,
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    borderBottom: "2px solid #b91c1c",
    margin: 0,
    lineHeight: 1.5,
    minHeight: "70px",
    boxSizing: "border-box" as const,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "18px",
    fontWeight: 700,
  },
  icon: {
    fontSize: "22px",
  },
  message: {
    fontSize: "14px",
    fontWeight: 500,
    maxWidth: "700px",
    lineHeight: 1.4,
    opacity: 0.95,
  },
};

const WarningBanner = ({ reason }: { reason: string }) => {
  return (
    <div style={bannerStyles.container} role="alert" aria-live="assertive">
      <div style={bannerStyles.header}>
        <span style={bannerStyles.icon}>⚠️</span>
        <span>DEFILLAMA BLOCKLIST WARNING</span>
      </div>
      <div style={bannerStyles.message}>
        This site is on the DefiLlama blocklist due to phishing or other security concerns. We recommend avoiding this
        site. If this is incorrect, please report it in DefiLlama Discord.
      </div>
    </div>
  );
};

let shadowHost: HTMLElement | null = null;
let mutationObserver: MutationObserver | null = null;
let isInjected = false;
let styleChecker: NodeJS.Timeout | null = null;
let reinjectionChecker: NodeJS.Timeout | null = null;

const containerStyles = `
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 2147483647 !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  pointer-events: none !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  transform: none !important;
  clip: none !important;
  clip-path: none !important;
  filter: none !important;
`;

function injectProtectiveCSS() {
  const existingStyle = document.getElementById("defillama-protective-css");
  if (existingStyle) return;

  const style = document.createElement("style");
  style.id = "defillama-protective-css";
  style.textContent = `
    /* Prevent CSS attacks on our banner */
    div[style*="position: fixed"][style*="z-index: 2147483647"] {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      transform: none !important;
      clip: none !important;
      clip-path: none !important;
      filter: none !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 2147483647 !important;
    }
  `;

  // Inject in head or at start of document
  if (document.head) {
    document.head.prepend(style);
  } else if (document.documentElement) {
    document.documentElement.prepend(style);
  }
}

function createProtectedBanner(reason: string): HTMLElement {
  const bannerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background-color: #dc2626;
      color: #ffffff;
      padding: 16px;
      text-align: center;
      z-index: 2147483647;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      border-bottom: 2px solid #b91c1c;
      margin: 0;
      line-height: 1.5;
      min-height: 70px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
      pointer-events: auto;
    " role="alert" aria-live="assertive">
      <div style="
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 700;
      ">
        <span style="font-size: 22px;">⚠️</span>
        <span>DEFILLAMA BLOCKLIST WARNING</span>
      </div>
      <div style="
        font-size: 14px;
        font-weight: 500;
        max-width: 700px;
        line-height: 1.4;
        opacity: 0.95;
      ">
        This site is on the DefiLlama blocklist due to phishing or security concerns. We recommend avoiding this site. If this is incorrect, please report it in DefiLlama Discord.
      </div>
    </div>
  `;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = bannerHTML;
  return tempDiv.firstElementChild as HTMLElement;
}

function setupMutationObserver(reason: string) {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  mutationObserver = new MutationObserver((mutations) => {
    let needsReset = false;

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.removedNodes.forEach((node) => {
          if (node === shadowHost || (node as Element)?.contains?.(shadowHost)) {
            setTimeout(() => {
              isInjected = false;
              injectWarningBanner(reason);
            }, 100);
          }
        });
      }

      // Only monitor style changes on our specific element
      if (mutation.type === "attributes" && mutation.target === shadowHost) {
        needsReset = true;
      }
    });

    // Batch style resets to avoid excessive calls
    if (needsReset && shadowHost) {
      resetElementStyles(shadowHost);
    }
  });

  // Only monitor our shadow host and immediate children, not entire document
  if (shadowHost) {
    mutationObserver.observe(shadowHost, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    // Also monitor document body for removal
    mutationObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: false, // Only direct children, not entire subtree
    });
  }
}

function resetElementStyles(element: HTMLElement) {
  if (element === shadowHost) {
    // Only reset if actually hidden - avoid unnecessary DOM operations
    const computed = window.getComputedStyle(element);
    if (computed.display === "none" || computed.visibility === "hidden" || computed.opacity === "0") {
      element.style.cssText = containerStyles;
    }
  }
}

function injectWithShadowDOM(reason: string): boolean {
  try {
    const host = document.createElement("div");
    host.style.cssText = containerStyles;

    // Add multiple random classes to make targeting harder
    const randomClasses = [
      `dlm-${Math.random().toString(36).substr(2, 9)}`,
      `warn-${Math.random().toString(36).substr(2, 9)}`,
      `sec-${Math.random().toString(36).substr(2, 9)}`,
    ];
    host.className = randomClasses.join(" ");

    const shadowRoot = host.attachShadow({ mode: "closed" });
    const banner = createProtectedBanner(reason);
    shadowRoot.appendChild(banner);

    shadowHost = host;

    if (document.body) {
      document.body.prepend(host);
    } else if (document.documentElement) {
      document.documentElement.prepend(host);
    } else {
      return false;
    }

    // Lightweight style monitoring - check less frequently
    if (styleChecker) clearInterval(styleChecker);
    styleChecker = setInterval(() => {
      if (host.offsetParent === null) {
        resetElementStyles(host);
      }
    }, 3000); // Reduced from 500ms to 3 seconds

    return true;
  } catch (error) {
    return false;
  }
}

export function injectWarningBanner(reason: string) {
  if (isInjected) return;

  const existingBanner = document.getElementById("defillama-warning-banner");
  if (existingBanner) {
    existingBanner.remove();
  }

  if (shadowHost) {
    shadowHost.remove();
    shadowHost = null;
  }

  // Inject protective CSS first
  injectProtectiveCSS();

  let success = false;

  // Try Shadow DOM first (strongest protection)
  if (injectWithShadowDOM(reason)) {
    success = true;
  } else {
    // Fallback to regular DOM injection
    try {
      const container = document.createElement("div");
      container.id = "defillama-warning-banner";
      container.style.cssText = containerStyles;

      if (document.body) {
        document.body.prepend(container);
      } else if (document.documentElement) {
        document.documentElement.prepend(container);
      } else {
        injectSimpleBanner(reason);
        return;
      }

      const root = createRoot(container);
      root.render(<WarningBanner reason={reason} />);
      success = true;
    } catch (error) {
      injectSimpleBanner(reason);
      success = true;
    }
  }

  if (success) {
    isInjected = true;
    setupMutationObserver(reason);

    // Reduced frequency re-injection check
    if (reinjectionChecker) clearInterval(reinjectionChecker);
    reinjectionChecker = setInterval(() => {
      if (!document.body.contains(shadowHost) && !document.getElementById("defillama-warning-banner")) {
        isInjected = false;
        injectWarningBanner(reason);
      }
    }, 5000); // Reduced from 2s to 5s

    // Minimal event protection - only prevent removal, don't block all interactions
    if (shadowHost) {
      shadowHost.addEventListener("DOMNodeRemoved", (e) => e.preventDefault(), true);
    }
  }
}

export function cleanupWarningBanner() {
  // Clear all timers
  if (styleChecker) {
    clearInterval(styleChecker);
    styleChecker = null;
  }

  if (reinjectionChecker) {
    clearInterval(reinjectionChecker);
    reinjectionChecker = null;
  }

  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }

  if (shadowHost) {
    shadowHost.remove();
    shadowHost = null;
  }

  const existingBanner = document.getElementById("defillama-warning-banner");
  if (existingBanner) {
    existingBanner.remove();
  }

  const simpleBanner = document.getElementById("defillama-simple-banner");
  if (simpleBanner) {
    simpleBanner.remove();
  }

  const protectiveCSS = document.getElementById("defillama-protective-css");
  if (protectiveCSS) {
    protectiveCSS.remove();
  }

  isInjected = false;
}

const fallbackBannerHTML = `
  <div style="
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    background-color: #dc2626 !important;
    color: #ffffff !important;
    padding: 16px !important;
    text-align: center !important;
    z-index: 2147483647 !important;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
    border-bottom: 2px solid #b91c1c !important;
    margin: 0 !important;
    line-height: 1.5 !important;
    min-height: 70px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 8px !important;
    box-sizing: border-box !important;
  " role="alert" aria-live="assertive">
    <div style="
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      font-size: 18px !important;
      font-weight: 700 !important;
    ">
      <span style="font-size: 22px;">⚠️</span>
      <span>DEFILLAMA BLOCKLIST WARNING</span>
    </div>
    <div style="
      font-size: 14px !important;
      font-weight: 500 !important;
      max-width: 700px !important;
      line-height: 1.4 !important;
      opacity: 0.95 !important;
    ">
      This site is on the DefiLlama blocklist due to phishing or security concerns. We recommend avoiding this site. If this is incorrect, please report it in DefiLlama Discord.
    </div>
  </div>
`;

function injectSimpleBanner(reason: string) {
  const simpleBanner = document.createElement("div");
  simpleBanner.id = "defillama-simple-banner";
  simpleBanner.innerHTML = fallbackBannerHTML;

  if (document.body) {
    document.body.prepend(simpleBanner);
  } else if (document.documentElement) {
    document.documentElement.prepend(simpleBanner);
  }
}
