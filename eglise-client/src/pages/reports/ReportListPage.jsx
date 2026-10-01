// src/pages/reports/ReportListPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Box, Button, Container, Flex, Heading, HStack, Input,
  SimpleGrid, Text, VStack,
} from "@chakra-ui/react";

import {
  LuCalendarDays, LuChevronLeft, LuChevronRight, LuEye, LuSearch,
  LuFilter, LuUsers, LuUserRound, LuArchive, LuBaby, LuFlower,
  LuHeart, LuFileText,
} from "react-icons/lu";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  getReportConfig, getSourceFromPath, pick, formatDate,
} from "./reportConfig";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#650A18";
const PRIMARY_BLUE = "#1F3A7D";
const SECONDARY_BLUE = "#315AB5";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const LIGHT_RED_BG = "#FFF5F7";
const LIGHT_BLUE_BG = "#F5F7FF";

const PAGE_SIZE = 8;

const ICONS = {
  archive: LuArchive, users: LuUsers, user: LuUserRound,
  calendar: LuCalendarDays, baby: LuBaby, flower: LuFlower, heart: LuHeart,
};

const TONES = {
  red: { bg: LIGHT_RED_BG, color: PRIMARY_RED, border: "#F4A3B2" },
  blue: { bg: LIGHT_BLUE_BG, color: SECONDARY_BLUE, border: "#AFC0E9" },
};

const ReportListPage = ({ type }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const source = getSourceFromPath(pathname);
  const cfg = getReportConfig(type, source);

  const buildInitial = () => ({
    search: "",
    year: "ALL",
    date: "",
    ...Object.fromEntries(cfg.filters.map((f) => [f.id, "ALL"])),
  });

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(buildInitial);
  const [applied, setApplied] = useState(buildInitial);

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await cfg.listFn();
      const data = res?.data?.results ?? res?.data ?? [];
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Error loading ${type} records:`, err);
      setError(err?.response?.data?.detail || `Unable to load ${type} records.`);
    } finally {
      setLoading(false);
    }
  };

  // Reset + reload when switching baptism / marriage / death / live / legacy
  useEffect(() => {
    setRecords([]);
    setPage(1);
    setDraft(buildInitial());
    setApplied(buildInitial());
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, source]);

  /* ---------- helpers ---------- */
  const getDateValue = (r) => pick(r, cfg.dateKeys, null);

  const getYear = (r) => {
    const v = getDateValue(r);
    const d = v ? new Date(v) : null;
    return d && !Number.isNaN(d.getTime()) ? d.getFullYear() : null;
  };

  const normalizeDate = (v) => {
    if (!v) return "";
    const s = String(v);
    if (s.includes("T")) return s.split("T")[0];
    if (s.includes(" ")) return s.split(" ")[0];
    return s;
  };

  const cardName = (r) =>
    type === "marriage"
      ? `${pick(r, ["groom_name"], "-")} & ${pick(r, ["bride_name"], "-")}`
      : pick(r, cfg.nameKeys, "Unknown");

  const upper = (v) => String(v ?? "").toUpperCase();

  /* ---------- filter options ---------- */
  const yearOptions = useMemo(() => {
    const set = new Set();
    records.forEach((r) => {
      const y = getYear(r);
      if (y) set.add(y);
    });
    return [...set].sort((a, b) => b - a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, type, source]);

  const filterOptions = useMemo(() => {
    const out = {};
    cfg.filters.forEach((f) => {
      if (f.options) {
        out[f.id] = f.options;
      } else {
        const values = records
          .map((r) => pick(r, f.keys, null))
          .filter(Boolean);
        out[f.id] = [...new Set(values)]
          .sort((a, b) => String(a).localeCompare(String(b)))
          .map((v) => ({ value: v, label: v }));
      }
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, type, source]);

  const handleApplyFilters = () => {
    setApplied({ ...draft, search: draft.search.trim() });
    setPage(1);
  };

  const filterChanged =
    JSON.stringify({ ...draft, search: draft.search.trim() }) !==
    JSON.stringify(applied);

  /* ---------- filtered list ---------- */
  const filtered = useMemo(() => {
    const kw = applied.search.toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !kw ||
        cfg.searchKeys.some((k) => String(r?.[k] || "").toLowerCase().includes(kw));
      if (!matchesSearch) return false;

      for (const f of cfg.filters) {
        if (
          applied[f.id] !== "ALL" &&
          upper(pick(r, f.keys, "")) !== upper(applied[f.id])
        ) return false;
      }

      if (cfg.showYear && applied.year !== "ALL" &&
          String(getYear(r)) !== String(applied.year)) return false;

      if (applied.date && normalizeDate(getDateValue(r)) !== applied.date)
        return false;

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, applied, type, source]);

  /* ---------- stats ---------- */
  const now = new Date();
  const statValue = (s) => {
    if (s.kind === "total") return records.length;
    if (s.kind === "month")
      return records.filter((r) => {
        const v = getDateValue(r);
        if (!v) return false;
        const d = new Date(v);
        return (
          !Number.isNaN(d.getTime()) &&
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      }).length;
    if (s.kind === "year")
      return records.filter((r) => getYear(r) === now.getFullYear()).length;
    if (s.kind === "match")
      return records.filter((r) => upper(pick(r, s.keys, "")) === s.equals).length;
    return 0;
  };

  /* ---------- pagination ---------- */
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3) return [1, 2, 3, "...", totalPages];
    if (safePage >= totalPages - 2)
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", safePage, "...", totalPages];
  };

  const EmptyIcon = ICONS[cfg.emptyIcon] || LuFileText;

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 3, md: 4, lg: 5 }}
                 pt={{ base: 2, md: 3 }} pb={{ base: 4, md: 5 }} flex="1">

        {/* BREADCRUMB */}
        <HStack gap={1.5} mb={0} color={SECONDARY_BLUE} fontSize="11px">
          <Text>Reports</Text>
          <Text>/</Text>
          <Text fontWeight="500">{cfg.title}</Text>
        </HStack>

        {/* HEADER */}
        <Box mb={3}>
          <Text fontSize="9px" fontWeight="700" color={PRIMARY_RED}
                mb={0.5} letterSpacing="0.5px">
            {cfg.eyebrow}
          </Text>
          <Heading color={PRIMARY_BLUE}
                   fontSize={{ base: "22px", md: "25px" }}
                   fontWeight="700" lineHeight="1.15" mb={0.5}>
            {cfg.title}
          </Heading>
          <Text color={SECONDARY_TEXT} fontSize="11px">{cfg.subtitle}</Text>
        </Box>

        {/* STATS */}
        <Flex bg="white" border={`1px solid ${BORDER_COLOR}`}
              borderRadius="7px" mb={3} align="stretch" px={1} py={1}
              direction={{ base: "column", md: "row" }}
              minH={{ base: "auto", md: "68px" }}>
          {cfg.stats.map((s, i) => {
            const StatIcon = ICONS[s.icon] || LuArchive;
            return (
              <React.Fragment key={s.label}>
                {i > 0 && <Divider />}
                <HorizontalStatItem
                  icon={<StatIcon size={23} color={PRIMARY_RED} />}
                  value={statValue(s)}
                  label={s.label}
                />
              </React.Fragment>
            );
          })}
        </Flex>

        {/* SEARCH & FILTER */}
        <Flex align="center" gap={2} mb={3}
              direction={{ base: "column", lg: "row" }}>
          <Box position="relative" flex="1" minW="0"
               w={{ base: "100%", lg: "auto" }}>
            <Box position="absolute" left="10px" top="50%"
                 transform="translateY(-50%)" color={SECONDARY_TEXT} zIndex={1}>
              <LuSearch size={14} />
            </Box>
            <Input value={draft.search}
                   onChange={(e) => setField("search", e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                   placeholder={cfg.placeholder}
                   pl="32px" h="34px" fontSize="11px"
                   borderColor={BORDER_COLOR} borderRadius="5px"
                   color={TEXT_COLOR}
                   _placeholder={{ color: "#8B98AB" }}
                   _focus={{ borderColor: PRIMARY_RED,
                             boxShadow: `0 0 0 1px ${PRIMARY_RED}` }} />
          </Box>

          <HStack gap={2} flexShrink={0} flexWrap="wrap"
                  justify={{ base: "stretch", lg: "flex-end" }}>
            {cfg.filters.map((f) => (
              <select key={f.id} value={draft[f.id]}
                      onChange={(e) => setField(f.id, e.target.value)}
                      style={selectStyle}>
                <option value="ALL">{f.allLabel}</option>
                {(filterOptions[f.id] || []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ))}

            {cfg.showYear && (
              <select value={draft.year}
                      onChange={(e) => setField("year", e.target.value)}
                      style={selectStyle}>
                <option value="ALL">All Years</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            <Box position="relative">
              <Box position="absolute" left="9px" top="50%"
                   transform="translateY(-50%)" zIndex={1}
                   pointerEvents="none" color={SECONDARY_TEXT}>
                <LuCalendarDays size={13} />
              </Box>
              <Input type="date" value={draft.date}
                     onChange={(e) => setField("date", e.target.value)}
                     h="34px" w="145px" pl="29px" fontSize="11px"
                     borderColor={BORDER_COLOR} borderRadius="5px" />
            </Box>

            <Button
              bg={filterChanged ? PRIMARY_RED : "white"}
              color={filterChanged ? "white" : PRIMARY_RED}
              border="1px solid" borderColor={PRIMARY_RED}
              h="34px" px={3} fontSize="11px" fontWeight="600"
              borderRadius="5px" onClick={handleApplyFilters}
              _hover={{ bg: DARK_RED, color: "white", borderColor: DARK_RED }}>
              <LuFilter size={14} style={{ marginRight: "5px" }} />
              Filter
            </Button>
          </HStack>
        </Flex>

        {/* ERROR */}
        {error && (
          <Box mb={3} p={2} borderRadius="5px" bg="#FFF5F5"
               border="1px solid #FED7D7">
            <Text color="red.600" fontSize="10px">{error}</Text>
          </Box>
        )}

        {/* TITLE */}
        <HStack gap={2} mb={2}>
          <Heading color={PRIMARY_BLUE} fontSize="16px" fontWeight="700">
            {cfg.title}
          </Heading>
          <Text fontSize="10px" color={SECONDARY_TEXT}>
            Showing {totalItems === 0 ? 0 : startIndex + 1}-
            {Math.min(startIndex + paginated.length, totalItems)} of {totalItems} records
          </Text>
        </HStack>

        {/* LOADING */}
        {loading && (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="6px"
               py={10} textAlign="center">
            <Text color={SECONDARY_TEXT} fontSize="11px">
              Loading {cfg.title.toLowerCase()}...
            </Text>
          </Box>
        )}

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="6px"
               py={10} textAlign="center">
            <EmptyIcon size={34} color="#C8CFD9"
                       style={{ margin: "0 auto 8px" }} />
            <Text color={TEXT_COLOR} fontSize="13px" fontWeight="600">
              No records found
            </Text>
            <Text color={SECONDARY_TEXT} fontSize="10px" mt={1}>
              Try changing your search or filter options.
            </Text>
          </Box>
        )}

        {/* CARDS */}
        {!loading && paginated.length > 0 && (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                      gap={{ base: 2.5, md: 3 }} mb={3}>
            {paginated.map((r) => (
              <ReportCard
                key={r.id}
                record={r}
                cfg={cfg}
                name={cardName(r)}
                onView={() => navigate(`${cfg.basePath}/${r.id}/certificate`)}
              />
            ))}
          </SimpleGrid>
        )}

        {/* PAGINATION */}
        {!loading && filtered.length > 0 && (
          <Flex align="center" justify="flex-end" gap={3} mt={1} mb={1}>
            <Text fontSize="10px" color={SECONDARY_TEXT} whiteSpace="nowrap">
              Showing{" "}
              <Text as="span" fontWeight="600" color={TEXT_COLOR}>
                {totalItems === 0 ? 0 : startIndex + 1}-
                {Math.min(startIndex + paginated.length, totalItems)}
              </Text>{" "}
              of{" "}
              <Text as="span" fontWeight="600" color={TEXT_COLOR}>
                {totalItems}
              </Text>{" "}
              records
            </Text>

            <HStack gap={1} flexWrap="wrap" justify="flex-end">
              <Button variant="outline" h="29px" minW="29px" px={2}
                      borderColor={BORDER_COLOR} color={SECONDARY_TEXT}
                      disabled={safePage === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      _hover={{ bg: LIGHT_RED_BG, borderColor: PRIMARY_RED,
                                color: PRIMARY_RED }}
                      _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
                      title="Previous">
                <LuChevronLeft size={14} />
              </Button>

              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <Text key={`d-${i}`} px="4px" fontSize="10px"
                        color={SECONDARY_TEXT}>...</Text>
                ) : (
                  <Button key={p} h="29px" minW="29px" px={1}
                          border="1px solid"
                          borderColor={safePage === p ? PRIMARY_RED : BORDER_COLOR}
                          bg={safePage === p ? PRIMARY_RED : "white"}
                          color={safePage === p ? "white" : SECONDARY_TEXT}
                          onClick={() => setPage(p)}
                          _hover={{ bg: safePage === p ? DARK_RED : LIGHT_RED_BG,
                                    borderColor: PRIMARY_RED,
                                    color: safePage === p ? "white" : PRIMARY_RED }}
                          fontSize="10px" fontWeight="600" borderRadius="4px">
                    {p}
                  </Button>
                )
              )}

              <Button variant="outline" h="29px" minW="29px" px={2}
                      borderColor={BORDER_COLOR} color={SECONDARY_TEXT}
                      disabled={safePage === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      _hover={{ bg: LIGHT_RED_BG, borderColor: PRIMARY_RED,
                                color: PRIMARY_RED }}
                      _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
                      title="Next">
                <LuChevronRight size={14} />
              </Button>
            </HStack>
          </Flex>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

/* ---------- STYLES ---------- */
const selectStyle = {
  height: "34px", minWidth: "145px",
  border: `1px solid ${BORDER_COLOR}`,
  borderRadius: "5px", padding: "0 28px 0 9px",
  fontSize: "11px", color: TEXT_COLOR,
  background: "white", outline: "none",
};

const Divider = () => (
  <Box display={{ base: "none", md: "block" }}
       width="1px" height="42px" bg={BORDER_COLOR} alignSelf="center" />
);

const HorizontalStatItem = ({ icon, value, label }) => (
  <Flex flex="1" align="center" justify="flex-start" gap={3}
        px={{ base: 3, md: 4 }} py={{ base: 2.5, md: 2.5 }}
        direction={{ base: "column", md: "row" }}
        textAlign={{ base: "center", md: "left" }}>
    <Box flexShrink={0}>{icon}</Box>
    <VStack align={{ base: "center", md: "flex-start" }} gap={0}>
      <Text fontSize="9px" color={SECONDARY_BLUE} fontWeight="500"
            letterSpacing="0.2px">
        {label}
      </Text>
      <Text fontSize="21px" fontWeight="700" color={PRIMARY_BLUE}
            lineHeight="1.05" mt="1px">
        {value}
      </Text>
    </VStack>
  </Flex>
);

/* ---------- CARD (eye button only) ---------- */
const ReportCard = ({ record, cfg, name, onView }) => {
  // badge: config badge (e.g. Parish/Other) or a fixed LEGACY tag
  let badge = null;
  if (cfg.badge) {
    const key = String(pick(record, cfg.badge.keys, "")).toUpperCase();
    badge = cfg.badge.map[key] || null;
  } else if (cfg.source === "legacy") {
    badge = { label: "LEGACY", tone: "red" };
  }
  const tone = badge ? TONES[badge.tone] : null;

  return (
    <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="6px"
         bg="white" display="flex" flexDirection="column"
         transition="all 0.2s ease" overflow="hidden" minH="0"
         _hover={{ boxShadow: "0 4px 12px rgba(24,35,56,0.1)",
                   borderColor: "#B8C2D2" }}>
      <Flex px={3} pt={2.5} pb={1.5} justify="space-between"
            align="flex-start" gap={2}>
        <Text color={PRIMARY_BLUE} fontSize="12px" fontWeight="700"
              lineHeight="1.3" flex="1" minW={0} noOfLines={1}>
          {name}
        </Text>
        {badge && (
          <Box flexShrink={0} bg={tone.bg} color={tone.color}
               border="1px solid" borderColor={tone.border}
               px="6px" py="1.5px" borderRadius="3px"
               textAlign="center" whiteSpace="nowrap">
            <Text fontSize="8px" fontWeight="700" letterSpacing="0.2px">
              {badge.label}
            </Text>
          </Box>
        )}
      </Flex>

      <SimpleGrid columns={2} gap={2} px={3} mb={1.5}>
        {cfg.cardFields.map((f) => {
          const raw = pick(record, f.keys, null);
          return (
            <Box key={f.label} minW={0}>
              <Text fontSize="8px" color={TEXT_COLOR} fontWeight="700"
                    mb="1px" letterSpacing="0.2px">
                {f.label}
              </Text>
              <Text fontSize="10px"
                    color={f.strong ? PRIMARY_BLUE : TEXT_COLOR}
                    fontWeight={f.strong ? "600" : "400"} noOfLines={1}>
                {f.date ? formatDate(raw) : raw ?? "-"}
              </Text>
            </Box>
          );
        })}
      </SimpleGrid>

      <Flex px={3} py={1.5} justify="flex-end" align="center">
        <Button variant="ghost" size="sm" h="24px" minW="24px" p={0}
                color={PRIMARY_RED} borderRadius="3px" onClick={onView}
                title="Print Certificate" _hover={{ bg: LIGHT_RED_BG }}>
          <LuEye size={14} strokeWidth={1.5} />
        </Button>
      </Flex>
    </Box>
  );
};

export default ReportListPage;