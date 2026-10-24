import React, { useEffect, useState } from "react";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Switch,
  Text,
} from "@chakra-ui/react";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listBankAccounts,
  updateBankAccount,
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
  toaster.create({ title, description, type, duration, closable: true });
};

const BankAccountEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await listBankAccounts();
        const data = res?.data ?? res;
        const items = Array.isArray(data) ? data : data?.results || [];
        const match = items.find((a) => String(a.id) === String(id));

        if (!match) {
          setError("Bank account not found.");
          setForm(null);
        } else {
          setForm({
            bank_name: match.bank_name || "",
            account_number: match.account_number || "",
            ifsc_code: match.ifsc_code || "",
            branch: match.branch || "",
            opening_balance: match.opening_balance || "", // ✅ NEW
            is_active: !!match.is_active,
          });
        }
      } catch (err) {
        console.error("Error loading bank account:", err);
        setError("Unable to load bank account.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!form) return;

    const trimmed = {
      bank_name: form.bank_name.trim(),
      account_number: form.account_number.trim(),
      ifsc_code: form.ifsc_code.trim().toUpperCase() || null,
      branch: form.branch.trim() || null,
      opening_balance: Number(form.opening_balance || 0), // ✅ NEW
      is_active: form.is_active,
    };

    const errors = {};
    if (!trimmed.bank_name) errors.bank_name = "Bank name is required.";
    if (!trimmed.account_number)
      errors.account_number = "Account number is required.";

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      showToast({
        title: "Please fix the form",
        description: Object.values(errors)[0],
        type: "warning",
        duration: 5000,
      });
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});

      await updateBankAccount(id, trimmed);

      showToast({
        title: "Bank account updated",
        description: "The bank account was updated successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/bank-accounts");
    } catch (err) {
      console.error("Error updating bank account:", err);
      const responseData = err?.response?.data;

      if (
        responseData &&
        typeof responseData === "object" &&
        !Array.isArray(responseData)
      ) {
        const errs = {};
        Object.entries(responseData).forEach(([key, value]) => {
          if (Array.isArray(value)) errs[key] = value.join(", ");
          else if (typeof value === "string") errs[key] = value;
          else errs[key] = JSON.stringify(value);
        });

        setFieldErrors(errs);

        const generalError =
          responseData.detail || responseData.non_field_errors?.[0];
        const fieldMessages = Object.values(errs).filter(Boolean);

        showToast({
          title: "Could not update bank account",
          description:
            generalError ||
            (fieldMessages.length === 1
              ? fieldMessages[0]
              : "Unable to update. Please try again."),
          type: "error",
          duration: 7000,
        });
      } else {
        showToast({
          title: "Could not update bank account",
          description: "Unable to update. Please try again.",
          type: "error",
          duration: 7000,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigate("/bank-accounts");

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

  const FieldLabel = ({ children, required = false }) => (
    <Text fontSize="12px" fontWeight="600" color={DARK} mb="8px">
      {children}
      {required && (
        <Text as="span" color={RED} ml="2px">
          *
        </Text>
      )}
    </Text>
  );

  return (
    <Box minH="100vh" bg="#FFFFFF" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%">
        <Box w="100%" px={{ base: 3, md: 5 }} py={{ base: 3, md: 5 }}>
          <HStack gap={2} mb={3} color={MUTED} fontSize="12px">
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Accounts</Text>
            <Text>/</Text>
            <Text>Bank Accounts</Text>
            <Text>/</Text>
            <Text color={DARK}>Edit Bank Account</Text>
          </HStack>

          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
            mb={4}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <Text fontSize="11px" fontWeight="700" color={RED} mb={1}>
                BANK ACCOUNTS
              </Text>

              <Heading
                color={DARK}
                fontSize={{ base: "24px", md: "28px" }}
                lineHeight="1.2"
                mb={1}
              >
                Edit Bank Account
              </Heading>

              <Text color={MUTED} fontSize="12px">
                Update the bank account details.
              </Text>
            </Box>
          </Flex>

          <Box
            border="1px solid"
            borderColor={BORDER}
            borderRadius="9px"
            bg="white"
            p={{ base: 4, md: 6 }}
            width="100%"
            boxShadow="0 1px 3px rgba(16, 24, 40, 0.04)"
          >
            {loading ? (
              <Flex justify="center" py={12}>
                <Spinner size="lg" color={PRIMARY_MAROON} />
              </Flex>
            ) : error ? (
              <Box
                p={3}
                borderRadius="6px"
                bg="#FFF5F5"
                border="1px solid #FED7D7"
              >
                <Text color="red.600" fontSize="12px">
                  {error}
                </Text>
              </Box>
            ) : (
              <>
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
                    Bank Details
                  </Text>
                </Box>

                <Box mb={5}>
                  <FieldLabel required>Bank Name</FieldLabel>
                  <Input
                    value={form.bank_name}
                    onChange={(e) => setField("bank_name", e.target.value)}
                    {...inputStyle}
                    borderColor={
                      fieldErrors.bank_name ? "#F3C4C4" : BORDER
                    }
                  />
                  {fieldErrors.bank_name && (
                    <Text fontSize="11px" color="#B42318" mt={1}>
                      {fieldErrors.bank_name}
                    </Text>
                  )}
                </Box>

                <Box mb={5}>
                  <FieldLabel required>Account Number</FieldLabel>
                  <Input
                    value={form.account_number}
                    onChange={(e) =>
                      setField("account_number", e.target.value)
                    }
                    fontFamily="monospace"
                    {...inputStyle}
                    borderColor={
                      fieldErrors.account_number ? "#F3C4C4" : BORDER
                    }
                  />
                  {fieldErrors.account_number && (
                    <Text fontSize="11px" color="#B42318" mt={1}>
                      {fieldErrors.account_number}
                    </Text>
                  )}
                </Box>

                <Box mb={5}>
                  <FieldLabel>IFSC Code</FieldLabel>
                  <Input
                    value={form.ifsc_code}
                    onChange={(e) =>
                      setField("ifsc_code", e.target.value.toUpperCase())
                    }
                    fontFamily="monospace"
                    {...inputStyle}
                    borderColor={
                      fieldErrors.ifsc_code ? "#F3C4C4" : BORDER
                    }
                  />
                  {fieldErrors.ifsc_code && (
                    <Text fontSize="11px" color="#B42318" mt={1}>
                      {fieldErrors.ifsc_code}
                    </Text>
                  )}
                </Box>

                <Box mb={5}>
                  <FieldLabel>Branch</FieldLabel>
                  <Input
                    value={form.branch}
                    onChange={(e) => setField("branch", e.target.value)}
                    {...inputStyle}
                    borderColor={
                      fieldErrors.branch ? "#F3C4C4" : BORDER
                    }
                  />
                  {fieldErrors.branch && (
                    <Text fontSize="11px" color="#B42318" mt={1}>
                      {fieldErrors.branch}
                    </Text>
                  )}
                </Box>

                {/* ✅ NEW: OPENING BALANCE */}
                <Box mb={5}>
                  <FieldLabel>Opening Balance (₹)</FieldLabel>
                  <Input
                    type="number"
                    value={form.opening_balance}
                    onChange={(e) => setField("opening_balance", e.target.value)}
                    {...inputStyle}
                    borderColor={
                      fieldErrors.opening_balance ? "#F3C4C4" : BORDER
                    }
                  />
                  {fieldErrors.opening_balance && (
                    <Text fontSize="11px" color="#B42318" mt={1}>
                      {fieldErrors.opening_balance}
                    </Text>
                  )}
                </Box>

                {/* ACTIVE TOGGLE — Chakra v3 API */}
                <Box mb={5}>
                  <HStack spacing={3}>
                    <Switch.Root
                      checked={form.is_active}
                      onCheckedChange={(e) =>
                        setField("is_active", e.checked)
                      }
                      colorPalette="green"
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                    <Text fontSize="12px" fontWeight="600" color={DARK}>
                      Active
                    </Text>
                  </HStack>
                </Box>

                <Box borderTop="1px solid" borderColor="#E6EAF0" mb={4} />

                <Flex justify="flex-end" align="center" gap={3}>
                  <Button
                    variant="outline"
                    borderColor={RED}
                    color={RED}
                    h="38px"
                    px={6}
                    borderRadius="7px"
                    fontSize="12px"
                    fontWeight="600"
                    onClick={handleCancel}
                    disabled={saving}
                    _hover={{ bg: "#FFF5F7" }}
                  >
                    Cancel
                  </Button>

                  <Button
                    h="38px"
                    px={7}
                    bg={PRIMARY_MAROON}
                    color="white"
                    borderRadius="7px"
                    fontSize="12px"
                    fontWeight="600"
                    loading={saving}
                    disabled={saving}
                    onClick={handleSubmit}
                    _hover={{ bg: "#650A18" }}
                  >
                    Update Bank Account
                  </Button>
                </Flex>
              </>
            )}
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default BankAccountEditPage;