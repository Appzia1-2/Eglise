import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
  Textarea,
} from "@chakra-ui/react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  createPayment,
  getPayment,
  updatePayment,
  listAccountLedgers,
  listBankAccounts,
} from "../api/registryServices";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#650A18";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const BLUE = "#315AB5";

const PAYMENT_TYPES = [
  { value: "BANK", label: "Bank" },
  { value: "CASH", label: "Cash" },
];

const TRANSACTION_TYPES = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CASH", label: "Cash" },
];

const today = () => new Date().toISOString().split("T")[0];

const AddPaymentPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [ledgers, setLedgers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    payment_date: today(),
    voucher_number: "",
    ref_no: "",
    party_name: "",
    payment_type: "BANK",
    payment_mode: "BANK_TRANSFER",
    bank_account: "",
    account_ledger: "",
    amount: "",
    narration: "",
  });

  // =========================================================
  // LOAD
  // =========================================================
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setPageError("");

        const [lRes, bRes] = await Promise.all([
          listAccountLedgers(),
          listBankAccounts(),
        ]);

        setLedgers(lRes?.data?.results ?? lRes?.data ?? []);
        setBanks(bRes?.data?.results ?? bRes?.data ?? []);

        if (isEdit) {
          const pRes = await getPayment(id);
          const p = pRes?.data ?? {};
          setFormData({
            payment_date: p.payment_date || today(),
            voucher_number: p.voucher_number || "",
            ref_no: p.ref_no || "",
            party_name: p.party_name || "",
            payment_type: p.payment_type || "BANK",
            payment_mode: p.payment_mode || "BANK_TRANSFER",
            bank_account: p.bank_account ? String(p.bank_account) : "",
            account_ledger: p.account_ledger ? String(p.account_ledger) : "",
            amount: p.amount ?? "",
            narration: p.narration || "",
          });
        }
      } catch (err) {
        console.error("Load error:", err);
        setPageError("Unable to load payment form data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEdit]);

  // =========================================================
  // MEMOS
  // =========================================================
  // Bank dropdown is only enabled for BANK type — but it is optional.
  const showBankField = formData.payment_type === "BANK";

  const bankOptions = useMemo(
    () =>
      banks
        .filter((b) => b.is_active !== false)
        .map((b) => ({
          value: String(b.id),
          label: b.display_name || `${b.bank_name} ${b.masked_account_number || ""}`,
        })),
    [banks]
  );

  const ledgerOptions = useMemo(
    () =>
      ledgers.map((l) => ({
        value: String(l.id),
        label: l.ledger_name,
      })),
    [ledgers]
  );

  // =========================================================
  // HANDLERS
  // =========================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: undefined }));
    setPageError("");
  };

  const handlePaymentTypeChange = (e) => {
    const v = e.target.value;
    setFormData((p) => ({
      ...p,
      payment_type: v,
      payment_mode: v === "CASH" ? "CASH" : "BANK_TRANSFER",
      bank_account: v === "CASH" ? "" : p.bank_account,
    }));
    setFieldErrors((p) => ({ ...p, payment_type: undefined, bank_account: undefined }));
  };

  // =========================================================
  // VALIDATION
  // =========================================================
  const validate = () => {
    const e = {};
    if (!formData.payment_date) e.payment_date = "Date is required.";
    if (!formData.party_name.trim()) e.party_name = "Party name is required.";
    if (!formData.payment_type) e.payment_type = "Payment type is required.";
    if (!formData.payment_mode) e.payment_mode = "Transaction type is required.";
    // ✅ bank_account is now OPTIONAL — no validation
    if (!formData.account_ledger) e.account_ledger = "Account ledger is required.";
    if (!formData.amount || Number(formData.amount) <= 0)
      e.amount = "Amount must be greater than zero.";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  // =========================================================
  // SUBMIT
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPageError("");
    if (!validate()) return;

    try {
      setSaving(true);

      // ✅ bank_account is optional — send null if empty
      const bankAccountPayload =
        showBankField && formData.bank_account
          ? Number(formData.bank_account)
          : null;

      const payload = {
        payment_date: formData.payment_date,
        ref_no: formData.ref_no.trim() || null,
        party_name: formData.party_name.trim(),
        payment_type: formData.payment_type,
        payment_mode: formData.payment_mode,
        bank_account: bankAccountPayload,
        account_ledger: Number(formData.account_ledger),
        amount: Number(formData.amount),
        narration: formData.narration.trim() || null,
      };

      if (isEdit) {
        await updatePayment(id, payload);
      } else {
        await createPayment(payload);
      }

      navigate("/payments");
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const normalized = {};
        Object.entries(data).forEach(([k, v]) => {
          normalized[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
        setFieldErrors(normalized);
        setPageError(
          Object.entries(normalized)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        );
      } else {
        setPageError("Unable to save payment.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigate("/payments");

  if (loading) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />
        <Container maxW="1400px" flex="1" py={5}>
          <Text color={SECONDARY_TEXT} fontSize="13px">
            Loading payment form...
          </Text>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 4, md: 5 }} pt={3} pb={6} flex="1">
        {/* BREADCRUMB */}
        <HStack gap={2} mb={2} fontSize="11px">
          <Text color={BLUE}>Activities</Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={BLUE}>Payments</Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={SECONDARY_TEXT}>{isEdit ? "Edit Payment" : "Add Payment"}</Text>
        </HStack>

        {/* HEADER */}
        <Box mb={4}>
          <Text
            color={PRIMARY_RED}
            fontSize="10px"
            fontWeight="700"
            letterSpacing="0.3px"
            mb={0.5}
          >
            PAYMENTS
          </Text>
          <Heading
            color={TEXT_COLOR}
            fontSize={{ base: "23px", md: "27px" }}
            fontWeight="600"
            lineHeight="1.1"
          >
            {isEdit ? "Edit Payment" : "Add New Payment"}
          </Heading>
          <Text color={SECONDARY_TEXT} fontSize="12px" mt={0.5}>
            {isEdit
              ? "Update a payment transaction."
              : "Record a new payment transaction."}
          </Text>
        </Box>

        {/* FORM CARD */}
        <Box
          bg="white"
          px={{ base: 4, md: 6 }}
          py={{ base: 4, md: 5 }}
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="10px"
        >
          <form onSubmit={handleSubmit}>
            <SectionTitle>1. Payment Information</SectionTitle>

            {pageError && (
              <Box
                mb={4}
                p={3}
                borderRadius="6px"
                bg="#FFF5F5"
                border="1px solid #FED7D7"
              >
                <Text color="red.600" fontSize="11px" whiteSpace="pre-line">
                  {pageError}
                </Text>
              </Box>
            )}

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {/* DATE */}
              <FormField label="Date" required error={fieldErrors.payment_date}>
                <Input
                  type="date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  h="40px"
                  fontSize="12px"
                  borderColor={fieldErrors.payment_date ? "red.400" : BORDER_COLOR}
                  borderRadius="6px"
                  _focus={{
                    borderColor: PRIMARY_RED,
                    boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
                  }}
                />
              </FormField>

              {/* VOUCHER NUMBER (read-only) */}
              <FormField label="Voucher Number" required>
                <HStack gap={2}>
                  <Input
                    value={formData.voucher_number}
                    isReadOnly
                    placeholder="Auto-generated"
                    bg="#F7F9FB"
                    h="40px"
                    fontSize="12px"
                    borderColor={BORDER_COLOR}
                    borderRadius="6px"
                    color={TEXT_COLOR}
                  />
                  <Box
                    px={2.5}
                    py="5px"
                    border="1px solid #F5B5B5"
                    borderRadius="4px"
                    bg="#FFF5F7"
                    flexShrink={0}
                  >
                    <Text color={PRIMARY_RED} fontSize="10px" fontWeight="600">
                      Auto-generated
                    </Text>
                  </Box>
                </HStack>
              </FormField>

              {/* REF NO */}
              <FormField label="Ref Number" error={fieldErrors.ref_no}>
                <Input
                  name="ref_no"
                  value={formData.ref_no}
                  onChange={handleChange}
                  placeholder="Enter reference number"
                  h="40px"
                  fontSize="12px"
                  borderColor={BORDER_COLOR}
                  borderRadius="6px"
                  _focus={{
                    borderColor: PRIMARY_RED,
                    boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
                  }}
                />
              </FormField>

              {/* PARTY NAME */}
              <FormField label="Party Name" required error={fieldErrors.party_name}>
                <Input
                  name="party_name"
                  value={formData.party_name}
                  onChange={handleChange}
                  placeholder="e.g. St. Joseph Suppliers"
                  h="40px"
                  fontSize="12px"
                  borderColor={fieldErrors.party_name ? "red.400" : BORDER_COLOR}
                  borderRadius="6px"
                  _focus={{
                    borderColor: PRIMARY_RED,
                    boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
                  }}
                />
              </FormField>

              {/* PAYMENT TYPE */}
              <FormField label="Payment Type" required error={fieldErrors.payment_type}>
                <SelectWrapper error={fieldErrors.payment_type}>
                  <Box
                    as="select"
                    name="payment_type"
                    value={formData.payment_type}
                    onChange={handlePaymentTypeChange}
                    width="100%"
                    height="40px"
                    fontSize="12px"
                    color={TEXT_COLOR}
                    border={`1px solid ${
                      fieldErrors.payment_type ? "#F56565" : BORDER_COLOR
                    }`}
                    borderRadius="6px"
                    bg="white"
                    appearance="none"
                    px="11px"
                    outline="none"
                    cursor="pointer"
                  >
                    {PAYMENT_TYPES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </Box>
                </SelectWrapper>
              </FormField>

              {/* TRANSACTION TYPE */}
              <FormField label="Transaction Type" required error={fieldErrors.payment_mode}>
                <SelectWrapper error={fieldErrors.payment_mode}>
                  <Box
                    as="select"
                    name="payment_mode"
                    value={formData.payment_mode}
                    onChange={handleChange}
                    width="100%"
                    height="40px"
                    fontSize="12px"
                    color={TEXT_COLOR}
                    border={`1px solid ${
                      fieldErrors.payment_mode ? "#F56565" : BORDER_COLOR
                    }`}
                    borderRadius="6px"
                    bg="white"
                    appearance="none"
                    px="11px"
                    outline="none"
                    cursor="pointer"
                  >
                    {TRANSACTION_TYPES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </Box>
                </SelectWrapper>
              </FormField>

              {/* BANK ACCOUNT — OPTIONAL */}
              <FormField label="Bank Account" error={fieldErrors.bank_account}>
                <SelectWrapper error={fieldErrors.bank_account}>
                  <Box
                    as="select"
                    name="bank_account"
                    value={formData.bank_account}
                    onChange={handleChange}
                    disabled={!showBankField}
                    width="100%"
                    height="40px"
                    fontSize="12px"
                    color={formData.bank_account ? TEXT_COLOR : SECONDARY_TEXT}
                    border={`1px solid ${
                      fieldErrors.bank_account ? "#F56565" : BORDER_COLOR
                    }`}
                    borderRadius="6px"
                    bg={!showBankField ? "#F7F9FB" : "white"}
                    appearance="none"
                    px="11px"
                    outline="none"
                    cursor={!showBankField ? "not-allowed" : "pointer"}
                  >
                    <option value="">
                      {!showBankField
                        ? "Not applicable for Cash"
                        : "Select Bank Account (optional)"}
                    </option>
                    {bankOptions.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </Box>
                </SelectWrapper>
              </FormField>

              {/* ACCOUNT LEDGER */}
              <FormField
                label="Account Ledger"
                required
                error={fieldErrors.account_ledger}
              >
                <SelectWrapper error={fieldErrors.account_ledger}>
                  <Box
                    as="select"
                    name="account_ledger"
                    value={formData.account_ledger}
                    onChange={handleChange}
                    width="100%"
                    height="40px"
                    fontSize="12px"
                    color={formData.account_ledger ? TEXT_COLOR : SECONDARY_TEXT}
                    border={`1px solid ${
                      fieldErrors.account_ledger ? "#F56565" : BORDER_COLOR
                    }`}
                    borderRadius="6px"
                    bg="white"
                    appearance="none"
                    px="11px"
                    outline="none"
                    cursor="pointer"
                  >
                    <option value="">Select Account Ledger</option>
                    {ledgerOptions.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </Box>
                </SelectWrapper>
              </FormField>

              {/* AMOUNT */}
              <FormField label="Amount" required error={fieldErrors.amount}>
                <Input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  h="40px"
                  fontSize="12px"
                  borderColor={fieldErrors.amount ? "red.400" : BORDER_COLOR}
                  borderRadius="6px"
                  _focus={{
                    borderColor: PRIMARY_RED,
                    boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
                  }}
                />
              </FormField>
            </SimpleGrid>

            {/* NARRATION */}
            <Box mt={4}>
              <FormField label="Narration" error={fieldErrors.narration}>
                <Textarea
                  name="narration"
                  value={formData.narration}
                  onChange={handleChange}
                  placeholder="Payment towards parish maintenance supplies."
                  minH="70px"
                  fontSize="12px"
                  borderColor={BORDER_COLOR}
                  borderRadius="6px"
                  resize="vertical"
                  _focus={{
                    borderColor: PRIMARY_RED,
                    boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
                  }}
                />
              </FormField>
            </Box>

            {/* SUBMIT */}
            <Flex justify="flex-end" mt={5}>
              <Button
                type="submit"
                bg={PRIMARY_RED}
                color="white"
                h="44px"
                px={8}
                minW="180px"
                fontSize="12px"
                fontWeight="600"
                borderRadius="6px"
                loading={saving}
                loadingText="Saving..."
                _hover={{ bg: DARK_RED }}
              >
                {isEdit ? "Save Changes" : "Save Payment"}
              </Button>
            </Flex>
          </form>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

// =========================================================
// HELPERS
// =========================================================

const SectionTitle = ({ children }) => (
  <Heading fontSize="15px" fontWeight="700" color={TEXT_COLOR} mb={4}>
    {children}
  </Heading>
);

const FormField = ({ label, required, error, children }) => (
  <Box>
    <Text fontSize="11px" fontWeight="600" color={TEXT_COLOR} mb={1.5}>
      {label}
      {required && (
        <Text as="span" color={PRIMARY_RED} ml="3px">
          *
        </Text>
      )}
    </Text>
    {children}
    {error && (
      <Text color="red.500" fontSize="10px" mt={1}>
        {error}
      </Text>
    )}
  </Box>
);

const SelectWrapper = ({ children, error }) => (
  <Box position="relative" width="100%">
    {children}
    <Box
      position="absolute"
      right="12px"
      top="50%"
      transform="translateY(-50%)"
      pointerEvents="none"
      color={SECONDARY_TEXT}
      fontSize="10px"
    >
      ▼
    </Box>
  </Box>
);

export default AddPaymentPage;