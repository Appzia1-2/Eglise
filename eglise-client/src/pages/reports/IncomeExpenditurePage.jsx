// src/pages/reports/IncomeExpenditurePage.jsx

import React, { useEffect, useMemo, useState } from "react";
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
import { getIncomeExpenditureReport } from "../../api/registryServices";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const BLUE = "#315AB5";
const LINK_BLUE = "#2B5CE6";

// ============================================================
// ICONS
// ============================================================
const ArrowLeftIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PrinterIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="6" y="14" width="12" height="8" stroke={color} strokeWidth="1.8" fill="none" />
  </svg>
);

const FilePdfIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <text x="12" y="17" textAnchor="middle" fontSize="6" fontWeight="700" fill={color}>PDF</text>
  </svg>
);

const ChevronDownIcon = ({ size = 14, color = SECONDARY_TEXT }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = ({ size = 16, color = BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="5" width="17" height="15" rx="2" stroke={color} strokeWidth="1.7" />
    <path d="M7 3v4M17 3v4M3.5 9.5h17" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

// Small triangle icon for expand / collapse
const TriangleIcon = ({ open = true, color = LINK_BLUE, size = 10 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 10 10"
    style={{
      transform: open ? "rotate(0deg)" : "rotate(-90deg)",
      transition: "transform 0.15s ease",
      display: "inline-block",
    }}
  >
    <polygon points="0,0 10,0 5,8" fill={color} />
  </svg>
);

const formatAmount = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const today = () => new Date().toISOString().split("T")[0];
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

// ============================================================
// RECURSIVE GROUP ROW (screen)
// ============================================================
const GroupRowRecursive = ({
  node,
  depth = 0,
  openMap,
  onToggle,
  showLedgers,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const hasLedgers =
    showLedgers && node.ledgers && node.ledgers.length > 0;
  const isExpandable = hasChildren || hasLedgers;

  const defaultOpen = true;
  const isOpen =
    openMap[node.group_name] !== undefined
      ? openMap[node.group_name]
      : defaultOpen;

  const indentLeft = 12 + depth * 18;
  const fontSize =
    depth === 0 ? "12px" : depth === 1 ? "11.5px" : "11px";
  const fontWeight = depth <= 1 ? "700" : "600";
  const color = depth <= 1 ? LINK_BLUE : TEXT_COLOR;

  return (
    <>
      <Box as="tr" bg="white" borderBottom={`1px solid ${BORDER_COLOR}`}>
        <Box as="td" px={3} py={2.5} pl={`${indentLeft}px`}>
          <HStack gap={2} align="center">
            {isExpandable ? (
              <Box
                as="span"
                role="button"
                tabIndex={0}
                onClick={() => onToggle(node.group_name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle(node.group_name);
                  }
                }}
                cursor="pointer"
                userSelect="none"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                w="14px"
                h="14px"
                _hover={{ opacity: 0.7 }}
              >
                <TriangleIcon open={isOpen} color={LINK_BLUE} />
              </Box>
            ) : (
              <Box width="14px" flexShrink={0} />
            )}
            <Text
              fontSize={fontSize}
              fontWeight={fontWeight}
              color={color}
              letterSpacing="0.2px"
            >
              {node.group_name}
            </Text>
          </HStack>
        </Box>
        <Box as="td" px={3} py={2.5} textAlign="right">
          <Text fontSize={fontSize} fontWeight={fontWeight} color={TEXT_COLOR}>
            {formatAmount(node.amount)}
          </Text>
        </Box>
      </Box>

      {isOpen &&
        hasLedgers &&
        node.ledgers.map((led, i) => (
          <Box
            as="tr"
            key={`${node.group_name}-led-${led.ledger_name}-${i}`}
            bg="#FAFBFC"
            borderBottom={`1px solid ${BORDER_COLOR}`}
          >
            <Box as="td" px={3} py={2} pl={`${indentLeft + 32}px`}>
              <Text fontSize="11px" color={SECONDARY_TEXT}>
                {led.ledger_name}
              </Text>
            </Box>
            <Box as="td" px={3} py={2} textAlign="right">
              <Text fontSize="11px" color={SECONDARY_TEXT}>
                {formatAmount(led.amount)}
              </Text>
            </Box>
          </Box>
        ))}

      {isOpen &&
        hasChildren &&
        node.children.map((child, i) => (
          <GroupRowRecursive
            key={`${node.group_name}-${child.group_name}-${i}`}
            node={child}
            depth={depth + 1}
            openMap={openMap}
            onToggle={onToggle}
            showLedgers={showLedgers}
          />
        ))}
    </>
  );
};

// ============================================================
// GRAND ROW (screen)
// ============================================================
const GrandRow = ({ label, amount, bold = false }) => (
  <Box
    as="tr"
    bg={bold ? "#F5CED8" : "#F0F4FA"}
    borderTop={bold ? `2px solid ${BORDER_COLOR}` : "none"}
    borderBottom={`1px solid ${BORDER_COLOR}`}
  >
    <Box as="td" px={3} py={3}>
      <Text
        fontSize="12px"
        fontWeight="700"
        color={bold ? DARK_RED : LINK_BLUE}
        letterSpacing="0.3px"
      >
        {label}
      </Text>
    </Box>
    <Box as="td" px={3} py={3} textAlign="right">
      <Text
        fontSize="12px"
        fontWeight="700"
        color={bold ? DARK_RED : TEXT_COLOR}
      >
        {formatAmount(amount)}
      </Text>
    </Box>
  </Box>
);

// ============================================================
// ONE SIDE (Income / Expenditure) — screen
// ============================================================
const ReportSide = ({ title, groups, openMap, onToggle, showLedgers }) => (
  <Box as="table" width="100%" borderCollapse="collapse">
    <Box as="thead">
      <Box as="tr" bg="#F7F9FB" borderBottom={`1px solid ${BORDER_COLOR}`}>
        <Box as="th" px={3} py={3} textAlign="left">
          <Text
            fontSize="12px"
            fontWeight="700"
            color={TEXT_COLOR}
            letterSpacing="0.4px"
          >
            {title}
          </Text>
        </Box>
        <Box as="th" px={3} py={3} textAlign="right" width="180px">
          <Text
            fontSize="12px"
            fontWeight="700"
            color={TEXT_COLOR}
            letterSpacing="0.4px"
          >
            Amount (₹)
          </Text>
        </Box>
      </Box>
    </Box>
    <Box as="tbody">
      {groups.map((g, i) => (
        <GroupRowRecursive
          key={`${title}-${g.group_name}-${i}`}
          node={g}
          depth={0}
          openMap={openMap}
          onToggle={onToggle}
          showLedgers={showLedgers}
        />
      ))}
    </Box>
  </Box>
);

// ============================================================
// PRINT-ONLY ROW COMPONENTS (static, no toggles)
// ============================================================
const PrintGroupRows = ({ node, depth = 0, showLedgers }) => {
  const hasChildren = node.children && node.children.length > 0;
  const hasLedgers =
    showLedgers && node.ledgers && node.ledgers.length > 0;

  const indentLeft = 8 + depth * 16;
  const fontSize =
    depth === 0 ? "11px" : depth === 1 ? "10.5px" : "10px";
  const fontWeight = depth <= 1 ? "700" : "600";
  const color = depth <= 1 ? DARK_RED : TEXT_COLOR;

  return (
    <>
      <tr style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
        <td style={{ padding: "6px 8px", paddingLeft: `${indentLeft}px` }}>
          <span
            style={{
              fontSize,
              fontWeight,
              color,
              fontFamily: "Georgia, serif",
            }}
          >
            {node.group_name}
          </span>
        </td>
        <td style={{ padding: "6px 8px", textAlign: "right" }}>
          <span
            style={{
              fontSize,
              fontWeight,
              color: TEXT_COLOR,
              fontFamily: "Georgia, serif",
            }}
          >
            {formatAmount(node.amount)}
          </span>
        </td>
      </tr>

      {hasLedgers &&
        node.ledgers.map((led, i) => (
          <tr
            key={`${node.group_name}-led-${led.ledger_name}-${i}`}
            style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
          >
            <td
              style={{
                padding: "4px 8px",
                paddingLeft: `${indentLeft + 28}px`,
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  color: SECONDARY_TEXT,
                  fontFamily: "Georgia, serif",
                }}
              >
                {led.ledger_name}
              </span>
            </td>
            <td style={{ padding: "4px 8px", textAlign: "right" }}>
              <span
                style={{
                  fontSize: "10px",
                  color: SECONDARY_TEXT,
                  fontFamily: "Georgia, serif",
                }}
              >
                {formatAmount(led.amount)}
              </span>
            </td>
          </tr>
        ))}

      {hasChildren &&
        node.children.map((child, i) => (
          <PrintGroupRows
            key={`${node.group_name}-${child.group_name}-${i}`}
            node={child}
            depth={depth + 1}
            showLedgers={showLedgers}
          />
        ))}
    </>
  );
};

const PrintGrandRow = ({ label, amount, bold = false }) => (
  <tr
    style={{
      background: bold ? "#F5CED8" : "#F0F4FA",
      borderTop: bold ? `2px solid ${BORDER_COLOR}` : "none",
      borderBottom: `1px solid ${BORDER_COLOR}`,
    }}
  >
    <td style={{ padding: "8px" }}>
      <span
        style={{
          fontSize: "11px",
          fontWeight: "700",
          color: bold ? DARK_RED : LINK_BLUE,
          fontFamily: "Georgia, serif",
        }}
      >
        {label}
      </span>
    </td>
    <td style={{ padding: "8px", textAlign: "right" }}>
      <span
        style={{
          fontSize: "11px",
          fontWeight: "700",
          color: bold ? DARK_RED : TEXT_COLOR,
          fontFamily: "Georgia, serif",
        }}
      >
        {formatAmount(amount)}
      </span>
    </td>
  </tr>
);

// ============================================================
// PRINT CONTENT COMPONENT
// ============================================================
const PrintContent = ({
  incomeGroups,
  expenditureGroups,
  totalIncome,
  totalExpenditure,
  net,
  isSurplus,
  isDetailed,
}) => (
  <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
    {/* Two-column layout */}
    <div
      style={{
        display: "flex",
        gap: "0",
        border: `1px solid ${BORDER_COLOR}`,
      }}
    >
      {/* INCOME SIDE */}
      <div style={{ flex: 1, borderRight: `1px solid ${BORDER_COLOR}` }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "Georgia, serif",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#F7F9FB",
                borderBottom: `1px solid ${BORDER_COLOR}`,
              }}
            >
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: TEXT_COLOR,
                  fontFamily: "Georgia, serif",
                }}
              >
                Income
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "right",
                  width: "120px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: TEXT_COLOR,
                  fontFamily: "Georgia, serif",
                }}
              >
                Amount (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {incomeGroups.map((g, i) => (
              <PrintGroupRows
                key={`inc-${g.group_name}-${i}`}
                node={g}
                depth={0}
                showLedgers={isDetailed}
              />
            ))}
          </tbody>
          <tfoot>
            <PrintGrandRow label="TOTAL INCOME" amount={totalIncome} />
          </tfoot>
        </table>
      </div>

      {/* EXPENDITURE SIDE */}
      <div style={{ flex: 1 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "Georgia, serif",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#F7F9FB",
                borderBottom: `1px solid ${BORDER_COLOR}`,
              }}
            >
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: TEXT_COLOR,
                  fontFamily: "Georgia, serif",
                }}
              >
                Expenditure
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "right",
                  width: "120px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: TEXT_COLOR,
                  fontFamily: "Georgia, serif",
                }}
              >
                Amount (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {expenditureGroups.map((g, i) => (
              <PrintGroupRows
                key={`exp-${g.group_name}-${i}`}
                node={g}
                depth={0}
                showLedgers={isDetailed}
              />
            ))}
          </tbody>
          <tfoot>
            <PrintGrandRow
              label="TOTAL EXPENDITURE"
              amount={totalExpenditure}
            />
            <PrintGrandRow
              label={
                isSurplus
                  ? "SURPLUS OF INCOME OVER EXPENDITURE"
                  : "DEFICIT OF EXPENDITURE OVER INCOME"
              }
              amount={Math.abs(net)}
            />
            <PrintGrandRow label="TOTAL" amount={totalIncome} bold />
          </tfoot>
        </table>
      </div>
    </div>

    {/* Net summary line */}
    <div
      style={{
        marginTop: "16px",
        padding: "10px 16px",
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: "6px",
        background: "#F8FAFC",
        textAlign: "center",
        fontFamily: "Georgia, serif",
      }}
    >
      <span
        style={{ fontSize: "11px", fontWeight: "600", color: TEXT_COLOR }}
      >
        Net {isSurplus ? "Surplus" : "Deficit"}:{" "}
      </span>
      <span
        style={{ fontSize: "12px", fontWeight: "700", color: PRIMARY_RED }}
      >
        {formatAmount(Math.abs(net))}
      </span>
      <span style={{ fontSize: "11px", color: SECONDARY_TEXT }}>
        {" "}
        — {isSurplus ? "Income exceeds expenditure" : "Expenditure exceeds income"}
      </span>
    </div>
  </div>
);

// ============================================================
// PAGE
// ============================================================
const IncomeExpenditurePage = () => {
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());
  const [displayMode, setDisplayMode] = useState("Summary");
  const [openMap, setOpenMap] = useState({});

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  // Print modal state
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Church details — replace with your actual source (context, API, redux, etc.)
  const church = {
    name: "Church Name",
    address: "123 Church Street",
    city: "City",
    state: "State",
    postal_code: "000000",
  };

  const toggle = (name) =>
    setOpenMap((p) => ({
      ...p,
      [name]: p[name] === false ? true : false,
    }));

  const fetchData = async () => {
    try {
      setLoading(true);
      setPageError("");
      const res = await getIncomeExpenditureReport({
        from: dateFrom,
        to: dateTo,
        mode: displayMode,
      });
      setData(res?.data ?? null);
    } catch (err) {
      console.error("Income & Expenditure fetch error:", err);
      setPageError("Unable to load report.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, displayMode]);

  const incomeGroups = data?.income || [];
  const expenditureGroups = data?.expenditure || [];
  const totalIncome = data?.total_income || 0;
  const totalExpenditure = data?.total_expenditure || 0;
  const net = data?.net_surplus || 0;
  const isSurplus = data?.is_surplus ?? true;

  const isDetailed = displayMode === "Detailed";

  const countNodes = (nodes) =>
    nodes.reduce(
      (s, n) =>
        s + 1 + countNodes(n.children || []) + (n.ledgers?.length || 0),
      0
    );

  const groupCount =
    countNodes(incomeGroups) + countNodes(expenditureGroups);

  const hasData =
    data && (incomeGroups.length > 0 || expenditureGroups.length > 0);

  // Open the print modal
  const handleOpenPrint = () => {
    if (!hasData) return;
    setIsPrintOpen(true);
  };

  // Subtitle shown inside the church print modal
  const printSubtitle = (
    <>
      Period: {formatDateDisplay(dateFrom)} – {formatDateDisplay(dateTo)}
      {isDetailed ? " • Detailed" : " • Summary"}
    </>
  );

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 4, md: 5 }} py={4} flex="1">
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
          <Text color={SECONDARY_TEXT}>
            Income &amp; Expenditure{isDetailed ? "" : " Summary"}
          </Text>
        </HStack>

        {/* HEADER */}
        <Flex
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={4}
          mb={4}
        >
          <Box>
            <Text
              fontSize="11px"
              fontWeight="700"
              color={PRIMARY_RED}
              letterSpacing="0.4px"
              mb={1}
            >
              INCOME &amp; EXPENDITURE{isDetailed ? "" : " SUMMARY"} REPORT
            </Text>
            <Heading
              color={TEXT_COLOR}
              fontSize={{ base: "22px", md: "26px" }}
              mb={1}
            >
              Income &amp; Expenditure{isDetailed ? "" : " Summary"}
            </Heading>
            <Text color={SECONDARY_TEXT} fontSize="12px">
              View income earned and expenditure incurred by ledger group and account.
            </Text>
          </Box>

          <HStack gap={3} flexWrap="wrap">
            <Button
              variant="outline"
              h="40px"
              px={5}
              borderColor={PRIMARY_RED}
              color={PRIMARY_RED}
              borderRadius="6px"
              fontSize="12px"
              fontWeight="600"
              onClick={() => navigate("/reports")}
              _hover={{ bg: "#FFF5F7" }}
              leftIcon={<ArrowLeftIcon />}
            >
              Back
            </Button>
            <Button
              variant="outline"
              h="40px"
              px={5}
              borderColor={PRIMARY_RED}
              color={PRIMARY_RED}
              borderRadius="6px"
              fontSize="12px"
              fontWeight="600"
              onClick={handleOpenPrint}
              isDisabled={!hasData}
              _hover={{ bg: "#FFF5F7" }}
              leftIcon={<PrinterIcon />}
            >
              Print
            </Button>
            <Button
              variant="outline"
              h="40px"
              px={5}
              borderColor={PRIMARY_RED}
              color={PRIMARY_RED}
              borderRadius="6px"
              fontSize="12px"
              fontWeight="600"
              onClick={handleOpenPrint}
              isDisabled={!hasData}
              _hover={{ bg: "#FFF5F7" }}
              leftIcon={<FilePdfIcon />}
            >
              Generate PDF
            </Button>
          </HStack>
        </Flex>

        {/* FILTERS */}
        <Box
          border={`1px solid ${BORDER_COLOR}`}
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
            <Box flex="1" minW="170px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Date From
              </Text>
              <Box position="relative">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  h="40px"
                  fontSize="12px"
                  borderColor={BORDER_COLOR}
                  borderRadius="6px"
                  color={TEXT_COLOR}
                />
                <Box
                  position="absolute"
                  right="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                >
                  <CalendarIcon />
                </Box>
              </Box>
            </Box>

            <Box flex="1" minW="170px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Date To
              </Text>
              <Box position="relative">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  h="40px"
                  fontSize="12px"
                  borderColor={BORDER_COLOR}
                  borderRadius="6px"
                  color={TEXT_COLOR}
                />
                <Box
                  position="absolute"
                  right="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                >
                  <CalendarIcon />
                </Box>
              </Box>
            </Box>

            <Box flex="1" minW="180px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Display Mode
              </Text>
              <Box position="relative">
                <Box
                  as="select"
                  value={displayMode}
                  onChange={(e) => setDisplayMode(e.target.value)}
                  width="100%"
                  height="40px"
                  fontSize="12px"
                  color={TEXT_COLOR}
                  border={`1px solid ${BORDER_COLOR}`}
                  borderRadius="6px"
                  bg="white"
                  appearance="none"
                  px="11px"
                  outline="none"
                  cursor="pointer"
                >
                  <option value="Summary">Summary</option>
                  <option value="Detailed">Detailed</option>
                </Box>
                <Box
                  position="absolute"
                  right="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                >
                  <ChevronDownIcon />
                </Box>
              </Box>
            </Box>

            <Box flexShrink={0}>
              <Button
                h="40px"
                px={10}
                bg="white"
                border={`1px solid ${PRIMARY_RED}`}
                color={PRIMARY_RED}
                fontSize="12px"
                fontWeight="600"
                borderRadius="6px"
                onClick={fetchData}
                _hover={{ bg: "#FFF5F7" }}
              >
                Filter
              </Button>
            </Box>
          </Flex>
        </Box>

        {/* ERROR */}
        {pageError && (
          <Box
            mb={4}
            p={3}
            borderRadius="6px"
            bg="#FFF5F5"
            border="1px solid #FED7D7"
          >
            <Text color="red.600" fontSize="12px">
              {pageError}
            </Text>
          </Box>
        )}

        {/* BODY */}
        {loading ? (
          <Box
            border={`1px solid ${BORDER_COLOR}`}
            borderRadius="10px"
            py={14}
            textAlign="center"
          >
            <Text color={SECONDARY_TEXT} fontSize="12px">
              Loading…
            </Text>
          </Box>
        ) : !hasData ? (
          <Box
            border={`1px solid ${BORDER_COLOR}`}
            borderRadius="10px"
            py={14}
            textAlign="center"
          >
            <Text color={TEXT_COLOR} fontSize="15px" fontWeight="600">
              No data for this period
            </Text>
            <Text color={SECONDARY_TEXT} fontSize="12px" mt={1}>
              Adjust the date range or post entries.
            </Text>
          </Box>
        ) : (
          <Box
            border={`1px solid ${BORDER_COLOR}`}
            borderRadius="10px"
            overflow="hidden"
          >
            <Box
              bg="#F7F9FB"
              borderBottom={`1px solid ${BORDER_COLOR}`}
              textAlign="center"
              py={3}
            >
              <Text
                fontSize="14px"
                fontWeight="700"
                color={TEXT_COLOR}
                letterSpacing="0.6px"
              >
                INCOME &amp; EXPENDITURE {isDetailed ? "STATEMENT" : "SUMMARY"}
              </Text>
            </Box>

            <Flex direction={{ base: "column", lg: "row" }}>
              {/* INCOME SIDE */}
              <Box
                flex="1"
                borderRight={{
                  base: "none",
                  lg: `1px solid ${BORDER_COLOR}`,
                }}
                borderBottom={{
                  base: `1px solid ${BORDER_COLOR}`,
                  lg: "none",
                }}
              >
                <ReportSide
                  title="Income"
                  groups={incomeGroups}
                  openMap={openMap}
                  onToggle={toggle}
                  showLedgers={isDetailed}
                />
                <Box borderTop={`1px solid ${BORDER_COLOR}`}>
                  <Box as="table" width="100%" borderCollapse="collapse">
                    <Box as="tbody">
                      <GrandRow label="TOTAL INCOME" amount={totalIncome} />
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* EXPENDITURE SIDE */}
              <Box flex="1">
                <ReportSide
                  title="Expenditure"
                  groups={expenditureGroups}
                  openMap={openMap}
                  onToggle={toggle}
                  showLedgers={isDetailed}
                />
                <Box borderTop={`1px solid ${BORDER_COLOR}`}>
                  <Box as="table" width="100%" borderCollapse="collapse">
                    <Box as="tbody">
                      <GrandRow
                        label="TOTAL EXPENDITURE"
                        amount={totalExpenditure}
                      />
                      <GrandRow
                        label={
                          isSurplus
                            ? "SURPLUS OF INCOME OVER EXPENDITURE"
                            : "DEFICIT OF EXPENDITURE OVER INCOME"
                        }
                        amount={Math.abs(net)}
                      />
                      <GrandRow label="TOTAL" amount={totalIncome} bold />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Flex>
          </Box>
        )}

        {/* NET SUMMARY BAR */}
        <Flex
          mt={4}
          px={5}
          py={3}
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="8px"
          bg="#F8FAFC"
          align="center"
          justify="center"
          gap={3}
          wrap="wrap"
        >
          <Text fontSize="12px" color={TEXT_COLOR} fontWeight="600">
            Net {isSurplus ? "Surplus" : "Deficit"}:
          </Text>
          <Text fontSize="13px" color={PRIMARY_RED} fontWeight="700">
            {formatAmount(Math.abs(net))}
          </Text>
          <Box width="5px" height="5px" borderRadius="50%" bg={SECONDARY_TEXT} />
          <Text fontSize="12px" color={SECONDARY_TEXT}>
            {isSurplus
              ? "Income exceeds expenditure"
              : "Expenditure exceeds income"}
          </Text>
        </Flex>

        {/* FOOTER */}
        <Flex
          mt={4}
          justify="space-between"
          align="center"
          direction={{ base: "column", md: "row" }}
          gap={2}
        >
          <Text color={SECONDARY_TEXT} fontSize="12px">
            Showing 1–{groupCount} of {groupCount} ledger groups
          </Text>
        </Flex>
      </Container>

      {/* ============================================================ */}
      {/* CHURCH PRINT MODAL — shared across all reports               */}
      {/* ============================================================ */}
      <ChurchPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={`INCOME & EXPENDITURE ${isDetailed ? "STATEMENT" : "SUMMARY"}`}
        subtitle={printSubtitle}
        church={church}
        pdfFileName={`income-expenditure-${dateFrom}-to-${dateTo}.pdf`}
        orientation="portrait"
      >
        <PrintContent
          incomeGroups={incomeGroups}
          expenditureGroups={expenditureGroups}
          totalIncome={totalIncome}
          totalExpenditure={totalExpenditure}
          net={net}
          isSurplus={isSurplus}
          isDetailed={isDetailed}
        />
      </ChurchPrintModal>

      <Footer />
    </Box>
  );
};

export default IncomeExpenditurePage;