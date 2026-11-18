// src/pages/RegistrationConfigForm.jsx

import React, { useState, useEffect, useMemo } from "react";
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
  LuHouse,
  LuFileDigit,
  LuSettings,
  LuCircleCheck,
  LuShieldCheck,
  LuSave,
  LuSquarePen,
  LuEye,
  LuList,
  LuListOrdered,
  LuChevronDown,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toaster } from "../components/ui/toaster";
import {
  listRegisterSettings,
  createRegisterSettings,
  updateRegisterSettings,
  previewRegisterSetting,
} from "../api/registryServices";

// ============================================================
// THEME CONSTANTS
// ============================================================
const RED = "#E31B23";
const RED_HOVER = "#C4141B";
const RED_SOFT = "#FFF0F0";
const PINK = "#FDE9EC";
const NAVY = "#1C2B6B";
const BLUE = "#1D3FD8";
const MUTED = "#5F6F8F";
const BORDER = "#E3E8F0";
const INPUT_BORDER = "#C9D3E3";
const GREEN = "#1E9E3E";
const CHECK_BLUE = "#2B47C4";

// ============================================================
// FEATURE FLAGS
// ============================================================
// SHOW_MANUAL_OVERRIDE: when true, renders the "Allow Manual Override"
// toggle in the Format Components card. The toggle is cosmetic — the
// backend does not yet persist or act on `allow_manual_override`.
//
// To actually enable manual override:
//   1. Add `allow_manual_override = BooleanField(default=False)` to
//      RegisterSetting (models.py) + migrate
//   2. In Baptism/Marriage/Death serializers, make `register_number`
//      writable when `setting.allow_manual_override` is True
//   3. In this file, add `allow_manual_override` to the save payload
//   4. In DeathAddPage.jsx and equivalent forms, show a manual
//      register-number input when the setting allows it
//   5. Flip this flag to true
//
// Until then, leave it false — no user-facing impact.
const SHOW_MANUAL_OVERRIDE = false;

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

// ------------------------------------------------------------
// Style objects for native inputs
// ------------------------------------------------------------
const inputStyle = {
  width: "100%",
  height: "30px",
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
  marginBottom: "3px",
  display: "block",
  color: NAVY,
  lineHeight: "15px",
};

const Req = () => <span style={{ color: RED }}> *</span>;

// ------------------------------------------------------------
// Reusable pieces
// ------------------------------------------------------------
const SelectField = ({ value, onChange, disabled, children }) => (
  <Box position="relative">
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        ...inputStyle,
        paddingRight: "34px",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        cursor: disabled ? "default" : "pointer",
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

const InlineSelect = ({ value, onChange, width = "120px", children }) => (
  <Box position="relative" w={width} flexShrink={0}>
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        height: "26px",
        padding: "0 24px 0 8px",
        fontSize: "12px",
        border: "none",
        outline: "none",
        background: "transparent",
        color: NAVY,
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        cursor: "pointer",
        textAlign: "right",
      }}
    >
      {children}
    </select>
    <Icon
      as={LuChevronDown}
      position="absolute"
      right="2px"
      top="50%"
      transform="translateY(-50%)"
      boxSize={4}
      color={BLUE}
      pointerEvents="none"
    />
  </Box>
);

const Toggle = ({ checked, onChange }) => (
  <Box
    as="button"
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    w="38px"
    h="20px"
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
      left={checked ? "20px" : "2px"}
      w="16px"
      h="16px"
      borderRadius="full"
      bg="white"
      transition="left 0.2s"
    />
  </Box>
);

const CardHeader = ({ icon, title, subtitle }) => (
  <HStack gap={4} mb={2} align="center">
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

const Card = ({ children, ...rest }) => (
  <Box
    bg="white"
    border={`1px solid ${BORDER}`}
    borderRadius="4px"
    px="20px"
    py="12px"
    {...rest}
  >
    {children}
  </Box>
);

const ToggleRow = ({ label, desc, checked, onChange }) => (
  <Flex justify="space-between" align="center" gap={4}>
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

const SummaryCell = ({ divider, children, ...rest }) => (
  <Flex align="center" position="relative" minH="76px" {...rest}>
    {divider && (
      <Box
        display={{ base: "none", lg: "block" }}
        position="absolute"
        left="0"
        top="50%"
        transform="translateY(-50%)"
        w="1px"
        h="36px"
        bg={BORDER}
      />
    )}
    {children}
  </Flex>
);

// ============================================================
// PAGE
// ============================================================
const RegistrationConfigForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [otherSettings, setOtherSettings] = useState([]);
  const [existingSetting, setExistingSetting] = useState(null);

  // Server-computed preview
  const [previewString, setPreviewString] = useState("");
  const [previewParts, setPreviewParts] = useState({});

  const [formData, setFormData] = useState({
    register_type: "BAPTISM",
    register_prefix: "BAP",
    separator: "/",
    register_suffix: "",
    starting_number: 1,
    next_register_number: 1,
    register_padding: 5,
    use_financial_year: false,
    include_parish_code: true,
    include_leading_zeros: true,
    reset_rule: "cy",
    year_format: "YYYY-YY",
    allow_manual_override: false,
  });

  const set = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  // Load data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await listRegisterSettings();
        const allSettings = res.data || [];
        setOtherSettings(allSettings);

        if (id) {
          const existing = allSettings.find(
            (s) => String(s.id) === String(id) || s.register_type === id
          );
          if (existing) {
            setExistingSetting(existing);
            setFormData((prev) => ({
              ...prev,
              register_type: existing.register_type,
              register_prefix: existing.register_prefix || "",
              separator: existing.separator || "/",
              register_suffix: existing.register_suffix || "",
              starting_number: existing.starting_number ?? 1,
              next_register_number: existing.next_register_number || 1,
              register_padding: existing.register_padding || 5,
              use_financial_year: !!existing.use_financial_year,
              include_parish_code: existing.include_parish_code ?? true,
              include_leading_zeros: existing.include_leading_zeros ?? true,
              reset_rule: existing.use_financial_year ? "fy" : "cy",
              year_format: existing.financial_year_format || "YYYY-YY",
            }));
          } else {
            toaster.create({
              title: "Configuration not found",
              type: "error",
            });
          }
        }
      } catch (err) {
        toaster.create({ title: "Failed to load configuration", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Live preview — debounced fetch to the backend. This uses the SAME
  // _financial_year_label + _assemble helpers that the real numbering
  // path uses, so the preview can never drift from actual output.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const payload = {
          register_type: formData.register_type,
          register_prefix: formData.register_prefix || "",
          register_suffix: formData.register_suffix || "",
          register_padding: Number(formData.register_padding) || 4,
          separator: formData.separator || "",
          include_parish_code: !!formData.include_parish_code,
          include_leading_zeros: !!formData.include_leading_zeros,
          use_financial_year: formData.reset_rule === "fy",
          financial_year_start_month: 4,
          financial_year_format: formData.year_format || "YYYY-YY",
          next_register_number:
            Number(formData.next_register_number) || 1,
        };
        const res = await previewRegisterSetting(payload);
        // Handle both axios (res.data = body) and unwrapped (res = body)
        const body = res?.data ?? res;
        if (!cancelled) {
          setPreviewString(body.preview || "");
          setPreviewParts(body.parts || {});
        }
      } catch (e) {
        // Keep the last successful preview — avoids flicker while typing
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    formData.register_type,
    formData.register_prefix,
    formData.register_suffix,
    formData.register_padding,
    formData.separator,
    formData.include_parish_code,
    formData.include_leading_zeros,
    formData.reset_rule,
    formData.year_format,
    formData.next_register_number,
  ]);

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const payload = {
        register_type: formData.register_type,
        register_prefix: formData.register_prefix,
        separator: formData.separator,
        register_suffix: formData.register_suffix,
        register_padding: Number(formData.register_padding) || 5,
        include_parish_code: !!formData.include_parish_code,
        include_leading_zeros: !!formData.include_leading_zeros,
        use_financial_year: formData.reset_rule === "fy",
        financial_year_format: formData.year_format || "YYYY-YY",
        financial_year_start_month: 4,
      };

      // Only send allow_manual_override when the flag is on AND
      // the backend supports it.
      if (SHOW_MANUAL_OVERRIDE) {
        payload.allow_manual_override = !!formData.allow_manual_override;
      }

      if (!isEdit) {
        payload.next_register_number =
          Number(formData.starting_number) || 1;
        payload.starting_number = Number(formData.starting_number) || 1;
      }

      if (isEdit) {
        await updateRegisterSettings(formData.register_type, payload);
        toaster.create({ title: "Configuration updated", type: "success" });
      } else {
        await createRegisterSettings(payload);
        toaster.create({ title: "Configuration created", type: "success" });
      }
      navigate("/register-settings");
    } catch (error) {
      const msg =
        error?.response?.data?.next_register_number?.[0] ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        "Failed to save configuration";
      toaster.create({ title: msg, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------- Derived values ----------------

  const padSeq = (n) =>
    formData.include_leading_zeros
      ? String(n).padStart(Number(formData.register_padding) || 4, "0")
      : String(n);

  const currentNumber = Math.max(0, formData.next_register_number - 1);
  const currentSeq = padSeq(currentNumber);

  const numberFormat = useMemo(() => {
    const parts = [
      "{PREFIX}",
      formData.include_parish_code ? "{PARISH_CODE}" : "",
      formData.reset_rule === "fy" ? "{YEAR}" : "",
      "{SEQUENCE}",
      formData.register_suffix ? "{SUFFIX}" : "",
    ].filter(Boolean);
    return parts.join(formData.separator);
  }, [
    formData.include_parish_code,
    formData.reset_rule,
    formData.register_suffix,
    formData.separator,
  ]);

  const typeKnown = Object.keys(REGISTER_LABELS).includes(
    formData.register_type
  );

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner color={RED} size="xl" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="100%" px={{ base: 4, md: "27px" }} py={5} flex="1">
        {/* Breadcrumb */}
        <HStack gap={3} mb={3} fontSize="15px" color={BLUE}>
          <Icon as={LuHouse} boxSize={5} />
          <Text cursor="pointer" onClick={() => navigate("/")}>
            Home
          </Text>
          <Text color={MUTED}>/</Text>
          <Text cursor="pointer" onClick={() => navigate("/settings")}>
            Settings
          </Text>
          <Text color={MUTED}>/</Text>
          <Text
            cursor="pointer"
            onClick={() => navigate("/register-settings")}
          >
            Registration Number
          </Text>
        </HStack>

        {/* Header */}
        <Flex justify="space-between" align="flex-start" gap={4} mb={3}>
          <Box>
            <Text
              fontSize="14px"
              color={RED}
              letterSpacing="0.2px"
              lineHeight="1.3"
            >
              SYSTEM SETTINGS
            </Text>
            <Heading
              color={BLUE}
              fontSize={{ base: "22px", md: "28px" }}
              fontWeight="600"
              lineHeight="1.2"
              mb="2px"
            >
              Registration Number Configuration
            </Heading>
            <Text color={BLUE} fontSize="13px">
              Configure automatic registration-number formats for parish
              registers.
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
            onClick={() => navigate("/register-settings")}
            _hover={{ bg: RED_SOFT }}
          >
            <Icon as={LuArrowLeft} boxSize={5} />
            Back
          </Button>
        </Flex>

        {/* Top Summary Bar */}
        <Box
          bg="white"
          border={`1px solid ${BORDER}`}
          borderRadius="4px"
          mb="12px"
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            lg: "387fr 156fr 279fr 312fr 436fr",
          }}
        >
          <SummaryCell pl="26px" gap={4}>
            <Flex
              w="62px"
              h="62px"
              borderRadius="full"
              bg={PINK}
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Icon as={LuFileDigit} boxSize={7} color={RED} />
            </Flex>
            <Box>
              <Text fontSize="14px" color={NAVY} lineHeight="1.2">
                Selected Register
              </Text>
              <Text
                fontSize="24px"
                fontWeight="600"
                color={BLUE}
                lineHeight="1.2"
              >
                {formatTitle(formData.register_type)}
              </Text>
            </Box>
          </SummaryCell>

          <SummaryCell divider justify="center" gap={3}>
            <Box w="16px" h="16px" borderRadius="full" bg={GREEN} />
            <Text fontSize="14px" color={GREEN}>
              Active
            </Text>
          </SummaryCell>

          <SummaryCell divider justify="center">
            <HStack
              gap={3}
              px={6}
              h="34px"
              border={`1px solid ${GREEN}`}
              borderRadius="3px"
              color={GREEN}
              bg="white"
            >
              <Icon as={LuSettings} boxSize={5} />
              <Text fontSize="14px">Auto Generation</Text>
            </HStack>
          </SummaryCell>

          <SummaryCell divider pl="54px" gap={4}>
            <Icon as={LuListOrdered} boxSize={7} color={BLUE} />
            <Box>
              <Text fontSize="14px" color={NAVY} lineHeight="1.2">
                Current Sequence
              </Text>
              <Text
                fontSize="26px"
                fontWeight="700"
                color={BLUE}
                lineHeight="1.2"
              >
                {currentSeq}
              </Text>
            </Box>
          </SummaryCell>

          <SummaryCell divider pl="80px">
            <Box>
              <Text fontSize="14px" color={NAVY} lineHeight="1.2">
                Next Reg. No.
              </Text>
              <Text
                fontSize="26px"
                fontWeight="700"
                color={BLUE}
                lineHeight="1.2"
              >
                {previewString || "—"}
              </Text>
            </Box>
          </SummaryCell>
        </Box>

        {/* Main Grid Layout */}
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", lg: "1.56fr 1fr" }}
          gap="27px"
          alignItems="start"
        >
          {/* ================= LEFT COLUMN ================= */}
          <VStack gap="10px" align="stretch">
            {/* Basic Configuration */}
            <Card pb="14px">
              <CardHeader
                icon={LuFileDigit}
                title="Basic Configuration"
                subtitle="Define the register, format and starting sequence."
              />

              <Box
                display="grid"
                gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
                columnGap="84px"
                rowGap="6px"
                px="4px"
              >
                <Box>
                  <label style={labelStyle}>
                    Register Type<Req />
                  </label>
                  <SelectField
                    value={formData.register_type}
                    onChange={(e) => set({ register_type: e.target.value })}
                    disabled={isEdit}
                  >
                    {Object.entries(REGISTER_LABELS).map(([val, lab]) => (
                      <option key={val} value={val}>
                        {lab}
                      </option>
                    ))}
                    {!typeKnown && (
                      <option value={formData.register_type}>
                        {formatTitle(formData.register_type)}
                      </option>
                    )}
                  </SelectField>
                </Box>

                <Box>
                  <label style={labelStyle}>
                    Generation Mode<Req />
                  </label>
                  <SelectField value="auto" onChange={() => {}} disabled>
                    <option value="auto">Automatic</option>
                  </SelectField>
                </Box>

                <Box>
                  <label style={labelStyle}>
                    Prefix<Req />
                  </label>
                  <input
                    style={inputStyle}
                    value={formData.register_prefix}
                    onChange={(e) =>
                      set({ register_prefix: e.target.value.toUpperCase() })
                    }
                  />
                </Box>

                <Box>
                  <label style={labelStyle}>
                    Separator<Req />
                  </label>
                  <SelectField
                    value={formData.separator}
                    onChange={(e) => set({ separator: e.target.value })}
                  >
                    <option value="/">/</option>
                    <option value="-">-</option>
                    <option value="_">_</option>
                  </SelectField>
                </Box>

                <Box>
                  <label style={labelStyle}>
                    Sequence Length<Req />
                  </label>
                  <SelectField
                    value={formData.register_padding}
                    onChange={(e) =>
                      set({ register_padding: Number(e.target.value) })
                    }
                  >
                    <option value={4}>4 Digits</option>
                    <option value={5}>5 Digits</option>
                    <option value={6}>6 Digits</option>
                  </SelectField>
                </Box>

                <Box>
                  <label style={labelStyle}>
                    Starting Number<Req />
                  </label>
                  <input
                    style={{
                      ...inputStyle,
                      backgroundColor: isEdit ? "#E9EFFA" : "white",
                    }}
                    type="number"
                    min={1}
                    value={formData.starting_number}
                    readOnly={isEdit}
                    onChange={(e) => {
                      if (isEdit) return;
                      const n = Number(e.target.value);
                      set({ starting_number: n, next_register_number: n });
                    }}
                  />
                </Box>

                <Box>
                  <label style={labelStyle}>Current Number</label>
                  <input
                    style={{ ...inputStyle, backgroundColor: "#E9EFFA" }}
                    value={currentNumber}
                    readOnly
                  />
                </Box>

                <Box>
                  <label style={labelStyle}>Suffix</label>
                  <input
                    style={inputStyle}
                    placeholder="Optional"
                    value={formData.register_suffix}
                    onChange={(e) => set({ register_suffix: e.target.value })}
                  />
                </Box>
              </Box>

              <Box mt="6px" px="4px">
                <label style={labelStyle}>
                  Number Format<Req />
                </label>
                <input style={inputStyle} value={numberFormat} readOnly />
              </Box>
            </Card>

            {/* Format Components */}
            <Card pb="16px">
              <HStack gap={4} mb={2}>
                <Flex
                  w="44px"
                  h="44px"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={LuSettings} boxSize={6} color={RED} />
                </Flex>
                <Text fontSize="17px" fontWeight="500" color={NAVY}>
                  Format Components
                </Text>
              </HStack>

              <VStack align="stretch" gap="8px">
                <ToggleRow
                  label="Include Parish Code"
                  desc="Add the parish code to every registration number."
                  checked={formData.include_parish_code}
                  onChange={(v) => set({ include_parish_code: v })}
                />

                <ToggleRow
                  label="Include Calendar / Financial Year"
                  desc="Add the four-digit registration year."
                  checked={formData.reset_rule !== "none"}
                  onChange={(v) =>
                    set({ reset_rule: v ? "cy" : "none" })
                  }
                />

                {/* Year Format */}
                <Flex
                  justify="space-between"
                  align="center"
                  border={`1px solid ${INPUT_BORDER}`}
                  borderRadius="3px"
                  px="10px"
                  minH="30px"
                >
                  <Text fontSize="12px" color={NAVY}>
                    Year Format
                  </Text>
                  <InlineSelect
                    width="110px"
                    value={formData.year_format}
                    onChange={(e) => set({ year_format: e.target.value })}
                  >
                    <option value="YYYY">YYYY</option>
                    <option value="YY">YY</option>
                    <option value="YYYY-YY">YYYY-YY</option>
                  </InlineSelect>
                </Flex>

                {/* Reset Sequence */}
                <Flex
                  justify="space-between"
                  align="center"
                  border={`1px solid ${INPUT_BORDER}`}
                  borderRadius="3px"
                  px="10px"
                  py="2px"
                  minH="30px"
                  gap={3}
                >
                  <Box>
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      color={NAVY}
                      lineHeight="1.3"
                    >
                      Reset Sequence
                    </Text>
                    <Text
                      fontSize="11px"
                      color={MUTED}
                      lineHeight="1.3"
                    >
                      Restart the sequence at the beginning of each period.
                    </Text>
                  </Box>
                  <InlineSelect
                    width="150px"
                    value={formData.reset_rule}
                    onChange={(e) => set({ reset_rule: e.target.value })}
                  >
                    <option value="cy">Calendar Year</option>
                    <option value="fy">Financial Year</option>
                    <option value="none">Never</option>
                  </InlineSelect>
                </Flex>

                <ToggleRow
                  label="Use Leading Zeros"
                  desc="Pad the sequence to the configured number length."
                  checked={formData.include_leading_zeros}
                  onChange={(v) => set({ include_leading_zeros: v })}
                />

                {/* Manual override (feature-flagged) + action buttons */}
                <Flex
                  justify="space-between"
                  align="flex-end"
                  gap={4}
                  direction={{ base: "column", md: "row" }}
                  mt={2}
                >
                  {SHOW_MANUAL_OVERRIDE ? (
                    <Box>
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={NAVY}
                        lineHeight="1.3"
                      >
                        Allow Manual Override
                      </Text>
                      <Text fontSize="11px" color={MUTED} lineHeight="1.3">
                        Permit authorized users to enter a registration
                        number manually.
                      </Text>
                      <Text
                        fontSize="10px"
                        color={RED}
                        lineHeight="1.3"
                        mt="2px"
                      >
                        (Not yet persisted — UI only.)
                      </Text>
                    </Box>
                  ) : (
                    <Box />
                  )}

                  <VStack align="flex-end" gap="8px">
                    {SHOW_MANUAL_OVERRIDE && (
                      <Toggle
                        checked={formData.allow_manual_override}
                        onChange={(v) =>
                          set({ allow_manual_override: v })
                        }
                      />
                    )}
                    <HStack gap="16px">
                      <Button
                        variant="outline"
                        bg="white"
                        borderColor={RED}
                        color={RED}
                        h="34px"
                        w="147px"
                        borderRadius="3px"
                        fontSize="14px"
                        fontWeight="500"
                        _hover={{ bg: RED_SOFT }}
                        onClick={() => navigate("/register-settings")}
                      >
                        Cancel
                      </Button>
                      <Button
                        bg={RED}
                        color="white"
                        h="34px"
                        w="183px"
                        borderRadius="3px"
                        fontSize="14px"
                        fontWeight="500"
                        _hover={{ bg: RED_HOVER }}
                        onClick={handleSave}
                        loading={isSaving}
                        isDisabled={isSaving}
                      >
                        <Icon as={LuSave} boxSize={5} />
                        Save Configuration
                      </Button>
                    </HStack>
                  </VStack>
                </Flex>
              </VStack>
            </Card>
          </VStack>

          {/* ================= RIGHT COLUMN ================= */}
          <VStack gap="10px" align="stretch">
            {/* Live Preview — server-computed */}
            <Card pb="14px">
              <HStack gap={4} mb={1} align="center">
                <Flex
                  w="44px"
                  h="44px"
                  borderRadius="full"
                  bg={PINK}
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={LuEye} boxSize={5} color={RED} />
                </Flex>
                <Box>
                  <Text
                    fontSize="17px"
                    fontWeight="500"
                    color={NAVY}
                    lineHeight="1.2"
                  >
                    Live Preview
                  </Text>
                  <Text fontSize="12px" color={NAVY} lineHeight="1.3">
                    Next Registration Number
                  </Text>
                  <Text
                    fontSize={{ base: "20px", md: "26px" }}
                    fontWeight="700"
                    color={BLUE}
                    lineHeight="1.2"
                  >
                    {previewString || "—"}
                  </Text>
                </Box>
              </HStack>

              <VStack align="stretch" gap={0} fontSize="12px" mt={2}>
                {[
                  ["Prefix", previewParts.prefix || "—"],
                  ["Parish Code", previewParts.parish_code || "—"],
                  ["Year", previewParts.financial_year || "—"],
                  ["Next Sequence", previewParts.sequence || "—"],
                ].map(([k, v]) => (
                  <Flex
                    key={k}
                    justify="space-between"
                    py="4px"
                    color={NAVY}
                  >
                    <Text>{k}</Text>
                    <Text>{v}</Text>
                  </Flex>
                ))}
              </VStack>

              <Box
                bg="#EEF3FB"
                border="1px solid #C9D6EE"
                borderRadius="3px"
                px={4}
                py="6px"
                mt={1}
              >
                <Text fontSize="11px" color={MUTED}>
                  Preview is computed by the backend — it matches the exact
                  string the next record will receive.
                </Text>
              </Box>
            </Card>

            {/* Configuration Rules */}
            <Card pb="14px">
              <CardHeader icon={LuShieldCheck} title="Configuration Rules" />
              <VStack align="start" gap="4px" ml="56px" mt="-24px">
                {[
                  "Registration numbers must be unique",
                  "Prefix must contain 2–10 uppercase characters",
                  "Sequence must contain at least 4 digits",
                  "Issued registration numbers cannot be changed",
                  "Yearly reset begins on 01 January (calendar) or 01 April (financial)",
                ].map((rule) => (
                  <HStack key={rule} gap={2}>
                    <Icon
                      as={LuCircleCheck}
                      boxSize="14px"
                      color={CHECK_BLUE}
                    />
                    <Text fontSize="11px" color={NAVY}>
                      {rule}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Card>

            {/* Configured Registers */}
            <Card pb="12px">
              <CardHeader icon={LuList} title="Configured Registers" />
              <VStack align="stretch" gap="2px" mt="-4px">
                {otherSettings.length === 0 && (
                  <Text fontSize="11px" color={MUTED}>
                    No registers configured yet.
                  </Text>
                )}
                {otherSettings.slice(0, 4).map((s) => (
                  <Box
                    key={s.id}
                    display="grid"
                    gridTemplateColumns="46% 33% 1fr"
                    alignItems="center"
                    fontSize="12px"
                    color={NAVY}
                    minH="21px"
                  >
                    <Text>{formatTitle(s.register_type)}</Text>
                    <Text>
                      {s.register_prefix}/{new Date().getFullYear()}/
                      {String(
                        Math.max(0, (s.next_register_number || 1) - 1)
                      ).padStart(s.register_padding || 5, "0")}
                    </Text>
                    <HStack gap={2}>
                      <Box w="10px" h="10px" borderRadius="full" bg={GREEN} />
                      <Text color={GREEN}>Active</Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Card>

            {/* Unsaved Changes */}
            <Card pb="14px">
              <CardHeader icon={LuSquarePen} title="Unsaved Changes" />
              <Text fontSize="12px" color={NAVY} ml="40px" mt="-6px">
                Your changes will apply only to registration numbers generated
                after saving.
              </Text>
            </Card>
          </VStack>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default RegistrationConfigForm;