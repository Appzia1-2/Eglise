// src/pages/RegistrationConfigView.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuPrinter,
  LuFileText,
  LuPencil,
  LuInfo,
  LuCalendarDays,
  LuUser,
  LuDroplet,
  LuWine,
  LuUsers,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toaster } from "../components/ui/toaster";
import { listRegisterSettings } from "../api/registryServices";

// ============================================================
// THEME CONSTANTS (matched to screenshot)
// ============================================================
const RED = "#E31B23";
const RED_HOVER = "#C4141B";
const RED_SOFT = "#FFF0F0";
const PINK = "#FDE9EC";
const BLUE = "#1D3FD8";
const NAVY = "#1C2B6B";
const VALUE = "#2F4BB0";
const MUTED = "#5F6F8F";
const BORDER = "#E3E8F0";
const GREEN = "#1E9E3E";

const REGISTER_LABELS = {
  BAPTISM: "Baptism Register",
  MARRIAGE: "Marriage Register",
  DEATH: "Death Register",
  HEAD: "Family Register",
  CERTIFICATE: "Certificate",
};

const formatTitle = (type = "") =>
  REGISTER_LABELS[type] ||
  `${type.toLowerCase().replace(/_/g, " ")} Register`.replace(/\b\w/g, (c) =>
    c.toUpperCase()
  );

// Financial year (Apr–Mar) -> 2-digit start year, e.g. Nov 2026 -> "26"
const getFinancialYearCode = () => {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return String(y).slice(-2);
};

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ------------------------------------------------------------
// Reusable pieces
// ------------------------------------------------------------
const Row = ({ label, value, labelW = "160px", mono }) => (
  <Flex align="flex-start" minH="22px">
    <Text
      w={labelW}
      flexShrink={0}
      fontSize="14px"
      fontWeight="600"
      color={NAVY}
      lineHeight="22px"
    >
      {label}
    </Text>
    <Text
      fontSize={mono ? "13px" : "14px"}
      color={VALUE}
      lineHeight="22px"
      wordBreak="break-word"
    >
      {value}
    </Text>
  </Flex>
);

const DetailsCard = ({ icon, title, columns, left, right }) => (
  <Box
    bg="white"
    border={`1px solid ${BORDER}`}
    borderRadius="4px"
    px="34px"
    pt="16px"
    pb="20px"
  >
    <HStack gap={4} mb="10px">
      <Flex
        w="44px"
        h="44px"
        borderRadius="full"
        bg={PINK}
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icon as={icon} boxSize={5} color={RED} />
      </Flex>
      <Text fontSize="16px" fontWeight="500" color={NAVY}>
        {title}
      </Text>
    </HStack>

    <Box
      display="grid"
      gridTemplateColumns={{ base: "1fr", md: columns }}
      ml="8px"
    >
      <VStack align="stretch" gap="10px" pr={{ md: "20px" }}>
        {left}
      </VStack>
      <VStack
        align="stretch"
        gap="10px"
        borderLeft={{ md: `1px solid ${BORDER}` }}
        pl={{ md: "40px" }}
        mt={{ base: 4, md: 0 }}
      >
        {right}
      </VStack>
    </Box>
  </Box>
);

const OutlineButton = ({ icon, children, ...rest }) => (
  <Button
    variant="outline"
    bg="white"
    borderColor={RED}
    color={RED}
    h="46px"
    px={6}
    borderRadius="4px"
    fontSize="15px"
    fontWeight="500"
    _hover={{ bg: RED_SOFT }}
    {...rest}
  >
    <Icon as={icon} boxSize="22px" />
    {children}
  </Button>
);

const InfoCell = ({ divider, children, ...rest }) => (
  <Flex align="center" position="relative" minH="70px" {...rest}>
    {divider && (
      <Box
        display={{ base: "none", md: "block" }}
        position="absolute"
        left="0"
        top="50%"
        transform="translateY(-50%)"
        w="1px"
        h="32px"
        bg={BORDER}
      />
    )}
    {children}
  </Flex>
);

// ============================================================
// PAGE
// ============================================================
const RegistrationConfigView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await listRegisterSettings();
        const allSettings = res.data || [];
        const existing = allSettings.find(
          (s) => String(s.id) === String(id) || s.register_type === id
        );

        if (existing) {
          setConfig(existing);
        } else {
          toaster.create({ title: "Configuration not found", type: "error" });
          navigate("/register-settings");
        }
      } catch (err) {
        toaster.create({ title: "Failed to load configuration", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <Box minH="100vh" bg="white" display="flex" alignItems="center" justifyContent="center">
        <Spinner color={RED} size="xl" />
      </Box>
    );
  }

  if (!config) return null;

  // ---------------- Derived values ----------------
  const PARISH_CODE = "CHR-0012";
  const title = formatTitle(config.register_type);
  const sep = config.separator || "/";
  const padding = config.register_padding || 5;
  const nextNumber = config.next_register_number || 1;
  const currentNumber = Math.max(0, nextNumber - 1);
  const useFY = !!config.use_financial_year;
  const active = config.is_active !== false;

  const nextSeq = config.include_leading_zeros
    ? String(nextNumber).padStart(padding, "0")
    : String(nextNumber);

  const previewString = [
    config.register_prefix || "PRE",
    config.include_parish_code ? PARISH_CODE : "",
    useFY ? getFinancialYearCode() : "",
    nextSeq,
    config.register_suffix || "",
  ]
    .filter(Boolean)
    .join(sep);

  const formatPattern = [
    "{PREFIX}",
    config.include_parish_code ? "{PARISH_CODE}" : "",
    useFY ? "{FINANCIAL_YEAR}" : "",
    "{SEQUENCE}",
    config.register_suffix ? "{SUFFIX}" : "",
  ]
    .filter(Boolean)
    .join(sep);

  const resetLabel = useFY ? "Financial Year" : "Calendar Year";
  const createdOn = formatDate(config.created_at) || "01 Apr 2026";
  const updatedOn = formatDate(config.updated_at) || "14 Aug 2026";
  const updatedBy = config.updated_by_name || "Super Admin";

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="100%" px={{ base: 4, md: "27px" }} py={5} flex="1">
        {/* Breadcrumb */}
        <HStack gap={4} mb={3} fontSize="13px" color={BLUE} flexWrap="wrap">
          <Text cursor="pointer" onClick={() => navigate("/masters")}>
            Masters
          </Text>
          <Text color={MUTED}>/</Text>
          <Text cursor="pointer" onClick={() => navigate("/register-settings")}>
            Registration Number Configuration
          </Text>
          <Text color={MUTED}>/</Text>
          <Text cursor="pointer" onClick={() => navigate(`/register-settings/${config.id}`)}>
            {title}
          </Text>
          <Text color={MUTED}>/</Text>
          <Text>Details</Text>
        </HStack>

        {/* Header */}
        <Flex
          justify="space-between"
          align="flex-start"
          direction={{ base: "column", xl: "row" }}
          gap={4}
          mb={5}
        >
          <Box>
            <Text fontSize="12px" fontWeight="500" color={RED} lineHeight="1.4">
              REGISTRATION NUMBER CONFIGURATION
            </Text>
            <Heading
              color={BLUE}
              fontSize={{ base: "22px", md: "28px" }}
              fontWeight="600"
              lineHeight="1.25"
              mb="4px"
            >
              Registration Number Configuration Details
            </Heading>
            <Text color={MUTED} fontSize="13px">
              View numbering rules configured for {title}.
            </Text>
          </Box>

          <HStack gap={5} flexWrap="wrap">
            <OutlineButton icon={LuArrowLeft} onClick={() => navigate("/register-settings")}>
              Back
            </OutlineButton>
            {/* <OutlineButton icon={LuPrinter} onClick={() => window.print()}>
              Print
            </OutlineButton>
            <OutlineButton icon={LuFileText} onClick={() => window.print()}>
              Generate PDF
            </OutlineButton> */}
            <Button
              bg={RED}
              color="white"
              h="46px"
              px={6}
              borderRadius="4px"
              fontSize="15px"
              fontWeight="500"
              _hover={{ bg: RED_HOVER }}
              onClick={() => navigate(`/register-settings/${config.id}/edit`)}
            >
              <Icon as={LuPencil} boxSize="22px" />
              Edit Configuration
            </Button>
          </HStack>
        </Flex>

        {/* Main Layout */}
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", lg: "442fr 1119fr" }}
          gap={{ base: 5, lg: "44px" }}
          alignItems="start"
        >
          {/* ========== LEFT SUMMARY CARD ========== */}
          <Box
            bg="white"
            border={`1px solid ${BORDER}`}
            borderRadius="4px"
            px="34px"
            pt="30px"
            pb="34px"
          >
            <Text fontSize="28px" fontWeight="500" color={BLUE} lineHeight="1.2" mb={3}>
              {title}
            </Text>

            <HStack gap={4} mb={3} fontSize="18px" color={VALUE}>
              <Text>Prefix</Text>
              <Box w="7px" h="7px" borderRadius="full" bg={BLUE} />
              <Text>{config.register_prefix || "-"}</Text>
            </HStack>

            <HStack
              display="inline-flex"
              gap={3}
              px={4}
              h="34px"
              bg={active ? "#DDF3E0" : "#F1F3F7"}
              border={`1px solid ${active ? "#A9DDB1" : BORDER}`}
              borderRadius="4px"
              mb="28px"
            >
              <Box w="14px" h="14px" borderRadius="full" bg={active ? GREEN : MUTED} />
              <Text fontSize="16px" color={active ? GREEN : MUTED}>
                {active ? "Active" : "Inactive"}
              </Text>
            </HStack>

            <Box borderBottom={`1px solid ${BORDER}`} mb="22px" />

            <Text fontSize="16px" fontWeight="600" color={NAVY} mb="6px">
              Number Preview
            </Text>
            <Text fontSize="22px" color={VALUE} mb="22px" wordBreak="break-word">
              {previewString}
            </Text>

            <Box borderBottom={`1px solid ${BORDER}`} mb="22px" />

            <Text fontSize="16px" fontWeight="600" color={NAVY}>
              Generation
            </Text>
            <Text fontSize="18px" color={VALUE} mb="22px">
              Automatic
            </Text>

            <Text fontSize="16px" fontWeight="600" color={NAVY}>
              Reset
            </Text>
            <Text fontSize="18px" color={VALUE} mb="32px">
              {resetLabel}
            </Text>

            <HStack
              as="button"
              gap={4}
              color={RED}
              fontSize="18px"
              cursor="pointer"
              onClick={() => navigate("/register")}
              _hover={{ opacity: 0.8 }}
            >
              <Text>View Register</Text>
              <Icon as={LuArrowRight} boxSize="22px" />
            </HStack>
          </Box>

          {/* ========== RIGHT DETAIL CARDS ========== */}
          <VStack gap="12px" align="stretch">
            <DetailsCard
              icon={LuDroplet}
              title="Register & Generation Information"
              columns="1fr 1fr"
              left={
                <>
                  <Row label="Register" value={title} labelW="194px" />
                  <Row label="Generation Mode" value="Automatic" labelW="194px" />
                  <Row label="Prefix" value={config.register_prefix || "-"} labelW="194px" />
                </>
              }
              right={
                <>
                  <Row label="Separator" value={sep} labelW="162px" />
                  <Row label="Suffix" value={config.register_suffix || "Not Configured"} labelW="162px" />
                  <Row label="Status" value={active ? "Active" : "Inactive"} labelW="162px" />
                </>
              }
            />

            <DetailsCard
              icon={LuWine}
              title="Financial Year & Reset"
              columns="1fr 1fr"
              left={
                <>
                  <Row
                    label="Include Parish Code"
                    value={config.include_parish_code ? "Yes" : "No"}
                    labelW="194px"
                  />
                  <Row label="Parish Code" value={PARISH_CODE} labelW="194px" />
                  <Row
                    label="Include Financial Year"
                    value={useFY ? "Yes" : "No"}
                    labelW="194px"
                  />
                </>
              }
              right={
                <>
                  <Row label="Year Format" value="YY" labelW="162px" />
                  <Row label="Reset Sequence" value={resetLabel} labelW="162px" />
                  <Row
                    label="Reset Date"
                    value={useFY ? "01 April" : "01 January"}
                    labelW="162px"
                  />
                </>
              }
            />

            <DetailsCard
              icon={LuUsers}
              title="Sequence Controls"
              columns="1fr auto"
              left={
                <>
                  <Row label="Sequence Length" value={`${padding} digits`} labelW="194px" />
                  <Row label="Starting Number" value={config.starting_number ?? 1} labelW="194px" />
                  <Row label="Current Number" value={currentNumber} labelW="194px" />
                </>
              }
              right={
                <>
                  <Row
                    label="Leading Zeros"
                    value={config.include_leading_zeros ? "Yes" : "No"}
                    labelW="152px"
                  />
                  <Row label="Manual Override" value="No" labelW="152px" />
                  <Row label="Format Pattern" value={formatPattern} labelW="152px" mono />
                </>
              }
            />
          </VStack>
        </Box>

        {/* Record Information */}
        <Box
          bg="white"
          border={`1px solid ${BORDER}`}
          borderRadius="4px"
          mt={5}
          display="grid"
          gridTemplateColumns={{ base: "1fr", md: "467fr 519fr 619fr" }}
        >
          <InfoCell pl="36px" gap={6}>
            <Icon as={LuInfo} boxSize="38px" color={BLUE} strokeWidth={1.5} />
            <Text fontSize="16px" fontWeight="600" color={NAVY}>
              Record Information
            </Text>
          </InfoCell>

          <InfoCell divider pl="64px" gap={5}>
            <Icon as={LuCalendarDays} boxSize="32px" color={BLUE} strokeWidth={1.5} />
            <Text fontSize="15px" color={NAVY}>
              Created on {createdOn}
            </Text>
          </InfoCell>

          <InfoCell divider pl="70px" gap={6}>
            <Icon as={LuUser} boxSize="32px" color={BLUE} strokeWidth={1.5} />
            <Text fontSize="15px" color={NAVY}>
              Last updated {updatedOn} by {updatedBy}
            </Text>
          </InfoCell>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default RegistrationConfigView;