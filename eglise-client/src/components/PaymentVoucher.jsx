// src/components/PaymentVoucher.jsx

import React from "react";
import { amountInWords } from "../utils/amountInWords";

/* =========================================================
   PALETTE
========================================================= */
const RED = "#9B1230";
const RED_DARK = "#6E0B20";
const RED_LINE = "#C9475F";
const GOLD = "#D99A2B";
const GOLD_LIGHT = "#F3C96B";
const PAPER = "#FFFAF2";
const LABEL_BG = "#FFF3E4";
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

/* =========================================================
   CORNER ORNAMENT  (sx / sy = mirror on X / Y)
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

/* =========================================================
   CHURCH ILLUSTRATION (gold + red line art)
========================================================= */
const ChurchIllustration = ({ size = 120, opacity = 1 }) => (
  <svg viewBox="0 0 140 150" width={size} height={size * (150 / 140)} style={{ opacity }}>
    {/* cross */}
    <path d="M70 2 V26 M61 11 H79" stroke={RED} strokeWidth="3" strokeLinecap="round" />
    {/* tower roof */}
    <path d="M52 44 Q70 26 88 44 Z" fill={GOLD} stroke={RED} strokeWidth="2" />
    {/* tower */}
    <rect x="54" y="44" width="32" height="34" fill={PAPER} stroke={RED} strokeWidth="2" />
    <path d="M64 70 V56 Q70 49 76 56 V70 Z" fill={RED} />
    <circle cx="70" cy="52" r="0" />
    {/* nave roof */}
    <path d="M36 82 L70 58 L104 82 Z" fill={GOLD} stroke={RED} strokeWidth="2" />
    {/* nave */}
    <rect x="42" y="82" width="56" height="52" fill={PAPER} stroke={RED} strokeWidth="2" />
    <circle cx="70" cy="92" r="5" fill={GOLD_LIGHT} stroke={RED} strokeWidth="1.6" />
    {/* door */}
    <path d="M58 134 V108 Q58 97 70 97 Q82 97 82 108 V134 Z" fill={RED} stroke={RED_DARK} strokeWidth="1.5" />
    <path d="M70 97 V134" stroke={GOLD_LIGHT} strokeWidth="1" />
    {/* wings */}
    <path d="M42 96 L22 108 V134 H42" fill={PAPER} stroke={RED} strokeWidth="2" />
    <path d="M98 96 L118 108 V134 H98" fill={PAPER} stroke={RED} strokeWidth="2" />
    <path d="M28 134 V118 Q28 112 33 112 Q38 112 38 118 V134 Z" fill={GOLD} stroke={RED} strokeWidth="1.4" />
    <path d="M102 134 V118 Q102 112 107 112 Q112 112 112 118 V134 Z" fill={GOLD} stroke={RED} strokeWidth="1.4" />
    {/* steps */}
    <rect x="16" y="134" width="108" height="5" fill={RED} />
    <rect x="10" y="139" width="120" height="5" fill={RED_DARK} />
  </svg>
);

/* =========================================================
   SMALL PIECES
========================================================= */
const Label = ({ children, ...rest }) => (
  <td
    {...rest}
    style={{
      border: `1px solid ${RED_LINE}`,
      background: LABEL_BG,
      padding: "7px 12px",
      fontSize: 13,
      fontWeight: 500,
      color: INK,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </td>
);

const Value = ({ children, style, ...rest }) => (
  <td
    {...rest}
    style={{
      border: `1px solid ${RED_LINE}`,
      padding: "7px 12px",
      fontSize: 13.5,
      color: INK,
      ...style,
    }}
  >
    {children}
  </td>
);

const Signature = ({ label }) => (
  <div style={{ flex: 1, textAlign: "center" }}>
    <div style={{ borderTop: `1.5px solid ${INK}`, width: "78%", margin: "0 auto 5px" }} />
    <div style={{ fontSize: 12.5, color: INK }}>{label}</div>
  </div>
);

/* =========================================================
   MAIN VOUCHER
========================================================= */
const PaymentVoucher = ({ payment, church }) => {
  const total = payment?.amount ?? 0;
  const churchName = church?.name || "Parish Name";
  const churchAddress =
    church?.full_address ||
    church?.address ||
    [church?.city, church?.state].filter(Boolean).join(", ");

  return (
    <div
      className="payment-voucher"
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
      <div
        style={{
          position: "relative",
          border: `2px solid ${RED}`,
          padding: 6,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "relative",
            border: `1px solid ${RED}`,
            padding: "18px 26px 22px",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* WATERMARK */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <ChurchIllustration size={230} opacity={0.045} />
          </div>

          <div style={{ position: "relative", zIndex: 2 }}>
            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              {/* left: church */}
              <div style={{ width: 150, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                <ChurchIllustration size={118} />
              </div>

              {/* center: name, address, banner */}
              <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
                <div
                  style={{
                    fontFamily:
                      "'UnifrakturCook', 'UnifrakturMaguntia', 'Old English Text MT', 'Blackadder ITC', 'Georgia', serif",
                    fontSize: 42,
                    fontWeight: 700,
                    color: RED_DARK,
                    lineHeight: 1.05,
                    letterSpacing: 0.5,
                  }}
                >
                  {churchName}
                </div>
                {churchAddress && (
                  <div style={{ fontSize: 16, color: INK, marginTop: 4 }}>{churchAddress}</div>
                )}

                {/* RIBBON BANNER */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                  <div
                    style={{
                      padding: 3,
                      background: `linear-gradient(180deg, ${GOLD_LIGHT}, ${GOLD})`,
                      clipPath:
                        "polygon(0 50%, 16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%)",
                    }}
                  >
                    <div
                      style={{
                        background: `linear-gradient(180deg, ${RED} 0%, ${RED_DARK} 100%)`,
                        color: "#FFF4D6",
                        padding: "6px 64px",
                        fontSize: 24,
                        fontWeight: 700,
                        letterSpacing: 3,
                        whiteSpace: "nowrap",
                        clipPath:
                          "polygon(0 50%, 14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%)",
                      }}
                    >
                      PAYMENT VOUCHER
                    </div>
                  </div>
                </div>
              </div>

              {/* right: voucher no / date */}
              <div style={{ width: 200, flexShrink: 0, textAlign: "right", fontSize: 13.5, lineHeight: 1.9, paddingTop: 34 }}>
                <div>
                  Voucher No.{" "}
                  <span style={{ fontWeight: 600 }}>{payment?.voucher_number || "—"}</span>
                </div>
                <div>
                  Date <span style={{ fontWeight: 600 }}>{formatDate(payment?.payment_date)}</span>
                </div>
              </div>
            </div>

            {/* DETAILS TABLE */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                marginTop: 14,
                border: `1px solid ${RED_LINE}`,
                background: "rgba(255,250,242,0.85)",
              }}
            >
              <colgroup>
                <col style={{ width: "15%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "19%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <Label>Party Name</Label>
                  <Value colSpan={5}>{payment?.party_name || "—"}</Value>
                </tr>

                <tr>
                  <Label>Ref Number</Label>
                  <Value colSpan={2}>{payment?.ref_no || "—"}</Value>
                  <Label>Payment Type</Label>
                  <Value colSpan={2}>
                    {payment?.payment_type_label || payment?.payment_type || "—"}
                  </Value>
                </tr>

                <tr>
                  <Label>Transaction Type</Label>
                  <Value>{payment?.payment_mode_label || payment?.payment_mode || "—"}</Value>
                  <Label>Bank Account</Label>
                  <Value>{payment?.bank_account_display || "—"}</Value>
                  <Label>Account Ledger</Label>
                  <Value>{payment?.account_ledger_name || "—"}</Value>
                </tr>

                <tr>
                  <Label>Amount</Label>
                  <Value colSpan={5} style={{ fontSize: 19, fontWeight: 700, color: RED }}>
                    ₹{formatMoney(total)}
                  </Value>
                </tr>

                <tr>
                  <Label>Amount in Words</Label>
                  <Value colSpan={5}>{amountInWords(total)}</Value>
                </tr>

                <tr>
                  <Label>Narration</Label>
                  <Value colSpan={5}>{payment?.narration || "—"}</Value>
                </tr>
              </tbody>
            </table>

            {/* SIGNATURES */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 28,
                marginTop: 46,
                padding: "0 10px",
              }}
            >
              <Signature label="Prepared By" />
              <Signature label="Receiver's Signature" />
              <Signature label="Vicar / Authorized Signatory" />
              <div style={{ minWidth: 70, textAlign: "center", fontSize: 12.5, letterSpacing: 1 }}>SEAL</div>
            </div>
          </div>
        </div>

        {/* CORNER ORNAMENTS (sit on the outer frame) */}
        <Corner sx={1} sy={1} style={{ top: -3, left: -3 }} />
        <Corner sx={-1} sy={1} style={{ top: -3, right: -3 }} />
        <Corner sx={1} sy={-1} style={{ bottom: -3, left: -3 }} />
        <Corner sx={-1} sy={-1} style={{ bottom: -3, right: -3 }} />
      </div>
    </div>
  );
};

export default PaymentVoucher;