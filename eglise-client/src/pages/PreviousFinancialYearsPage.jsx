// src/pages/PreviousFinancialYearsPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  Spinner,
} from "@chakra-ui/react";
import {
  LuHouse,
  LuArrowLeft,
  LuCalendarCheck,
  LuBookOpen,
  LuShieldCheck,
  LuSearch,
  LuListFilter,
  LuChevronDown,
  LuLock,
  LuEye,
  LuInfo,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listFinancialYears } from "../api/registryServices";
import { toaster } from "../components/ui/toaster";

// ============================================================
// THEME CONSTANTS (matched to screenshot)
// ============================================================
const RED = "#E31B23";
const RED_HOVER = "#C4141B";
const RED_SOFT = "#FFF0F0";
const PINK = "#FDE9EC";
const BLUE = "#1D3FD8";
const NAVY = "#1C2B6B";
const MUTED = "#5F6F8F";
const BORDER = "#E3E8F0";
const INPUT_BORDER = "#C9D3E3";
const GREEN = "#1E9E3E";

const PAGE_SIZE = 10;

const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

// ------------------------------------------------------------
// Reusable pieces
// ------------------------------------------------------------
const FieldLabel = ({ children }) => (
  <Text fontSize="12px" fontWeight="500" color={NAVY} mb="6px" lineHeight="1.2">
    {children}
  </Text>
);

const FilterSelect = ({ value, onChange, children }) => (
  <Box position="relative" h="38px">
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        height: "38px",
        padding: "0 40px 0 16px",
        border: `1px solid ${INPUT_BORDER}`,
        borderRadius: "3px",
        fontSize: "13px",
        color: BLUE,
        background: "white",
        outline: "none",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        cursor: "pointer",
      }}
    >
      {children}
    </select>
    <Icon
      as={LuChevronDown}
      position="absolute"
      right="14px"
      top="50%"
      transform="translateY(-50%)"
      boxSize={4}
      color={BLUE}
      pointerEvents="none"
    />
  </Box>
);

const BannerCell = ({ divider, children, ...rest }) => (
  <Flex align="center" position="relative" minH="88px" {...rest}>
    {divider && (
      <Box
        display={{ base: "none", lg: "block" }}
        position="absolute"
        left="0"
        top="50%"
        transform="translateY(-50%)"
        w="1px"
        h="28px"
        bg={BORDER}
      />
    )}
    {children}
  </Flex>
);

const thStyle = {
  textAlign: "center",
  padding: "10px 12px",
  fontSize: "14px",
  fontWeight: "500",
  color: NAVY,
  border: `1px solid ${BORDER}`,
  background: "white",
};

const tdStyle = {
  textAlign: "center",
  padding: "8px 12px",
  fontSize: "14px",
  color: BLUE,
  border: `1px solid ${BORDER}`,
  height: "46px",
};

// ============================================================
// PAGE
// ============================================================
const PreviousFinancialYearsPage = () => {
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [currentYear, setCurrentYear] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [booksFilter, setBooksFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        setLoading(true);
        const res = await listFinancialYears();
        const data = res?.data || [];
        setCurrentYear(data.find((y) => y.is_current) || null);
        setYears(data.filter((y) => !y.is_current));
      } catch (err) {
        toaster.create({ title: "Failed to load financial years", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchYears();
  }, []);

  // Previous years are locked unless the API says otherwise
  const isLocked = (y) => y.is_locked !== false;

  const filteredYears = years
    .filter((y) => {
      const matchesSearch = (y.name || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "closed" && y.is_closed) ||
        (statusFilter === "archived" && !y.is_closed);
      const matchesBooks =
        booksFilter === "all" ||
        (booksFilter === "locked" && isLocked(y)) ||
        (booksFilter === "open" && !isLocked(y));
      return matchesSearch && matchesStatus && matchesBooks;
    })
    .sort((a, b) => {
      const da = new Date(a.start_date).getTime() || 0;
      const db = new Date(b.start_date).getTime() || 0;
      return sortBy === "newest" ? db - da : da - db;
    });

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setBooksFilter("all");
    setSortBy("newest");
    setPage(1);
  };

  // ---------------- Pagination ----------------
  const totalItems = filteredYears.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageRows = filteredYears.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + pageRows.length, totalItems);

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%" px={{ base: 4, md: "27px" }} py={5}>
        {/* Breadcrumb */}
        <HStack gap={3} mb={3} fontSize="15px" color={BLUE} flexWrap="wrap">
          <Icon as={LuHouse} boxSize={5} />
          <Text cursor="pointer" onClick={() => navigate("/")}>
            Home
          </Text>
          <Text color={MUTED}>/</Text>
          <Text cursor="pointer" onClick={() => navigate("/settings")}>
            Settings
          </Text>
          <Text color={MUTED}>/</Text>
          <Text cursor="pointer" onClick={() => navigate("/financial-years/settings")}>
            Financial Year
          </Text>
          <Text color={MUTED}>/</Text>
          <Text>Previous Years</Text>
        </HStack>

        {/* Header */}
        <Flex justify="space-between" align="flex-start" gap={4} mb={3}>
          <Box>
            <Text fontSize="14px" color={RED} letterSpacing="0.2px" lineHeight="1.3">
              FINANCIAL SETTINGS
            </Text>
            <Heading
              color={BLUE}
              fontSize={{ base: "22px", md: "28px" }}
              fontWeight="600"
              lineHeight="1.2"
              mb="2px"
            >
              Previous Financial Years
            </Heading>
            <Text color={BLUE} fontSize="13px">
              Review closed and archived accounting periods.
            </Text>
          </Box>
          <Button
            variant="outline"
            bg="white"
            borderColor={RED}
            color={RED}
            h="42px"
            px={6}
            borderRadius="4px"
            fontSize="14px"
            fontWeight="500"
            onClick={() => navigate("/financial-years/settings")}
            _hover={{ bg: RED_SOFT }}
          >
            <Icon as={LuArrowLeft} boxSize={5} />
            Back to Settings
          </Button>
        </Flex>

        {/* Current year banner */}
        {currentYear && (
          <Box
            bg="white"
            border={`1px solid ${BORDER}`}
            borderRadius="4px"
            mb="14px"
            display="grid"
            gridTemplateColumns={{ base: "1fr", lg: "416px 138px 205px 1fr" }}
          >
            <BannerCell pl="20px" gap={4} py={2}>
              <Flex w="66px" h="66px" borderRadius="full" bg={PINK} align="center" justify="center" flexShrink={0}>
                <Icon as={LuCalendarCheck} boxSize={7} color={RED} />
              </Flex>
              <Box>
                <Text fontSize="14px" color={NAVY} lineHeight="1.2">
                  Current Financial Year
                </Text>
                <Text fontSize="26px" fontWeight="700" color={BLUE} lineHeight="1.15">
                  {currentYear.name}
                </Text>
                <Text fontSize="13px" color={BLUE} lineHeight="1.3">
                  {fmtDate(currentYear.start_date)} – {fmtDate(currentYear.end_date)}
                </Text>
              </Box>
            </BannerCell>

            <BannerCell divider justify="center" gap={3}>
              <Box w="14px" h="14px" borderRadius="full" bg={GREEN} />
              <Text fontSize="14px" color={GREEN}>
                Active
              </Text>
            </BannerCell>

            <BannerCell divider justify="center">
              <HStack gap={3} px={4} h="30px" border={`1px solid ${GREEN}`} borderRadius="3px" color={GREEN} bg="white">
                <Icon as={LuBookOpen} boxSize={5} />
                <Text fontSize="14px">Books Open</Text>
              </HStack>
            </BannerCell>

            <BannerCell divider pl="30px" gap={3}>
              <Icon as={LuShieldCheck} boxSize={6} color={NAVY} />
              <Text fontSize="14px" color={NAVY}>
                Current Year
              </Text>
            </BannerCell>
          </Box>
        )}

        {/* Filter panel */}
        <Box
          bg="#FAFCFF"
          border={`1px solid ${BORDER}`}
          borderRadius="4px"
          px="24px"
          pt="18px"
          pb="20px"
          mb="14px"
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            md: "1fr 1fr",
            lg: "1.23fr 1fr 1fr 0.96fr 136px",
          }}
          gap={{ base: 4, lg: "40px" }}
          alignItems="end"
        >
          <Box>
            <FieldLabel>Search Financial Year</FieldLabel>
            <HStack
              h="38px"
              px={3}
              gap={3}
              bg="white"
              border={`1px solid ${INPUT_BORDER}`}
              borderRadius="3px"
            >
              <Icon as={LuSearch} boxSize={5} color={BLUE} flexShrink={0} />
              <input
                placeholder="Search by year"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: "13px",
                  color: NAVY,
                  background: "transparent",
                }}
              />
            </HStack>
          </Box>

          <Box>
            <FieldLabel>Status</FieldLabel>
            <FilterSelect
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </FilterSelect>
          </Box>

          <Box>
            <FieldLabel>Books Status</FieldLabel>
            <FilterSelect
              value={booksFilter}
              onChange={(e) => {
                setBooksFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Books</option>
              <option value="locked">Locked</option>
              <option value="open">Open</option>
            </FilterSelect>
          </Box>

          <Box>
            <FieldLabel>Sort By</FieldLabel>
            <FilterSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </FilterSelect>
          </Box>

          <Button
            variant="outline"
            bg="white"
            borderColor={RED}
            color={RED}
            h="42px"
            borderRadius="3px"
            fontSize="14px"
            fontWeight="500"
            _hover={{ bg: RED_SOFT }}
            onClick={resetFilters}
          >
            <Icon as={LuListFilter} boxSize={5} />
            Filter
          </Button>
        </Box>

        {/* Table card */}
        <Box border={`1px solid ${BORDER}`} borderRadius="4px" overflow="hidden" bg="white">
          <Box py="10px" textAlign="center" borderBottom={`1px solid ${BORDER}`}>
            <Text fontSize="17px" fontWeight="500" color={BLUE} letterSpacing="0.2px">
              FINANCIAL YEAR HISTORY
            </Text>
          </Box>

          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner color={RED} />
            </Flex>
          ) : (
            <Box overflowX="auto">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "950px",
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  <col style={{ width: "13.5%" }} />
                  <col style={{ width: "18.2%" }} />
                  <col style={{ width: "11.5%" }} />
                  <col style={{ width: "12.3%" }} />
                  <col style={{ width: "10.8%" }} />
                  <col style={{ width: "14.7%" }} />
                  <col style={{ width: "19%" }} />
                </colgroup>
                <thead>
                  <tr>
                    {[
                      "Financial Year",
                      "Accounting Period",
                      "Status",
                      "Books Status",
                      "Closed On",
                      "Closed By",
                      "Action",
                    ].map((h) => (
                      <th key={h} style={{ ...thStyle, borderTop: "none" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: "24px",
                          color: MUTED,
                          fontSize: "13px",
                          border: `1px solid ${BORDER}`,
                        }}
                      >
                        No previous financial years found.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((year) => (
                      <tr key={year.id}>
                        <td style={{ ...tdStyle, fontWeight: "600" }}>{year.name}</td>
                        <td style={tdStyle}>
                          {fmtDate(year.start_date)} – {fmtDate(year.end_date)}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              minWidth: year.is_closed ? "58px" : "76px",
                              padding: "3px 10px",
                              borderRadius: "3px",
                              fontSize: "13px",
                              border: `1px solid ${year.is_closed ? RED : BLUE}`,
                              color: year.is_closed ? RED : BLUE,
                              backgroundColor: "white",
                            }}
                          >
                            {year.is_closed ? "Closed" : "Archived"}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: NAVY }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <LuLock size={18} color={BLUE} />
                            {isLocked(year) ? "Locked" : "Open"}
                          </span>
                        </td>
                        <td style={tdStyle}>{year.closed_on ? fmtDate(year.closed_on) : "—"}</td>
                        <td style={tdStyle}>{year.closed_by || "Parish Administrator"}</td>
                        <td style={tdStyle}>
                          <Button
                            h="30px"
                            px={3}
                            bg="white"
                            variant="outline"
                            borderColor={RED}
                            color={RED}
                            fontSize="13px"
                            fontWeight="500"
                            borderRadius="3px"
                            _hover={{ bg: RED_SOFT }}
                            onClick={() => navigate(`/financial-years/${year.id}`)}
                          >
                            <Icon as={LuEye} boxSize={5} />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Box>
          )}
        </Box>

        {/* Info bar */}
        <Flex
          align="center"
          gap={4}
          bg="#EAF0FB"
          border="1px solid #D3DEF3"
          borderRadius="4px"
          px="24px"
          minH="48px"
          mt="14px"
          color={BLUE}
          fontSize="14px"
          flexWrap="wrap"
        >
          <Icon as={LuInfo} boxSize={6} strokeWidth={1.5} />
          <Text>Previous financial years are read-only</Text>
          <Box w="6px" h="6px" borderRadius="full" bg={BLUE} mx={2} />
          <Text>Existing accounting records remain preserved</Text>
        </Flex>

        {/* Pagination */}
        <Flex
          mt="14px"
          align="center"
          justify="space-between"
          direction={{ base: "column", md: "row" }}
          gap={3}
        >
          <Text color={BLUE} fontSize="14px">
            Showing {showingFrom}–{showingTo} of {totalItems} financial years
          </Text>

          <HStack gap={5}>
            <Box
              as="button"
              color={BLUE}
              fontSize="14px"
              cursor={safePage === 1 ? "default" : "pointer"}
              opacity={safePage === 1 ? 0.5 : 1}
              onClick={() => safePage > 1 && setPage(safePage - 1)}
            >
              Previous
            </Box>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Flex
                key={p}
                as="button"
                w="34px"
                h="32px"
                align="center"
                justify="center"
                borderRadius="3px"
                fontSize="14px"
                fontWeight="700"
                bg={safePage === p ? RED : "white"}
                color={safePage === p ? "white" : BLUE}
                onClick={() => setPage(p)}
                _hover={{ bg: safePage === p ? RED_HOVER : "#F8FAFC" }}
              >
                {p}
              </Flex>
            ))}
            <Box
              as="button"
              color={BLUE}
              fontSize="14px"
              mr={3}
              cursor={safePage === totalPages ? "default" : "pointer"}
              opacity={safePage === totalPages ? 0.5 : 1}
              onClick={() => safePage < totalPages && setPage(safePage + 1)}
            >
              Next
            </Box>
          </HStack>
        </Flex>
      </Box>

      <Footer />
    </Box>
  );
};

export default PreviousFinancialYearsPage;