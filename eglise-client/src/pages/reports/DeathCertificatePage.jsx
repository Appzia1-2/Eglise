// src/pages/reports/DeathCertificatePage.jsx

import React from "react";

import CertificateShell from "./CertificateShell";
import { pick, formatDate } from "./reportConfig";

// ============================================================
// COLORS
// ============================================================
const GOLD = "#C99A38";
const BORDER_RED = "#D65A4A";
const LIGHT_BORDER = "#D9B8A8";
const PAPER = "#FFFDF8";

// ============================================================
// STYLES (scoped with .dc- prefix so nothing leaks)
// ============================================================
const STYLES = `
  .dc-page{width:210mm;height:297mm;min-height:297mm;position:relative;overflow:hidden;
    margin:0 auto;padding:11mm 13mm;box-sizing:border-box;color:#171717;
    background:radial-gradient(circle at center,rgba(190,145,70,.025),transparent 45%),${PAPER};
    font-family:Georgia,"Times New Roman",serif;}
  .dc-page *{box-sizing:border-box;}

  .dc-outer{position:absolute;inset:5mm;border:1.5px solid ${BORDER_RED};pointer-events:none;z-index:20;}
  .dc-outer::before{content:"";position:absolute;inset:4px;border:1px solid rgba(214,90,74,.45);}
  .dc-inner{position:absolute;inset:8mm;border:1.8px solid #B92323;pointer-events:none;z-index:19;}
  .dc-inner::before{content:"";position:absolute;inset:4px;border:1px solid ${GOLD};}

  .dc-corner{position:absolute;z-index:25;width:34px;height:34px;display:flex;
    justify-content:center;align-items:center;color:${BORDER_RED};font-size:24px;line-height:1;pointer-events:none;}
  .dc-corner.tl{top:5.5mm;left:5.5mm;}
  .dc-corner.tr{top:5.5mm;right:5.5mm;transform:scaleX(-1);}
  .dc-corner.bl{bottom:5.5mm;left:5.5mm;transform:scaleY(-1);}
  .dc-corner.br{bottom:5.5mm;right:5.5mm;transform:scale(-1);}

  .dc-header{position:relative;z-index:10;margin-top:5mm;width:100%;display:flex;justify-content:center;}
  .dc-header-inner{width:100%;display:grid;grid-template-columns:75px 1fr 75px;align-items:center;min-height:28mm;}
  .dc-church{text-align:center;padding:0 5px;}
  .dc-church-name,.dc-church-sub{color:#4A1111;font-weight:700;line-height:1.05;white-space:nowrap;
    font-family:"Old English Text MT","UnifrakturCook","Lucida Blackletter",Georgia,serif;}
  .dc-church-name{font-size:27px;letter-spacing:.1px;}
  .dc-church-sub{font-size:24px;margin-top:2px;}

  .dc-title-area{position:relative;z-index:10;margin-top:4mm;text-align:center;}
  .dc-banner{position:relative;display:inline-flex;align-items:center;justify-content:center;
    min-width:107mm;height:15mm;padding:2px 20px;color:#fff;border:2px solid ${GOLD};border-radius:2px;
    background:linear-gradient(to bottom,#B30D0D,#8F0000);box-shadow:inset 0 0 0 1px #650000;}
  .dc-banner::before,.dc-banner::after{content:"";position:absolute;top:2px;width:17px;height:calc(100% - 4px);
    background:linear-gradient(to bottom,#B30D0D,#8F0000);border-top:2px solid ${GOLD};border-bottom:2px solid ${GOLD};}
  .dc-banner::before{left:-11px;transform:skewX(-18deg);}
  .dc-banner::after{right:-11px;transform:skewX(18deg);}
  .dc-banner-text{position:relative;z-index:2;font-size:21px;line-height:1;font-weight:700;letter-spacing:.2px;
    white-space:nowrap;font-family:"Old English Text MT","UnifrakturCook","Lucida Blackletter",Georgia,serif;}

  .dc-content{position:relative;z-index:5;margin:5mm 8mm 0;}

  .dc-top-table{width:88%;margin:0 auto 3.5mm;border-collapse:collapse;table-layout:fixed;font-size:12.5px;}
  .dc-top-table td{border:1px solid ${LIGHT_BORDER};padding:5px 8px;vertical-align:middle;height:10mm;}
  .dc-top-label{width:32mm;font-weight:700;white-space:nowrap;}
  .dc-top-value{font-weight:500;padding-left:10px !important;}

  .dc-details{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12.5px;}
  .dc-details td{border:1px solid ${LIGHT_BORDER};padding:5px 7px;vertical-align:middle;}
  .dc-label{width:42mm;font-weight:700;line-height:1.15;}
  .dc-value{font-weight:500;line-height:1.25;padding-left:10px !important;}
  .dc-name-row td{height:11mm;}
  .dc-age-row td{height:16mm;}
  .dc-address-row td{height:26mm;line-height:1.45;}
  .dc-normal-row td{height:10mm;}
  .dc-date-row td{height:9mm;}
  .dc-age-number{width:15mm;text-align:center;font-size:12px;}
  .dc-sex-sep{width:14mm;text-align:center;font-size:12px;font-weight:600;}
  .dc-sex-cell{width:31mm;white-space:nowrap;text-align:center;font-size:11.5px;}

  .dc-watermark{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);width:92mm;height:92mm;
    border:1.5px solid rgba(155,30,30,.045);border-radius:50%;display:flex;align-items:center;
    justify-content:center;z-index:1;pointer-events:none;opacity:.75;}
  .dc-watermark::before{content:"✠";font-size:125px;color:rgba(155,30,30,.035);}
  .dc-watermark-text{position:absolute;bottom:24px;font-size:7px;color:rgba(155,30,30,.045);
    letter-spacing:1.3px;white-space:nowrap;}

  .dc-certify{position:relative;z-index:5;text-align:center;margin:4mm 9mm 0;font-size:11.5px;line-height:1.45;}
  .dc-gap{height:24mm;position:relative;z-index:5;}

  .dc-footer{position:relative;z-index:5;margin:0 9mm;}
  .dc-footer-grid{display:grid;grid-template-columns:1.05fr .7fr 1.25fr;gap:8px;align-items:end;}
  .dc-footer-item{font-size:10.5px;line-height:1.3;}
  .dc-footer-center,.dc-footer-right{text-align:center;}
  .dc-footer-label{font-size:10px;font-weight:500;line-height:1.25;}
  .dc-footer-date{margin-top:6px;font-size:10.5px;}

  @media print{
    .dc-page{margin:0 !important;width:210mm;height:297mm;box-shadow:none !important;}
  }
`;

// ============================================================
// HELPERS
// ============================================================
const clean = (v) =>
  v === undefined || v === null || v === "" || v === "-" ? "N/A" : v;

const cap = (v) =>
  typeof v === "string" && v !== "-" && v !== "N/A"
    ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
    : v;

// DD:MM:YYYY
const formatDOB = (value) => {
  if (!value || value === "-") return "--:--:----";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}:${mm}:${d.getFullYear()}`;
};

// ============================================================
// PAGE
// ============================================================
const DeathCertificatePage = () => (
  <CertificateShell type="death">
    {(r) => {
      const name = clean(pick(r, ["name", "member_name", "deceased_name"]));
      const diocese = clean(pick(r, ["diocese_name"]));
      const church = clean(pick(r, ["church_name"]));
      const churchCity = pick(r, ["place", "church_city"]);

      const age = clean(pick(r, ["age_at_death", "age"]));
      const dob = pick(r, ["date_of_birth", "dob"], null);
      const gender = clean(cap(pick(r, ["gender"])));
      const address = clean(pick(r, ["address", "member_address"]));
      const houseNo = clean(
        pick(r, ["house_no", "house_number", "house_name", "member_id"])
      );

      const diedRaw = pick(r, ["died_on", "date_of_death", "death_date"], null);
      const funeralRaw = pick(
        r,
        ["funeral_on", "burial_date", "buried_on"],
        null
      );
      const celebrant = clean(
        pick(r, ["priest_name", "vicar_name", "minister_name"])
      );

      return (
        <Box_ScrollWrap>
          <style>{STYLES}</style>

          <div className="cert-box dc-page">
            <div className="dc-outer" />
            <div className="dc-inner" />
            <div className="dc-corner tl">❧</div>
            <div className="dc-corner tr">❧</div>
            <div className="dc-corner bl">❧</div>
            <div className="dc-corner br">❧</div>

            {/* HEADER */}
            <div className="dc-header">
              <div className="dc-header-inner">
                <div />
                <div className="dc-church">
                  <div className="dc-church-name">Malankara Orthodox</div>
                  <div className="dc-church-sub">Syrian Church</div>
                </div>
                <div />
              </div>
            </div>

            {/* TITLE */}
            <div className="dc-title-area">
              <div className="dc-banner">
                <div className="dc-banner-text">Death/Funeral Certificate</div>
              </div>
            </div>

            {/* CONTENT */}
            <div className="dc-content">
              <table className="dc-top-table">
                <tbody>
                  <tr>
                    <td className="dc-top-label">Diocese</td>
                    <td className="dc-top-value">{diocese}</td>
                  </tr>
                  <tr>
                    <td className="dc-top-label">Parish</td>
                    <td className="dc-top-value">{church}</td>
                  </tr>
                </tbody>
              </table>

              <div className="dc-watermark">
                <div className="dc-watermark-text">
                  MALANKARA ORTHODOX SYRIAN CHURCH
                </div>
              </div>

              <table className="dc-details">
                <tbody>
                  <tr className="dc-name-row">
                    <td className="dc-label">Name</td>
                    <td className="dc-value" colSpan="6">{name}</td>
                  </tr>

                  <tr className="dc-age-row">
                    <td className="dc-label">Age, Date of Birth</td>
                    <td className="dc-age-number">{age}</td>
                    <td className="dc-value" colSpan="3" style={{ textAlign: "center" }}>
                      {formatDOB(dob)}
                    </td>
                    <td className="dc-sex-sep">Sex :</td>
                    <td className="dc-sex-cell">{gender}</td>
                  </tr>

                  <tr className="dc-address-row">
                    <td className="dc-label">Address</td>
                    <td className="dc-value" colSpan="6">{address}</td>
                  </tr>

                  <tr className="dc-normal-row">
                    <td className="dc-label">House No. in the Church Register</td>
                    <td className="dc-value" colSpan="6">{houseNo}</td>
                  </tr>

                  <tr className="dc-date-row">
                    <td className="dc-label">Date of Death</td>
                    <td className="dc-value" colSpan="6">
                      {diedRaw ? formatDate(diedRaw) : "N/A"}
                    </td>
                  </tr>

                  <tr className="dc-date-row">
                    <td className="dc-label">Date of Funeral</td>
                    <td className="dc-value" colSpan="6">
                      {funeralRaw ? formatDate(funeralRaw) : "N/A"}
                    </td>
                  </tr>

                  <tr className="dc-date-row">
                    <td className="dc-label">Chief Celebrant</td>
                    <td className="dc-value" colSpan="6">
                      {celebrant === "N/A" ? celebrant : `Rev. Fr. ${celebrant}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CERTIFICATION */}
            <div className="dc-certify">
              I do hereby certify that the above is a true copy of an entry in the
              <br />
              Funeral Register maintained at this Parish.
            </div>

            <div className="dc-gap" />

            {/* FOOTER */}
            <div className="dc-footer">
              <div className="dc-footer-grid">
                <div className="dc-footer-item">
                  <strong>Place :</strong> {clean(churchCity)}
                  <div className="dc-footer-date">
                    <strong>Date :</strong>{" "}
                    {funeralRaw || diedRaw
                      ? formatDate(funeralRaw || diedRaw)
                      : "N/A"}
                  </div>
                </div>

                <div className="dc-footer-item dc-footer-center">
                  <div className="dc-footer-label">SEAL</div>
                </div>

                <div className="dc-footer-item dc-footer-right">
                  <div className="dc-footer-label">
                    <br />
                    Name and Signature of Vicar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Box_ScrollWrap>
      );
    }}
  </CertificateShell>
);

// Lets the fixed-size A4 page scroll sideways on small screens
const Box_ScrollWrap = ({ children }) => (
  <div style={{ overflowX: "auto", paddingBottom: 8 }}>{children}</div>
);

export default DeathCertificatePage;