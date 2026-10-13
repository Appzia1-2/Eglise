// src/pages/SubscriptionEditPage.jsx

import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";

import {
  LuCalendarDays,
  LuCircleAlert,
  LuCircleCheck,
  LuCircleX,
  LuRefreshCw,
} from "react-icons/lu";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getSubscription,
  updateSubscription,
  listGrades,
  listAccountLedgers,
} from "../api/registryServices";

import { toaster } from "../components/ui/toaster";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

// ============================================================
// BILLING CYCLES
// ============================================================

const BILLING_CYCLES = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

// ============================================================
// TOAST HELPER
// ============================================================

const showToast = ({
  title,
  description,
  type = "info",
  duration = 4000,
}) => {
  toaster.create({ title, description, type, duration, closable: true });
};

// ============================================================
// FIELD LABELS
// ============================================================

const FIELD_LABELS = {
  grade: "Grade",
  term: "Term",
  start_date: "Start Date",
  end_date: "End Date",
  amount: "Amount",
  billing_cycle: "Billing Cycle",
  ledger: "Ledger",
  cancel_reason: "Cancel Reason",
};

const SubscriptionEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [grades, setGrades] = useState([]);
  const [ledgers, setLedgers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingLedgers, setLoadingLedgers] = useState(true);
  const [saving, setSaving] = useState(false);

  const [subscription, setSubscription] = useState(null);

  const [formData, setFormData] = useState({
    grade: "",
    term: "",
    start_date: "",
    end_date: "",
    amount: "",
    billing_cycle: "MONTHLY",
    ledger: "",
    is_cancelled: false,
    cancel_reason: "",
  });

  const [originalFormData, setOriginalFormData] = useState({
    grade: "",
    term: "",
    start_date: "",
    end_date: "",
    amount: "",
    billing_cycle: "MONTHLY",
    ledger: "",
    is_cancelled: false,
    cancel_reason: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // ---------- helpers ----------
  const formatInputDate = (date) => {
    if (!date) return "";
    const value = String(date);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatDisplayDate = (date) => {
    if (!date) return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ---------- load ----------
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [subRes, gradeRes, ledgerRes] = await Promise.all([
        getSubscription(id),
        listGrades(),
        listAccountLedgers(),
      ]);

      const sub = subRes?.data ?? subRes;
      setSubscription(sub);

      const gradeData = gradeRes?.data ?? gradeRes;
      const gradeList = Array.isArray(gradeData)
        ? gradeData
        : gradeData?.results || [];
      setGrades(gradeList);

      // ---- ledgers ----
      setLoadingLedgers(true);
      const ledgerData = ledgerRes?.data ?? ledgerRes;
      let ledgerList = Array.isArray(ledgerData)
        ? ledgerData
        : ledgerData?.results || [];

      // Filter to subscription ledgers
      const subLedgers = ledgerList.filter((l) => {
        const name = (l.ledger_name || "").toLowerCase();
        const group = (l.account_group_name || "").toLowerCase();
        return name.includes("subscription") || group.includes("subscription");
      });

      if (subLedgers.length === 0) {
        ledgerList = ledgerList.filter(
          (l) => (l.ledger_nature || "").toUpperCase() === "INCOME"
        );
      } else {
        ledgerList = subLedgers;
      }
      setLedgers(ledgerList);
      setLoadingLedgers(false);

      // ---- form ----
      const gradeId =
        sub?.grade?.id ?? sub?.grade ?? "";
      const ledgerId =
        sub?.ledger?.id ?? sub?.ledger ?? "";

      const loaded = {
        grade: gradeId ? String(gradeId) : "",
        term: sub?.term ?? "",
        start_date: sub?.start_date ? formatInputDate(sub.start_date) : "",
        end_date: sub?.end_date ? formatInputDate(sub.end_date) : "",
        amount:
          sub?.amount !== null && sub?.amount !== undefined
            ? String(sub.amount)
            : "",
        billing_cycle: sub?.billing_cycle ?? "MONTHLY",
        ledger: ledgerId ? String(ledgerId) : "",
        is_cancelled: Boolean(sub?.is_cancelled),
        cancel_reason: sub?.cancel_reason ?? "",
      };

      setFormData(loaded);
      setOriginalFormData({ ...loaded });
    } catch (err) {
      console.error("Error loading subscription:", err);
      showToast({
        title: "Failed to load record",
        description:
          err?.response?.data?.detail ||
          "Unable to load subscription. Please try again.",
        type: "error",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------- change ----------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFieldErrors((prev) =>
      prev[name] ? { ...prev, [name]: "" } : prev
    );
  };

  const handleCancelledToggle = () => {
    setFormData((prev) => ({
      ...prev,
      is_cancelled: !prev.is_cancelled,
    }));
    setFieldErrors((prev) =>
      prev.cancel_reason ? { ...prev, cancel_reason: "" } : prev
    );
  };

  // ---------- unsaved ----------
  const changedFields = useMemo(() => {
    const fields = [];
    const compare = (field, label) => {
      const a = originalFormData[field] ?? "";
      const b = formData[field] ?? "";
      if (String(a) !== String(b)) fields.push(label);
    };
    compare("grade", "Grade");
    compare("term", "Term");
    compare("start_date", "Start Date");
    compare("end_date", "End Date");
    compare("amount", "Amount");
    compare("billing_cycle", "Billing Cycle");
    compare("ledger", "Ledger");
    compare("is_cancelled", "Status");
    compare("cancel_reason", "Cancel Reason");
    return fields;
  }, [formData, originalFormData]);

  const unsavedChangesCount = changedFields.length;
  const hasUnsavedChanges = unsavedChangesCount > 0;

  const getGradeName = () => {
    const g = grades.find(
      (grade) => String(grade.id) === String(formData.grade)
    );
    if (g?.name) return g.name;
    if (typeof subscription?.grade === "object" && subscription?.grade?.name) {
      return subscription.grade.name;
    }
    return "Grade";
  };

  // ---------- validate ----------
  const validateForm = () => {
    const errors = {};
    const missing = [];

    if (!formData.grade) {
      errors.grade = "Please select a grade.";
      missing.push(FIELD_LABELS.grade);
    }
    if (!formData.term.trim()) {
      errors.term = "Term is required.";
      missing.push(FIELD_LABELS.term);
    }
    if (!formData.start_date) {
      errors.start_date = "Start date is required.";
      missing.push(FIELD_LABELS.start_date);
    }
    if (!formData.end_date) {
      errors.end_date = "End date is required.";
      missing.push(FIELD_LABELS.end_date);
    }
    if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.end_date) < new Date(formData.start_date)
    ) {
      errors.end_date = "End date cannot be before start date.";
    }
    if (formData.amount === "" || formData.amount === null) {
      errors.amount = "Amount is required.";
      missing.push(FIELD_LABELS.amount);
    } else {
      const amount = Number(formData.amount);
      if (Number.isNaN(amount) || amount < 0) {
        errors.amount = "Amount must be zero or greater.";
      }
    }
    if (!formData.billing_cycle) {
      errors.billing_cycle = "Billing cycle is required.";
      missing.push(FIELD_LABELS.billing_cycle);
    }
    if (!formData.ledger) {
      errors.ledger = "Ledger is required.";
      missing.push(FIELD_LABELS.ledger);
    }
    if (formData.is_cancelled && !formData.cancel_reason.trim()) {
      errors.cancel_reason =
        "Cancel reason is required when marking as cancelled.";
      missing.push(FIELD_LABELS.cancel_reason);
    }

    setFieldErrors(errors);
    return { errors, missing };
  };

  // ---------- submit ----------
  const handleSubmit = async () => {
    const { errors, missing } = validateForm();

    if (Object.keys(errors).length > 0) {
      const explicitMessages = Object.entries(errors)
        .filter(([key]) => !missing.includes(FIELD_LABELS[key]))
        .map(([, msg]) => msg);

      let description;
      if (explicitMessages.length > 0) {
        description = explicitMessages.join("\n");
      } else if (missing.length === 1) {
        description = `${missing[0]} is required.`;
      } else {
        description = `Please fill: ${missing.join(", ")}.`;
      }

      showToast({
        title: "Please fix the form",
        description,
        type: "warning",
        duration: 5000,
      });
      return;
    }

    if (!hasUnsavedChanges) {
      showToast({
        title: "No changes to save",
        description: "Please modify at least one field before updating.",
        type: "info",
        duration: 4000,
      });
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});

      const payload = {
        grade: Number(formData.grade),
        term: formData.term.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        amount: Number(formData.amount),
        billing_cycle: formData.billing_cycle,
        ledger: Number(formData.ledger),
        is_cancelled: Boolean(formData.is_cancelled),
      };

      if (formData.is_cancelled) {
        payload.cancel_reason = formData.cancel_reason.trim();
      } else {
        payload.cancel_reason = "";
      }

      await updateSubscription(id, payload);

      setOriginalFormData({ ...formData });

      showToast({
        title: "Changes saved",
        description: "The subscription record was updated successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/subscriptions");
    } catch (err) {
      console.error("Error updating subscription:", err);

      const responseData = err?.response?.data;

      if (
        responseData &&
        typeof responseData === "object" &&
        !Array.isArray(responseData)
      ) {
        const errors = {};
        Object.entries(responseData).forEach(([key, value]) => {
          if (Array.isArray(value)) errors[key] = value.join(", ");
          else if (typeof value === "string") errors[key] = value;
          else errors[key] = JSON.stringify(value);
        });

        setFieldErrors(errors);

        const generalError =
          responseData.detail || responseData.non_field_errors?.[0];
        const fieldMessages = Object.values(errors).filter(Boolean);
        const onlyOne = fieldMessages.length === 1 && !generalError;

        showToast({
          title: "Could not save changes",
          description:
            generalError ||
            (onlyOne
              ? fieldMessages[0]
              : `Please check: ${Object.keys(errors)
                  .map((k) => FIELD_LABELS[k] || k)
                  .join(", ")}`),
          type: "error",
          duration: 7000,
        });
      } else {
        showToast({
          title: "Could not save changes",
          description: "Unable to update subscription. Please try again.",
          type: "error",
          duration: 7000,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigate("/subscriptions");

  // ---------- loading ----------
  if (loading) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" display="flex" alignItems="center" justifyContent="center">
          <Flex direction="column" align="center" gap={3}>
            <Spinner size="md" color={PRIMARY_MAROON} />
            <Text fontSize="12px" color={MUTED}>Loading subscription...</Text>
          </Flex>
        </Box>
        <Footer />
      </Box>
    );
  }

  const currentStatus = formData.is_cancelled ? "Cancelled" : "Active";
  const selectedLedger = ledgers.find((l) => String(l.id) === String(formData.ledger));
  const selectedCycle = BILLING_CYCLES.find(
    (b) => b.value === formData.billing_cycle
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1">
        <Container maxW="1600px" px={{ base: 4, md: 5, lg: 6 }} py={{ base: 3, md: 4 }}>
          {/* BREADCRUMB */}
          <HStack gap={2} mb={2} color={MUTED} fontSize="11px" flexWrap="wrap">
            <Text>Activities</Text>
            <Text>/</Text>
            <Text>Subscriptions</Text>
            <Text>/</Text>
            <Text>
              {subscription?.subscription_number ||
                subscription?.code ||
                `SUB-${String(id).padStart(6, "0")}`}{" "}
              / Edit
            </Text>
          </HStack>

          {/* HEADER */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", lg: "flex-end" }}
            direction={{ base: "column", lg: "row" }}
            gap={3}
            mb={3}
          >
            <Box>
              <Text fontSize="10px" fontWeight="700" color={RED} mb={1} letterSpacing="0.3px">
                SUBSCRIPTIONS
              </Text>
              <Heading color={DARK} fontSize={{ base: "22px", md: "27px" }} lineHeight="1.1" mb={1}>
                Edit Subscription
              </Heading>
              <Text color={MUTED} fontSize="11px">
                Update grade, term, dates, billing cycle, ledger, amount and status.
              </Text>
            </Box>

            <HStack gap={2} width={{ base: "100%", lg: "auto" }}>
              <Button
                flex={{ base: 1, lg: "none" }}
                variant="outline"
                borderColor={RED}
                color={RED}
                h="38px"
                minW="125px"
                borderRadius="6px"
                fontSize="12px"
                fontWeight="700"
                onClick={handleCancel}
                _hover={{ bg: "#FFF5F7" }}
              >
                Cancel
              </Button>
              <Button
                flex={{ base: 1, lg: "none" }}
                bg={RED}
                color="white"
                h="38px"
                minW="155px"
                borderRadius="6px"
                fontSize="12px"
                fontWeight="700"
                loading={saving}
                disabled={saving}
                onClick={handleSubmit}
                _hover={{ bg: "#B80035" }}
              >
                Update
              </Button>
            </HStack>
          </Flex>

          {/* COMPACT SUMMARY */}
          <Box
            border="1px solid #F2CBD6"
            borderRadius="8px"
            bg="#FFF9FB"
            px={{ base: 3, md: 4, lg: 5 }}
            py={3}
            mb={3}
          >
            <Grid
              templateColumns={{ base: "1fr", lg: "1fr 1px 1fr" }}
              alignItems="center"
              gap={{ base: 3, lg: 4 }}
            >
              <Flex align="center" gap={3}>
                <Box
                  width="50px"
                  height="50px"
                  borderRadius="50%"
                  bg="#FFEAF0"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Icon as={LuCalendarDays} boxSize={6} color={RED} strokeWidth={1.6} />
                </Box>
                <Box>
                  <Text fontSize={{ base: "17px", md: "20px" }} fontWeight="700" color={DARK} mb="2px">
                    {getGradeName()} Subscription
                  </Text>
                  <HStack gap={2} flexWrap="wrap">
                    <Text fontSize="11px" color={MUTED}>
                      {subscription?.subscription_number ||
                        subscription?.code ||
                        `SUB-${String(id).padStart(6, "0")}`}
                    </Text>
                    <Text fontSize="11px" color={MUTED}>
                      {formatDisplayDate(formData.start_date)} – {formatDisplayDate(formData.end_date)}
                    </Text>
                    <Box
                      px={2.5}
                      py="3px"
                      borderRadius="15px"
                      bg={formData.is_cancelled ? "#FFF0F0" : "#EAF8EA"}
                      color={formData.is_cancelled ? "#B5122F" : "#238B2D"}
                      fontSize="9px"
                      fontWeight="700"
                    >
                      {currentStatus}
                    </Box>
                  </HStack>
                </Box>
              </Flex>

              <Box display={{ base: "none", lg: "block" }} height="52px" borderLeft="1px solid #E2D5DA" />

              <Flex align="center" gap={3}>
                <Box
                  width="50px"
                  height="50px"
                  borderRadius="50%"
                  bg="#FFEAF0"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Text fontSize="18px" fontWeight="800" color={RED}>
                    {formData.billing_cycle === "MONTHLY" ? "M" : "Y"}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize={{ base: "17px", md: "20px" }} fontWeight="700" color={DARK} mb="1px">
                    {selectedCycle?.label || formData.billing_cycle}
                  </Text>
                  <Text fontSize="11px" color={MUTED}>
                    {selectedLedger?.ledger_name || "No ledger selected"}
                  </Text>
                </Box>
              </Flex>
            </Grid>
          </Box>

          {/* MAIN GRID */}
          <Grid
            templateColumns={{ base: "1fr", lg: "minmax(0, 2.1fr) minmax(300px, 1fr)" }}
            gap={3}
            alignItems="start"
          >
            {/* LEFT FORM */}
            <Box border="1px solid #DCE2EA" borderRadius="8px" p={{ base: 4, md: 5 }} bg="white">
              <HStack gap={2} mb={4}>
                <Box width="30px" height="30px" borderRadius="7px" bg="#FFF0F4" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                  <Box width="10px" height="10px" borderRadius="3px" bg="#FFE0E8" />
                </Box>
                <Text fontSize="15px" fontWeight="700" color={DARK}>
                  Subscription Information
                </Text>
              </HStack>

              {/* GRADE + TERM */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3} mb={3}>
                <Box>
                  <Text fontSize="11px" fontWeight="700" color={DARK} mb={1.5}>
                    Grade <Text as="span" color={RED}>*</Text>
                  </Text>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "38px",
                      border: `1px solid ${fieldErrors.grade ? "#F3C4C4" : BORDER}`,
                      borderRadius: "6px",
                      padding: "0 10px",
                      fontSize: "12px",
                      background: "white",
                      color: DARK,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Select grade</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="700" color={DARK} mb={1.5}>
                    Term <Text as="span" color={RED}>*</Text>
                  </Text>
                  <Input
                    name="term"
                    value={formData.term}
                    onChange={handleChange}
                    placeholder="Enter term"
                    h="38px"
                    fontSize="12px"
                    borderColor={fieldErrors.term ? "#F3C4C4" : BORDER}
                    borderRadius="6px"
                    color={DARK}
                    _placeholder={{ color: "#98A2B3" }}
                    _focus={{
                      borderColor: PRIMARY_MAROON,
                      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                    }}
                  />
                </Box>
              </Grid>

              {/* BILLING CYCLE + LEDGER */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3} mb={3}>
                <Box>
                  <Text fontSize="11px" fontWeight="700" color={DARK} mb={1.5}>
                    Billing Cycle <Text as="span" color={RED}>*</Text>
                  </Text>
                  <select
                    name="billing_cycle"
                    value={formData.billing_cycle}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "38px",
                      border: `1px solid ${fieldErrors.billing_cycle ? "#F3C4C4" : BORDER}`,
                      borderRadius: "6px",
                      padding: "0 10px",
                      fontSize: "12px",
                      background: "white",
                      color: DARK,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {BILLING_CYCLES.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="700" color={DARK} mb={1.5}>
                    Ledger <Text as="span" color={RED}>*</Text>
                  </Text>
                  <select
                    name="ledger"
                    value={formData.ledger}
                    onChange={handleChange}
                    disabled={loadingLedgers}
                    style={{
                      width: "100%",
                      height: "38px",
                      border: `1px solid ${fieldErrors.ledger ? "#F3C4C4" : BORDER}`,
                      borderRadius: "6px",
                      padding: "0 10px",
                      fontSize: "12px",
                      background: loadingLedgers ? "#F7F9FB" : "white",
                      color: DARK,
                      outline: "none",
                      cursor: loadingLedgers ? "not-allowed" : "pointer",
                    }}
                  >
                    <option value="">
                      {loadingLedgers ? "Loading ledgers..." : "Select ledger"}
                    </option>
                    {ledgers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.ledger_name}
                      </option>
                    ))}
                  </select>
                </Box>
              </Grid>

              {/* START + END */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3} mb={3}>
                <Box>
                  <Text fontSize="11px" fontWeight="700" color={DARK} mb={1.5}>
                    Start Date <Text as="span" color={RED}>*</Text>
                  </Text>
                  <Box position="relative">
                    <Input
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleChange}
                      h="38px"
                      fontSize="12px"
                      borderColor={fieldErrors.start_date ? "#F3C4C4" : BORDER}
                      borderRadius="6px"
                      color={DARK}
                      pr="38px"
                      _focus={{
                        borderColor: PRIMARY_MAROON,
                        boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />
                    <Icon as={LuCalendarDays} position="absolute" right="10px" top="50%" transform="translateY(-50%)" color="#98A2B3" boxSize={3.5} pointerEvents="none" />
                  </Box>
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="700" color={DARK} mb={1.5}>
                    End Date <Text as="span" color={RED}>*</Text>
                  </Text>
                  <Box position="relative">
                    <Input
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleChange}
                      h="38px"
                      fontSize="12px"
                      borderColor={fieldErrors.end_date ? "#F3C4C4" : BORDER}
                      borderRadius="6px"
                      color={DARK}
                      pr="38px"
                      _focus={{
                        borderColor: PRIMARY_MAROON,
                        boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />
                    <Icon as={LuCalendarDays} position="absolute" right="10px" top="50%" transform="translateY(-50%)" color="#98A2B3" boxSize={3.5} pointerEvents="none" />
                  </Box>
                </Box>
              </Grid>

              {/* AMOUNT */}
              <Box mb={3}>
                <Text fontSize="11px" fontWeight="700" color={DARK} mb={1.5}>
                  Amount <Text as="span" color={RED}>*</Text>
                </Text>
                <Flex>
                  <Box
                    width="42px"
                    height="38px"
                    border="1px solid"
                    borderColor={BORDER}
                    borderRadius="6px 0 0 6px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="#FAFBFC"
                    fontSize="12px"
                    color={MUTED}
                  >
                    ₹
                  </Box>
                  <Input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    h="38px"
                    fontSize="12px"
                    borderColor={fieldErrors.amount ? "#F3C4C4" : BORDER}
                    borderRadius="0 6px 6px 0"
                    borderLeft="none"
                    color={DARK}
                    _placeholder={{ color: "#98A2B3" }}
                    _focus={{
                      borderColor: PRIMARY_MAROON,
                      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                    }}
                  />
                </Flex>
              </Box>

              {/* CANCELLED */}
              <Box>
                <Text fontSize="11px" fontWeight="700" color={DARK} mb={2}>
                  Canceled
                </Text>
                <HStack gap={3} cursor="pointer" onClick={handleCancelledToggle}>
                  <Box
                    width="42px"
                    height="22px"
                    borderRadius="20px"
                    bg={formData.is_cancelled ? RED : "#B8C3D1"}
                    position="relative"
                    transition="all 0.2s"
                    flexShrink={0}
                  >
                    <Box
                      position="absolute"
                      top="2px"
                      left={formData.is_cancelled ? "22px" : "2px"}
                      width="18px"
                      height="18px"
                      borderRadius="50%"
                      bg="white"
                      transition="all 0.2s"
                      boxShadow="0 1px 3px rgba(0,0,0,0.2)"
                    />
                  </Box>
                  <Text fontSize="12px" color="#344054">
                    Mark this subscription as canceled
                  </Text>
                </HStack>
              </Box>

              {/* CANCEL REASON */}
              {formData.is_cancelled && (
                <Box mt={3} p={3} border="1px solid #F2CBD6" borderRadius="7px" bg="#FFF9FB">
                  <Text fontSize="11px" fontWeight="700" color={DARK} mb={1.5}>
                    Cancel Reason <Text as="span" color={RED}>*</Text>
                  </Text>
                  <Textarea
                    name="cancel_reason"
                    value={formData.cancel_reason}
                    onChange={handleChange}
                    placeholder="Enter reason for cancelling this subscription"
                    minH="70px"
                    resize="vertical"
                    fontSize="12px"
                    borderColor={
                      fieldErrors.cancel_reason
                        ? "#F3C4C4"
                        : formData.cancel_reason.trim()
                        ? BORDER
                        : "#F2B8C3"
                    }
                    borderRadius="6px"
                    color={DARK}
                    bg="white"
                    _placeholder={{ color: "#98A2B3" }}
                    _focus={{
                      borderColor: PRIMARY_MAROON,
                      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                    }}
                  />
                  <Text mt={1} fontSize="10px" color={MUTED}>
                    Please provide a reason before cancelling.
                  </Text>
                </Box>
              )}
            </Box>

            {/* RIGHT COLUMN */}
            <Flex direction="column" gap={3}>
              {/* RECORD INFO */}
              <Box border="1px solid #DCE2EA" borderRadius="8px" p={3.5} bg="white">
                <HStack gap={2} mb={3}>
                  <Box width="28px" height="28px" borderRadius="7px" bg="#FFF0F4" display="flex" alignItems="center" justifyContent="center">
                    <Icon as={LuCircleCheck} boxSize={3.5} color={RED} />
                  </Box>
                  <Text fontSize="14px" fontWeight="700" color={DARK}>
                    Record Information
                  </Text>
                </HStack>
                <HStack align="flex-start" gap={2.5} mb={3}>
                  <Box width="28px" height="28px" borderRadius="7px" bg="#FFF7FA" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                    <Icon as={LuCalendarDays} boxSize={3.5} color={RED} />
                  </Box>
                  <Box>
                    <Text fontSize="10px" color={MUTED} mb="1px">Created On</Text>
                    <Text fontSize="12px" fontWeight="700" color={DARK}>
                      {formatDisplayDate(subscription?.created_at || subscription?.created_on)}
                    </Text>
                  </Box>
                </HStack>
                <HStack align="flex-start" gap={2.5}>
                  <Box width="28px" height="28px" borderRadius="7px" bg="#FFF7FA" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                    <Icon as={LuCircleCheck} boxSize={3.5} color={RED} />
                  </Box>
                  <Box>
                    <Text fontSize="10px" color={MUTED} mb="1px">Last Updated</Text>
                    <Text fontSize="12px" fontWeight="700" color={DARK}>
                      {formatDisplayDate(subscription?.updated_at || subscription?.last_updated)}
                      {subscription?.updated_by ? ` by ${subscription.updated_by}` : ""}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* UNSAVED CHANGES */}
              <Box border="1px solid #DCE2EA" borderRadius="8px" p={3.5} bg="white">
                <HStack gap={2} mb={3}>
                  <Box width="28px" height="28px" borderRadius="7px" bg={hasUnsavedChanges ? "#FFF7ED" : "#F0FDF4"} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={hasUnsavedChanges ? LuCircleAlert : LuCircleCheck} boxSize={3.5} color={hasUnsavedChanges ? "#F97316" : "#16A34A"} />
                  </Box>
                  <Box>
                    <Text fontSize="14px" fontWeight="700" color={hasUnsavedChanges ? "#EA580C" : "#15803D"}>
                      {hasUnsavedChanges ? "Unsaved Changes" : "No Unsaved Changes"}
                    </Text>
                    <Text fontSize="10px" color={MUTED}>
                      {unsavedChangesCount} {unsavedChangesCount === 1 ? "field" : "fields"} changed
                    </Text>
                  </Box>
                </HStack>
                {hasUnsavedChanges ? (
                  <HStack gap={2} align="flex-start" mb={2}>
                    <Box width="28px" height="28px" borderRadius="7px" bg="#FFF7ED" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                      <Icon as={LuRefreshCw} boxSize={3.5} color="#F97316" />
                    </Box>
                    <Box>
                      <Text fontSize="12px" fontWeight="700" color="#EA580C">
                        Review changes before updating
                      </Text>
                      <Text fontSize="10px" color={MUTED} mt="2px">
                        {changedFields.join(", ")}
                      </Text>
                    </Box>
                  </HStack>
                ) : (
                  <Text fontSize="11px" color="#15803D">Everything is saved.</Text>
                )}
              </Box>

              {/* DANGER ZONE */}
              <Box border="1px solid #DCE2EA" borderRadius="8px" p={3.5} bg="white">
                <HStack gap={2} mb={3}>
                  <Box width="28px" height="28px" borderRadius="7px" bg="#FFF0F2" display="flex" alignItems="center" justifyContent="center">
                    <Icon as={LuCircleX} boxSize={3.5} color="#B5122F" />
                  </Box>
                  <Text fontSize="14px" fontWeight="700" color="#A81224">
                    Danger Zone
                  </Text>
                </HStack>
                <HStack gap={2} mb={1.5}>
                  <Box width="28px" height="28px" borderRadius="7px" bg="#FFF0F2" display="flex" alignItems="center" justifyContent="center">
                    <Icon as={LuCircleX} boxSize={3.5} color={RED} />
                  </Box>
                  <Text fontSize="12px" fontWeight="700" color={RED}>
                    Archive Subscription Record
                  </Text>
                </HStack>
                <Text fontSize="10px" color={MUTED} ml="40px">
                  The record will remain in history.
                </Text>
              </Box>
            </Flex>
          </Grid>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default SubscriptionEditPage;