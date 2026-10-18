"use client";
import { useEffect, useState } from "react";
/** Explicit local development diagnostic; never rendered in production. */
export default function DevAudit() {
  const [visible, V] = useState(false);
  const [results, R] = useState("");
  useEffect(() => V(location.hash === "#audit"), []);
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 1000,
        background: "white",
        color: "#17242b",
        padding: 18,
        border: "2px solid #17242b",
        maxWidth: 420,
        maxHeight: "60vh",
        overflow: "auto",
      }}
    >
      <button
        onClick={async () => {
          const axe = (await import("axe-core")).default;
          const result = await axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          });
          R(
            JSON.stringify(
              result.violations.map((v) => ({
                id: v.id,
                impact: v.impact,
                nodes: v.nodes.map((n) => ({
                  target: n.target,
                  summary: n.failureSummary,
                })),
              })),
              null,
              2,
            ),
          );
        }}
      >
        Run local accessibility audit
      </button>
      <button onClick={() => V(false)}>Close audit</button>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>{results}</pre>
    </div>
  );
}
