
// src/pages/ContraFormPage.jsx

import React, { useEffect, useState } from "react";
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
import BankAccountSelect from "../components/BankAccountSelect";

import {
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

const TYPE_OPTIONS = [
  {
    value: "CASH_TO_BANK",
    label: "Cash deposited to Bank",
  },
  {
    value: "BANK_TO_CASH",
    label: "Cash withdrawn from Bank",
  },
  {
    value: "BANK_TO_BANK",
    label: "Bank to Bank transfer",
  },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const ContraFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    contra_date: todayISO(),
    contra_type: "CASH_TO_BANK",
    from_bank_account: null,
    to_bank_account: null,
    amount: "",
    narration: "",
    ref_no: "",
  });

  // ==========================================================
  // LOAD EXISTING VOUCHER
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setServerError("");

      try {
        if (isEdit) {
          const res = await getContra(id);
          const c = res.data;

          if (!mounted) return;

          setForm({
            contra_date: c.contra_date || todayISO(),
            contra_type: c.contra_type || "CASH_TO_BANK",
            from_bank_account: c.from_bank_account
              ? Number(c.from_bank_account)
              : null,
            to_bank_account: c.to_bank_account
              ? Number(c.to_bank_account)
              : null,
            amount: c.amount ?? "",
            narration: c.narration || "",
            ref_no: c.ref_no || "",
          });
        }
      } catch (err) {
        if (mounted) {
          setServerError(
            err?.response?.data?.detail || "Failed to load contra voucher."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const isBankToCash = form.contra_type === "BANK_TO_CASH";
  const isCashToBank = form.contra_type === "CASH_TO_BANK";
  const isBankToBank = form.contra_type === "BANK_TO_BANK";

  // ==========================================================
  // HANDLERS
  // ==========================================================

  const handleTypeChange = (type) => {
    setForm((f) => ({
      ...f,
      contra_type: type,
      from_bank_account: null,
      to_bank_account: null,
    }));

    setFieldErrors({});
    setServerError("");
  };

  const validate = () => {
    const errs = {};

    if (!form.contra_date) {
      errs.contra_date = "Date is required.";
    }

    if (isBankToCash || isBankToBank) {
      if (!form.from_bank_account) {
        errs.from_bank_account = "Select the source bank account.";
      }
    }

    if (isCashToBank || isBankToBank) {
      if (!form.to_bank_account) {
        errs.to_bank_account = "Select the destination bank account.";
      }
    }

    if (
      isBankToBank &&
      form.from_bank_account &&
      form.to_bank_account &&
      String(form.from_bank_account) === String(form.to_bank_account)
    ) {
      errs.to_bank_account =
        "Source and destination bank accounts must be different.";
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
        description: "Some required fields are missing.",
        type: "warning",
        duration: 5000,
      });

      return;
    }

    // Only bank account IDs are sent.
    // The backend automatically resolves the corresponding ledgers.
    const payload = {
      contra_date: form.contra_date,
      contra_type: form.contra_type,

      from_bank_account:
        isBankToCash || isBankToBank
          ? Number(form.from_bank_account)
          : null,

      to_bank_account:
        isCashToBank || isBankToBank
          ? Number(form.to_bank_account)
          : null,

      amount: Number(form.amount),
      narration: form.narration || "",
      ref_no: form.ref_no || "",
    };

    try {
      setSaving(true);

      if (isEdit) {
        await updateContra(id, payload);
      } else {
        await createContra(payload);
      }

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

        Object.entries(data).forEach(([key, value]) => {
          const message = Array.isArray(value)
            ? value.join(", ")
            : typeof value === "string"
              ? value
              : JSON.stringify(value);

          if (
            [
              "contra_date",
              "contra_type",
              "amount",
              "from_bank_account",
              "to_bank_account",
            ].includes(key)
          ) {
            errs[key] = message;
          } else {
            general = message;
          }
        });

        setFieldErrors(errs);

        if (general) {
          setServerError(general);
        }

        showToast({
          title: "Could not save",
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
  // STYLES
  // ==========================================================

  const inputStyle = {
    h: "42px",
    fontSize: "13px",
    borderColor: BORDER,
    borderRadius: "7px",
    color: DARK,
    bg: "white",
    _placeholder: {
      color: "#98A2B3",
    },
    _hover: {
      borderColor: "#BFC7D4",
    },
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
    _hover: {
      bg: "#650A18",
    },
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
    _hover: {
      bg: "#FFF5F7",
    },
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
  // MAIN FORM
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
            <Text color={DARK}>
              {isEdit ? "Edit" : "Add"}
            </Text>
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
              <Text
                fontSize="10px"
                fontWeight="700"
                color={RED}
                mb={1}
              >
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

            {/* TRANSFER TYPE */}

            <Box mb={5}>
              <FieldLabel>Transfer Type</FieldLabel>

              <HStack spacing={2} flexWrap="wrap">
                {TYPE_OPTIONS.map((type) => {
                  const active = form.contra_type === type.value;

                  return (
                    <Button
                      key={type.value}
                      type="button"
                      size="sm"
                      onClick={() => handleTypeChange(type.value)}
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
                      {type.label}
                    </Button>
                  );
                })}
              </HStack>
            </Box>

            {/* DATE AND REFERENCE NUMBER */}

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

            {/* BANK ACCOUNT SELECTION */}

            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              spacing={4}
              mb={4}
            >
              {(isBankToCash || isBankToBank) && (
                <Box>
                  <BankAccountSelect
                    value={form.from_bank_account}
                    onChange={(value) => {
                      setForm((f) => ({
                        ...f,
                        from_bank_account: value,
                      }));

                      setFieldErrors((errors) => ({
                        ...errors,
                        from_bank_account: "",
                        to_bank_account: "",
                      }));
                    }}
                    label="From Bank Account"
                    isRequired={true}
                    errorText={fieldErrors.from_bank_account}
                  />
                </Box>
              )}

              {(isCashToBank || isBankToBank) && (
                <Box>
                  <BankAccountSelect
                    value={form.to_bank_account}
                    onChange={(value) => {
                      setForm((f) => ({
                        ...f,
                        to_bank_account: value,
                      }));

                      setFieldErrors((errors) => ({
                        ...errors,
                        to_bank_account: "",
                      }));
                    }}
                    label="To Bank Account"
                    isRequired={true}
                    errorText={fieldErrors.to_bank_account}
                  />
                </Box>
              )}
            </SimpleGrid>

            {/* CASH ACCOUNT INFORMATION */}

            {isCashToBank && (
              <Box
                mb={4}
                p={3}
                border="1px solid #DCE2EA"
                borderRadius="7px"
                bg="#F8FAFC"
              >
                <Text fontSize="12px" color={MUTED}>
                  **From:** Cash in Hand
                </Text>
                <Text fontSize="11px" color={MUTED} mt={1}>
                  The Cash in Hand ledger will be selected automatically.
                </Text>
              </Box>
            )}

            {isBankToCash && (
              <Box
                mb={4}
                p={3}
                border="1px solid #DCE2EA"
                borderRadius="7px"
                bg="#F8FAFC"
              >
                <Text fontSize="12px" color={MUTED}>
                  **To:** Cash in Hand
                </Text>
                <Text fontSize="11px" color={MUTED} mt={1}>
                  The Cash in Hand ledger will be selected automatically.
                </Text>
              </Box>
            )}

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
                _hover={{
                  borderColor: "#BFC7D4",
                }}
                _focus={{
                  borderColor: PRIMARY_MAROON,
                  boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                }}
              />
            </Box>

            <Box
              borderTop="1px solid"
              borderColor="#E6EAF0"
              mb={4}
            />

            {/* ACTIONS */}

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
