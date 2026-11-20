
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Text,
} from "@chakra-ui/react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChurchPrintModal from "../../components/ChurchPrintModal";

import {
  getIncomeExpenditureStatutory,
  getMyChurch,
} from "../../api/registryServices";

// ============================================================
// THEME
// ============================================================

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";
const TEXT_COLOR = "#182338";
const SECONDARY = "#60708C";
const BORDER = "#DCE2EA";
const BLUE = "#315AB5";

const HATCH_CSS =
  "repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 2px, #ffffff 2px, #ffffff 4px)";

// ============================================================
// DATE HELPERS
// ============================================================

const localDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const today = () => localDateString(new Date());

const monthStart = () => {
  const d = new Date();
  d.setDate(1);
  return localDateString(d);
};

const lastYearMonthStart = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  d.setDate(1);
  return localDateString(d);
};

const lastYearToday = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return localDateString(d);
};

const formatDateDisplay = (value) => {
  if (!value) return "";

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

// ============================================================
// AMOUNT FORMATTER
// ============================================================

const formatAmount = (value) => {
  const amount = Number(value ?? 0);

  return (
    "₹" +
    amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

// ============================================================
// DATE VALIDATION
// ============================================================

const isValidDateString = (value) => {
  if (!value) return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

// ============================================================
// SHARED STATUTORY ROW
// SCREEN + PRINT
// ============================================================

const StatutoryRow = ({ row, mode = "screen" }) => {
  const {
    code,
    name,
    depth,
    row_type,
    current_year,
    previous_year,
    section,
  } = row;

  const isPrint = mode === "print";

  const isSection = row_type === "section";
  const isGroup = row_type === "group";
  const isSubTotal = row_type === "subtotal";

  const isTotal = [
    "total",
    "grand_total",
    "grand_total_balanced",
  ].includes(row_type);

  const isAdj = row_type === "adjustment";

  const weight =
    isSection || isGroup || isTotal
      ? 700
      : isSubTotal
      ? 600
      : isAdj
      ? 600
      : 400;

  const color =
    isSection || isTotal
      ? DARK_RED
      
      : TEXT_COLOR;

  const bg =
    isSection || isGroup
      ? HATCH_CSS
      : isTotal
      ? "#F0F4FA"
      : isSubTotal
      ? "#F7F9FB"
      : "white";

  const indentPx = [0, 20, 40, 60][depth] ?? 40;

  const prefix =
    isSection && section ? `${section}.  ` : "";

  const cellPad = isPrint ? "4px 6px" : "6px 8px";
  const fontSize = isPrint ? "9.5px" : "11.5px";

  const fontFam = isPrint
    ? "Georgia, 'Times New Roman', serif"
    : "inherit";

  const fontStyle = isSubTotal ? "italic" : "normal";

  const showAmount = !isSection && !isGroup;

  const base = {
    fontSize,
    fontWeight: weight,
    fontFamily: fontFam,
    fontStyle,
    background: bg,
  };

  return (
    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
      <td
        style={{
          ...base,
          color,
          width: 60,
          padding: cellPad,
          textAlign: "center",
          borderRight: `1px solid ${BORDER}`,
        }}
      >
        {code || ""}
      </td>

      <td
        style={{
          ...base,
          color,
          padding: cellPad,
          paddingLeft: `${indentPx + (isPrint ? 4 : 8)}px`,
          textTransform:
            isSection || isTotal ? "uppercase" : "none",
          letterSpacing: isSection ? "0.4px" : "normal",
        }}
      >
        {prefix}
        {name}
      </td>

      <td
        style={{
          ...base,
          color,
          width: 130,
          padding: cellPad,
          textAlign: "right",
        }}
      >
        {showAmount ? formatAmount(current_year) : ""}
      </td>

      <td
        style={{
          ...base,
          color,
          width: 130,
          padding: cellPad,
          textAlign: "right",
          borderLeft: `1px solid ${BORDER}`,
        }}
      >
        {showAmount ? formatAmount(previous_year) : ""}
      </td>
    </tr>
  );
};

// ============================================================
// TABLE HEADER
// ============================================================

const ReportTableHeader = ({ label, print = false }) => (
  <tr
    style={{
      background: "#F7F9FB",
      borderBottom: `1px solid ${BORDER}`,
    }}
  >
    <th
      style={{
        padding: print ? "4px 6px" : "10px 6px",
        width: print ? 55 : 60,
        borderRight: `1px solid ${BORDER}`,
        fontSize: print ? "10px" : "12px",
        textAlign: "center",
      }}
    >
      Code
    </th>

    <th
      style={{
        padding: print ? "4px 6px" : "10px 6px",
        textAlign: "left",
        fontSize: print ? "10px" : "12px",
      }}
    >
      {label}
    </th>

    <th
      style={{
        padding: print ? "4px 6px" : "10px 6px",
        textAlign: "right",
        width: print ? 110 : 130,
        fontSize: print ? "10px" : "12px",
      }}
    >
      Current (₹)
    </th>

    <th
      style={{
        padding: print ? "4px 6px" : "10px 6px",
        textAlign: "right",
        width: print ? 110 : 130,
        borderLeft: `1px solid ${BORDER}`,
        fontSize: print ? "10px" : "12px",
      }}
    >
      Previous (₹)
    </th>
  </tr>
);

// ============================================================
// TWO-COLUMN SCREEN VIEW
// IMPORTANT:
// Render ONLY backend rows.
// Do not append another TOTAL row.
// ============================================================

const ScreenStatutory = ({
  incomeRows = [],
  expenditureRows = [],
}) => {
  return (
    <Flex
      direction={{ base: "column", lg: "row" }}
      border={`1px solid ${BORDER}`}
      borderRadius="10px"
      overflow="hidden"
    >
      {/* INCOME */}

      <Box
        flex="1"
        borderRight={{
          base: "none",
          lg: `1px solid ${BORDER}`,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <ReportTableHeader label="INCOME" />
          </thead>

          <tbody>
            {incomeRows.map((row, index) => (
              <StatutoryRow
                key={`income-${row.code ?? row.name}-${index}`}
                row={row}
              />
            ))}
          </tbody>
        </table>
      </Box>

      {/* EXPENDITURE */}

      <Box flex="1">
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <ReportTableHeader label="EXPENDITURE" />
          </thead>

          <tbody>
            {expenditureRows.map((row, index) => (
              <StatutoryRow
                key={`expenditure-${row.code ?? row.name}-${index}`}
                row={row}
              />
            ))}
          </tbody>
        </table>
      </Box>
    </Flex>
  );
};

// ============================================================
// PRINT STATUTORY CONTENT
// IMPORTANT:
// Render ONLY backend rows.
// Do not append another TOTAL row.
// ============================================================

const PrintStatutory = ({
  incomeRows = [],
  expenditureRows = [],
  net = 0,
  isSurplus = true,
  dateFrom,
  dateTo,
}) => {
  return (
    <div
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        width: "100%",
        fontSize: "10px",
      }}
    >
      {/* REPORT TITLE */}

      <div
        style={{
          textAlign: "center",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: DARK_RED,
            letterSpacing: "0.5px",
          }}
        >
          INCOME AND EXPENDITURE ACCOUNT
        </div>

        <div
          style={{
            fontSize: 11,
            color: SECONDARY,
          }}
        >
          FOR THE PERIOD FROM {dateFrom} TO {dateTo}
        </div>
      </div>

      {/* INCOME TABLE */}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: 55 }} />
          <col style={{ width: "auto" }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 110 }} />
        </colgroup>

        <thead>
          <ReportTableHeader label="INCOME" print />
        </thead>

        <tbody>
          {incomeRows.map((row, index) => (
            <StatutoryRow
              key={`print-income-${row.code ?? row.name}-${index}`}
              row={row}
              mode="print"
            />
          ))}
        </tbody>
      </table>

      <div style={{ height: 16 }} />

      {/* EXPENDITURE TABLE */}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: 55 }} />
          <col style={{ width: "auto" }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 110 }} />
        </colgroup>

        <thead>
          <ReportTableHeader label="EXPENDITURE" print />
        </thead>

        <tbody>
          {expenditureRows.map((row, index) => (
            <StatutoryRow
              key={`print-exp-${row.code ?? row.name}-${index}`}
              row={row}
              mode="print"
            />
          ))}
        </tbody>
      </table>

      {/* NET BALANCE */}

      <div
        style={{
          marginTop: 14,
          textAlign: "right",
          fontWeight: 700,
          color: DARK_RED,
          fontSize: 11,
        }}
      >
        NET {isSurplus ? "SURPLUS" : "DEFICIT"}:{" "}
        {formatAmount(Math.abs(Number(net || 0)))}
      </div>

      {/* SIGNATURES */}

      <div
        className="print-footer-block"
        style={{
          marginTop: 30,
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
        }}
      >
        <div>
          <div>Place: ______________________</div>

          <div style={{ marginTop: 8 }}>
            Date: ______________________
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div>As per our report of even date attached</div>

          <br />
          <br />

          <div style={{ fontWeight: 700 }}>Vicar</div>

          <div
            style={{
              fontWeight: 700,
              marginTop: 6,
            }}
          >
            Trustee
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================

const IncomeExpenditurePage = () => {
  const navigate = useNavigate();

  // DATE FILTERS

  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);

  const [prevFrom, setPrevFrom] = useState(lastYearMonthStart);
  const [prevTo, setPrevTo] = useState(lastYearToday);

  // DATA

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const [church, setChurch] = useState({
    name: "",
    address: "",
    diocese: "",
  });

  // CHURCH DETAILS

  useEffect(() => {
    let active = true;

    getMyChurch()
      .then((res) => {
        if (!active) return;

        const c = res?.data ?? res ?? {};

        setChurch({
          name: c.name || "Church",
          address: c.full_address || c.address || "",
          diocese: c.diocese_name || "",
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // FETCH REPORT

  const fetchData = useCallback(async () => {
    if (!isValidDateString(dateFrom)) {
      setPageError("Please select a valid current period start date.");
      return;
    }

    if (!isValidDateString(dateTo)) {
      setPageError("Please select a valid current period end date.");
      return;
    }

    if (dateFrom > dateTo) {
      setPageError("Current period start date cannot be after end date.");
      return;
    }

    if (prevFrom && !isValidDateString(prevFrom)) {
      setPageError("Please select a valid previous period start date.");
      return;
    }

    if (prevTo && !isValidDateString(prevTo)) {
      setPageError("Please select a valid previous period end date.");
      return;
    }

    if (prevFrom && prevTo && prevFrom > prevTo) {
      setPageError("Previous period start date cannot be after end date.");
      return;
    }

    try {
      setLoading(true);
      setPageError("");

      const params = {
        from: dateFrom,
        to: dateTo,
      };

      if (prevFrom) params.prev_from = prevFrom;
      if (prevTo) params.prev_to = prevTo;

      const res = await getIncomeExpenditureStatutory(params);
      const result = res?.data ?? res ?? null;

      if (
        !result ||
        typeof result !== "object" ||
        !Array.isArray(result.income) ||
        !Array.isArray(result.expenditure)
      ) {
        throw new Error("Invalid report response.");
      }

      setData(result);
    } catch (err) {
      console.error("Income & Expenditure report error:", err);

      setPageError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to load report."
      );

      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, prevFrom, prevTo]);

  // AUTOMATIC FETCH

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // REPORT VALUES

  const incomeRows = data?.income || [];
  const expenditureRows = data?.expenditure || [];

  const totalIncome = Number(data?.total_income ?? 0);
  const totalExp = Number(data?.total_expenditure ?? 0);

  const net = Number(data?.net ?? totalIncome - totalExp);

  const isSurplus = data?.is_surplus ?? net >= 0;

  const hasData =
    data &&
    (incomeRows.length > 0 || expenditureRows.length > 0);

  // DATE INPUT HANDLERS

  const handleDateChange = (setter) => (event) => {
    setter(event.target.value);
  };

  // PAGE

  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Container
        maxW="1400px"
        px={{ base: 4, md: 5 }}
        py={4}
        flex="1"
      >
        {/* BREADCRUMB */}

        <HStack gap={2} mb={2} fontSize="12px">
          <Text
            color={BLUE}
            cursor="pointer"
            onClick={() => navigate("/reports")}
          >
            Reports
          </Text>

          <Text color="#A2ACBB">/</Text>

          <Text color={SECONDARY}>
            Income &amp; Expenditure
          </Text>
        </HStack>

        {/* PAGE HEADER */}

        <Flex
          justify="space-between"
          align="center"
          mb={4}
          wrap="wrap"
          gap={3}
        >
          <Box>
            <Text
              fontSize="11px"
              fontWeight="700"
              color={PRIMARY_RED}
              letterSpacing="0.4px"
              mb={1}
            >
              INCOME &amp; EXPENDITURE REPORT
            </Text>

            <Heading color={TEXT_COLOR} fontSize="24px">
              Income &amp; Expenditure Account
            </Heading>
          </Box>

          <HStack gap={3}>
            <Button
              variant="outline"
              h="40px"
              px={5}
              borderColor={PRIMARY_RED}
              color={PRIMARY_RED}
              onClick={() => setIsPrintOpen(true)}
              isDisabled={!hasData || loading}
            >
              Print
            </Button>
          </HStack>
        </Flex>

        {/* DATE FILTERS */}

        <Box
          border={`1px solid ${BORDER}`}
          borderRadius="10px"
          px={{ base: 4, md: 5 }}
          py={4}
          mb={4}
          bg="white"
        >
          <Flex
            gap={4}
            direction={{ base: "column", lg: "row" }}
            align={{ base: "stretch", lg: "flex-end" }}
            wrap="wrap"
          >
            {[
              {
                label: "Current — From",
                value: dateFrom,
                setter: setDateFrom,
              },
              {
                label: "Current — To",
                value: dateTo,
                setter: setDateTo,
              },
              {
                label: "Previous — From",
                value: prevFrom,
                setter: setPrevFrom,
              },
              {
                label: "Previous — To",
                value: prevTo,
                setter: setPrevTo,
              },
            ].map((item) => (
              <Box key={item.label} flex="1" minW="160px">
                <Text
                  fontSize="10px"
                  fontWeight="600"
                  color={TEXT_COLOR}
                  mb={1}
                >
                  {item.label}
                </Text>

                <Input
                  type="date"
                  value={item.value}
                  onChange={handleDateChange(item.setter)}
                  h="40px"
                  fontSize="12px"
                />
              </Box>
            ))}

            <Box>
              <Button
                h="40px"
                px={8}
                bg="white"
                border={`1px solid ${PRIMARY_RED}`}
                color={PRIMARY_RED}
                onClick={fetchData}
                isLoading={loading}
                loadingText="Loading"
              >
                Refresh
              </Button>
            </Box>
          </Flex>

          {pageError && (
            <Text
              color={PRIMARY_RED}
              fontSize="12px"
              mt={3}
              fontWeight="600"
            >
              {pageError}
            </Text>
          )}

          <Text fontSize="11px" color={SECONDARY} mt={3}>
            Current period: {formatDateDisplay(dateFrom)}
            {" "}to{" "}
            {formatDateDisplay(dateTo)}
          </Text>
        </Box>

        {/* REPORT CONTENT */}

        {loading ? (
          <Text textAlign="center" py={10}>
            Loading report...
          </Text>
        ) : !hasData ? (
          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="10px"
            py={14}
            textAlign="center"
          >
            <Text
              color={TEXT_COLOR}
              fontSize="15px"
              fontWeight="600"
            >
              No data for this period
            </Text>

            {!pageError && (
              <Text color={SECONDARY} fontSize="12px" mt={2}>
                Try selecting another date range.
              </Text>
            )}
          </Box>
        ) : (
          <>
            {/* REPORT TITLE */}

            <Box
              bg="#F7F9FB"
              borderBottom={`1px solid ${BORDER}`}
              borderTop={`1px solid ${BORDER}`}
              textAlign="center"
              py={3}
              mb={4}
              borderRadius="10px 10px 0 0"
            >
              <Text
                fontSize="14px"
                fontWeight="700"
                color={TEXT_COLOR}
                letterSpacing="0.6px"
              >
                INCOME &amp; EXPENDITURE STATEMENT
              </Text>
            </Box>

            {/* REPORT TABLES */}

            <ScreenStatutory
              incomeRows={incomeRows}
              expenditureRows={expenditureRows}
            />

            {/* NET BALANCE */}

            <Flex
              justify="flex-end"
              align="center"
              mt={4}
              pt={3}
              borderTop={`1px solid ${BORDER}`}
            >
              <HStack gap={3}>
                <Text
                  fontSize="13px"
                  fontWeight="700"
                  color={SECONDARY}
                  letterSpacing="0.4px"
                >
                  NET {isSurplus ? "SURPLUS" : "DEFICIT"}:
                </Text>

                <Text
                  fontSize="18px"
                  fontWeight="800"
                  color={isSurplus ? "#2E7D32" : PRIMARY_RED}
                >
                  {formatAmount(Math.abs(net))}
                </Text>
              </HStack>
            </Flex>
          </>
        )}
      </Container>

      <Footer />

      {/* PRINT MODAL */}

      <ChurchPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="INCOME & EXPENDITURE"
        subtitle={`Period: ${formatDateDisplay(dateFrom)} – ${formatDateDisplay(dateTo)}`}
        church={church}
        pdfFileName={`income-expenditure-${dateFrom}-to-${dateTo}.pdf`}
        defaultOrientation="portrait"
      >
        <PrintStatutory
          incomeRows={incomeRows}
          expenditureRows={expenditureRows}
          net={net}
          isSurplus={isSurplus}
          dateFrom={formatDateDisplay(dateFrom)}
          dateTo={formatDateDisplay(dateTo)}
        />
      </ChurchPrintModal>
    </Box>
  );
};

export default IncomeExpenditurePage;
