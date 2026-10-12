// src/components/PaymentVoucher.jsx

import React from "react";
import { amountInWords } from "../utils/amountInWords";

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
   ORNAMENT
========================================================= */

const CornerFlourish = ({ flip = false, rotate = 0 }) => (
  <svg
    viewBox="0 0 60 60"
    width="42"
    height="42"
    style={{
      position: "absolute",
      transform: `scaleX(${flip ? -1 : 1}) rotate(${rotate}deg)`,
      pointerEvents: "none",
    }}
  >
    <path
      d="M4 4 C 24 4, 30 12, 30 24 C 30 12, 40 4, 56 4"
      fill="none"
      stroke="#8B0E22"
      strokeWidth="1.4"
    />
    <path
      d="M8 8 C 22 8, 26 14, 26 22"
      fill="none"
      stroke="#8B0E22"
      strokeWidth="1"
    />
    <circle cx="6" cy="6" r="2.4" fill="#C8A44C" stroke="#8B0E22" strokeWidth="0.8" />
    <circle cx="54" cy="6" r="2.4" fill="#C8A44C" stroke="#8B0E22" strokeWidth="0.8" />
  </svg>
);

/* =========================================================
   CHURCH ILLUSTRATION
========================================================= */

const ChurchIllustration = () => (
  <svg viewBox="0 0 100 110" width="70" height="80">
    <rect x="30" y="50" width="40" height="55" fill="#FBE9C8" stroke="#8B0E22" strokeWidth="1.2" />
    <path d="M44 105 L44 82 Q50 74 56 82 L56 105 Z" fill="#8B0E22" opacity="0.75" />
    <polygon points="26,52 50,32 74,52" fill="#FBE9C8" stroke="#8B0E22" strokeWidth="1.2" />
    <rect x="44" y="18" width="12" height="24" fill="#FBE9C8" stroke="#8B0E22" strokeWidth="1.2" />
    <polygon points="42,18 50,4 58,18" fill="#FBE9C8" stroke="#8B0E22" strokeWidth="1.2" />
    <line x1="50" y1="-4" x2="50" y2="4" stroke="#8B0E22" strokeWidth="1.6" />
    <line x1="46" y1="0" x2="54" y2="0" stroke="#8B0E22" strokeWidth="1.6" />
    <rect x="36" y="70" width="5" height="12" fill="#8B0E22" opacity="0.5" />
    <rect x="59" y="70" width="5" height="12" fill="#8B0E22" opacity="0.5" />
    <rect x="20" y="105" width="60" height="3" fill="#8B0E22" />
  </svg>
);

/* =========================================================
   STYLES
========================================================= */

const cellLabel = {
  border: "1px solid #8B0E22",
  padding: "6px 10px",
  background: "#FDF3E0",
  fontWeight: 600,
  fontSize: 12,
  color: "#5A2418",
  whiteSpace: "nowrap",
  width: "18%",
};

const cellValue = {
  border: "1px solid #8B0E22",
  padding: "6px 10px",
  fontSize: 12.5,
  color: "#2A1310",
};

const SignatureBlock = ({ label }) => (
  <div style={{ textAlign: "center", flex: 1 }}>
    <div
      style={{
        borderTop: "1px solid #4A2019",
        width: "80%",
        margin: "0 auto 4px",
      }}
    />
    <div style={{ fontSize: 11, color: "#4A2019" }}>{label}</div>
  </div>
);

/* =========================================================
   MAIN VOUCHER
========================================================= */

const PaymentVoucher = ({ payment, church }) => {
  const total = payment?.amount ?? 0;

  const churchName = church?.name || "Parish Name";
  const churchAddress = [church?.city, church?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="payment-voucher"
      style={{
        width: "100%",
        maxWidth: "1000px",
        margin: "0 auto",
        background: "#FFFDF6",
        border: "1.5px solid #8B0E22",
        padding: "20px 26px",
        position: "relative",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: "#2A1310",
        boxSizing: "border-box",
      }}
    >
      {/* ORNATE CORNERS */}
      <div style={{ position: "absolute", top: 6, left: 6 }}>
        <CornerFlourish />
      </div>
      <div style={{ position: "absolute", top: 6, right: 6 }}>
        <CornerFlourish flip />
      </div>
      <div style={{ position: "absolute", bottom: 6, left: 6 }}>
        <CornerFlourish rotate={90} />
      </div>
      <div style={{ position: "absolute", bottom: 6, right: 6 }}>
        <CornerFlourish flip rotate={90} />
      </div>

      {/* INNER BORDER */}
      <div
        style={{
          border: "1px solid #D4B16A",
          padding: "14px 18px",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 8,
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <ChurchIllustration />
          </div>

          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#8B0E22",
                letterSpacing: 1,
                lineHeight: 1.1,
              }}
            >
              {churchName}
            </div>
            {churchAddress && (
              <div
                style={{
                  fontSize: 13,
                  color: "#4A2019",
                  marginTop: 2,
                }}
              >
                {churchAddress}
              </div>
            )}
          </div>

          <div
            style={{
              textAlign: "right",
              fontSize: 12,
              lineHeight: 1.6,
              minWidth: 190,
            }}
          >
            <div>
              <strong>Voucher No.</strong>{" "}
              <span style={{ fontFamily: "monospace" }}>
                {payment?.voucher_number || "—"}
              </span>
            </div>
            <div>
              <strong>Date</strong>{" "}
              <span>{formatDate(payment?.payment_date)}</span>
            </div>
          </div>
        </div>

        {/* TITLE BANNER */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "12px 0 14px",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(180deg, #A3122B 0%, #8B0E22 100%)",
              color: "#FFF4D6",
              padding: "8px 44px",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 3,
              clipPath:
                "polygon(0 50%, 10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%)",
              boxShadow: "0 2px 4px rgba(139,14,34,0.25)",
            }}
          >
            PAYMENT VOUCHER
          </div>
        </div>

        {/* DETAILS TABLE */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            border: "1px solid #8B0E22",
          }}
        >
          <tbody>
            <tr>
              <td style={cellLabel}>Party Name</td>
              <td style={cellValue} colSpan={5}>
                {payment?.party_name || "—"}
              </td>
            </tr>

            <tr>
              <td style={cellLabel}>Ref Number</td>
              <td style={cellValue} colSpan={2}>
                {payment?.ref_no || "—"}
              </td>
              <td style={cellLabel}>Payment Type</td>
              <td style={cellValue} colSpan={2}>
                {payment?.payment_type_label ||
                  payment?.payment_type ||
                  "—"}
              </td>
            </tr>

            <tr>
              <td style={cellLabel}>Transaction Type</td>
              <td style={cellValue}>
                {payment?.payment_mode_label ||
                  payment?.payment_mode ||
                  "—"}
              </td>
              <td style={cellLabel}>Bank Account</td>
              <td style={cellValue} colSpan={3}>
                {payment?.bank_account_display || "—"}
              </td>
            </tr>

            <tr>
              <td style={cellLabel}>Account Ledger</td>
              <td style={cellValue} colSpan={5}>
                {payment?.account_ledger_name || "—"}
              </td>
            </tr>

            <tr>
              <td style={cellLabel}>Amount</td>
              <td
                style={{
                  ...cellValue,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#8B0E22",
                }}
                colSpan={5}
              >
                ₹ {formatMoney(total)}
              </td>
            </tr>

            <tr>
              <td style={cellLabel}>Amount in Words</td>
              <td
                style={{ ...cellValue, fontStyle: "italic" }}
                colSpan={5}
              >
                {amountInWords(total)}
              </td>
            </tr>

            <tr>
              <td style={cellLabel}>Narration</td>
              <td style={cellValue} colSpan={5}>
                {payment?.narration || "—"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* SIGNATURES */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 40,
            gap: 20,
          }}
        >
          <SignatureBlock label="Prepared By" />
          <SignatureBlock label="Receiver's Signature" />
          <SignatureBlock label="Vicar / Authorized Signatory" />
          <div
            style={{
              fontSize: 11,
              color: "#4A2019",
              textAlign: "center",
              minWidth: 60,
            }}
          >
            <div
              style={{
                width: 60,
                height: 36,
                border: "1px dashed #8B0E22",
                borderRadius: 4,
                marginBottom: 4,
              }}
            />
            SEAL
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVoucher;