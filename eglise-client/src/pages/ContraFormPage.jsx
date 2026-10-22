// ContraFormPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Text,
  Textarea,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";

import { LuArrowLeft } from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchableSelect from "../components/SearchableSelect";

import {
  listAccountLedgers,
  listBankAccounts,
  createContra,
  getContra,
  updateContra,
} from "../api/registryServices";
import { toaster } from "../components/ui/toaster";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

// ============================================================
// TOAST
// ============================================================
const showToast = ({
  title,
  description,
  type = "info",
  duration = 4000,
}) => {
  toaster.create({
    title,
    description,
    type,
    duration,
    closable: true,
  });
};

// ============================================================
// CONSTANTS
// ============================================================
const CASH_LEDGER_NAMES = new Set([
  "Cash in Hand",
  "Closing - Cash in Hand",
]);

const TYPE_OPTIONS = [
  { value: "CASH_TO_BANK", label: "Cash deposited to Bank" },
  { value: "BANK_TO_CASH", label: "Cash withdrawn from Bank" },
  { value: "BANK_TO_BANK", label: "Bank to Bank transfer" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

// ============================================================
// PAGE
// ============================================================
const ContraFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [ledgers, setLedgers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    contra_date: todayISO(),
    contra_type: "CASH_TO_BANK",
    from_ledger: "",
    to_ledger: "",
    from_bank_account: "",
    to_bank_account: "",
    amount: "",
    narration: "",
    ref_no: "",
  });

  // ==========================================================
  // LEDGER CLASSIFICATION
  // ==========================================================
  const isCashLedger = (ledger) => {
    if (!ledger) return false;
    const name = (ledger.ledger_name || "").trim();
    if (CASH_LEDGER_NAMES.has(name)) return true;
    return name.toLowerCase().includes("cash");
  };

  const cashLedgers = useMemo(
    () => ledgers.filter((l) => isCashLedger(l)),
    [ledgers]
  );
  const bankLedgers = useMemo(
    () => ledgers.filter((l) => !isCashLedger(l)),
    [ledgers]
  );

  // ==========================================================
  // LOAD
  // ==========================================================
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [lRes, bRes] = await Promise.all([
          listAccountLedgers(),
          listBankAccounts(),
        ]);
        const raw = lRes.data?.results ?? lRes.data ?? [];
        const banksRaw = bRes.data?.results ?? bRes.data ?? [];

        const assetLedgers = (Array.isArray(raw) ? raw : []).filter(
          (l) =>
            (l.ledger_nature || "").toUpperCase() === "ASSET" &&
            l.status !== false
        );

        setLedgers(assetLedgers);
        setBanks(Array.isArray(banksRaw) ? banksRaw : []);

        if (isEdit) {
          const res = await getContra(id);
          const c = res.data;
          setForm({
            contra_date: c.contra_date || todayISO(),
            contra_type: c.contra_type || "CASH_TO_BANK",
            from_ledger: c.from_ledger || "",
            to_ledger: c.to_ledger || "",
            from_bank_account: c.from_bank_account || "",
            to_bank_account: c.to_bank_account || "",
            amount: c.amount ?? "",
            narration: c.narration || "",
            ref_no: c.ref_no || "",
          });
        } else {
          const cash = assetLedgers.filter((l) => {
            const name = (l.ledger_name || "").trim();
            if (CASH_LEDGER_NAMES.has(name)) return true;
            return name.toLowerCase().includes("cash");
          });
          const banksOnly = assetLedgers.filter(
            (l) => !cash.some((c) => c.id === l.id)
          );
          setForm((f) => ({
            ...f,
            from_ledger: cash[0]?.id || "",
            to_ledger: banksOnly[0]?.id || "",
          }));
        }
      } catch {
        setServerError("Failed to load ledgers and bank accounts.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ==========================================================
  // DERIVED
  // ==========================================================
  const availableFromLedgers = useMemo(() => {
    return form.contra_type === "CASH_TO_BANK"
      ? cashLedgers
      : bankLedgers;
  }, [form.contra_type, cashLedgers, bankLedgers]);

  const availableToLedgers = useMemo(() => {
    if (form.contra_type === "BANK_TO_CASH") return cashLedgers;
    return bankLedgers.filter(
      (l) => String(l.id) !== String(form.from_ledger)
    );
  }, [form.contra_type, form.from_ledger, cashLedgers, bankLedgers]);

  const fromLedgerObj = ledgers.find(
    (l) => String(l.id) === String(form.from_ledger)
  );
  const toLedgerObj = ledgers.find(
    (l) => String(l.id) === String(form.to_ledger)
  );
  const needsFromBank =
    fromLedgerObj && !isCashLedger(fromLedgerObj);
  const needsToBank = toLedgerObj && !isCashLedger(toLedgerObj);

  // ==========================================================
  // OPTIONS for SearchableSelect
  // ==========================================================
  const fromLedgerOptions = useMemo(
    () =>
      availableFromLedgers.map((l) => ({
        value: l.id,
        label: l.ledger_name,
        sublabel: l.alias || undefined,
      })),
    [availableFromLedgers]
  );

  const toLedgerOptions = useMemo(
    () =>
      availableToLedgers.map((l) => ({
        value: l.id,
        label: l.ledger_name,
        sublabel: l.alias || undefined,
      })),
    [availableToLedgers]
  );

  const bankOptions = useMemo(
    () =>
      banks.map((b) => ({
        value: b.id,
        label: `${b.bank_name}${
          b.masked_account_number
            ? `  ·  ${b.masked_account_number}`
            : ""
        }`,
        sublabel: b.branch || undefined,
      })),
    [banks]
  );

  // ==========================================================
  // HANDLERS
  // ==========================================================
  const handleTypeChange = (type) => {
    setForm((f) => ({
      ...f,
      contra_type: type,
      from_ledger: "",
      to_ledger: "",
      from_bank_account: "",
      to_bank_account: "",
    }));
    setFieldErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.contra_date) errs.contra_date = "Date is required.";
    if (!form.from_ledger)
      errs.from_ledger = "Source ledger is required.";
    if (!form.to_ledger)
      errs.to_ledger = "Destination ledger is required.";
    if (
      form.from_ledger &&
      form.to_ledger &&
      String(form.from_ledger) === String(form.to_ledger)
    ) {
      errs.to_ledger = "Source and destination must be different.";
    }
    if (!form.amount || Number(form.amount) <= 0) {
      errs.amount = "Amount must be greater than zero.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setServerError("");
    if (!validate()) {
      showToast({
        title: "Please fix the form",
        description: "Some required fields are missing or invalid.",
        type: "warning",
        duration: 5000,
      });
      return;
    }

    const payload = {
      contra_date: form.contra_date,
      contra_type: form.contra_type,
      from_ledger: Number(form.from_ledger),
      to_ledger: Number(form.to_ledger),
      from_bank_account:
        needsFromBank && form.from_bank_account
          ? Number(form.from_bank_account)
          : null,
      to_bank_account:
        needsToBank && form.to_bank_account
          ? Number(form.to_bank_account)
          : null,
      amount: Number(form.amount),
      narration: form.narration || "",
      ref_no: form.ref_no || "",
    };

    try {
      setSaving(true);
      if (isEdit) await updateContra(id, payload);
      else await createContra(payload);

      showToast({
        title: isEdit ? "Contra updated" : "Contra posted",
        description: isEdit
          ? "Voucher updated successfully."
          : "Voucher posted and ledgers updated.",
        type: "success",
      });
      navigate("/contra");
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const errs = {};
        let general = "";
        Object.entries(data).forEach(([k, v]) => {
          const msg = Array.isArray(v) ? v.join(", ") : String(v);
          if (
            [
              "contra_date",
              "contra_type",
              "from_ledger",
              "to_ledger",
              "amount",
              "from_bank_account",
              "to_bank_account",
            ].includes(k)
          ) {
            errs[k] = msg;
          } else {
            general = msg;
          }
        });
        setFieldErrors(errs);
        if (general) setServerError(general);

        showToast({
          title: isEdit ? "Could not update" : "Could not post",
          description:
            general || "Please check the fields and try again.",
          type: "error",
          duration: 7000,
        });
      } else {
        setServerError("Save failed. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigate("/contra");

  // ==========================================================
  // SHARED STYLES
  // ==========================================================
  const inputStyle = {
    h: "42px",
    fontSize: "13px",
    borderColor: BORDER,
    borderRadius: "7px",
    color: DARK,
    bg: "white",
    _placeholder: { color: "#98A2B3" },
    _hover: { borderColor: "#BFC7D4" },
    _focus: {
      borderColor: PRIMARY_MAROON,
      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
    },
  };

  const FieldLabel = ({ children, required = true }) => (
    <Text fontSize="12px" fontWeight="600" color={DARK} mb="8px">
      {children}
      {required && (
        <Text as="span" color={RED} ml="2px">
          *
        </Text>
      )}
    </Text>
  );

  const FieldError = ({ message }) =>
    message ? (
      <Text fontSize="11px" color={RED} mt={1}>
        {message}
      </Text>
    ) : null;

  const primaryBtn = {
    h: "38px",
    px: 7,
    bg: PRIMARY_MAROON,
    color: "white",
    borderRadius: "7px",
    fontSize: "12px",
    fontWeight: "600",
    _hover: { bg: "#650A18" },
  };

  const outlineBtn = {
    variant: "outline",
    borderColor: RED,
    color: RED,
    h: "38px",
    px: 6,
    borderRadius: "7px",
    fontSize: "12px",
    fontWeight: "600",
    _hover: { bg: "#FFF5F7" },
  };

  // ==========================================================
  // LOADING
  // ==========================================================
  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />
        <Flex flex="1" justify="center" align="center">
          <Spinner size="lg" color={PRIMARY_MAROON} />
        </Flex>
        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Box flex="1" w="100%">
        <Box px={{ base: 3, md: 5 }} py={{ base: 3, md: 5 }}>
          {/* BREADCRUMB */}
          <HStack gap={2} mb={3} color={MUTED} fontSize="11px">
            <Text>Activities</Text>
            <Text>/</Text>
            <Text>Accounts</Text>
            <Text>/</Text>
            <Text>Contra</Text>
            <Text>/</Text>
            <Text color={DARK}>{isEdit ? "Edit" : "Add"}</Text>
          </HStack>

          {/* PAGE HEADER */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
            mb={4}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <Text fontSize="10px" fontWeight="700" color={RED} mb={1}>
                ACCOUNTS
              </Text>
              <Heading
                color={DARK}
                fontSize={{ base: "22px", md: "26px" }}
                lineHeight="1.1"
                mb={1}
              >
                {isEdit ? "Edit Contra Voucher" : "New Contra Voucher"}
              </Heading>
              <Text color={MUTED} fontSize="11px">
                Transfer money between Cash and Bank. This does not
                affect income or expense.
              </Text>
            </Box>

            <Button
              variant="outline"
              borderColor={BORDER}
              color={DARK}
              h="38px"
              px={4}
              fontSize="12px"
              borderRadius="6px"
              flexShrink={0}
              onClick={handleCancel}
              _hover={{ bg: "#FAFBFC" }}
            >
              <Icon as={LuArrowLeft} mr={2} boxSize={4} />
              Back
            </Button>
          </Flex>

          {/* FORM CARD */}
          <Box
            border="1px solid #DCE2EA"
            borderRadius="8px"
            bg="white"
            p={{ base: 4, md: 6 }}
            width="100%"
          >
            {/* CARD HEADER */}
            <Box mb={5}>
              <Text
                fontSize="13px"
                fontWeight="700"
                color={RED}
                pb="10px"
                borderBottom="2px solid"
                borderColor={RED}
                display="inline-block"
              >
                Contra Details
              </Text>
            </Box>

            {/* SERVER ERROR */}
            {serverError && (
              <Box
                mb={4}
                p={3}
                borderRadius="6px"
                bg="#FFF5F5"
                border="1px solid #FED7D7"
              >
                <Text color="red.600" fontSize="12px">
                  {serverError}
                </Text>
              </Box>
            )}

            {/* TRANSFER TYPE PILLS */}
            <Box mb={5}>
              <FieldLabel>Transfer Type</FieldLabel>
              <HStack spacing={2} flexWrap="wrap">
                {TYPE_OPTIONS.map((t) => {
                  const active = form.contra_type === t.value;
                  return (
                    <Button
                      key={t.value}
                      type="button"
                      size="sm"
                      onClick={() => handleTypeChange(t.value)}
                      bg={active ? PRIMARY_MAROON : "white"}
                      color={active ? "white" : DARK}
                      border="1px solid"
                      borderColor={active ? PRIMARY_MAROON : BORDER}
                      _hover={{
                        bg: active ? "#650A18" : "#FAFBFC",
                      }}
                      borderRadius="full"
                      px={4}
                      fontSize="12px"
                      fontWeight="600"
                      h="34px"
                    >
                      {t.label}
                    </Button>
                  );
                })}
              </HStack>
            </Box>

            {/* DATE + REF NO */}
            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              spacing={4}
              mb={4}
            >
              <Box>
                <FieldLabel>Date</FieldLabel>
                <Input
                  type="date"
                  value={form.contra_date}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      contra_date: e.target.value,
                    }))
                  }
                  {...inputStyle}
                  borderColor={
                    fieldErrors.contra_date ? "#F3C4C4" : BORDER
                  }
                />
                <FieldError message={fieldErrors.contra_date} />
              </Box>
              <Box>
                <FieldLabel required={false}>Reference No.</FieldLabel>
                <Input
                  value={form.ref_no}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ref_no: e.target.value,
                    }))
                  }
                  placeholder="Cheque no., UTR, etc."
                  {...inputStyle}
                />
              </Box>
            </SimpleGrid>

            {/* FROM / TO */}
            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              spacing={4}
              mb={4}
            >
              {/* FROM */}
              <Box
                bg="#FAFBFC"
                borderRadius="7px"
                p={4}
                border="1px solid"
                borderColor={BORDER}
              >
                <Text
                  fontSize="11px"
                  textTransform="uppercase"
                  fontWeight="700"
                  color={MUTED}
                  letterSpacing="0.05em"
                  mb={2}
                >
                  Money Leaves
                </Text>
                <Box mb={needsFromBank ? 2 : 0}>
                  <SearchableSelect
                    value={form.from_ledger}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        from_ledger: v,
                        from_bank_account: "",
                      }))
                    }
                    options={fromLedgerOptions}
                    placeholder="Search source ledger…"
                    error={!!fieldErrors.from_ledger}
                  />
                  <FieldError message={fieldErrors.from_ledger} />
                </Box>
                {needsFromBank && (
                  <SearchableSelect
                    value={form.from_bank_account}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        from_bank_account: v,
                      }))
                    }
                    options={bankOptions}
                    placeholder="Search bank account…"
                  />
                )}
              </Box>

              {/* TO */}
              <Box
                bg="#FAFBFC"
                borderRadius="7px"
                p={4}
                border="1px solid"
                borderColor={BORDER}
              >
                <Text
                  fontSize="11px"
                  textTransform="uppercase"
                  fontWeight="700"
                  color={MUTED}
                  letterSpacing="0.05em"
                  mb={2}
                >
                  Money Arrives
                </Text>
                <Box mb={needsToBank ? 2 : 0}>
                  <SearchableSelect
                    value={form.to_ledger}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        to_ledger: v,
                        to_bank_account: "",
                      }))
                    }
                    options={toLedgerOptions}
                    placeholder="Search destination ledger…"
                    error={!!fieldErrors.to_ledger}
                  />
                  <FieldError message={fieldErrors.to_ledger} />
                </Box>
                {needsToBank && (
                  <SearchableSelect
                    value={form.to_bank_account}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        to_bank_account: v,
                      }))
                    }
                    options={bankOptions}
                    placeholder="Search bank account…"
                  />
                )}
              </Box>
            </SimpleGrid>

            {/* AMOUNT */}
            <Box mb={4}>
              <FieldLabel>Amount</FieldLabel>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    amount: e.target.value,
                  }))
                }
                {...inputStyle}
                borderColor={
                  fieldErrors.amount ? "#F3C4C4" : BORDER
                }
              />
              <FieldError message={fieldErrors.amount} />
            </Box>

            {/* NARRATION */}
            <Box mb={4}>
              <FieldLabel required={false}>Narration</FieldLabel>
              <Textarea
                rows={3}
                value={form.narration}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    narration: e.target.value,
                  }))
                }
                placeholder="e.g. Weekly cash deposit, cheque #12345"
                fontSize="13px"
                borderColor={BORDER}
                borderRadius="7px"
                _hover={{ borderColor: "#BFC7D4" }}
                _focus={{
                  borderColor: PRIMARY_MAROON,
                  boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                }}
              />
            </Box>

            {/* PREVIEW */}
            <Box
              bg="#FFF5F7"
              border="1px solid"
              borderColor="#F3C4C4"
              borderRadius="7px"
              p={4}
              mb={5}
            >
              <Text
                fontSize="12px"
                fontWeight="700"
                color={DARK}
                mb={2}
              >
                Ledger Effect Preview
              </Text>
              <Text fontSize="12px" color={MUTED}>
                <b>{fromLedgerObj?.ledger_name || "—"}</b> will be{" "}
                <b>CREDITED</b> by ₹{" "}
                {Number(form.amount || 0).toFixed(2)}
              </Text>
              <Text fontSize="12px" color={MUTED} mt={1}>
                <b>{toLedgerObj?.ledger_name || "—"}</b> will be{" "}
                <b>DEBITED</b> by ₹{" "}
                {Number(form.amount || 0).toFixed(2)}
              </Text>
            </Box>

            {/* DIVIDER */}
            <Box
              borderTop="1px solid"
              borderColor="#E6EAF0"
              mb={4}
            />

            {/* BUTTONS */}
            <Flex justify="flex-end" align="center" gap={3}>
              <Button
                {...outlineBtn}
                onClick={handleCancel}
                isDisabled={saving}
              >
                Cancel
              </Button>
              <Button
                {...primaryBtn}
                onClick={handleSubmit}
                isLoading={saving}
                loadingText="Saving..."
                isDisabled={saving}
              >
                {isEdit ? "Save Changes" : "Post Contra"}
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default ContraFormPage;