import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Text,
  Textarea,
} from "@chakra-ui/react";

import { LuSearch, LuX, LuChevronDown } from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BankAccountSelect from "../components/BankAccountSelect";

import {
  createPayment,
  getPayment,
  updatePayment,
  listAccountLedgers,
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

const PAYMENT_LEDGER_NATURES = ["EXPENSE", "LIABILITY"];

const today = () => new Date().toISOString().split("T")[0];

/* -------------------------------------------------------
   Searchable Ledger Select Component
------------------------------------------------------- */
const SearchableLedgerSelect = ({
  value,
  onChange,
  options,
  placeholder,
  hasError,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  const selectedOption = options.find((o) => o.value === String(value));
  const selectedLabel = selectedOption ? selectedOption.label : "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <Box ref={containerRef} position="relative" w="100%">
      {isOpen ? (
        <Box position="relative">
          <Icon
            as={LuSearch}
            position="absolute"
            left="12px"
            top="50%"
            transform="translateY(-50%)"
            color={SECONDARY_TEXT}
            boxSize={3.5}
            pointerEvents="none"
            zIndex={1}
          />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ledger..."
            pl="34px"
            pr="34px"
            h="40px"
            fontSize="12px"
            borderColor={PRIMARY_RED}
            borderRadius="6px"
            _focus={{
              borderColor: PRIMARY_RED,
              boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
            }}
          />
          <Icon
            as={LuX}
            position="absolute"
            right="12px"
            top="50%"
            transform="translateY(-50%)"
            color={SECONDARY_TEXT}
            boxSize={3.5}
            cursor="pointer"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
            zIndex={1}
          />
        </Box>
      ) : (
        <Box
          onClick={() => setIsOpen(true)}
          h="40px"
          border={`1px solid ${hasError ? "#F56565" : BORDER_COLOR}`}
          borderRadius="6px"
          px="11px"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          cursor="pointer"
          bg="white"
          _hover={{ borderColor: PRIMARY_RED }}
        >
          <Text
            fontSize="12px"
            color={selectedLabel ? TEXT_COLOR : SECONDARY_TEXT}
            noOfLines={1}
          >
            {selectedLabel || placeholder || "Select ledger"}
          </Text>
          <HStack gap={1} flexShrink={0}>
            {selectedLabel && (
              <Icon
                as={LuX}
                boxSize={3}
                color={SECONDARY_TEXT}
                onClick={handleClear}
                _hover={{ color: PRIMARY_RED }}
              />
            )}
            <Icon as={LuChevronDown} boxSize={3.5} color={SECONDARY_TEXT} />
          </HStack>
        </Box>
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
          boxShadow="0 4px 12px rgba(0,0,0,0.1)"
          maxH="220px"
          overflowY="auto"
          zIndex={20}
        >
          {filtered.length === 0 ? (
            <Box px={3} py={2}>
              <Text fontSize="11px" color={SECONDARY_TEXT}>
                No ledgers found
              </Text>
            </Box>
          ) : (
            filtered.map((o) => {
              const isSelected = o.value === String(value);
              return (
                <Box
                  key={o.value}
                  px={3}
                  py={2}
                  fontSize="12px"
                  color={TEXT_COLOR}
                  cursor="pointer"
                  bg={isSelected ? "#FDF2F5" : "white"}
                  _hover={{ bg: "#F7F9FB" }}
                  onClick={() => handleSelect(o)}
                >
                  {o.label}
                </Box>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
};

const AddPaymentPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [ledgers, setLedgers] = useState([]);
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
    bank_account: null,
    account_ledger: "",
    amount: "",
    narration: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setPageError("");

        const lRes = await listAccountLedgers();
        const all = lRes?.data?.results ?? lRes?.data ?? [];

        const filtered = (Array.isArray(all) ? all : [])
          .filter((l) =>
            PAYMENT_LEDGER_NATURES.includes(
              String(l.ledger_nature || "").toUpperCase()
            )
          )
          .sort((a, b) => {
            const ga = (a.account_group_name || "").toLowerCase();
            const gb = (b.account_group_name || "").toLowerCase();
            if (ga !== gb) return ga.localeCompare(gb);
            return (a.ledger_name || "").localeCompare(b.ledger_name || "");
          });

        setLedgers(filtered);

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
            bank_account: p.bank_account ? Number(p.bank_account) : null,
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

  const showBankField = formData.payment_type === "BANK";

  // ✅ Bank payment requires a bank account
  const bankRequired = showBankField && !formData.bank_account;

  const ledgerOptions = useMemo(
    () =>
      ledgers.map((l) => ({
        value: String(l.id),
        label: l.account_group_name
          ? `${l.ledger_name} (${l.account_group_name})`
          : l.ledger_name,
      })),
    [ledgers]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: undefined }));
    setPageError("");
  };

  const handleLedgerChange = (value) => {
    setFormData((p) => ({ ...p, account_ledger: value }));
    setFieldErrors((p) => ({ ...p, account_ledger: undefined }));
    setPageError("");
  };

  const handlePaymentTypeChange = (e) => {
    const v = e.target.value;
    setFormData((p) => ({
      ...p,
      payment_type: v,
      payment_mode: v === "CASH" ? "CASH" : "BANK_TRANSFER",
      bank_account: v === "CASH" ? null : p.bank_account,
    }));
    setFieldErrors((p) => ({
      ...p,
      payment_type: undefined,
      bank_account: undefined,
    }));
  };

  const validate = () => {
    const e = {};
    if (!formData.payment_date) e.payment_date = "Date is required.";
    if (!formData.party_name.trim()) e.party_name = "Party name is required.";
    if (!formData.payment_type) e.payment_type = "Payment type is required.";
    if (!formData.payment_mode) e.payment_mode = "Transaction type is required.";
    if (!formData.account_ledger) e.account_ledger = "Account ledger is required.";
    if (!formData.amount || Number(formData.amount) <= 0)
      e.amount = "Amount must be greater than zero.";

    // ✅ Bank payments require a bank account
    if (formData.payment_type === "BANK" && !formData.bank_account) {
      e.bank_account = "Bank account is required for bank payments.";
    }

    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPageError("");
    if (!validate()) return;

    try {
      setSaving(true);

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
        <HStack gap={2} mb={2} fontSize="11px">
          <Text color={BLUE}>Activities</Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={BLUE}>Payments</Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={SECONDARY_TEXT}>
            {isEdit ? "Edit Payment" : "Add Payment"}
          </Text>
        </HStack>

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

              {/* ✅ BANK ACCOUNT — required for BANK, hidden for CASH */}
              <Box>
                {showBankField ? (
                  <BankAccountSelect
                    value={formData.bank_account}
                    onChange={(id) =>
                      setFormData((p) => ({ ...p, bank_account: id }))
                    }
                    label="Bank Account"
                    isRequired={true}
                    errorText={fieldErrors.bank_account}
                  />
                ) : (
                  <>
                    <Text
                      fontSize="11px"
                      fontWeight="600"
                      color={TEXT_COLOR}
                      mb={1.5}
                    >
                      Bank Account
                    </Text>
                    <Input
                      value="Not applicable for Cash"
                      isReadOnly
                      bg="#F7F9FB"
                      color={SECONDARY_TEXT}
                      h="40px"
                      fontSize="12px"
                      borderColor={BORDER_COLOR}
                      borderRadius="6px"
                    />
                  </>
                )}
              </Box>

              <FormField
                label="Account Ledger"
                required
                error={fieldErrors.account_ledger}
              >
                <SearchableLedgerSelect
                  value={formData.account_ledger}
                  onChange={handleLedgerChange}
                  options={ledgerOptions}
                  placeholder="Select Account Ledger"
                  hasError={Boolean(fieldErrors.account_ledger)}
                />
              </FormField>

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

            <Flex
              justify="flex-end"
              mt={5}
              direction="column"
              align="flex-end"
            >
              {bankRequired && (
                <Text
                  fontSize="11px"
                  color="red.500"
                  mb={2}
                  textAlign="right"
                >
                  Bank account is required for bank payments.
                </Text>
              )}
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