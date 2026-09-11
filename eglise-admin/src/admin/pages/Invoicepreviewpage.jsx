// src/admin/pages/InvoicePreviewPage.jsx

import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  Flex,
  Icon,
  Badge,
} from "@chakra-ui/react";

import {
  LuPrinter,
  LuDownload,
  LuQrCode,
} from "react-icons/lu";

import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";
const borderColor = "#1a1a2e";

/* =========================================================
   HELPERS
========================================================= */

const pick = (obj, keys, fallback = "—") => {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce((acc, k) => (acc == null ? acc : acc[k]), obj);

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return fallback;
};

const formatMoney = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (dateString) => {
  if (!dateString) return "—";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =========================================================
   NUMBER TO WORDS
========================================================= */

const numberToWords = (num) => {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const twoDigits = (n) => {
    if (n < 20) return ones[n];

    return `${tens[Math.floor(n / 10)]}${
      n % 10 ? " " + ones[n % 10] : ""
    }`;
  };

  const threeDigits = (n) => {
    if (n < 100) return twoDigits(n);

    return `${ones[Math.floor(n / 100)]} Hundred${
      n % 100 ? " " + twoDigits(n % 100) : ""
    }`;
  };

  if (!num || num === 0) {
    return "Zero";
  }

  let n = Math.round(Number(num));

  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  const lakh = Math.floor(n / 100000);
  n %= 100000;

  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const hundred = n;

  let words = "";

  if (crore) {
    words += `${threeDigits(crore)} Crore `;
  }

  if (lakh) {
    words += `${threeDigits(lakh)} Lakh `;
  }

  if (thousand) {
    words += `${threeDigits(thousand)} Thousand `;
  }

  if (hundred) {
    words += `${threeDigits(hundred)} `;
  }

  return words.trim();
};

/* =========================================================
   TABLE PRIMITIVES
========================================================= */

const Cell = ({
  children,
  w,
  align = "left",
  bold,
  bg,
  border = true,
  py = "4px",
  px = "8px",
}) => (
  <td
    style={{
      width: w,
      textAlign: align,
      fontWeight: bold ? 700 : 400,
      background: bg || "transparent",
      border: border
        ? `1px solid ${borderColor}`
        : "none",
      padding: `${py} ${px}`,
      fontSize: "11.5px",
      verticalAlign: "top",
    }}
  >
    {children}
  </td>
);

const HeadCell = (props) => (
  <Cell
    bold
    bg="#f4f4f6"
    {...props}
  />
);

/* =========================================================
   MAIN PAGE
========================================================= */

const InvoicePreviewPage = () => {
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    fetchInvoice();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInvoice = async () => {
    setIsLoading(true);

    try {
      const res = await adminApi.getInvoiceDetail(id);

      setInvoice(res.data || null);
    } catch (error) {
      console.error(
        "Error fetching invoice:",
        error
      );

      toaster.create({
        title: "Error",
        description: "Failed to load invoice.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     DERIVED FIELDS
  ========================================================= */

  const invoiceNo = pick(
    invoice,
    ["invoice_number", "bill_number"],
    `#${id}`
  );

  const dated = pick(
    invoice,
    ["paid_at", "created_at"],
    null
  );

  const modeOfPayment = pick(
    invoice,
    [
      "payment_method_display",
      "payment_method",
    ],
    "—"
  );

  const referenceNo = pick(
    invoice,
    [
      "transaction_id",
      "reference_number",
    ],
    "—"
  );

  const status = pick(
    invoice,
    ["status", "payment_status"],
    "PAID"
  );

  /* =========================================================
     SUBSCRIPTION
  ========================================================= */

  const subscriptionNo = pick(
    invoice,
    ["subscription_code"]
  );

  const billingStart = pick(
    invoice,
    ["billing_start"],
    null
  );

  const billingEnd = pick(
    invoice,
    ["billing_end"],
    null
  );

  const billingPeriod =
    billingStart &&
    billingStart !== "—"
      ? `${formatDate(
          billingStart
        )} – ${formatDate(billingEnd)}`
      : "—";

  /* =========================================================
     SELLER
  ========================================================= */

  const sellerName = pick(
    invoice,
    ["seller.company_name"],
    "Eglise Church Management"
  );

  const sellerSub = pick(
    invoice,
    ["seller.brand_name"],
    "Appzia Tec Solutions"
  );

  const sellerAddress = pick(
    invoice,
    ["seller.address"],
    "Kerala, India"
  );

  const sellerGstin = pick(
    invoice,
    ["seller.gstin"],
    "32ABCDE1234F1Z5"
  );

  const sellerEmail = pick(
    invoice,
    ["seller.email"],
    "billing@eglise.com"
  );

  /* =========================================================
     CHURCH
  ========================================================= */

  const churchName = pick(
    invoice,
    ["church_name", "church.name"]
  );

  const churchCode = pick(
    invoice,
    ["church_code", "church.code"]
  );

  const churchAddress = pick(
    invoice,
    [
      "church_address",
      "church.address",
    ],
    "—"
  );

  const churchEmail = pick(
    invoice,
    [
      "church_email",
      "church.email",
    ],
    "—"
  );

  const churchState = pick(
    invoice,
    [
      "church_state",
      "church.state_name",
    ],
    "—"
  );

  const churchStateCode = pick(
    invoice,
    [
      "church_state_code",
      "church.state_code",
    ],
    "—"
  );

  const placeOfSupply = pick(
    invoice,
    ["place_of_supply"],
    churchState
  );

  /* =========================================================
     PACKAGE
  ========================================================= */

  const packageName = pick(
    invoice,
    ["package_name"]
  );

  const packageCode = pick(
    invoice,
    ["package_code"],
    ""
  );

  const billingCycle = pick(
    invoice,
    ["billing_cycle"],
    ""
  );

  const billingCycleDisplay = pick(
    invoice,
    ["billing_cycle_display"],
    billingCycle === "YEARLY"
      ? "Yearly"
      : billingCycle === "MONTHLY"
      ? "Monthly"
      : billingCycle
  );

  const sacCode = pick(
    invoice,
    ["sac_code"],
    "998314"
  );

  const memberLimit = Number(
    pick(
      invoice,
      ["member_limit", "capacity"],
      0
    )
  );

  const rateUsed = Number(
    pick(invoice, ["rate_used"], 0)
  );

  const rateYearly = Number(
    pick(
      invoice,
      ["rate_per_member_yearly"],
      0
    )
  );

  const rateMonthly = Number(
    pick(
      invoice,
      ["rate_per_member_monthly"],
      0
    )
  );

  const ratePerMember =
    rateUsed ||
    (billingCycle === "YEARLY"
      ? rateYearly
      : rateMonthly);

  /* =========================================================
     AMOUNTS
  ========================================================= */

  const subtotal = Number(
    pick(
      invoice,
      ["taxable_amount", "amount"],
      0
    )
  );

  const taxTypeCode = pick(
    invoice,
    ["tax_type.tax_type_code"],
    "IGST"
  );

  const taxRatePercentage = Number(
    pick(
      invoice,
      [
        "tax_percentage",
        "tax_rate.rate_percentage",
      ],
      0
    )
  );

  const taxAmount = Number(
    pick(
      invoice,
      ["tax_amount"],
      0
    )
  );

  const totalPaid = Number(
    pick(
      invoice,
      ["total_amount"],
      subtotal + taxAmount
    )
  );

  /* =========================================================
     BANK
  ========================================================= */

  const bankName = pick(
    invoice,
    ["seller.bank_name"],
    "HDFC Bank"
  );

  const bankAccount = pick(
    invoice,
    ["seller.bank_account_masked"],
    "XXXX XXXX 5678"
  );

  const bankBranchIfsc = pick(
    invoice,
    ["seller.bank_branch_ifsc"],
    "Kochi & HDFC0001234"
  );

  const bankCurrency = pick(
    invoice,
    ["seller.bank_currency"],
    "INR (₹)"
  );

  /* =========================================================
     ACTIONS
  ========================================================= */

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      const res =
        await adminApi.downloadInvoicePdf(id);

      const blob = new Blob(
        [res.data],
        {
          type: "application/pdf",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.setAttribute(
        "download",
        `${invoiceNo}.pdf`
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Error downloading invoice PDF:",
        error
      );

      toaster.create({
        title: "Error",
        description:
          "Failed to download invoice PDF. Falling back to print.",
        type: "error",
        duration: 4000,
      });

      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (isLoading) {
    return (
      <AdminLayout>
        <Container
          maxW="container.xl"
          py={6}
        >
          <Flex
            justify="center"
            align="center"
            minH="400px"
          >
            <Box
              width="40px"
              height="40px"
              border="4px solid"
              borderColor="gray.200"
              borderTopColor={primaryMaroon}
              borderRadius="50%"
              animation="spin 1s linear infinite"
            />
          </Flex>

          <style>
            {`
              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }

                100% {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </Container>
      </AdminLayout>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AdminLayout>

      {/* =====================================================
          PRINT CSS
      ===================================================== */}

      <style>
        {`

          /* ===================================================
             SCREEN
          =================================================== */

          #invoice-print-area {
            box-sizing: border-box;
          }


          /* ===================================================
             PRINT
          =================================================== */

          @media print {

            @page {
              size: A4 portrait;
              margin: 0;
            }

            html,
            body {
              width: 210mm;
              height: 297mm;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              overflow: hidden !important;
            }

            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body * {
              visibility: hidden;
            }

            #invoice-print-area,
            #invoice-print-area * {
              visibility: visible;
            }

            #invoice-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;

              width: 210mm !important;
              height: 297mm !important;

              max-width: none !important;

              margin: 0 !important;

              padding: 8mm !important;

              border: none !important;
              border-radius: 0 !important;

              box-sizing: border-box !important;

              background: #ffffff !important;

              overflow: hidden !important;

              font-family: Arial, sans-serif !important;

              page-break-before: avoid !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
            }

            #invoice-hide-on-print {
              display: none !important;
            }

            #invoice-screen-wrapper {
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
            }


            /* ================================================
               PRINT TYPOGRAPHY
            ================================================ */

            #invoice-print-area p {
              margin-top: 0 !important;
              margin-bottom: 1px !important;
              line-height: 1.18 !important;
            }

            #invoice-print-area table {
              width: 100% !important;
              border-collapse: collapse !important;
              page-break-inside: avoid !important;
            }

            #invoice-print-area tr {
              page-break-inside: avoid !important;
              page-break-after: auto !important;
            }

            #invoice-print-area td,
            #invoice-print-area th {
              page-break-inside: avoid !important;
            }


            /* ================================================
               REDUCE VERTICAL SPACE
            ================================================ */

            #invoice-print-area .invoice-title {
              margin-bottom: 2mm !important;
            }

            #invoice-print-area .seller-section {
              min-height: auto !important;
            }

            #invoice-print-area .buyer-section {
              margin-top: 0 !important;
            }

            #invoice-print-area .particulars-section {
              margin-top: 3mm !important;
            }

            #invoice-print-area .amount-words {
              margin-top: 1mm !important;
              margin-bottom: 2mm !important;
            }

            #invoice-print-area .bank-section {
              margin-top: 0 !important;
            }

            #invoice-print-area .invoice-footer {
              margin-top: 2mm !important;
              padding-top: 1.5mm !important;
            }


            /* ================================================
               PRINT-SPECIFIC CELL SIZE
            ================================================ */

            #invoice-print-area td {
              padding-top: 2.5px !important;
              padding-bottom: 2.5px !important;
              padding-left: 5px !important;
              padding-right: 5px !important;
              font-size: 9.5px !important;
              line-height: 1.15 !important;
            }

            #invoice-print-area .small-print {
              font-size: 8.5px !important;
              line-height: 1.12 !important;
            }

            #invoice-print-area .normal-print {
              font-size: 9.5px !important;
              line-height: 1.15 !important;
            }

            #invoice-print-area .large-print {
              font-size: 11px !important;
              line-height: 1.15 !important;
            }


            /* ================================================
               KEEP ALL MAIN SECTIONS TOGETHER
            ================================================ */

            #invoice-print-area > div {
              page-break-inside: avoid !important;
            }

            #invoice-print-area table,
            #invoice-print-area .print-section {
              break-inside: avoid !important;
            }


            /* ================================================
               REMOVE SCREEN-ONLY GRAY BACKGROUND
            ================================================ */

            #invoice-screen-wrapper {
              display: block !important;
              width: 210mm !important;
              height: 297mm !important;
            }
          }
        `}
      </style>

      <Container
        maxW="container.xl"
        py={4}
      >

        {/* =====================================================
            SCREEN HEADER
        ===================================================== */}

        <Box id="invoice-hide-on-print">

          <Text
            fontSize="xs"
            color="gray.400"
            fontWeight="600"
            mb={2}
          >
            Payments / Invoices / {invoiceNo}
          </Text>

          <Flex
            justify="space-between"
            align={{
              base: "flex-start",
              md: "center",
            }}
            direction={{
              base: "column",
              md: "row",
            }}
            gap={3}
            mb={5}
          >

            <VStack
              align="start"
              spacing={1}
            >
              <Text
                fontSize="xs"
                fontWeight="700"
                color={primaryMaroon}
                textTransform="uppercase"
                letterSpacing="0.08em"
              >
                Invoice
              </Text>

              <Heading
                fontSize="2xl"
                fontWeight="800"
                color="#1a1a2e"
              >
                Invoice Preview
              </Heading>

              <Text
                color="gray.500"
                fontSize="sm"
              >
                Tally-style tax invoice for subscription billing.
              </Text>
            </VStack>

            <HStack spacing={3}>

              <Button
                variant="outline"
                borderColor={primaryMaroon}
                color={primaryMaroon}
                bg="white"
                _hover={{
                  bg: "rgba(174,32,80,0.05)",
                }}
                onClick={handlePrint}
              >
                <Icon
                  as={LuPrinter}
                  boxSize={4}
                  mr={2}
                />

                Print
              </Button>

              <Button
                bg={primaryMaroon}
                color="white"
                _hover={{
                  bg: "#8a1a3e",
                }}
                onClick={handleDownloadPdf}
                isLoading={isDownloading}
                loadingText="Downloading"
              >
                <Icon
                  as={LuDownload}
                  boxSize={4}
                  mr={2}
                />

                Download PDF
              </Button>

            </HStack>
          </Flex>
        </Box>


        {/* =====================================================
            INVOICE PAPER
        ===================================================== */}

        <Box
          id="invoice-screen-wrapper"
          bg="gray.100"
          borderRadius="lg"
          py={8}
          display="flex"
          justifyContent="center"
        >

          <Box
            id="invoice-print-area"
            bg="white"
            border="1px solid"
            borderColor={borderColor}
            w="100%"
            maxW="760px"
            p={6}
            fontFamily="Arial, sans-serif"
            color="#1a1a2e"
          >

            {/* =================================================
                TITLE
            ================================================= */}

            <Flex
              className="invoice-title"
              justify="space-between"
              align="baseline"
              mb={3}
            >
              <Text
                className="large-print"
                fontSize="lg"
                fontWeight="800"
                letterSpacing="0.03em"
              >
                TAX INVOICE
              </Text>

              <Text
                className="small-print"
                fontSize="xs"
                fontStyle="italic"
                color="gray.600"
              >
                Original for Recipient
              </Text>
            </Flex>


            {/* =================================================
                SELLER + INVOICE META
            ================================================= */}

            <Flex
              className="seller-section print-section"
              border={`1px solid ${borderColor}`}
              borderBottom="none"
            >

              {/* SELLER */}

              <Box
                flex="1"
                p={3}
                borderRight={`1px solid ${borderColor}`}
              >

                <HStack
                  spacing={2}
                  mb={2}
                >
                  <Box
                    boxSize="34px"
                    borderRadius="6px"
                    border={`1.5px solid ${primaryMaroon}`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color={primaryMaroon}
                    fontWeight="800"
                    fontSize="sm"
                  >
                    E
                  </Box>

                  <Text
                    fontSize="lg"
                    fontWeight="800"
                    color={primaryMaroon}
                    fontFamily="serif"
                  >
                    Eglise
                  </Text>
                </HStack>

                <Text
                  className="normal-print"
                  fontSize="sm"
                  fontWeight="700"
                >
                  {sellerName}
                </Text>

                <Text
                  className="small-print"
                  fontSize="xs"
                >
                  {sellerSub}
                </Text>

                <Text
                  className="small-print"
                  fontSize="xs"
                >
                  {sellerAddress}
                </Text>

                <Text
                  className="small-print"
                  fontSize="xs"
                >
                  GSTIN/UIN: {sellerGstin}
                </Text>

                <HStack spacing={2}>

                  <Text
                    className="small-print"
                    fontSize="xs"
                  >
                    Email: {sellerEmail}
                  </Text>

                  {status === "PAID" && (
                    <Badge
                      bg="green.50"
                      color="green.600"
                      border="1px solid"
                      borderColor="green.300"
                      fontSize="9px"
                      px={1.5}
                      borderRadius="sm"
                    >
                      PAID
                    </Badge>
                  )}

                </HStack>

              </Box>


              {/* INVOICE META */}

              <Box flex="1">

                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >
                  <tbody>

                    <tr>
                      <HeadCell w="45%">
                        Invoice No.
                      </HeadCell>

                      <Cell border={false}>
                        {invoiceNo}
                      </Cell>
                    </tr>

                    <tr
                      style={{
                        borderTop:
                          `1px solid ${borderColor}`,
                      }}
                    >
                      <HeadCell>
                        Dated
                      </HeadCell>

                      <Cell border={false}>
                        {formatDate(dated)}
                      </Cell>
                    </tr>

                    <tr
                      style={{
                        borderTop:
                          `1px solid ${borderColor}`,
                      }}
                    >
                      <HeadCell>
                        Mode/Terms of Payment
                      </HeadCell>

                      <Cell border={false}>
                        {modeOfPayment}
                      </Cell>
                    </tr>

                    <tr
                      style={{
                        borderTop:
                          `1px solid ${borderColor}`,
                      }}
                    >
                      <HeadCell>
                        Reference No.
                      </HeadCell>

                      <Cell border={false}>
                        {referenceNo}
                      </Cell>
                    </tr>

                    <tr
                      style={{
                        borderTop:
                          `1px solid ${borderColor}`,
                      }}
                    >
                      <HeadCell>
                        Subscription No.
                      </HeadCell>

                      <Cell border={false}>
                        {subscriptionNo}
                      </Cell>
                    </tr>

                    <tr
                      style={{
                        borderTop:
                          `1px solid ${borderColor}`,
                      }}
                    >
                      <HeadCell>
                        Billing Period
                      </HeadCell>

                      <Cell border={false}>
                        {billingPeriod}
                      </Cell>
                    </tr>

                  </tbody>
                </table>

              </Box>

            </Flex>


            {/* =================================================
                BUYER
            ================================================= */}

            <Box
              className="buyer-section print-section"
              border={`1px solid ${borderColor}`}
              borderTop="none"
              p={3}
              maxW="60%"
            >

              <Text
                className="small-print"
                fontSize="xs"
                fontWeight="700"
                mb={1}
              >
                Buyer (Bill to)
              </Text>

              <Text
                className="normal-print"
                fontSize="sm"
                fontWeight="700"
              >
                {churchName}
              </Text>

              <Text
                className="small-print"
                fontSize="xs"
              >
                Church Code: {churchCode}
              </Text>

              <Text
                className="small-print"
                fontSize="xs"
              >
                {churchAddress}
              </Text>

              <Text
                className="small-print"
                fontSize="xs"
              >
                Email: {churchEmail}
              </Text>

              <Text
                className="small-print"
                fontSize="xs"
              >
                State Name: {churchState}, Code:{" "}
                {churchStateCode}
              </Text>

              <Text
                className="small-print"
                fontSize="xs"
              >
                Place of Supply:{" "}
                {placeOfSupply}
              </Text>

            </Box>


            {/* =================================================
                PARTICULARS TABLE
            ================================================= */}

            <Box
              className="particulars-section print-section"
              mt={4}
            >

              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                }}
              >

                <thead>
                  <tr>

                    <HeadCell
                      w="6%"
                      align="center"
                    >
                      Sl No.
                    </HeadCell>

                    <HeadCell>
                      Particulars
                    </HeadCell>

                    <HeadCell
                      w="9%"
                      align="center"
                    >
                      SAC
                    </HeadCell>

                    <HeadCell
                      w="11%"
                      align="right"
                    >
                      Member Limit
                    </HeadCell>

                    <HeadCell
                      w="11%"
                      align="right"
                    >
                      Rate / Member
                    </HeadCell>

                    <HeadCell
                      w="8%"
                      align="center"
                    >
                      Per
                    </HeadCell>

                    <HeadCell
                      w="14%"
                      align="right"
                    >
                      Amount
                    </HeadCell>

                  </tr>
                </thead>

                <tbody>

                  <tr>

                    <Cell align="center">
                      1
                    </Cell>

                    <Cell>
                      {packageName}
                      {packageCode
                        ? ` (${packageCode})`
                        : ""}{" "}
                      – {billingCycleDisplay}{" "}
                      Subscription
                    </Cell>

                    <Cell align="center">
                      {sacCode}
                    </Cell>

                    <Cell align="right">
                      {memberLimit.toLocaleString(
                        "en-IN"
                      )}
                    </Cell>

                    <Cell align="right">
                      {formatMoney(
                        ratePerMember
                      )}
                    </Cell>

                    <Cell align="center">
                      Member
                    </Cell>

                    <Cell align="right">
                      {formatMoney(
                        subtotal
                      )}
                    </Cell>

                  </tr>


                  <tr>

                    <Cell align="center">
                      {" "}
                    </Cell>

                    <Cell>
                      {taxTypeCode} @{" "}
                      {taxRatePercentage}%
                    </Cell>

                    <Cell align="center">
                      {" "}
                    </Cell>

                    <Cell align="right">
                      {" "}
                    </Cell>

                    <Cell align="right">
                      {" "}
                    </Cell>

                    <Cell align="center">
                      {" "}
                    </Cell>

                    <Cell align="right">
                      {formatMoney(
                        taxAmount
                      )}
                    </Cell>

                  </tr>


                  <tr>

                    <Cell
                      border={false}
                      align="center"
                    >
                      {" "}
                    </Cell>

                    <HeadCell align="right">
                      Total
                    </HeadCell>

                    <Cell
                      border={false}
                      align="center"
                    >
                      {" "}
                    </Cell>

                    <Cell
                      bold
                      align="right"
                    >
                      {memberLimit.toLocaleString(
                        "en-IN"
                      )}
                    </Cell>

                    <Cell
                      border={false}
                      align="right"
                    >
                      {" "}
                    </Cell>

                    <Cell
                      border={false}
                      align="center"
                    >
                      {" "}
                    </Cell>

                    <Cell
                      bold
                      align="right"
                    >
                      {formatMoney(
                        totalPaid
                      )}
                    </Cell>

                  </tr>

                </tbody>

              </table>

            </Box>


            {/* =================================================
                AMOUNT IN WORDS
            ================================================= */}

            <Flex
              className="amount-words print-section"
              justify="space-between"
              align="flex-end"
              mt={2}
              mb={3}
            >

              <Box>

                <Text
                  className="small-print"
                  fontSize="xs"
                  color="gray.600"
                >
                  Amount Chargeable (in words)
                </Text>

                <Text
                  className="normal-print"
                  fontSize="sm"
                  fontWeight="700"
                >
                  INR {numberToWords(
                    totalPaid
                  )} Only
                </Text>

              </Box>

              <Text
                className="small-print"
                fontSize="xs"
                fontStyle="italic"
                color="gray.600"
              >
                E. &amp; O.E.
              </Text>

            </Flex>


            {/* =================================================
                TAX ANALYSIS
            ================================================= */}

            <table
              className="print-section"
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
              }}
            >

              <thead>
                <tr>

                  <HeadCell align="center">
                    SAC
                  </HeadCell>

                  <HeadCell align="center">
                    Taxable Value
                  </HeadCell>

                  <HeadCell align="center">
                    Integrated Tax Rate
                  </HeadCell>

                  <HeadCell align="center">
                    Integrated Tax Amount
                  </HeadCell>

                  <HeadCell align="center">
                    Total Tax Amount
                  </HeadCell>

                </tr>
              </thead>

              <tbody>

                <tr>

                  <Cell align="center">
                    {sacCode}
                  </Cell>

                  <Cell align="center">
                    {formatMoney(
                      subtotal
                    )}
                  </Cell>

                  <Cell align="center">
                    {taxRatePercentage}%
                  </Cell>

                  <Cell align="center">
                    {formatMoney(
                      taxAmount
                    )}
                  </Cell>

                  <Cell align="center">
                    {formatMoney(
                      taxAmount
                    )}
                  </Cell>

                </tr>


                <tr>

                  <HeadCell align="center">
                    Total
                  </HeadCell>

                  <HeadCell align="center">
                    {formatMoney(
                      subtotal
                    )}
                  </HeadCell>

                  <HeadCell align="center">
                    —
                  </HeadCell>

                  <HeadCell align="center">
                    {formatMoney(
                      taxAmount
                    )}
                  </HeadCell>

                  <HeadCell align="center">
                    {formatMoney(
                      taxAmount
                    )}
                  </HeadCell>

                </tr>

              </tbody>

            </table>


            {/* =================================================
                TAX WORDS
            ================================================= */}

            <Box
              className="print-section"
              border={`1px solid ${borderColor}`}
              borderTop="none"
              p={2}
            >

              <Text
                className="small-print"
                fontSize="xs"
              >
                Tax Amount (in words): INR{" "}
                {numberToWords(
                  taxAmount
                )} Only
              </Text>

            </Box>


            {/* =================================================
                BANK + DECLARATION
            ================================================= */}

            <Flex
              className="bank-section print-section"
              border={`1px solid ${borderColor}`}
              borderTop="none"
            >

              {/* BANK */}

              <Box
                flex="1"
                p={3}
                borderRight={`1px solid ${borderColor}`}
              >

                <Text
                  className="small-print"
                  fontSize="xs"
                  fontWeight="700"
                  mb={1}
                >
                  Company's Bank Details
                </Text>

                <Text
                  className="small-print"
                  fontSize="xs"
                >
                  Bank Name: {bankName}
                </Text>

                <Text
                  className="small-print"
                  fontSize="xs"
                >
                  A/c No.: {bankAccount}
                </Text>

                <Text
                  className="small-print"
                  fontSize="xs"
                >
                  Branch &amp; IFSC:{" "}
                  {bankBranchIfsc}
                </Text>

                <Text
                  className="small-print"
                  fontSize="xs"
                  mb={2}
                >
                  Currency: {bankCurrency}
                </Text>


                <Text
                  className="small-print"
                  fontSize="xs"
                  fontWeight="700"
                  mb={1}
                >
                  Declaration
                </Text>

                <Text
                  className="small-print"
                  fontSize="xs"
                >
                  We declare that this invoice
                  shows the actual subscription
                  charges and that all particulars
                  are true and correct.
                </Text>

              </Box>


              {/* SIGNATORY */}

              <Box
                flex="1"
                p={3}
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
              >

                <Text
                  className="small-print"
                  fontSize="xs"
                  fontWeight="700"
                >
                  For {sellerName}
                </Text>

                <Box
                  textAlign="center"
                  mt={8}
                >

                  <Box
                    borderTop={`1px solid ${borderColor}`}
                    pt={1}
                    w="70%"
                    mx="auto"
                  >

                    <Text
                      className="small-print"
                      fontSize="xs"
                    >
                      Authorised Signatory
                    </Text>

                  </Box>

                </Box>

              </Box>

            </Flex>


            {/* =================================================
                FOOTER
            ================================================= */}

            <Flex
              className="invoice-footer print-section"
              align="center"
              justify="space-between"
              mt={3}
              pt={2}
              borderTop="1px solid"
              borderColor="gray.200"
            >

              <HStack spacing={2}>

                <Box
                  boxSize="30px"
                  border={`1px solid ${borderColor}`}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon
                    as={LuQrCode}
                    boxSize={4}
                  />
                </Box>

                <Text
                  className="small-print"
                  fontSize="xs"
                  color={primaryMaroon}
                  textDecoration="underline"
                >
                  Verify Invoice
                </Text>

              </HStack>


              <Text
                className="small-print"
                fontSize="xs"
                color="gray.500"
              >
                This is a computer-generated invoice.
              </Text>


              <Text
                className="small-print"
                fontSize="xs"
                color="gray.500"
              >
                Page 1 of 1
              </Text>

            </Flex>

          </Box>

        </Box>

      </Container>

    </AdminLayout>
  );
};

export default InvoicePreviewPage;