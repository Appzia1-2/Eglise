// src/pages/RegisterSettingsPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  Badge,
  Icon,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import {
  LuPlus,
  LuSearch,
  LuFilter,
  LuSettings,
  LuFileDigit,
  LuEye,
  LuPencil,
  LuCircleCheck,
  LuCalendarClock,
  LuChevronDown,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toaster } from "../components/ui/toaster";
import { listRegisterSettings } from "../api/registryServices";

const PAGE_SIZE = 6;

// ============================================================
// THEME CONSTANTS
// ============================================================
const RED = "#E01E26";
const RED_BTN = "#C9151B";
const RED_BTN_HOVER = "#A91217";
const RED_SOFT = "#FFF0F0";
const NAVY = "#1C2B6B";
const LINK = "#2563C4";
const MUTED = "#6B7A99";
const SUBTLE_BLUE = "#5C7AA5";
const BORDER = "#E3E8F0";
const INPUT_BORDER = "#D5DCE8";

// ------------------------------------------------------------
// Small reusable pieces
// ------------------------------------------------------------
const FilterSelect = ({ value, onChange, children }) => (
  <Box position="relative" h="48px">
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        height: "48px",
        padding: "0 40px 0 18px",
        border: `1px solid ${INPUT_BORDER}`,
        borderRadius: "4px",
        fontSize: "13px",
        color: SUBTLE_BLUE,
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
      color={NAVY}
      pointerEvents="none"
    />
  </Box>
);

const Field = ({ label, value, ...rest }) => (
  <Box {...rest}>
    <Text fontSize="12px" fontWeight="700" color={NAVY} lineHeight="1.3">
      {label}
    </Text>
    <Text fontSize="13px" color={NAVY} lineHeight="1.4">
      {value}
    </Text>
  </Box>
);

const RegisterSettingsPage = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [resetFilter, setResetFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await listRegisterSettings();
      setSettings(res.data || []);
    } catch (error) {
      toaster.create({ title: "Failed to load configurations", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = (s) => s.is_active !== false;

  // ---------------- Filter ----------------
  const filteredSettings = settings.filter((s) => {
    const kw = search.toLowerCase();
    const matchesSearch =
      (s.register_type || "").toLowerCase().includes(kw) ||
      (s.register_prefix || "").toLowerCase().includes(kw);

    const matchesMode = modeFilter === "all" || modeFilter === "automatic";
    const matchesReset =
      resetFilter === "all" ||
      (resetFilter === "financial" && !!s.use_financial_year) ||
      (resetFilter === "calendar" && !s.use_financial_year);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isActive(s)) ||
      (statusFilter === "inactive" && !isActive(s));

    return matchesSearch && matchesMode && matchesReset && matchesStatus;
  });

  const hasFilters =
    !!search || modeFilter !== "all" || resetFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setModeFilter("all");
    setResetFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  // ---------------- Pagination ----------------
  const totalItems = filteredSettings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedSettings = filteredSettings.slice(startIndex, startIndex + PAGE_SIZE);

  const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + paginatedSettings.length, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (safePage > 3) pages.push("...");
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) if (!pages.includes(i)) pages.push(i);
    if (safePage < totalPages - 2) pages.push("...");
    if (!pages.includes(totalPages)) pages.push(totalPages);
    return pages;
  };

  // ---------------- Number helpers ----------------
  const buildNumber = (setting, masked) => {
    const padding = Number(setting.register_padding) || 4;
    let numberPart;
    if (masked) {
      numberPart = "#".repeat(padding);
    } else if (setting.include_leading_zeros) {
      numberPart = String(setting.next_register_number).padStart(padding, "0");
    } else {
      numberPart = String(setting.next_register_number);
    }

    // Use the real church code from the serializer (source="church.code"),
    // not a hardcoded placeholder. Fall back to empty string if null.
    const parishCode = setting.include_parish_code
      ? (setting.church_code || "")
      : "";

    // Mirror the backend's _financial_year_label() exactly so the
    // dashboard preview matches what the real number will be.
    const fyLabel = setting.use_financial_year
      ? (() => {
          const today = new Date();
          const startMonth = setting.financial_year_start_month || 4;
          const year =
            today.getMonth() + 1 >= startMonth
              ? today.getFullYear()
              : today.getFullYear() - 1;
          const endYear = year + 1;
          const fmt = setting.financial_year_format || "YYYY-YY";
          if (fmt === "YYYY-YY") {
            return `${year}-${String(endYear).slice(-2).padStart(2, "0")}`;
          }
          if (fmt === "YYYY-YYYY") return `${year}-${endYear}`;
          if (fmt === "YYYY") return String(year);
          if (fmt === "YY") return String(year).slice(-2).padStart(2, "0");
          return `${year}-${String(endYear).slice(-2).padStart(2, "0")}`;
        })()
      : "";

    const parts = [
      setting.register_prefix || "",
      parishCode,
      fyLabel,
      numberPart,
      setting.register_suffix || "",
    ].filter(Boolean);

    return parts.join(setting.separator || "/");
  };

  const formatTitle = (type = "") =>
    `${type.toLowerCase().replace(/_/g, " ")} Register`;

  // ---------------- Stats ----------------
  const stats = [
    { label: "Total Configurations", val: settings.length, icon: LuFileDigit },
    { label: "Automatic", val: settings.length, icon: LuSettings },
    { label: "Active", val: settings.filter(isActive).length, icon: LuCircleCheck },
    {
      label: "Financial Year Reset",
      val: settings.filter((s) => s.use_financial_year).length,
      icon: LuCalendarClock,
    },
  ];

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="100%" px={{ base: 4, md: "35px" }} py={6} flex="1">
        {/* Breadcrumb */}
        <HStack gap={3} mb={4} fontSize="13px">
          <Text color={LINK} cursor="pointer" onClick={() => navigate("/masters")}>
            Masters
          </Text>
          <Text color={MUTED}>/</Text>
          <Text color={LINK}>Registration Number Configuration</Text>
        </HStack>

        {/* Header */}
        <Flex
          justify="space-between"
          align="flex-start"
          direction={{ base: "column", lg: "row" }}
          gap={4}
          mb={5}
        >
          <Box>
            <Text
              fontSize="13px"
              fontWeight="700"
              color={RED}
              letterSpacing="0.3px"
              mb="2px"
            >
              REGISTRATION NUMBER CONFIGURATION
            </Text>
            <Heading
              color={NAVY}
              fontSize={{ base: "24px", md: "32px" }}
              fontWeight="500"
              lineHeight="1.2"
              mb="2px"
            >
              Registration Number Configuration Dashboard
            </Heading>
            <Text color={LINK} fontSize="13px">
              Manage registration number formats and sequences for parish registers.
            </Text>
          </Box>

          <Button
            bg={RED_BTN}
            color="white"
            h="48px"
            w={{ base: "100%", lg: "222px" }}
            px={5}
            borderRadius="4px"
            justifyContent="space-between"
            fontSize="14px"
            fontWeight="500"
            _hover={{ bg: RED_BTN_HOVER }}
            onClick={() => navigate("/register-settings/create")}
          >
            <Icon as={LuPlus} boxSize={6} />
            <Text as="span">Add Configuration</Text>
            <Icon as={LuChevronDown} boxSize={5} />
          </Button>
        </Flex>

        {/* Stats Row */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={5} mb={6}>
          {stats.map((stat) => (
            <Flex
              key={stat.label}
              align="center"
              gap={9}
              h="92px"
              pl={5}
              pr={4}
              border={`1px solid ${BORDER}`}
              borderRadius="6px"
              bg="white"
            >
              <Icon as={stat.icon} boxSize="44px" color={RED} strokeWidth={1.5} />
              <Box>
                <Text fontSize="13px" color={MUTED} lineHeight="1.2">
                  {stat.label}
                </Text>
                <Text fontSize="28px" fontWeight="700" color={NAVY} lineHeight="1.2">
                  {stat.val}
                </Text>
              </Box>
            </Flex>
          ))}
        </SimpleGrid>

        {/* Filter Bar */}
        <Box
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            md: "1fr 1fr",
            lg: "1.8fr 1fr 0.95fr 1.1fr 140px",
          }}
          gap={{ base: 3, lg: "28px" }}
          mb={6}
        >
          <HStack
            border={`1px solid ${INPUT_BORDER}`}
            borderRadius="4px"
            px={4}
            h="48px"
            gap={3}
            bg="white"
          >
            <Icon as={LuSearch} boxSize={5} color={NAVY} flexShrink={0} />
            <input
              placeholder="Search register type or prefix"
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                fontSize: "13px",
                color: NAVY,
                background: "transparent",
              }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </HStack>

          <FilterSelect
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Generation Modes</option>
            <option value="automatic">Automatic</option>
          </FilterSelect>

          <FilterSelect
            value={resetFilter}
            onChange={(e) => {
              setResetFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Reset Rules</option>
            <option value="financial">Financial Year</option>
            <option value="calendar">Calendar Year</option>
          </FilterSelect>

          <FilterSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>

          <Button
            variant="outline"
            bg="white"
            borderColor={RED}
            color={RED}
            h="48px"
            borderRadius="4px"
            fontSize="14px"
            fontWeight="600"
            _hover={{ bg: RED_SOFT }}
            onClick={() => hasFilters && clearFilters()}
          >
            <Icon as={LuFilter} boxSize={5} />
            {hasFilters ? "Clear" : "Filter"}
          </Button>
        </Box>

        {/* List Header */}
        <Box mb={3}>
          <Heading fontSize="20px" fontWeight="500" color={NAVY} lineHeight="1.3">
            Configured Registers
          </Heading>
          <Text fontSize="12px" color={SUBTLE_BLUE}>
            Showing {showingFrom}–{showingTo} of {totalItems} configurations
          </Text>
        </Box>

        {/* Cards Grid */}
        {isLoading ? (
          <Flex justify="center" py={10}>
            <Spinner color={RED} size="xl" />
          </Flex>
        ) : paginatedSettings.length === 0 ? (
          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="6px"
            py={16}
            textAlign="center"
            bg="white"
          >
            <Text color={MUTED} fontSize="13px">
              No configurations found.
            </Text>
            <Button
              mt={4}
              bg={RED_BTN}
              color="white"
              size="sm"
              onClick={clearFilters}
              _hover={{ bg: RED_BTN_HOVER }}
            >
              Clear Filters
            </Button>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="28px">
            {paginatedSettings.map((setting) => (
              <Box
                key={setting.id}
                position="relative"
                minH="185px"
                pt="14px"
                pb="12px"
                px="16px"
                border={`1px solid ${BORDER}`}
                borderRadius="4px"
                bg="white"
              >
                {/* Title + badge */}
                <HStack gap={4} mb={3}>
                  <Text
                    fontSize="18px"
                    fontWeight="500"
                    color={NAVY}
                    textTransform="capitalize"
                    lineHeight="1.3"
                  >
                    {formatTitle(setting.register_type)}
                  </Text>
                  <Badge
                    bg="white"
                    color={RED}
                    border={`1px solid ${RED}`}
                    borderRadius="3px"
                    px={3}
                    h="22px"
                    fontSize="10px"
                    fontWeight="500"
                    textTransform="none"
                  >
                    {isActive(setting) ? "Active" : "Inactive"}
                  </Badge>
                </HStack>

                {/* Two-column details */}
                <Box display="grid" gridTemplateColumns="40% 1fr">
                  <VStack align="stretch" gap="8px">
                    <Field label="Prefix" value={setting.register_prefix || "-"} />
                    <Field label="Mode" value="Automatic" />
                  </VStack>

                  <VStack align="stretch" gap="6px">
                    <Field label="Number Format" value={buildNumber(setting, true)} />
                    <Field label="Next Number" value={buildNumber(setting, false)} />
                    <Field
                      label="Reset"
                      value={setting.use_financial_year ? "Financial Year" : "Calendar Year"}
                    />
                  </VStack>
                </Box>

                {/* Last updated (audit trail) */}
                {setting.updated_at && (
                  <Text fontSize="10px" color={MUTED} mt={2} mb={1}>
                    Last updated:{" "}
                    {new Date(setting.updated_at).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                )}

                {/* Actions */}
                <HStack position="absolute" right="14px" bottom="12px" gap={1}>
                  <IconButton
                    aria-label="View"
                    variant="ghost"
                    size="sm"
                    color={RED}
                    onClick={() => navigate(`/register-settings/${setting.id}`)}
                    _hover={{ bg: RED_SOFT }}
                  >
                    <Icon as={LuEye} boxSize={5} />
                  </IconButton>
                  <IconButton
                    aria-label="Edit"
                    variant="ghost"
                    size="sm"
                    color={RED}
                    onClick={() => navigate(`/register-settings/${setting.id}/edit`)}
                    _hover={{ bg: RED_SOFT }}
                  >
                    <Icon as={LuPencil} boxSize={5} />
                  </IconButton>
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        )}

        {/* Pagination */}
        <Flex
          mt={6}
          align="center"
          justify="space-between"
          direction={{ base: "column", md: "row" }}
          gap={4}
        >
          <Text color={SUBTLE_BLUE} fontSize="12px">
            Showing {showingFrom}–{showingTo} of {totalItems} configurations
          </Text>

          <HStack gap={3}>
            <Button
              variant="outline"
              h="40px"
              px={6}
              borderRadius="4px"
              borderColor={BORDER}
              color={LINK}
              fontSize="13px"
              fontWeight="500"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>

            {getPageNumbers().map((p, i) => {
              if (p === "...")
                return (
                  <Text key={`dots-${i}`} px={2} color={MUTED}>
                    ...
                  </Text>
                );
              const isCurrent = safePage === p;
              return (
                <Button
                  key={p}
                  h="40px"
                  minW="56px"
                  borderRadius="4px"
                  fontSize="14px"
                  fontWeight="700"
                  bg={isCurrent ? RED_BTN : "white"}
                  color={isCurrent ? "white" : LINK}
                  border={`1px solid ${isCurrent ? RED_BTN : BORDER}`}
                  onClick={() => setPage(p)}
                  _hover={{ bg: isCurrent ? RED_BTN_HOVER : "#F8FAFC" }}
                >
                  {p}
                </Button>
              );
            })}

            <Button
              variant="outline"
              h="40px"
              px={6}
              borderRadius="4px"
              borderColor={BORDER}
              color={LINK}
              fontSize="13px"
              fontWeight="500"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </HStack>
        </Flex>
      </Container>

      <Footer />
    </Box>
  );
};

export default RegisterSettingsPage;