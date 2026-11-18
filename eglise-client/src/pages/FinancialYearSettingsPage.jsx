// src/pages/FinancialYearSettingsPage.jsx

import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@chakra-ui/react";
import {
  LuHouse,
  LuArrowLeft,
  LuCalendarCheck,
  LuCalendarDays,
  LuBookOpen,
  LuShieldCheck,
  LuSettings,
  LuCircleCheck,
  LuInfo,
  LuSquarePen,
  LuChevronDown,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
const CHECK_BLUE = "#2B47C4";

// 🚀 CHANGE THIS to match the route of your "Previous Financial Years" page
const PREVIOUS_YEARS_ROUTE = "/financial-years";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-04-01" -> "01 Apr 2026"
const formatDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
};

// Date -> "14 Aug 2026, 10:30 AM"
const formatDateTime = (date) => {
  const h = date.getHours();
  const h12 = h % 12 || 12;
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${h12}:${mm} ${h >= 12 ? "PM" : "AM"}`;
};

// ------------------------------------------------------------
// Style objects for native inputs
// ------------------------------------------------------------
const inputStyle = {
  width: "100%",
  height: "34px",
  padding: "0 12px",
  fontSize: "13px",
  border: `1px solid ${INPUT_BORDER}`,
  borderRadius: "3px",
  outline: "none",
  color: NAVY,
  backgroundColor: "white",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "500",
  marginBottom: "4px",
  display: "block",
  color: NAVY,
  lineHeight: "15px",
};

const Req = () => <span style={{ color: RED }}> *</span>;

// ------------------------------------------------------------
// Reusable pieces
// ------------------------------------------------------------
const Card = ({ children, ...rest }) => (
  <Box bg="white" border={`1px solid ${BORDER}`} borderRadius="4px" px="20px" py="12px" {...rest}>
    {children}
  </Box>
);

const CardHeader = ({ icon, title, subtitle }) => (
  <HStack gap={4} mb={2} align="center">
    <Flex w="44px" h="44px" borderRadius="full" bg={PINK} align="center" justify="center" flexShrink={0}>
      <Icon as={icon} boxSize={5} color={RED} />
    </Flex>
    <Box>
      <Text fontSize="17px" fontWeight="500" color={NAVY} lineHeight="1.2">
        {title}
      </Text>
      {subtitle && (
        <Text fontSize="11px" color={NAVY}>
          {subtitle}
        </Text>
      )}
    </Box>
  </HStack>
);

const Toggle = ({ checked, onChange }) => (
  <Box
    as="button"
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    w="44px"
    h="22px"
    borderRadius="full"
    bg={checked ? RED : "#D3D9E3"}
    position="relative"
    transition="background 0.2s"
    flexShrink={0}
    cursor="pointer"
  >
    <Box
      position="absolute"
      top="2px"
      left={checked ? "24px" : "2px"}
      w="18px"
      h="18px"
      borderRadius="full"
      bg="white"
      transition="left 0.2s"
      boxShadow="0 1px 3px rgba(0,0,0,0.2)"
    />
  </Box>
);

const ControlRow = ({ label, desc, checked, onChange, last }) => (
  <Flex
    justify="space-between"
    align="center"
    gap={4}
    minH="41px"
    py="4px"
    borderBottom={last ? "none" : `1px solid ${BORDER}`}
  >
    <Box>
      <Text fontSize="12px" fontWeight="600" color={NAVY} lineHeight="1.3">
        {label}
      </Text>
      <Text fontSize="11px" color={MUTED} lineHeight="1.3">
        {desc}
      </Text>
    </Box>
    <Toggle checked={checked} onChange={onChange} />
  </Flex>
);

const SelectField = ({ value, onChange, children }) => (
  <Box position="relative">
    <select
      value={value}
      onChange={onChange}
      style={{
        ...inputStyle,
        paddingRight: "34px",
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
      right="12px"
      top="50%"
      transform="translateY(-50%)"
      boxSize={4}
      color={BLUE}
      pointerEvents="none"
    />
  </Box>
);

// Shows "01 Apr 2026" but still opens the native date picker
const DateField = ({ value, onChange }) => {
  const ref = useRef(null);
  return (
    <Box
      position="relative"
      h="34px"
      border={`1px solid ${INPUT_BORDER}`}
      borderRadius="3px"
      bg="white"
    >
      <Flex align="center" justify="space-between" h="100%" px="12px">
        <Text fontSize="13px" color={NAVY}>
          {formatDate(value)}
        </Text>
        <Icon as={LuCalendarDays} boxSize={5} color={BLUE} />
      </Flex>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={onChange}
        onClick={() => {
          try {
            ref.current?.showPicker?.();
          } catch (e) {
            /* showPicker not supported – native behaviour applies */
          }
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "pointer",
        }}
      />
    </Box>
  );
};

const BannerCell = ({ divider, children, ...rest }) => (
  <Flex align="center" position="relative" minH="82px" {...rest}>
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

const InfoRow = ({ label, value, valueColor = NAVY, last }) => (
  <Flex
    justify="space-between"
    align="center"
    minH="26px"
    borderBottom={last ? "none" : `1px solid ${BORDER}`}
    fontSize="12px"
  >
    <Text color={NAVY}>{label}</Text>
    <Text color={valueColor} textAlign="right">
      {value}
    </Text>
  </Flex>
);

// ============================================================
// PAGE
// ============================================================
const INITIAL = {
  name: "2026 – 2027",
  previous_year: "2025 – 2026",
  start_date: "2026-04-01",
  end_date: "2027-03-31",
  description: "Financial year for parish accounts and reports.",
  is_active: true,
  is_current: true,
  carry_forward: true,
  backdated: false,
  lock: true,
};

const FinancialYearSettingsPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL);
  // Last saved values – drive the banner and "Current Configuration" card
  const [saved, setSaved] = useState({ ...INITIAL, updated_at: "14 Aug 2026, 10:30 AM" });

  const set = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const goToPreviousYears = () => navigate(PREVIOUS_YEARS_ROUTE);
  const goToDashboard = () => navigate("/dashboard");

  const handleSave = () => {
    if (!formData.name.trim()) {
      toaster.create({ title: "Financial Year Name is required", type: "error" });
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      toaster.create({ title: "Start Date and End Date are required", type: "error" });
      return;
    }
    if (formData.start_date >= formData.end_date) {
      toaster.create({ title: "Start Date must be before End Date", type: "error" });
      return;
    }

    // 🔌 Hook your API call here (create/update financial year) before updating local state
    setSaved({ ...formData, updated_at: formatDateTime(new Date()) });
    toaster.create({ title: "Financial year saved", type: "success" });
  };

  const savedPeriod = `${formatDate(saved.start_date)} – ${formatDate(saved.end_date)}`;

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="100%" px={{ base: 4, md: "27px" }} py={5} flex="1">
        {/* Breadcrumb */}
        <HStack gap={3} mb={3} fontSize="15px" color={BLUE}>
          <Icon as={LuHouse} boxSize={5} />
          <Text cursor="pointer" onClick={goToDashboard}>
            Home
          </Text>
          <Text color={MUTED}>/</Text>
          <Text cursor="pointer" onClick={() => navigate("/settings")}>
            Settings
          </Text>
          <Text color={MUTED}>/</Text>
          <Text>Financial Year</Text>
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
              Financial Year Settings
            </Heading>
            <Text color={BLUE} fontSize="13px">
              Configure the accounting period used for transactions and financial reports.
            </Text>
          </Box>
          <Button
            variant="outline"
            bg="white"
            borderColor={RED}
            color={RED}
            h="42px"
            w="106px"
            borderRadius="4px"
            fontSize="14px"
            fontWeight="500"
            onClick={goToPreviousYears}
            _hover={{ bg: RED_SOFT }}
          >
            <Icon as={LuArrowLeft} boxSize={5} />
            Back
          </Button>
        </Flex>

        {/* Current Year Banner */}
        <Box
          bg="white"
          border={`1px solid ${BORDER}`}
          borderRadius="4px"
          mb="12px"
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
                {saved.name}
              </Text>
              <Text fontSize="13px" color={MUTED} lineHeight="1.3">
                {savedPeriod}
              </Text>
            </Box>
          </BannerCell>

          <BannerCell divider justify="center" gap={3}>
            <Box w="14px" h="14px" borderRadius="full" bg={saved.is_active ? GREEN : MUTED} />
            <Text fontSize="14px" color={saved.is_active ? GREEN : MUTED}>
              {saved.is_active ? "Active" : "Inactive"}
            </Text>
          </BannerCell>

          <BannerCell divider justify="center">
            <HStack gap={3} px={4} h="30px" border={`1px solid ${GREEN}`} borderRadius="3px" color={GREEN} bg="white">
              <Icon as={LuBookOpen} boxSize={5} />
              <Text fontSize="14px">Books Open</Text>
            </HStack>
          </BannerCell>

          <BannerCell divider pl="30px" gap={3}>
            {saved.is_current && (
              <>
                <Icon as={LuShieldCheck} boxSize={6} color={NAVY} />
                <Text fontSize="14px" color={NAVY}>
                  Current Year
                </Text>
              </>
            )}
          </BannerCell>
        </Box>

        {/* Main Grid */}
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", lg: "1.565fr 1fr" }}
          gap="26px"
          alignItems="start"
        >
          {/* ================= LEFT COLUMN ================= */}
          <VStack gap="10px" align="stretch">
            {/* Financial Year Details */}
            <Card pb="14px">
              <CardHeader
                icon={LuCalendarCheck}
                title="Financial Year Details"
                subtitle="Define the accounting period and status."
              />

              <Box
                display="grid"
                gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
                columnGap="40px"
                rowGap="8px"
              >
                <Box>
                  <label style={labelStyle}>
                    Financial Year Name<Req />
                  </label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. 2026 – 2027"
                    value={formData.name}
                    onChange={(e) => set({ name: e.target.value })}
                  />
                </Box>

                <Box>
                  <label style={labelStyle}>Previous Financial Year</label>
                  <SelectField
                    value={formData.previous_year}
                    onChange={(e) => set({ previous_year: e.target.value })}
                  >
                    <option value="">Select previous year</option>
                    <option value="2025 – 2026">2025 – 2026</option>
                    <option value="2024 – 2025">2024 – 2025</option>
                  </SelectField>
                </Box>

                <Box>
                  <label style={labelStyle}>
                    Start Date<Req />
                  </label>
                  <DateField value={formData.start_date} onChange={(e) => set({ start_date: e.target.value })} />
                </Box>

                <Box>
                  <label style={labelStyle}>
                    End Date<Req />
                  </label>
                  <DateField value={formData.end_date} onChange={(e) => set({ end_date: e.target.value })} />
                </Box>
              </Box>

              <HStack gap="24px" mt="14px" mb="10px">
                <Text fontSize="12px" fontWeight="500" color={NAVY} w="53px">
                  Status
                </Text>
                <Toggle checked={formData.is_active} onChange={(v) => set({ is_active: v })} />
                <Text fontSize="12px" color={NAVY}>
                  {formData.is_active ? "Active" : "Inactive"}
                </Text>
              </HStack>

              <Box>
                <label style={labelStyle}>Description</label>
                <input
                  style={{ ...inputStyle, height: "38px" }}
                  placeholder="Financial year for parish accounts and reports."
                  value={formData.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </Box>
            </Card>

            {/* Financial Controls */}
            <Card pb="14px">
              <HStack gap={4} mb={1}>
                <Flex w="44px" h="44px" borderRadius="full" bg={PINK} align="center" justify="center" flexShrink={0}>
                  <Icon as={LuSettings} boxSize={5} color={RED} />
                </Flex>
                <Text fontSize="17px" fontWeight="500" color={NAVY}>
                  Financial Controls
                </Text>
              </HStack>

              <VStack align="stretch" gap={0}>
                <ControlRow
                  label="Set as Current Financial Year"
                  desc="Use this period by default for new transactions and reports."
                  checked={formData.is_current}
                  onChange={(v) => set({ is_current: v })}
                />
                <ControlRow
                  label="Carry Forward Closing Balances"
                  desc="Create opening balances from the previous financial year."
                  checked={formData.carry_forward}
                  onChange={(v) => set({ carry_forward: v })}
                />
                <ControlRow
                  label="Allow Backdated Entries"
                  desc="Permit entries before the current transaction date."
                  checked={formData.backdated}
                  onChange={(v) => set({ backdated: v })}
                />
                <ControlRow
                  label="Lock Entries After Year Closure"
                  desc="Prevent modification of transactions after the year is closed."
                  checked={formData.lock}
                  onChange={(v) => set({ lock: v })}
                />
              </VStack>

              <Flex justify="flex-end" gap="14px" mt="8px">
                <Button
                  variant="outline"
                  bg="white"
                  borderColor={RED}
                  color={RED}
                  h="40px"
                  w="136px"
                  borderRadius="3px"
                  fontSize="14px"
                  fontWeight="500"
                  _hover={{ bg: RED_SOFT }}
                  onClick={goToPreviousYears}
                >
                  Cancel
                </Button>
                <Button
                  bg={RED}
                  color="white"
                  h="40px"
                  w="200px"
                  borderRadius="3px"
                  fontSize="14px"
                  fontWeight="500"
                  _hover={{ bg: RED_HOVER }}
                  onClick={handleSave}
                >
                  <Icon as={LuCalendarCheck} boxSize={5} />
                  Save Financial Year
                </Button>
              </Flex>
            </Card>
          </VStack>

          {/* ================= RIGHT COLUMN ================= */}
          <VStack gap="10px" align="stretch">
            {/* Current Configuration */}
            <Card pb="14px">
              <CardHeader icon={LuCalendarCheck} title="Current Configuration" />
              <VStack align="stretch" gap={0}>
                <InfoRow label="Financial Year" value={saved.name} />
                <InfoRow label="Accounting Period" value={savedPeriod} />
                <InfoRow label="Books Status" value="Open" valueColor={GREEN} />
                <InfoRow label="Set By" value="Parish Administrator" />
                <InfoRow label="Last Updated" value={saved.updated_at} last />
              </VStack>
            </Card>

            {/* Validation Rules */}
            <Card pb="14px">
              <CardHeader icon={LuShieldCheck} title="Validation Rules" />
              <VStack align="start" gap="6px" ml="12px">
                {[
                  "Start Date must be before End Date",
                  "Financial years cannot overlap",
                  "Only one financial year can be current",
                  "Closed years cannot accept new entries",
                ].map((rule) => (
                  <HStack key={rule} gap={3}>
                    <Icon as={LuCircleCheck} boxSize="18px" color={CHECK_BLUE} />
                    <Text fontSize="12px" color={NAVY}>
                      {rule}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Card>

            {/* Important Notice */}
            <Card pb="14px">
              <CardHeader icon={LuInfo} title="Important Notice" />
              <Text fontSize="12px" color={NAVY} lineHeight="1.5" maxW="440px" mb={3}>
                Changing the current financial year affects new vouchers, reports and default
                transaction dates.
              </Text>
              <Box bg={PINK} border="1px solid #F6C6CD" borderRadius="3px" px={4} py="6px">
                <Text fontSize="12px" color={RED}>
                  Existing transactions and closed financial years will remain unchanged.
                </Text>
              </Box>
            </Card>

            {/* Unsaved Changes */}
            <Card pb="14px">
              <CardHeader icon={LuSquarePen} title="Unsaved Changes" />
              <Text fontSize="12px" color={NAVY} ml="4px">
                Your changes will take effect only after you save the financial year.
              </Text>
            </Card>
          </VStack>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default FinancialYearSettingsPage;