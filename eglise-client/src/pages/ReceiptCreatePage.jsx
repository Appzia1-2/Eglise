// src/admin/pages/ReceiptCreatePage.jsx

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@chakra-ui/react";
import {
  LuCalendar,
  LuLock,
  LuChevronDown,
  LuPlus,
  LuMinus,
  LuSearch,
  LuX,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BankAccountSelect from "../components/BankAccountSelect";
import { toaster } from "../components/ui/toaster";
import {
  listMembers,
  listAccountLedgers,
  createReceipt,
} from "../api/registryServices";
import { amountInWords } from "../utils/amountInWords";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const RECEIPT_LEDGER_NATURES = ["INCOME"];
const RECEIPT_EXCLUDE_LEDGER_NAMES = [
  "cash in hand",
  "balance in savings account",
  "balance in deposit account",
  "balance in other accounts",
];

const isReceiptLedger = (ledger) => {
  const name = String(ledger.ledger_name || "").trim().toLowerCase();
  const nature = String(ledger.ledger_nature || "").toUpperCase();

  return (
    RECEIPT_LEDGER_NATURES.includes(nature) &&
    !RECEIPT_EXCLUDE_LEDGER_NAMES.includes(name) &&
    !name.includes("closing")
  );
};

const today = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().slice(0, 10);
};

const emptyLine = () => ({ ledger: "", amount: "" });

const RequiredMark = () => (
  <Text as="span" color={RED} ml="3px" aria-hidden="true">
    *
  </Text>
);

/* -------------------------------------------------------
   Searchable Ledger Select
------------------------------------------------------- */

const SearchableLedgerSelect = ({
  value,
  onChange,
  ledgers,
  placeholder,
  hasError,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  const selectedLedger = ledgers.find(
    (ledger) => String(ledger.id) === String(value)
  );

  const selectedLabel = selectedLedger
    ? selectedLedger.account_group_name
      ? `${selectedLedger.ledger_name} (${selectedLedger.account_group_name})`
      : selectedLedger.ledger_name
    : "";

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return ledgers;

    return ledgers.filter((ledger) => {
      const label = ledger.account_group_name
        ? `${ledger.ledger_name} (${ledger.account_group_name})`
        : ledger.ledger_name || "";
      return label.toLowerCase().includes(search);
    });
  }, [ledgers, query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (ledger) => {
    onChange(String(ledger.id));
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = (event) => {
    event.stopPropagation();
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
            color={MUTED}
            boxSize={4}
            pointerEvents="none"
            zIndex={1}
          />

          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ledger..."
            pl="36px"
            pr="36px"
            h="44px"
            borderColor={RED}
            borderRadius="6px"
            fontSize="13px"
            _focus={{ borderColor: RED, boxShadow: "none" }}
          />

          <Icon
            as={LuX}
            position="absolute"
            right="12px"
            top="50%"
            transform="translateY(-50%)"
            color={MUTED}
            boxSize={4}
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
          role="button"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-required="true"
          onClick={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
          h="44px"
          border={`1px solid ${hasError ? RED : BORDER}`}
          borderRadius="6px"
          px="12px"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          cursor="pointer"
          bg="white"
          _hover={{ borderColor: MUTED }}
        >
          <Text
            fontSize="13px"
            color={selectedLabel ? DARK : MUTED}
            noOfLines={1}
          >
            {selectedLabel || placeholder || "Select ledger"}
          </Text>

          <HStack gap={1} flexShrink={0}>
            {selectedLabel && (
              <Icon
                as={LuX}
                boxSize={3.5}
                color={MUTED}
                cursor="pointer"
                onClick={handleClear}
                _hover={{ color: RED }}
              />
            )}
            <Icon as={LuChevronDown} boxSize={4} color={MUTED} />
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
          border={`1px solid ${BORDER}`}
          borderRadius="6px"
          boxShadow="0 4px 12px rgba(0,0,0,0.1)"
          maxH="220px"
          overflowY="auto"
          zIndex={20}
          role="listbox"
        >
          {filtered.length === 0 ? (
            <Box px={3} py={2}>
              <Text fontSize="12px" color={MUTED}>
                No ledgers found
              </Text>
            </Box>
          ) : (
            filtered.map((ledger) => {
              const label = ledger.account_group_name
                ? `${ledger.ledger_name} (${ledger.account_group_name})`
                : ledger.ledger_name;
              const isSelected = String(ledger.id) === String(value);

              return (
                <Box
                  key={ledger.id}
                  role="option"
                  aria-selected={isSelected}
                  px={3}
                  py={2}
                  fontSize="13px"
                  color={DARK}
                  cursor="pointer"
                  bg={isSelected ? "#FDF2F5" : "white"}
                  _hover={{ bg: "#F7F9FB" }}
                  onClick={() => handleSelect(ledger)}
                >
                  {label}
                </Box>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
};

/* -------------------------------------------------------
   Receipt Create Page
------------------------------------------------------- */

const ReceiptCreatePage = () => {
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [lineErrors, setLineErrors] = useState({});

  const [form, setForm] = useState({
    receipt_date: today(),
    ref_no: "",
    member: "",
    payment_type: "BANK",
    transaction_type: "BANK_TRANSFER",
    bank_account: null,
    narration: "",
    lines: [emptyLine()],
  });

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  /* Load Members and Account Ledgers */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoading(true);

        const [membersResponse, ledgersResponse] = await Promise.all([
          listMembers(),
          listAccountLedgers(),
        ]);

        const toArray = (response) => {
          const data = response?.data?.results ?? response?.data ?? [];
          return Array.isArray(data) ? data : [];
        };

        const allLedgers = toArray(ledgersResponse);
        const allMembers = toArray(membersResponse);

        const receiptLedgers = allLedgers
          .filter(isReceiptLedger)
          .sort((a, b) => {
            const groupA = (a.account_group_name || "").toLowerCase();
            const groupB = (b.account_group_name || "").toLowerCase();

            if (groupA !== groupB) return groupA.localeCompare(groupB);

            return (a.ledger_name || "").localeCompare(
              b.ledger_name || ""
            );
          });

        const activeMembers = allMembers.filter(
          (member) => member.is_active && !member.expired
        );

        if (mounted) {
          setMembers(activeMembers);
          setLedgers(receiptLedgers);
        }
      } catch (error) {
        console.error("Receipt form load error:", error);

        if (mounted) {
          toaster.create({
            title: "Failed to load form data",
            description:
              error?.response?.data?.detail || "Please try again.",
            type: "error",
          });
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  /* Particulars Management */

  const updateLine = (index, patch) => {
    setForm((current) => {
      const lines = [...current.lines];
      lines[index] = { ...lines[index], ...patch };
      return { ...current, lines };
    });

    setLineErrors((current) => ({
      ...current,
      [index]: {
        ...current[index],
        ...(patch.ledger !== undefined ? { ledger: "" } : {}),
        ...(patch.amount !== undefined ? { amount: "" } : {}),
      },
    }));
  };

  const addLine = () => {
    setForm((current) => ({
      ...current,
      lines: [...current.lines, emptyLine()],
    }));
  };

  const removeLine = (index) => {
    setForm((current) => {
      if (current.lines.length === 1) return current;
      return {
        ...current,
        lines: current.lines.filter((_, i) => i !== index),
      };
    });

    setLineErrors((current) => {
      const next = {};
      Object.entries(current).forEach(([key, value]) => {
        const oldIndex = Number(key);
        if (oldIndex < index) next[oldIndex] = value;
        if (oldIndex > index) next[oldIndex - 1] = value;
      });
      return next;
    });
  };

  /* Grand Total */

  const grandTotal = useMemo(
    () =>
      form.lines.reduce(
        (sum, line) => sum + (Number(line.amount) || 0),
        0
      ),
    [form.lines]
  );

  const bankRequired =
    form.payment_type === "BANK" && !form.bank_account;

  /* Save Receipt */

  const handleSave = async () => {
    if (isSaving) return;

    if (!form.receipt_date) {
      toaster.create({
        title: "Receipt date is required",
        type: "error",
      });
      return;
    }

    if (!form.member) {
      toaster.create({
        title: "Member is required",
        type: "error",
      });
      return;
    }

    if (bankRequired) {
      toaster.create({
        title: "Bank account is required",
        description:
          "Select a bank account, or add one if none exist yet.",
        type: "error",
      });
      return;
    }

    if (!form.lines.length) {
      toaster.create({
        title: "At least one particulars line is required",
        type: "error",
      });
      return;
    }

    const errors = {};
    let hasLineError = false;

    form.lines.forEach((line, index) => {
      const rowErrors = {};

      if (!line.ledger) {
        rowErrors.ledger = "Please select a particulars ledger.";
        hasLineError = true;
      }

      const amount = Number(line.amount);
      if (
        line.amount === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        rowErrors.amount = "Enter an amount greater than zero.";
        hasLineError = true;
      }

      if (Object.keys(rowErrors).length) errors[index] = rowErrors;
    });

    setLineErrors(errors);

    if (hasLineError) {
      toaster.create({
        title: "Complete all particulars fields",
        description:
          "Every particulars row must have a ledger and an amount greater than zero.",
        type: "error",
      });
      return;
    }

    const payload = {
      receipt_date: form.receipt_date,
      ref_no: form.ref_no.trim() || null,
      member: Number(form.member),
      payment_type: form.payment_type,
      transaction_type:
        form.payment_type === "BANK" ? form.transaction_type : null,
      bank_account:
        form.payment_type === "BANK" && form.bank_account
          ? Number(form.bank_account)
          : null,
      narration: form.narration.trim(),
      lines: form.lines.map((line, index) => ({
        ledger: Number(line.ledger),
        amount: Number(line.amount).toFixed(2),
        position: index,
      })),
    };

    setIsSaving(true);

    try {
      const response = await createReceipt(payload);
      const receiptNumber = response?.data?.receipt_number;

      toaster.create({
        title: "Receipt saved",
        description: receiptNumber
          ? `Saved as ${receiptNumber}`
          : "Receipt created.",
        type: "success",
      });

      navigate("/receipts");
    } catch (error) {
      console.error("Receipt save error:", error);

      const backend = error?.response?.data;
      const firstError =
        backend && typeof backend === "object"
          ? Object.values(backend).flat(Infinity).find(Boolean)
          : null;

      toaster.create({
        title: "Save failed",
        description:
          backend?.detail ||
          (firstError ? String(firstError) : null) ||
          "Please check the form and try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Box
        flex="1"
        w="100%"
        px={{ base: 3, md: 6 }}
        py={{ base: 3, md: 4 }}
      >
        {/* Breadcrumb */}

        <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
          <Text
            color={PRIMARY_MAROON}
            cursor="pointer"
            onClick={() => navigate("/activities")}
          >
            Activities
          </Text>
          <Text>/</Text>
          <Text
            color={PRIMARY_MAROON}
            cursor="pointer"
            onClick={() => navigate("/receipts")}
          >
            Receipts
          </Text>
          <Text>/</Text>
          <Text>Create Receipt</Text>
        </HStack>

        {/* Page Heading */}

        <Box mb={4}>
          <Text fontSize="10px" fontWeight="700" color={RED} mb={1}>
            RECEIPTS
          </Text>

          <Heading
            color={DARK}
            fontSize={{ base: "24px", md: "28px" }}
            lineHeight="1.1"
            mb={1}
          >
            Create New Receipt
          </Heading>

          <Text color={MUTED} fontSize="12px">
            Record a parish receipt with one or more account ledgers.
          </Text>
        </Box>

        {isLoading ? (
          <Box border={`1px solid ${BORDER}`} borderRadius="8px" p={5}>
            <Text color={MUTED} fontSize="13px">
              Loading receipt form...
            </Text>
          </Box>
        ) : (
          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="8px"
            bg="white"
            p={{ base: 4, md: 5 }}
          >
            {/* ROW 1: Date + Receipt Number */}

            <Flex
              gap={4}
              mb={4}
              direction={{ base: "column", md: "row" }}
            >
              <Box flex="1">
                <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
                  Date <RequiredMark />
                </Text>

                <Box position="relative">
                  <Input
                    type="date"
                    value={form.receipt_date}
                    required
                    onChange={(event) =>
                      updateForm("receipt_date", event.target.value)
                    }
                    h="40px"
                    pr="40px"
                    borderColor={BORDER}
                    borderRadius="6px"
                    fontSize="13px"
                  />
                  <Icon
                    as={LuCalendar}
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    color={MUTED}
                    boxSize={4}
                    pointerEvents="none"
                  />
                </Box>
              </Box>

              <Box flex="1">
                <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
                  Receipt Number <RequiredMark />
                </Text>

                <Box position="relative">
                  <Input
                    value="Auto-generated"
                    readOnly
                    aria-readonly="true"
                    bg="#F7F9FB"
                    color={MUTED}
                    h="40px"
                    pr="130px"
                    borderColor={BORDER}
                    borderRadius="6px"
                    fontSize="13px"
                  />
                  <HStack
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    gap={1}
                    color={MUTED}
                    pointerEvents="none"
                  >
                    <Icon as={LuLock} boxSize={3.5} />
                    <Text fontSize="11px">Auto-generated</Text>
                  </HStack>
                </Box>
              </Box>
            </Flex>

            {/* ROW 2: Reference + Member */}

            <Flex
              gap={4}
              mb={4}
              direction={{ base: "column", md: "row" }}
            >
              <Box flex="1">
                <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
                  Ref Number
                </Text>
                <Input
                  value={form.ref_no}
                  onChange={(event) =>
                    updateForm("ref_no", event.target.value)
                  }
                  h="40px"
                  borderColor={BORDER}
                  borderRadius="6px"
                  fontSize="13px"
                />
              </Box>

              <Box flex="1">
                <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
                  Member Name <RequiredMark />
                </Text>

                <Box position="relative">
                  <select
                    value={form.member}
                    required
                    onChange={(event) =>
                      updateForm("member", event.target.value)
                    }
                    style={{
                      width: "100%",
                      height: "40px",
                      border: `1px solid ${BORDER}`,
                      borderRadius: "6px",
                      padding: "0 35px 0 12px",
                      fontSize: "13px",
                      background: "white",
                      color: DARK,
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>

                  <Icon
                    as={LuChevronDown}
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    color={MUTED}
                    boxSize={4}
                    pointerEvents="none"
                  />
                </Box>
              </Box>
            </Flex>

            {/* ROW 3: Payment + Transaction + Bank Account */}

            <Flex
              gap={4}
              mb={5}
              direction={{ base: "column", md: "row" }}
            >
              <Box flex="1">
                <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
                  Payment Type <RequiredMark />
                </Text>

                <Box position="relative">
                  <select
                    value={form.payment_type}
                    onChange={(event) => {
                      const paymentType = event.target.value;

                      setForm((current) => ({
                        ...current,
                        payment_type: paymentType,
                        bank_account:
                          paymentType === "CASH"
                            ? null
                            : current.bank_account,
                        transaction_type:
                          paymentType === "CASH"
                            ? "CASH"
                            : current.transaction_type === "CASH"
                              ? "BANK_TRANSFER"
                              : current.transaction_type,
                      }));
                    }}
                    style={{
                      width: "100%",
                      height: "40px",
                      border: `1px solid ${BORDER}`,
                      borderRadius: "6px",
                      padding: "0 35px 0 12px",
                      fontSize: "13px",
                      background: "white",
                      color: DARK,
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="BANK">Bank</option>
                    <option value="CASH">Cash</option>
                  </select>

                  <Icon
                    as={LuChevronDown}
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    color={MUTED}
                    boxSize={4}
                    pointerEvents="none"
                  />
                </Box>
              </Box>

              <Box flex="1">
                <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
                  Transaction Type <RequiredMark />
                </Text>

                <Box position="relative">
                  <select
                    value={form.transaction_type}
                    onChange={(event) =>
                      updateForm("transaction_type", event.target.value)
                    }
                    disabled={form.payment_type === "CASH"}
                    style={{
                      width: "100%",
                      height: "40px",
                      border: `1px solid ${BORDER}`,
                      borderRadius: "6px",
                      padding: "0 35px 0 12px",
                      fontSize: "13px",
                      background:
                        form.payment_type === "CASH" ? "#F7F9FB" : "white",
                      color: DARK,
                      appearance: "none",
                      cursor:
                        form.payment_type === "CASH"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="CHEQUE">Cheque</option>
                    {form.payment_type === "CASH" && (
                      <option value="CASH">Cash</option>
                    )}
                  </select>

                  <Icon
                    as={LuChevronDown}
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    color={MUTED}
                    boxSize={4}
                    pointerEvents="none"
                  />
                </Box>
              </Box>

              <Box flex="1">
                {form.payment_type === "BANK" ? (
                  <BankAccountSelect
                    value={form.bank_account}
                    onChange={(id) =>
                      setForm((current) => ({
                        ...current,
                        bank_account: id,
                      }))
                    }
                    label="Bank Account"
                    isRequired={true}
                    errorText={
                      bankRequired
                        ? "Bank account is required for bank receipts."
                        : undefined
                    }
                  />
                ) : (
                  <>
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      color={DARK}
                      mb={1}
                    >
                      Bank Account
                    </Text>
                    <Input
                      value="Not applicable for Cash"
                      readOnly
                      aria-readonly="true"
                      bg="#F7F9FB"
                      color={MUTED}
                      h="40px"
                      borderColor={BORDER}
                      borderRadius="6px"
                      fontSize="13px"
                    />
                  </>
                )}
              </Box>
            </Flex>

            {/* PARTICULARS + AMOUNT: BOTH REQUIRED */}

            <Box
              border={`1px solid ${BORDER}`}
              borderRadius="8px"
              p={4}
              mb={4}
              overflow="visible"
            >
              <Flex
                gap={4}
                mb={3}
                direction={{ base: "column", sm: "row" }}
              >
                <Box flex="1">
                  <Text fontSize="13px" fontWeight="700" color={DARK}>
                    Particulars <RequiredMark />
                  </Text>
                </Box>

                <Box width={{ base: "100%", sm: "240px" }}>
                  <Text fontSize="13px" fontWeight="700" color={DARK}>
                    Amount <RequiredMark />
                  </Text>
                </Box>
              </Flex>

              {form.lines.map((line, index) => {
                const isFirst = index === 0;
                const isLast = index === form.lines.length - 1;
                const errors = lineErrors[index] || {};

                return (
                  <Flex
                    key={index}
                    gap={4}
                    mb={index === form.lines.length - 1 ? 0 : 3}
                    align="flex-start"
                    direction={{ base: "column", sm: "row" }}
                  >
                    <Box flex="1" w={{ base: "100%", sm: "auto" }}>
                      <SearchableLedgerSelect
                        value={line.ledger}
                        onChange={(value) =>
                          updateLine(index, { ledger: value })
                        }
                        ledgers={ledgers}
                        placeholder="Select ledger"
                        hasError={Boolean(errors.ledger)}
                      />
                      {errors.ledger && (
                        <Text color="red.500" fontSize="10px" mt={1}>
                          {errors.ledger}
                        </Text>
                      )}
                    </Box>

                    <Box
                      width={{ base: "100%", sm: "240px" }}
                      position="relative"
                    >
                      <Text
                        position="absolute"
                        left="12px"
                        top="22px"
                        transform="translateY(-50%)"
                        fontSize="13px"
                        color={MUTED}
                        zIndex={1}
                        pointerEvents="none"
                      >
                        ₹
                      </Text>

                      <Input
                        type="number"
                        value={line.amount}
                        required
                        min="0.01"
                        step="0.01"
                        onChange={(event) =>
                          updateLine(index, {
                            amount: event.target.value,
                          })
                        }
                        pl="28px"
                        pr="52px"
                        h="44px"
                        borderColor={errors.amount ? RED : BORDER}
                        borderRadius="6px"
                        fontSize="13px"
                        placeholder="0.00"
                        aria-label={`Amount for particulars row ${index + 1}`}
                        aria-invalid={Boolean(errors.amount)}
                      />

                      <HStack
                        position="absolute"
                        right="4px"
                        top="4px"
                        gap={0}
                        zIndex={2}
                      >
                        {isFirst && (
                          <Button
                            type="button"
                            aria-label="Add particulars row"
                            size="sm"
                            h="36px"
                            w="36px"
                            minW="36px"
                            p={0}
                            bg={RED}
                            color="white"
                            _hover={{ bg: "#B0143A" }}
                            _active={{ bg: "#B0143A" }}
                            onClick={addLine}
                            borderRadius="4px"
                          >
                            <Icon as={LuPlus} boxSize={4} color="white" />
                          </Button>
                        )}

                        {!isFirst && isLast && (
                          <Button
                            type="button"
                            aria-label="Remove particulars row"
                            size="sm"
                            h="36px"
                            w="36px"
                            minW="36px"
                            p={0}
                            bg={RED}
                            color="white"
                            _hover={{ bg: "#B0143A" }}
                            _active={{ bg: "#B0143A" }}
                            onClick={() => removeLine(index)}
                            borderRadius="4px"
                          >
                            <Icon as={LuMinus} boxSize={4} color="white" />
                          </Button>
                        )}
                      </HStack>

                      {errors.amount && (
                        <Text color="red.500" fontSize="10px" mt={1}>
                          {errors.amount}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                );
              })}
            </Box>

            {/* GRAND TOTAL + AMOUNT IN WORDS */}

            <Flex direction="column" align="flex-end" mb={4}>
              <Box width={{ base: "100%", md: "380px" }}>
                <Text
                  fontSize="12px"
                  fontWeight="600"
                  color={DARK}
                  mb={1}
                >
                  Grand Total
                </Text>

                <Box position="relative">
                  <Text
                    position="absolute"
                    left="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    fontSize="13px"
                    color={MUTED}
                    pointerEvents="none"
                  >
                    ₹
                  </Text>
                  <Input
                    value={grandTotal.toFixed(2)}
                    readOnly
                    aria-readonly="true"
                    bg="#F7F9FB"
                    pl="28px"
                    pr="12px"
                    h="40px"
                    borderColor={BORDER}
                    borderRadius="6px"
                    fontSize="13px"
                    fontWeight="700"
                    textAlign="right"
                  />
                </Box>

                <Text
                  fontSize="11px"
                  color={MUTED}
                  mt={1}
                  textAlign="right"
                >
                  Amount in words:{" "}
                  <Text as="span" fontWeight="600" color={DARK}>
                    {amountInWords(grandTotal)}
                  </Text>
                </Text>
              </Box>
            </Flex>

            {/* NARRATION */}

            <Box mb={5}>
              <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
                Narration
              </Text>
              <Textarea
                value={form.narration}
                onChange={(event) =>
                  updateForm("narration", event.target.value)
                }
                h="80px"
                borderColor={BORDER}
                borderRadius="6px"
                fontSize="13px"
                resize="vertical"
              />
            </Box>

            {/* SAVE BUTTON */}

            <Flex
              justify="flex-end"
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
                  Bank account is required for bank receipts.
                </Text>
              )}

              <Button
                type="button"
                bg={RED}
                color="white"
                h="42px"
                px={8}
                fontSize="13px"
                borderRadius="6px"
                loading={isSaving}
                disabled={isSaving || isLoading}
                onClick={handleSave}
                _hover={{ bg: "#B0143A" }}
              >
                {isSaving ? "Saving..." : "Save Receipt"}
              </Button>
            </Flex>
          </Box>
        )}
      </Box>

      <Footer />
    </Box>
  );
};

export default ReceiptCreatePage;
