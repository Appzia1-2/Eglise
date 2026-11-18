// src/pages/ContraListPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";

import {
  LuChevronLeft,
  LuChevronRight,
  LuPencil,
  LuPlus,
  LuSearch,
  LuFilter,
  LuCalendar,
  LuArrowRightLeft,
  LuX,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CancelContraModal from "../components/CancelContraModal"; // ✅ Import the modal

import { listContra, cancelContra } from "../api/registryServices";
import { toaster } from "../components/ui/toaster";

const PRIMARY_MAROON = "var(--primary-maroon)";
const PRIMARY_RED = "#D7193F";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";

const TYPE_LABELS = {
  CASH_TO_BANK: { text: "Cash → Bank", scheme: "green" },
  BANK_TO_CASH: { text: "Bank → Cash", scheme: "blue" },
  BANK_TO_BANK: { text: "Bank → Bank", scheme: "purple" },
};

const fmtINR = (n) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));

const showToast = ({ title, description, type = "info", duration = 4000 }) => {
  toaster.create({ title, description, type, duration, closable: true });
};

// ============================================================
// PAGE
// ============================================================
const ContraListPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // ✅ Modal State
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (search) params.search = search;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await listContra(params);
      const data = res?.data ?? res;
      const items = Array.isArray(data) ? data : data?.results || [];
      setRows(items);
    } catch (err) {
      console.error("Error loading contra:", err);
      setError("Unable to load contra vouchers.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = [...rows];
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => {
        const vn = String(r.voucher_number || "").toLowerCase();
        const nr = String(r.narration || "").toLowerCase();
        const fl = String(r.from_ledger_name || "").toLowerCase();
        const tl = String(r.to_ledger_name || "").toLowerCase();
        return vn.includes(q) || nr.includes(q) || fl.includes(q) || tl.includes(q);
      });
    }
    if (!showCancelled) result = result.filter((r) => !r.is_cancelled);
    return result;
  }, [rows, search, showCancelled]);

  const totals = useMemo(() => {
    const active = filtered.filter((r) => !r.is_cancelled);
    return { count: active.length, amount: active.reduce((s, r) => s + Number(r.amount || 0), 0) };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRows = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => { setCurrentPage(1); }, [search, dateFrom, dateTo, showCancelled]);

  // ✅ Handlers for Modal
  const openCancel = (row) => {
    setCancelTarget(row);
    setCancelOpen(true);
  };

  const closeCancel = () => {
    if (cancelling) return;
    setCancelOpen(false);
    setCancelTarget(null);
  };

  const submitCancel = async (data) => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelContra(cancelTarget.id, data);
      showToast({ title: "Contra cancelled", description: "The voucher was reversed successfully.", type: "success" });
      closeCancel();
      await load();
    } catch (err) {
      const msg = err?.response?.data ? Object.values(err.response.data)[0] : "Cancel failed.";
      showToast({ title: "Cancel failed", description: Array.isArray(msg) ? msg[0] : String(msg), type: "error", duration: 7000 });
    } finally {
      setCancelling(false);
    }
  };

  const renderPages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const StatCard = ({ icon, title, value }) => (
    <Box border="1px solid #DCE2EA" borderRadius="8px" h="78px" px={4} bg="white" display="flex" alignItems="center">
      <Flex align="center" width="100%" height="100%">
        <Box width="65px" height="100%" borderRight="1px solid #DCE2EA" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
          <Icon as={icon} boxSize={8} color={PRIMARY_RED} strokeWidth={1.6} />
        </Box>
        <Box pl={4}>
          <Text fontSize="12px" color={TEXT_COLOR} mb={1} fontWeight="600">{title}</Text>
          <Text fontSize="24px" fontWeight="700" color={TEXT_COLOR} lineHeight="1">{value}</Text>
        </Box>
      </Flex>
    </Box>
  );

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />
      <Box flex="1" w="100%">
        <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
          <HStack gap={2} mb={2} color={SECONDARY_TEXT} fontSize="11px">
            <Text>Activities</Text><Text>/</Text><Text>Accounts</Text><Text>/</Text><Text color={TEXT_COLOR}>Contra</Text>
          </HStack>

          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} mb={3} direction={{ base: "column", md: "row" }}>
            <Box>
              <Text fontSize="10px" fontWeight="700" color={PRIMARY_RED} mb={1}>ACCOUNTS</Text>
              <Heading color={TEXT_COLOR} fontSize={{ base: "22px", md: "26px" }} lineHeight="1.1" mb={1}>Contra Vouchers</Heading>
              <Text color={SECONDARY_TEXT} fontSize="11px">Transfers between Cash and Bank. Not income, not expense.</Text>
            </Box>
            <Button bg={PRIMARY_MAROON} color="white" px={5} h="38px" fontSize="12px" borderRadius="6px" flexShrink={0} onClick={() => navigate("/contra/add")} _hover={{ bg: "#650A18" }}>
              <Icon as={LuPlus} mr={2} boxSize={4} />New Contra
            </Button>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} mb={3}>
            <StatCard icon={LuArrowRightLeft} title="Total Contra Entries" value={totals.count} />
            <StatCard icon={LuCalendar} title="Total Amount Transferred" value={`₹ ${fmtINR(totals.amount)}`} />
          </SimpleGrid>

          <Box border="1px solid #DCE2EA" borderRadius="8px" p={3} bg="white" w="100%">
            <Flex gap={3} mb={3} direction={{ base: "column", md: "row" }} flexWrap="wrap">
              <Box position="relative" flex="1" minW={{ base: "100%", md: "260px" }}>
                <Icon as={LuSearch} position="absolute" left="12px" top="50%" transform="translateY(-50%)" color={SECONDARY_TEXT} zIndex={1} boxSize={4} />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search voucher / narration / ledger" pl="38px" h="38px" borderColor={BORDER_COLOR} borderRadius="6px" fontSize="12px" _focus={{ borderColor: PRIMARY_RED, boxShadow: `0 0 0 1px ${PRIMARY_RED}` }} />
              </Box>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} h="38px" w={{ base: "100%", md: "160px" }} borderColor={BORDER_COLOR} borderRadius="6px" fontSize="12px" _focus={{ borderColor: PRIMARY_RED, boxShadow: `0 0 0 1px ${PRIMARY_RED}` }} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} h="38px" w={{ base: "100%", md: "160px" }} borderColor={BORDER_COLOR} borderRadius="6px" fontSize="12px" _focus={{ borderColor: PRIMARY_RED, boxShadow: `0 0 0 1px ${PRIMARY_RED}` }} />
              <Box display="flex" alignItems="center" gap={2} px={3} h="38px" border="1px solid" borderColor={BORDER_COLOR} borderRadius="6px" bg="white" cursor="pointer" onClick={() => setShowCancelled((v) => !v)}>
                <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} style={{ cursor: "pointer" }} />
                <Text fontSize="11px" color={TEXT_COLOR} fontWeight="600">Show cancelled</Text>
              </Box>
              <Button bg={PRIMARY_MAROON} color="white" h="38px" px={5} fontSize="12px" borderRadius="6px" onClick={load} _hover={{ bg: "#650A18" }}>Apply</Button>
              <Button variant="outline" h="38px" borderColor="#FF5A7D" color={PRIMARY_RED} borderRadius="6px" px={4} fontSize="12px" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setShowCancelled(false); load(); }}>
                <Icon as={LuFilter} mr={2} boxSize={4} />Reset
              </Button>
            </Flex>

            {error && (
              <Box mb={3} p={2} borderRadius="6px" bg="#FFF5F5" border="1px solid #FED7D7">
                <Text color="red.600" fontSize="12px">{error}</Text>
              </Box>
            )}

            <Box overflowX="auto" overflowY="hidden" border="1px solid #E6EAF0" borderRadius="6px" width="100%">
              <Box as="table" width="100%" minW="1000px" borderCollapse="collapse">
                <Box as="thead">
                  <Box as="tr" height="42px">
                    {["Date", "Voucher", "Type", "From (Leaves)", "To (Arrives)", "Amount", "Narration", "Actions"].map((heading) => (
                      <Box as="th" key={heading} textAlign="left" px={4} py={2} fontSize="11px" fontWeight="700" color={TEXT_COLOR} borderBottom="1px solid #E6EAF0" whiteSpace="nowrap" bg="white">{heading}</Box>
                    ))}
                  </Box>
                </Box>
                <Box as="tbody">
                  {loading ? (
                    <Box as="tr"><Box as="td" colSpan={8} textAlign="center" height="48px" color={SECONDARY_TEXT} fontSize="12px">Loading contra vouchers...</Box></Box>
                  ) : paginatedRows.length === 0 ? (
                    <Box as="tr"><Box as="td" colSpan={8} textAlign="center" height="48px" color={SECONDARY_TEXT} fontSize="12px">No contra vouchers found.</Box></Box>
                  ) : (
                    paginatedRows.map((r) => {
                      const t = TYPE_LABELS[r.contra_type] || { text: r.contra_type, scheme: "gray" };
                      return (
                        <Box as="tr" key={r.id} height="42px" opacity={r.is_cancelled ? 0.55 : 1} _hover={{ bg: "#FFFBFC" }}>
                          <Box as="td" px={4} py={1} fontSize="12px" color={TEXT_COLOR} borderBottom="1px solid #E6EAF0" whiteSpace="nowrap">{r.contra_date}</Box>
                          <Box as="td" px={4} py={1} fontSize="11px" fontFamily="mono" color={TEXT_COLOR} borderBottom="1px solid #E6EAF0" whiteSpace="nowrap">{r.voucher_number}</Box>
                          <Box as="td" px={4} py={1} borderBottom="1px solid #E6EAF0">
                            <Box as="span" display="inline-block" px={2} py="2px" borderRadius="full" fontSize="10px" fontWeight="600" bg={t.scheme === "green" ? "#E6F7EE" : t.scheme === "blue" ? "#E6F1FB" : t.scheme === "purple" ? "#F1EAFB" : "#F4F6F9"} color={t.scheme === "green" ? "#1A7F4B" : t.scheme === "blue" ? "#1E5FB7" : t.scheme === "purple" ? "#6B3FB5" : "#344054"}>{t.text}</Box>
                          </Box>
                          <Box as="td" px={4} py={1} fontSize="12px" color={TEXT_COLOR} borderBottom="1px solid #E6EAF0">{r.from_ledger_name}</Box>
                          <Box as="td" px={4} py={1} fontSize="12px" color={TEXT_COLOR} borderBottom="1px solid #E6EAF0">{r.to_ledger_name}</Box>
                          <Box as="td" px={4} py={1} fontSize="12px" fontWeight="600" color={TEXT_COLOR} borderBottom="1px solid #E6EAF0" whiteSpace="nowrap">₹ {fmtINR(r.amount)}</Box>
                          <Box as="td" px={4} py={1} fontSize="12px" color={SECONDARY_TEXT} borderBottom="1px solid #E6EAF0" maxW="220px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" title={r.narration || ""}>{r.narration || "—"}</Box>
                          <Box as="td" px={4} py={1} borderBottom="1px solid #E6EAF0">
                            {r.is_cancelled ? (
                              <Box as="span" display="inline-block" px={2} py="2px" borderRadius="full" fontSize="10px" fontWeight="600" bg="#FFF5F5" color={PRIMARY_RED}>Cancelled</Box>
                            ) : (
                              <HStack gap={2}>
                                <Button variant="ghost" size="sm" h="30px" color={PRIMARY_RED} px={2} fontSize="11px" onClick={() => navigate(`/contra/${r.id}/edit`)} _hover={{ bg: "#FFF0F4" }}>
                                  <Icon as={LuPencil} mr={1} boxSize={3.5} />Edit
                                </Button>
                                <Box h="20px" borderLeft="1px solid #DCE2EA" />
                                <Button variant="ghost" size="sm" h="30px" color={PRIMARY_RED} px={2} fontSize="11px" onClick={() => openCancel(r)} _hover={{ bg: "#FFF0F4" }}>
                                  <Icon as={LuX} mr={1} boxSize={3.5} />Cancel
                                </Button>
                              </HStack>
                            )}
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Box>
            </Box>

            <Flex justify="space-between" align="center" mt={3} gap={3} direction={{ base: "column", md: "row" }}>
              <Text fontSize="11px" color={SECONDARY_TEXT}>
                {filtered.length === 0 ? "Showing 0 contra vouchers" : `Showing ${startIndex + 1}–${Math.min(startIndex + paginatedRows.length, filtered.length)} of ${filtered.length} contra vouchers`}
              </Text>
              <HStack gap={1}>
                <Button size="xs" h="30px" variant="outline" borderColor={BORDER_COLOR} color={SECONDARY_TEXT} disabled={safePage === 1} onClick={() => setCurrentPage(Math.max(1, safePage - 1))}>
                  <Icon as={LuChevronLeft} boxSize={3.5} />Previous
                </Button>
                {renderPages().map((page, index) =>
                  page === "..." ? (
                    <Text key={`dots-${index}`} px={1.5} fontSize="11px" color={SECONDARY_TEXT}>...</Text>
                  ) : (
                    <Button key={page} size="xs" h="30px" minW="30px" variant={page === safePage ? "solid" : "outline"} bg={page === safePage ? PRIMARY_MAROON : "white"} color={page === safePage ? "white" : "#344054"} borderColor={page === safePage ? PRIMARY_MAROON : BORDER_COLOR} onClick={() => setCurrentPage(page)} _hover={{ bg: page === safePage ? "#650A18" : "#FFF0F4" }}>
                      {page}
                    </Button>
                  )
                )}
                <Button size="xs" h="30px" variant="outline" borderColor="#FF5A7D" color={PRIMARY_RED} disabled={safePage === totalPages} onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}>
                  Next<Icon as={LuChevronRight} ml={1} boxSize={3.5} />
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Box>
      </Box>

      {/* ✅ Render the Modal Component */}
      <CancelContraModal
        isOpen={cancelOpen}
        onClose={closeCancel}
        contra={cancelTarget}
        onConfirm={submitCancel}
        saving={cancelling}
      />

      <Footer />
    </Box>
  );
};

export default ContraListPage;