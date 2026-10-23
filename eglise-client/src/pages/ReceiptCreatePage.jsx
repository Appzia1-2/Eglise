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

import { toaster } from "../components/ui/toaster";

import {
  listMembers,
  listAccountLedgers,
  listBankAccounts,
  createReceipt,
} from "../api/registryServices";

import { amountInWords } from "../utils/amountInWords";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

// ============================================================
// LEDGER FILTER FOR RECEIPTS
// ============================================================

const RECEIPT_LEDGER_NATURES = ["INCOME"];

const RECEIPT_EXCLUDE_LEDGER_NAMES = [
  "cash in hand",
  "balance in savings account",
  "balance in deposit account",
  "balance in other accounts",
];

const isReceiptLedger = (l) => {
  const name = String(l.ledger_name || "").trim().toLowerCase();
  const nature = String(l.ledger_nature || "").toUpperCase();

  if (!RECEIPT_LEDGER_NATURES.includes(nature)) return false;
  if (RECEIPT_EXCLUDE_LEDGER_NAMES.includes(name)) return false;
  if (name.includes("closing")) return false;
  return true;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyLine = () => ({ ledger: "", amount: "" });

/* -------------------------------------------------------
   Searchable Ledger Select Component
------------------------------------------------------- */
const SearchableLedgerSelect = ({ value, onChange, ledgers, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedLedger = ledgers.find((l) => String(l.id) === String(value));
  const selectedLabel = selectedLedger
    ? selectedLedger.account_group_name
      ? `${selectedLedger.ledger_name} (${selectedLedger.account_group_name})`
      : selectedLedger.ledger_name
    : "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ledgers;
    return ledgers.filter((l) => {
      const label = l.account_group_name
        ? `${l.ledger_name} (${l.account_group_name})`
        : l.ledger_name || "";
      return label.toLowerCase().includes(q);
    });
  }, [ledgers, query]);

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

  const handleSelect = (ledger) => {
    onChange(String(ledger.id));
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
            color={MUTED}
            boxSize={4}
            pointerEvents="none"
            zIndex={1}
          />
          <Input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
          onClick={() => setIsOpen(true)}
          h="44px"
          border={`1px solid ${BORDER}`}
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
          <HStack gap={1}>
            {selectedLabel && (
              <Icon
                as={LuX}
                boxSize={3.5}
                color={MUTED}
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
        >
          {filtered.length === 0 ? (
            <Box px={3} py={2}>
              <Text fontSize="12px" color={MUTED}>
                No ledgers found
              </Text>
            </Box>
          ) : (
            filtered.map((l) => {
              const label = l.account_group_name
                ? `${l.ledger_name} (${l.account_group_name})`
                : l.ledger_name;
              const isSelected = String(l.id) === String(value);
              return (
                <Box
                  key={l.id}
                  px={3}
                  py={2}
                  fontSize="13px"
                  color={DARK}
                  cursor="pointer"
                  bg={isSelected ? "#FDF2F5" : "white"}
                  _hover={{ bg: "#F7F9FB" }}
                  onClick={() => handleSelect(l)}
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

const ReceiptCreatePage = () => {
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);

  const [members, setMembers] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [form, setForm] = useState({
    receipt_date: today(),
    ref_no: "",
    member: "",
    payment_type: "BANK",
    transaction_type: "BANK_TRANSFER",
    bank_account: "",
    narration: "",
    lines: [emptyLine()],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, lRes, bRes] = await Promise.all([
          listMembers(),
          listAccountLedgers(),
          listBankAccounts(),
        ]);

        const toArray = (r) => {
          const d = r?.data?.results ?? r?.data ?? [];
          return Array.isArray(d) ? d : [];
        };

        const allLedgers = toArray(lRes);
        const allMembers = toArray(mRes);

        // ✅ Filter + sort ledgers for a RECEIPT
        //    INCOME only, cash/bank excluded, closing excluded.
        const receiptLedgers = allLedgers
          .filter(isReceiptLedger)
          .sort((a, b) => {
            const ga = (a.account_group_name || "").toLowerCase();
            const gb = (b.account_group_name || "").toLowerCase();
            if (ga !== gb) return ga.localeCompare(gb);
            return (a.ledger_name || "").localeCompare(b.ledger_name || "");
          });

        // ✅ NEW: Filter out dead/expired/inactive members
        const activeMembers = allMembers.filter(
          (m) => m.is_active && !m.expired
        );

        setMembers(activeMembers);
        setLedgers(receiptLedgers);
        setBankAccounts(toArray(bRes));
      } catch (err) {
        console.error(err);
        toaster.create({
          title: "Failed to load form data",
          description: err?.response?.data?.detail || "Please try again.",
          type: "error",
        });
      }
    };
    load();
  }, []);

  const updateLine = (idx, patch) => {
    setForm((f) => {
      const lines = [...f.lines];
      lines[idx] = { ...lines[idx], ...patch };
      return { ...f, lines };
    });
  };

  const addLine = () => {
    setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }));
  };

  const removeLine = (idx) => {
    setForm((f) => {
      if (f.lines.length === 1) return f;
      return { ...f, lines: f.lines.filter((_, i) => i !== idx) };
    });
  };

  const grandTotal = useMemo(
    () =>
      form.lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
    [form.lines]
  );

  const handleSave = async () => {
    if (!form.member) {
      toaster.create({ title: "Member is required", type: "error" });
      return;
    }
    if (!form.lines.length) {
      toaster.create({ title: "At least one line is required", type: "error" });
      return;
    }

    for (let i = 0; i < form.lines.length; i++) {
      const l = form.lines[i];
      if (!l.ledger) {
        toaster.create({
          title: `Line ${i + 1}: Particulars required`,
          type: "error",
        });
        return;
      }
      if (!l.amount || Number(l.amount) <= 0) {
        toaster.create({
          title: `Line ${i + 1}: Amount must be greater than zero`,
          type: "error",
        });
        return;
      }
    }

    const payload = {
      receipt_date: form.receipt_date,
      ref_no: form.ref_no || null,
      member: Number(form.member),
      payment_type: form.payment_type,
      transaction_type:
        form.payment_type === "BANK" ? form.transaction_type : null,
      bank_account:
        form.payment_type === "BANK" && form.bank_account
          ? Number(form.bank_account)
          : null,
      narration: form.narration || "",
      lines: form.lines.map((l, idx) => ({
        ledger: Number(l.ledger),
        amount: String(Number(l.amount).toFixed(2)),
        position: idx,
      })),
    };

    setIsSaving(true);
    try {
      const res = await createReceipt(payload);
      const number = res?.data?.receipt_number;
      toaster.create({
        title: "Receipt saved",
        description: number ? `Saved as ${number}` : "Receipt created.",
        type: "success",
      });
      navigate("/receipts");
    } catch (err) {
      console.error(err);
      const backend = err?.response?.data;
      toaster.create({
        title: "Save failed",
        description:
          backend?.detail ||
          Object.values(backend || {})[0]?.[0] ||
          "Please check the form and try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%" px={{ base: 3, md: 6 }} py={{ base: 3, md: 4 }}>
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

        <Box
          border={`1px solid ${BORDER}`}
          borderRadius="8px"
          bg="white"
          p={{ base: 4, md: 5 }}
        >
          {/* ROW 1 — Date + Receipt Number */}
          <Flex gap={4} mb={4} direction={{ base: "column", md: "row" }}>
            <Box flex="1">
              <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
                Date <Text as="span" color={RED}>*</Text>
              </Text>
              <Box position="relative">
                <Input
                  type="date"
                  value={form.receipt_date}
                  onChange={(e) =>
                    setForm({ ...form, receipt_date: e.target.value })
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
                Receipt Number <Text as="span" color={RED}>*</Text>
              </Text>
              <Box position="relative">
                <Input
                  value="Auto-generated"
                  isReadOnly
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

          {/* ROW 2 — Ref + Member */}
          <Flex gap={4} mb={4} direction={{ base: "column", md: "row" }}>
            <Box flex="1">
              <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
                Ref Number
              </Text>
              <Input
                value={form.ref_no}
                onChange={(e) => setForm({ ...form, ref_no: e.target.value })}
                h="40px"
                borderColor={BORDER}
                borderRadius="6px"
                fontSize="13px"
              />
            </Box>

            <Box flex="1">
              <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
                Member Name <Text as="span" color={RED}>*</Text>
              </Text>
              <Box position="relative">
                <select
                  value={form.member}
                  onChange={(e) => setForm({ ...form, member: e.target.value })}
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
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
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

          {/* ROW 3 — Payment Type + Transaction Type + Bank Account */}
          <Flex gap={4} mb={5} direction={{ base: "column", md: "row" }}>
            <Box flex="1">
              <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
                Payment Type <Text as="span" color={RED}>*</Text>
              </Text>
              <Box position="relative">
                <select
                  value={form.payment_type}
                  onChange={(e) =>
                    setForm({ ...form, payment_type: e.target.value })
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
                Transaction Type <Text as="span" color={RED}>*</Text>
              </Text>
              <Box position="relative">
                <select
                  value={form.transaction_type}
                  onChange={(e) =>
                    setForm({ ...form, transaction_type: e.target.value })
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
                      form.payment_type === "CASH" ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
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
                Bank Account
              </Text>
              <Box position="relative">
                <select
                  value={form.bank_account}
                  onChange={(e) =>
                    setForm({ ...form, bank_account: e.target.value })
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
                      form.payment_type === "CASH" ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">Select bank account</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.display_name ||
                        `${b.bank_name} ${b.masked_account_number || ""}`}
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

          {/* PARTICULARS + AMOUNT SECTION */}
          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="8px"
            p={4}
            mb={4}
            overflow="visible"
          >
            <Flex gap={4} mb={3}>
              <Box flex="1">
                <Text fontSize="13px" fontWeight="700" color={DARK}>
                  Particulars
                </Text>
              </Box>
              <Box width={{ base: "180px", md: "240px" }}>
                <Text fontSize="13px" fontWeight="700" color={DARK}>
                  Amount
                </Text>
              </Box>
            </Flex>

            {form.lines.map((line, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === form.lines.length - 1;

              return (
                <Flex key={idx} gap={4} mb={3} align="center">
                  <Box flex="1">
                    <SearchableLedgerSelect
                      value={line.ledger}
                      onChange={(val) => updateLine(idx, { ledger: val })}
                      ledgers={ledgers}
                      placeholder="Select ledger"
                    />
                  </Box>

                  <Box
                    width={{ base: "180px", md: "240px" }}
                    position="relative"
                  >
                    <Text
                      position="absolute"
                      left="12px"
                      top="50%"
                      transform="translateY(-50%)"
                      fontSize="13px"
                      color={MUTED}
                      zIndex={1}
                    >
                      ₹
                    </Text>
                    <Input
                      type="number"
                      value={line.amount}
                      onChange={(e) =>
                        updateLine(idx, { amount: e.target.value })
                      }
                      pl="28px"
                      pr="52px"
                      h="44px"
                      borderColor={BORDER}
                      borderRadius="6px"
                      fontSize="13px"
                      placeholder="0.00"
                    />

                    <HStack
                      position="absolute"
                      right="4px"
                      top="50%"
                      transform="translateY(-50%)"
                      gap={0}
                      zIndex={2}
                    >
                      {isFirst && (
                        <Button
                          aria-label="Add line"
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
                          borderTopLeftRadius="4px"
                          borderBottomLeftRadius="4px"
                          borderTopRightRadius={isLast ? "4px" : "0"}
                          borderBottomRightRadius={isLast ? "4px" : "0"}
                        >
                          <Icon as={LuPlus} boxSize={4} color="white" />
                        </Button>
                      )}
                      {!isFirst && isLast && (
                        <Button
                          aria-label="Remove line"
                          size="sm"
                          h="36px"
                          w="36px"
                          minW="36px"
                          p={0}
                          bg={RED}
                          color="white"
                          _hover={{ bg: "#B0143A" }}
                          _active={{ bg: "#B0143A" }}
                          onClick={() => removeLine(idx)}
                          borderTopRightRadius="4px"
                          borderBottomRightRadius="4px"
                        >
                          <Icon as={LuMinus} boxSize={4} color="white" />
                        </Button>
                      )}
                    </HStack>
                  </Box>
                </Flex>
              );
            })}
          </Box>

          {/* GRAND TOTAL + NARRATION */}
          <Flex direction="column" align="flex-end" mb={4}>
            <Box width={{ base: "100%", md: "380px" }}>
              <Text fontSize="12px" fontWeight="600" color={DARK} mb={1}>
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
                >
                  ₹
                </Text>
                <Input
                  value={grandTotal.toFixed(2)}
                  isReadOnly
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
              <Text fontSize="11px" color={MUTED} mt={1} textAlign="right">
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
              onChange={(e) =>
                setForm({ ...form, narration: e.target.value })
              }
              h="80px"
              borderColor={BORDER}
              borderRadius="6px"
              fontSize="13px"
              resize="vertical"
            />
          </Box>

          <Flex justify="flex-end">
            <Button
              bg={RED}
              color="white"
              h="42px"
              px={8}
              fontSize="13px"
              borderRadius="6px"
              isLoading={isSaving}
              loadingText="Saving..."
              onClick={handleSave}
              _hover={{ bg: "#B0143A" }}
            >
              Save Receipt
            </Button>
          </Flex>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default ReceiptCreatePage;