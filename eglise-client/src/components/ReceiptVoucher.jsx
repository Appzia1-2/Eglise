// src/components/ReceiptVoucher.jsx

import React from "react";
import { amountInWords } from "../utils/amountInWords";

/* =========================================================
   PALETTE
========================================================= */
const RED = "#8B1224";
const RED_DARK = "#6E0B1B";
const RED_LINE = "#D9A0A8";
const PAPER = "#FFFAF4";
const TINT = "#FBE6E8";
const INK = "#2A1310";

/* =========================================================
   FORMATTERS
========================================================= */
const formatMoney = (v) =>
  Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatTxnType = (t) =>
  t ? t.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "—";

/* =========================================================
   ORNAMENTS
========================================================= */
const Corner = ({ sx = 1, sy = 1, style }) => (
  <svg
    viewBox="0 0 64 64"
    width="46"
    height="46"
    style={{
      position: "absolute",
      pointerEvents: "none",
      transform: `scale(${sx}, ${sy})`,
      zIndex: 5,
      ...style,
    }}
  >
    <g fill="none" stroke={RED} strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 58 V22 Q4 6 20 6 H58" />
      <path d="M12 58 V26 Q12 14 24 14 H58" strokeWidth="1" />
      <path d="M18 40 Q18 26 32 26 Q40 26 40 32 Q40 38 34 36" />
      <path d="M26 18 Q36 10 46 16" />
      <path d="M10 28 Q16 38 8 46" />
    </g>
    <circle cx="9" cy="11" r="3.2" fill={RED} />
    <circle cx="44" cy="19" r="2" fill={RED} />
    <circle cx="16" cy="44" r="2" fill={RED} />
    <path d="M30 30 l3 -4 l3 4 l-3 4 z" fill={RED} />
  </svg>
);

/* Single-colour line-art church (matches the mockup) */
const ChurchIllustration = ({ size = 110, opacity = 1 }) => (
  <svg viewBox="0 0 120 130" width={size} height={size * (130 / 120)} style={{ opacity }}>
    <g fill="none" stroke={RED} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      {/* cross */}
      <path d="M60 2 V22 M52 9 H68" />
      {/* tower roof + tower */}
      <path d="M46 40 L60 22 L74 40 Z" />
      <path d="M48 40 V62 M72 40 V62" />
      <circle cx="60" cy="48" r="3.5" />
      {/* nave roof */}
      <path d="M28 70 L60 52 L92 70" />
      {/* nave */}
      <path d="M36 70 V112 M84 70 V112" />
      <path d="M36 112 H84" />
      {/* door */}
      <path d="M50 112 V92 Q50 82 60 82 Q70 82 70 92 V112" />
      <path d="M60 82 V112" strokeWidth="1.2" />
      {/* wings */}
      <path d="M36 82 L18 92 V112 H36" />
      <path d="M84 82 L102 92 V112 H84" />
      <path d="M24 112 V100 Q24 96 27 96 Q30 96 30 100 V112" strokeWidth="1.5" />
      <path d="M90 112 V100 Q90 96 93 96 Q96 96 96 100 V112" strokeWidth="1.5" />
      {/* base */}
      <path d="M10 112 H110" strokeWidth="2.6" />
      <path d="M14 117 H106" strokeWidth="1.4" />
    </g>
  </svg>
);

/* =========================================================
   SMALL PIECES
========================================================= */
const KeyLabel = ({ children }) => (
  <div style={{ fontSize: 13.5, fontWeight: 700, color: RED, whiteSpace: "nowrap" }}>{children}</div>
);

const KeyValue = ({ children }) => (
  <div style={{ fontSize: 13.5, color: INK, minWidth: 0, wordBreak: "break-word" }}>{children}</div>
);

const Signature = ({ label }) => (
  <div style={{ flex: 1, textAlign: "center" }}>
    <div style={{ borderTop: `1.5px solid ${INK}`, width: "62%", margin: "0 auto 5px" }} />
    <div style={{ fontSize: 12.5, color: INK }}>{label}</div>
  </div>
);

const th = {
  border: `1px solid ${RED_LINE}`,
  padding: "7px 10px",
  fontSize: 14,
  fontWeight: 700,
  color: RED,
  textAlign: "center",
};

const td = {
  border: `1px solid ${RED_LINE}`,
  padding: "7px 10px",
  fontSize: 13,
  color: INK,
};

/* =========================================================
   MAIN
========================================================= */
const ReceiptVoucher = ({ receipt, church }) => {
  const total = receipt?.grand_total ?? 0;
  const churchName = church?.name || "Parish Name";
  const churchAddress =
    church?.full_address ||
    church?.address ||
    [church?.city, church?.state].filter(Boolean).join(", ");

  const lines = receipt?.lines || [];

  return (
    <div
      className="receipt-voucher"
      style={{
        width: "100%",
        maxWidth: 1000,
        margin: "0 auto",
        background: PAPER,
        padding: 10,
        boxSizing: "border-box",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: INK,
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        breakInside: "avoid",
      }}
    >
      {/* DOUBLE FRAME */}
      <div style={{ position: "relative", border: `2px solid ${RED}`, padding: 6, boxSizing: "border-box" }}>
        <div
          style={{
            position: "relative",
            border: `1px solid ${RED}`,
            padding: "18px 30px 18px",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* WATERMARK */}
          <div
            style={{
              position: "absolute",
              top: "58%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <ChurchIllustration size={250} opacity={0.05} />
          </div>

          <div style={{ position: "relative", zIndex: 2 }}>
            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 150, flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 4 }}>
                <ChurchIllustration size={104} />
              </div>

              <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: RED, lineHeight: 1.1, letterSpacing: 0.5 }}>
                  {churchName}
                </div>
                {churchAddress && (
                  <div style={{ fontSize: 16, color: INK, marginTop: 4 }}>{churchAddress}</div>
                )}

                {/* RECEIPT BANNER */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                  <div
                    style={{
                      padding: 2,
                      background: RED,
                      clipPath:
                        "polygon(0 50%, 14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%)",
                    }}
                  >
                    <div
                      style={{
                        background: `linear-gradient(180deg, ${RED} 0%, ${RED_DARK} 100%)`,
                        color: "#FFF4E6",
                        padding: "4px 70px",
                        fontSize: 26,
                        fontWeight: 700,
                        letterSpacing: 3,
                        clipPath:
                          "polygon(0 50%, 12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%)",
                      }}
                    >
                      RECEIPT
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ width: 150, flexShrink: 0 }} />
            </div>

            {/* RECEIPT NO / DATE */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginTop: 14,
                paddingBottom: 6,
                borderBottom: `1px solid ${RED_LINE}`,
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                <KeyLabel>Receipt No.</KeyLabel>
                <span style={{ fontSize: 14, color: INK }}>{receipt?.receipt_number || "—"}</span>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                <KeyLabel>Date</KeyLabel>
                <span style={{ fontSize: 14, color: INK }}>{formatDate(receipt?.receipt_date)}</span>
              </div>
            </div>

            {/* DETAILS + PARTICULARS */}
            <div style={{ display: "flex", gap: 28, marginTop: 14, alignItems: "flex-start" }}>
              {/* left: key/value grid */}
              <div
                style={{
                  flex: "1 1 56%",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto 1fr",
                  columnGap: 16,
                  rowGap: 12,
                  paddingTop: 10,
                  minWidth: 0,
                }}
              >
                <KeyLabel>Member Name</KeyLabel>
                <KeyValue>{receipt?.member_name || "—"}</KeyValue>
                <KeyLabel>Transaction Type</KeyLabel>
                <KeyValue>{formatTxnType(receipt?.transaction_type)}</KeyValue>

                <KeyLabel>Ref Number</KeyLabel>
                <KeyValue>{receipt?.ref_no || "—"}</KeyValue>
                <KeyLabel>Bank Account</KeyLabel>
                <KeyValue>{receipt?.bank_account_display || "—"}</KeyValue>

                <KeyLabel>Payment Type</KeyLabel>
                <KeyValue>{receipt?.payment_type === "BANK" ? "Bank" : "Cash"}</KeyValue>
              </div>

              {/* right: particulars table */}
              <table
                style={{
                  flex: "0 0 40%",
                  width: "40%",
                  borderCollapse: "collapse",
                  background: "rgba(255,250,244,0.9)",
                }}
              >
                <thead>
                  <tr>
                    <th style={th}>Particulars</th>
                    <th style={{ ...th, width: "38%" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td style={td}>—</td>
                      <td style={{ ...td, textAlign: "right" }}>—</td>
                    </tr>
                  ) : (
                    lines.map((l, i) => (
                      <tr key={l.id || i} style={{ breakInside: "avoid" }}>
                        <td style={td}>{l.ledger_name || "—"}</td>
                        <td style={{ ...td, textAlign: "right" }}>₹ {formatMoney(l.amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr style={{ background: TINT }}>
                    <td style={{ ...td, fontSize: 15, fontWeight: 700, color: RED }}>Grand Total</td>
                    <td style={{ ...td, fontSize: 15, fontWeight: 700, color: RED, textAlign: "right" }}>
                      ₹ {formatMoney(total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* WORDS + NARRATION */}
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 22, rowGap: 10 }}>
              <KeyLabel>Amount in Words</KeyLabel>
              <KeyValue>{amountInWords(total)}</KeyValue>
              <KeyLabel>Narration</KeyLabel>
              <KeyValue>{receipt?.narration || "—"}</KeyValue>
            </div>

            {/* SIGNATURES */}
            <div style={{ marginTop: 26, borderTop: `1px solid ${RED_LINE}`, paddingTop: 30 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
                <Signature label="Received By" />
                <Signature label="Member Signature" />
                <Signature label="Vicar / Authorized Signatory" />
                <div style={{ minWidth: 80, textAlign: "center", fontSize: 14, fontWeight: 700, color: RED, letterSpacing: 1 }}>
                  SEAL
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: 10, fontSize: 13.5, fontStyle: "italic", color: INK }}>
                This is a computer-generated receipt.
              </div>
            </div>
          </div>
        </div>

        {/* CORNERS */}
        <Corner sx={1} sy={1} style={{ top: -3, left: -3 }} />
        <Corner sx={-1} sy={1} style={{ top: -3, right: -3 }} />
        <Corner sx={1} sy={-1} style={{ bottom: -3, left: -3 }} />
        <Corner sx={-1} sy={-1} style={{ bottom: -3, right: -3 }} />
      </div>
    </div>
  );
};

export default ReceiptVoucher;