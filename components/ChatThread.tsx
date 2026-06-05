"use client";

import type { MessageRow } from "@/lib/db";

export default function ChatThread({
  messages,
  viewerId,
  requesterId,
}: {
  messages: MessageRow[];
  viewerId: string;
  requesterId: string;
}) {
  if (!messages.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {messages.map((m) => {
        const mine = m.sender_id === viewerId;
        const who = mine ? "Você" : m.sender_id === requesterId ? "Solicitante" : "Plantonista";
        return (
          <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "84%" }}>
            <div
              className="card-2"
              style={{
                padding: "8px 12px",
                background: mine ? "color-mix(in srgb, var(--blue) 18%, var(--surface-2))" : "var(--surface-2)",
              }}
            >
              <div className="faint" style={{ fontSize: 11, marginBottom: 2 }}>{who}</div>
              <div style={{ fontSize: 14, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{m.body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
