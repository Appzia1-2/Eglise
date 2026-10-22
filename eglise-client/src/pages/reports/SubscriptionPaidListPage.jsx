// src/pages/reports/SubscriptionPaidListPage.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  getSubscriptionPaidReport,
  listWards,
  listMembers,
  getMyChurch,
} from "../../api/registryServices";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const BLUE = "#315AB5";

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
const HomeIcon = ({ size = 16, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
  </svg>
);
const SearchIcon = ({ size = 14, color = SECONDARY_TEXT }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
    <path d="M21 21l-4.3-4.3" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const CloseIcon = ({ size = 12, color = SECONDARY_TEXT }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const fmt = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const today = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

// ============================================================
// SEARCHABLE SELECT (generic)
// ============================================================
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select",
  searchPlaceholder = "Search...",
  getLabel = (o) => o.label || o.name || "",
  getMeta = (o) => "",
  getValue = (o) => o.id,
  allLabel = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find(
    (o) => String(getValue(o)) === String(value)
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const label = String(getLabel(o) || "").toLowerCase();
      const meta = String(getMeta(o) || "").toLowerCase();
      return label.includes(q) || meta.includes(q);
    });
  }, [options, query, getLabel, getMeta]);

  useEffect(() => {
    const handler = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(String(getValue(option)));
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  const handlePickAll = () => {
    onChange("");
    setIsOpen(false);
    setQuery("");
  };

  return (
    <Box ref={containerRef} position="relative" w="100%">
      {isOpen ? (
        <Box position="relative">
          <Box
            position="absolute"
            left="11px"
            top="50%"
            transform="translateY(-50%)"
            pointerEvents="none"
            zIndex={1}
          >
            <SearchIcon />
          </Box>
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            pl="34px"
            pr="34px"
            h="40px"
            fontSize="12px"
            borderColor={PRIMARY_RED}
            borderRadius="6px"
            bg="white"
            _focus={{
              borderColor: PRIMARY_RED,
              boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
                setQuery("");
              } else if (e.key === "Enter" && filtered.length > 0) {
                handleSelect(filtered[0]);
              }
            }}
          />
          <Box
            position="absolute"
            right="11px"
            top="50%"
            transform="translateY(-50%)"
            cursor="pointer"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
            zIndex={1}
          >
            <CloseIcon />
          </Box>
        </Box>
      ) : (
        <Flex
          onClick={() => setIsOpen(true)}
          h="40px"
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="6px"
          px="11px"
          align="center"
          justify="space-between"
          cursor="pointer"
          bg="white"
          _hover={{ borderColor: SECONDARY_TEXT }}
        >
          <Text
            fontSize="12px"
            color={selected ? TEXT_COLOR : SECONDARY_TEXT}
            noOfLines={1}
          >
            {selected ? getLabel(selected) : placeholder}
          </Text>
          <HStack gap={1} flexShrink={0}>
            {selected && (
              <Box
                as="span"
                onClick={handleClear}
                cursor="pointer"
                display="inline-flex"
                alignItems="center"
                _hover={{ opacity: 0.7 }}
              >
                <CloseIcon />
              </Box>
            )}
            <ChevronDownIcon color={TEXT_COLOR} />
          </HStack>
        </Flex>
      )}

      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          right={0}
          bg="white"
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="6px"
          boxShadow="0 6px 20px rgba(0,0,0,0.12)"
          maxH="280px"
          overflowY="auto"
          zIndex={30}
        >
          {allLabel && !query && (
            <Box
              px={3}
              py={2}
              fontSize="12px"
              fontWeight={!value ? "600" : "500"}
              color={TEXT_COLOR}
              cursor="pointer"
              bg={!value ? "#FDF2F5" : "white"}
              _hover={{ bg: "#F7F9FB" }}
              onClick={handlePickAll}
            >
              {allLabel}
            </Box>
          )}

          {filtered.length === 0 ? (
            <Box px={3} py={2}>
              <Text fontSize="12px" color={SECONDARY_TEXT}>
                No matches
              </Text>
            </Box>
          ) : (
            filtered.map((o) => {
              const isSelected = String(getValue(o)) === String(value);
              const meta = getMeta(o);
              return (
                <Box
                  key={getValue(o)}
                  px={3}
                  py={2}
                  fontSize="12px"
                  color={TEXT_COLOR}
                  cursor="pointer"
                  bg={isSelected ? "#FDF2F5" : "white"}
                  _hover={{ bg: "#F7F9FB" }}
                  onClick={() => handleSelect(o)}
                >
                  <Text fontWeight={isSelected ? "600" : "500"}>
                    {getLabel(o)}
                  </Text>
                  {meta && (
                    <Text fontSize="10px" color={SECONDARY_TEXT}>
                      {meta}
                    </Text>
                  )}
                </Box>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
};

// ============================================================
// PAID TABLE
// ============================================================
const PaidTable = ({ wards, forPrint = false }) => {
  const headerBg = forPrint ? "#F4D8DE" : "#F7F9FB";
  const headerColor = forPrint ? DARK_RED : TEXT_COLOR;
  const wardBg = forPrint ? "#FBE9ED" : "#FFF5F7";
  const stripeBg = forPrint ? "#FCF2F4" : "#FAFBFC";
  const rowBorder = forPrint ? "#E8B4C0" : BORDER_COLOR;
  const wardRowBorder = forPrint ? "#DDAAB8" : "#F2C7D2";

  const grandTotal = wards.reduce(
    (sum, ward) =>
      sum + (Number(ward.ward_total ?? ward.ward_paid_total ?? 0) || 0),
    0
  );

  const totalMembers = wards.reduce(
    (sum, ward) => sum + (Number(ward.member_count) || 0),
    0
  );

  return (
    <Box
      border={`1px solid ${rowBorder}`}
      borderRadius={forPrint ? "0" : "10px"}
      overflow="hidden"
      overflowX="auto"
    >
      <Box
        as="table"
        width="100%"
        minW="760px"
        borderCollapse="collapse"
        fontSize={forPrint ? "11px" : "12px"}
        fontFamily={forPrint ? "Georgia, serif" : "inherit"}
      >
        <Box as="thead">
          <Box as="tr" bg={headerBg}>
            {[
              "Member Name",
              "Family",
              "Subscription", // ✅ Changed header
              "Charity Fund",
              "Diocese Fund",
              "Total Paid",
            ].map((label, index) => (
              <Box
                as="th"
                key={label}
                textAlign={index >= 2 ? "right" : "left"}
                px={3}
                py={3}
                fontSize="11px"
                fontWeight="700"
                color={headerColor}
                borderBottom={`1px solid ${rowBorder}`}
                letterSpacing="0.3px"
                whiteSpace="nowrap"
              >
                {label}
              </Box>
            ))}
          </Box>
        </Box>

        <Box as="tbody">
          {wards.map((ward) => (
            <React.Fragment key={ward.ward}>
              <Box
                as="tr"
                bg={wardBg}
                borderTop={`1px solid ${wardRowBorder}`}
                borderBottom={`1px solid ${wardRowBorder}`}
              >
                <Box as="td" colSpan={4} px={3} py={2.5}>
                  <HStack gap={2}>
                    <HomeIcon
                      size={16}
                      color={forPrint ? DARK_RED : PRIMARY_RED}
                    />
                    <Text
                      fontSize={forPrint ? "12px" : "13px"}
                      fontWeight="700"
                      color={forPrint ? DARK_RED : TEXT_COLOR}
                    >
                      {ward.ward}
                    </Text>
                  </HStack>
                </Box>

                <Box as="td" px={3} py={2.5} textAlign="right">
                  <Text
                    fontSize="11px"
                    fontWeight="600"
                    color={forPrint ? DARK_RED : SECONDARY_TEXT}
                    whiteSpace="nowrap"
                  >
                    {ward.member_count} Member
                    {ward.member_count === 1 ? "" : "s"}
                  </Text>
                </Box>

                <Box as="td" px={3} py={2.5} textAlign="right">
                  <Text
                    fontSize="12px"
                    fontWeight="700"
                    color={forPrint ? DARK_RED : PRIMARY_RED}
                    whiteSpace="nowrap"
                  >
                    Ward Paid:{" "}
                    {fmt(
                      ward.ward_total ??
                        ward.ward_paid_total ??
                        ward.members.reduce(
                          (sum, member) =>
                            sum + (Number(member.total_paid) || 0),
                          0
                        )
                    )}
                  </Text>
                </Box>
              </Box>

              {ward.members.map((member, index) => (
                <Box
                  as="tr"
                  key={`${ward.ward}-${member.member_id}-${index}`}
                  bg={index % 2 === 1 ? stripeBg : "white"}
                  borderBottom={`1px solid ${rowBorder}`}
                >
                  <Box as="td" px={3} py={2} pl={7} color={TEXT_COLOR}>
                    {member.name}
                  </Box>

                  <Box as="td" px={3} py={2} color={TEXT_COLOR}>
                    {member.family_name}
                  </Box>

                  {/* ✅ Amount with Billing Cycle below */}
                  <Box as="td" px={3} py={2} textAlign="right" color={TEXT_COLOR} whiteSpace="nowrap">
                    <Text fontSize={forPrint ? "11px" : "12px"}>
                      {fmt(member.monthly_subscription)}
                    </Text>
                    {member.billing_cycle && (
                      <Text fontSize="9px" color={SECONDARY_TEXT} textTransform="capitalize">
                        {member.billing_cycle === "YEARLY" ? "Yearly" : "Monthly"}
                      </Text>
                    )}
                  </Box>

                  <Box as="td" px={3} py={2} textAlign="right" color={TEXT_COLOR} whiteSpace="nowrap">
                    {fmt(member.charity_fund)}
                  </Box>

                  <Box as="td" px={3} py={2} textAlign="right" color={TEXT_COLOR} whiteSpace="nowrap">
                    {fmt(member.diocese_fund)}
                  </Box>

                  <Box as="td" px={3} py={2} textAlign="right" fontWeight="600" color={TEXT_COLOR} whiteSpace="nowrap">
                    {fmt(member.total_paid)}
                  </Box>
                </Box>
              ))}
            </React.Fragment>
          ))}

          <Box as="tr" bg={forPrint ? "#F5CED8" : "#F5F7FA"} borderTop={`2px solid ${rowBorder}`}>
            <Box as="td" colSpan={4} px={3} py={3} textAlign="right">
              <Text
                fontSize="12px"
                fontWeight="700"
                color={forPrint ? DARK_RED : BLUE}
                letterSpacing="0.3px"
              >
                Grand Total Paid
                {!forPrint ? ` (${totalMembers} members)` : ""}
              </Text>
            </Box>

            <Box as="td" />

            <Box
              as="td"
              px={3}
              py={3}
              textAlign="right"
              fontWeight="700"
              color={forPrint ? DARK_RED : TEXT_COLOR}
              fontSize="12px"
              whiteSpace="nowrap"
            >
              {fmt(grandTotal)}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// ============================================================
// PAGE
// ============================================================
const SubscriptionPaidListPage = () => {
  const navigate = useNavigate();

  const [wards, setWards] = useState([]);
  const [members, setMembers] = useState([]);
  const [church, setChurch] = useState({});

  const [selectedWard, setSelectedWard] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());

  const [data, setData] = useState({
    wards: [],
    grand_total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [wardsResponse, membersResponse, churchResponse] =
          await Promise.all([
            listWards(),
            listMembers(),
            getMyChurch(),
          ]);

        setWards(wardsResponse?.data?.results ?? wardsResponse?.data ?? []);
        setMembers(membersResponse?.data?.results ?? membersResponse?.data ?? []);
        setChurch(churchResponse?.data ?? {});
      } catch (error) {
        console.error("Load options error:", error);
      }
    };

    load();
  }, []);

  const fetchData = async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setPageError("Date From cannot be later than Date To.");
      setData({ wards: [], grand_total: 0 });
      return;
    }

    try {
      setLoading(true);
      setPageError("");

      const params = {
        from: dateFrom,
        to: dateTo,
      };

      if (selectedWard) params.ward_id = selectedWard;
      if (selectedMember) params.member_id = selectedMember;

      const response = await getSubscriptionPaidReport(params);

      setData({
        wards: response?.data?.wards || [],
        grand_total: Number(response?.data?.grand_total) || 0,
      });
    } catch (error) {
      console.error("Paid list fetch error:", error);
      setPageError("Unable to load subscription paid list.");
      setData({ wards: [], grand_total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, selectedWard, selectedMember]);

  const periodLabel = `${new Date(`${dateFrom}T00:00:00`).toLocaleDateString(
    "en-GB",
    { day: "2-digit", month: "short", year: "numeric" }
  )} – ${new Date(`${dateTo}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  const totalMembers = (data.wards || []).reduce(
    (sum, ward) => sum + (Number(ward.member_count) || 0),
    0
  );

  // Member picker options
  const memberOptions = useMemo(
    () =>
      members.map((m) => ({
        id: m.id,
        name: m.name,
        family_name: m.family_name || "",
        house_name: m.house_name || "",
      })),
    [members]
  );

  // Ward picker options
  const wardOptions = useMemo(
    () =>
      wards.map((w) => ({
        id: w.id,
        name: w.ward_name,
        ward_number: w.ward_number,
        place: w.place,
      })),
    [wards]
  );

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 4, md: 5 }} py={4} flex="1">
        <HStack gap={2} mb={2} fontSize="12px">
          <Text color={BLUE} cursor="pointer" onClick={() => navigate("/reports")}>
            Reports
          </Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={SECONDARY_TEXT}>Subscription Paid List</Text>
        </HStack>

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
              SUBSCRIPTION PAID REPORT
            </Text>
            <Heading color={TEXT_COLOR} fontSize={{ base: "22px", md: "26px" }} mb={1}>
              Subscription Paid List
            </Heading>
            <Text color={SECONDARY_TEXT} fontSize="12px">
              View ward-wise member subscription payments.
            </Text>
          </Box>

          <HStack gap={3} flexWrap="wrap">
            {/* <Button
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
            </Button> */}

            <Button
              variant="outline"
              h="40px"
              px={5}
              borderColor={PRIMARY_RED}
              color={PRIMARY_RED}
              borderRadius="6px"
              fontSize="12px"
              fontWeight="600"
              onClick={() => setPrintOpen(true)}
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
              onClick={() => setPrintOpen(true)}
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
            {/* MEMBER — searchable */}
            <Box flex="1" minW="220px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Member
              </Text>
              <SearchableSelect
                options={memberOptions}
                value={selectedMember}
                onChange={setSelectedMember}
                placeholder="All Members"
                searchPlaceholder="Search member..."
                getLabel={(o) => o.name}
                getMeta={(o) =>
                  [o.family_name, o.house_name].filter(Boolean).join(" • ")
                }
                getValue={(o) => o.id}
                allLabel="All Members"
              />
            </Box>

            {/* WARD — searchable */}
            <Box flex="1" minW="200px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Ward
              </Text>
              <SearchableSelect
                options={wardOptions}
                value={selectedWard}
                onChange={setSelectedWard}
                placeholder="All Wards"
                searchPlaceholder="Search ward..."
                getLabel={(o) => o.name}
                getMeta={(o) =>
                  [o.ward_number ? `Ward #${o.ward_number}` : "", o.place]
                    .filter(Boolean)
                    .join(" • ")
                }
                getValue={(o) => o.id}
                allLabel="All Wards"
              />
            </Box>

            <Box flex="1" minW="150px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Date From
              </Text>
              <Box position="relative">
                <Input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(event) => setDateFrom(event.target.value)}
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

            <Box flex="1" minW="150px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Date To
              </Text>
              <Box position="relative">
                <Input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  max={today()}
                  onChange={(event) => setDateTo(event.target.value)}
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

        {pageError && (
          <Box mb={4} p={3} borderRadius="6px" bg="#FFF5F5" border="1px solid #FED7D7">
            <Text color="red.600" fontSize="12px">
              {pageError}
            </Text>
          </Box>
        )}

        {loading ? (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" py={14} textAlign="center">
            <Text color={SECONDARY_TEXT} fontSize="12px">
              Loading subscription payments…
            </Text>
          </Box>
        ) : (data.wards || []).length === 0 ? (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" py={14} textAlign="center">
            <Text color={TEXT_COLOR} fontSize="15px" fontWeight="600">
              No payments found
            </Text>
            <Text color={SECONDARY_TEXT} fontSize="12px" mt={1}>
              No subscription payments in this period.
            </Text>
          </Box>
        ) : (
          <PaidTable wards={data.wards} />
        )}

        <Flex
          mt={4}
          justify="space-between"
          align="center"
          direction={{ base: "column", md: "row" }}
          gap={2}
        >
          <Text color={SECONDARY_TEXT} fontSize="12px">
            Showing 1–{totalMembers} of {totalMembers} paid members
          </Text>
        </Flex>
      </Container>

      <Footer />

      <ChurchPrintModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="SUBSCRIPTION PAID LIST"
        church={church}
        subtitle={
          <>
            <Text as="span" fontWeight="700">
              Period:
            </Text>{" "}
            {periodLabel}
          </>
        }
      >
        <PaidTable wards={data.wards || []} forPrint />
      </ChurchPrintModal>
    </Box>
  );
};

export default SubscriptionPaidListPage;