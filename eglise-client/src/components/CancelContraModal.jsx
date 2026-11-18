// src/components/CancelContraModal.jsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  HStack,
  Text,
  Textarea,
} from "@chakra-ui/react";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";

const CANCEL_REASONS = [
  { value: "INCORRECT_ENTRY", label: "Incorrect contra entry" },
  { value: "DUPLICATE", label: "Duplicate contra" },
  { value: "WRONG_AMOUNT", label: "Wrong amount" },
  { value: "WRONG_ACCOUNT", label: "Wrong bank / cash account" },
  { value: "BANK_REJECTED", label: "Bank rejected" },
  { value: "OTHER", label: "Other" },
];

// ============================================================
// INLINE SVG ICONS
// ============================================================
const ContraIcon = ({ size = 22, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3L21 7L17 11" />
    <path d="M21 7H9C6.79086 7 5 8.79086 5 11V13" />
    <path d="M7 21L3 17L7 13" />
    <path d="M3 17H15C17.2091 17 19 15.2091 19 13V11" />
  </svg>
);

const CircleXIcon = ({ size = 16, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const AlertTriangleIcon = ({ size = 16, color = "#B54708" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ============================================================
// SUMMARY CELL
// ============================================================
const SummaryCell = ({ label, value, valueColor, borderLeft }) => (
  <Box flex="1" px={4} py={3} borderLeft={borderLeft ? `1px solid ${BORDER_COLOR}` : "none"}>
    <Text fontSize="10px" color={SECONDARY_TEXT} mb={1}>{label}</Text>
    <Text fontSize="12px" fontWeight="600" color={valueColor || TEXT_COLOR}>{value}</Text>
  </Box>
);

// ============================================================
// MAIN COMPONENT
// ============================================================
const CancelContraModal = ({ isOpen, onClose, contra, onConfirm, saving }) => {
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [ack, setAck] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setRemarks("");
      setAck(false);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen || !contra) return null;

  const canSubmit = reason && remarks.trim() && ack;

  const handleConfirm = () => {
    const e = {};
    if (!reason) e.reason = "Cancellation reason is required.";
    if (!remarks.trim()) e.remarks = "Remarks are required.";
    if (!ack) e.ack = "You must acknowledge this action.";
    setErrors(e);
    if (Object.keys(e).length) return;

    onConfirm({
      cancel_reason: reason,
      cancel_remarks: remarks.trim(),
      acknowledge: true,
    });
  };

  const fmtINR = (n) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));

  return (
    <Box position="fixed" inset={0} zIndex={1000} display="flex" alignItems="center" justifyContent="center" px={4}>
      {/* BACKDROP */}
      <Box position="absolute" inset={0} bg="rgba(15,23,42,0.45)" onClick={saving ? undefined : onClose} />

      {/* DIALOG */}
      <Box position="relative" zIndex={1001} width="100%" maxW="620px" bg="white" borderRadius="14px" boxShadow="0 24px 60px rgba(0,0,0,0.22)" overflow="hidden" maxH="94vh" display="flex" flexDirection="column">
        {/* CLOSE */}
        <Box position="absolute" top="14px" right="16px" cursor="pointer" color={SECONDARY_TEXT} onClick={saving ? undefined : onClose} zIndex={2} fontSize="18px" lineHeight="1">×</Box>

        {/* BODY */}
        <Box px={7} pt={6} pb={5} overflowY="auto">
          <HStack align="flex-start" gap={4} mb={5}>
            <Box boxSize="52px" borderRadius="full" bg="#FFE8EC" display="flex" alignItems="center" justifyContent="center" flexShrink={0} position="relative">
              <ContraIcon size={22} color={PRIMARY_RED} />
              <Box position="absolute" bottom="-2px" right="-2px" bg="white" borderRadius="full" boxSize="20px" display="flex" alignItems="center" justifyContent="center">
                <CircleXIcon size={16} color={PRIMARY_RED} />
              </Box>
            </Box>
            <Box flex="1">
              <Heading fontSize="21px" fontWeight="700" color={TEXT_COLOR} lineHeight="1.2" mb={1}>Cancel Contra Voucher</Heading>
              <Text fontSize="12px" color={SECONDARY_TEXT}>Cancel voucher <Text as="span" color="#315AB5" fontWeight="600">{contra.voucher_number}</Text> for ₹ {fmtINR(contra.amount)}.</Text>
            </Box>
          </HStack>

          <Box p={3} borderRadius="6px" bg="#FFF5F7" border="1px solid #FED7DE" mb={5}>
            <Text fontSize="11px" color={PRIMARY_RED} lineHeight="1.5">This action will mark the contra voucher as Cancelled. The record and ledger entries will remain in the audit history.</Text>
          </Box>

          <Flex border={`1px solid ${BORDER_COLOR}`} borderRadius="6px" mb={5} overflow="hidden">
            <SummaryCell label="Voucher Number" value={contra.voucher_number} valueColor="#315AB5" />
            <SummaryCell label="Date" value={contra.contra_date} borderLeft />
            <SummaryCell label="Amount" value={`₹ ${fmtINR(contra.amount)}`} valueColor={PRIMARY_RED} borderLeft />
          </Flex>

          <Box mb={4}>
            <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1.5}>Cancellation Reason <Text as="span" color={PRIMARY_RED}>*</Text></Text>
            <Box position="relative">
              {/* ✅ Native HTML Select to prevent Chakra v3 errors */}
              <select
                value={reason}
                onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: undefined })); }}
                style={{ width: "100%", height: "40px", fontSize: "12px", color: reason ? TEXT_COLOR : SECONDARY_TEXT, border: `1px solid ${errors.reason ? "#F56565" : BORDER_COLOR}`, borderRadius: "6px", backgroundColor: "white", padding: "0 11px", outline: "none", appearance: "none" }}
              >
                <option value="">Select cancellation reason</option>
                {CANCEL_REASONS.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
              </select>
              <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none" color={SECONDARY_TEXT} fontSize="10px">▼</Box>
            </Box>
            {errors.reason && <Text color="red.500" fontSize="10px" mt={1}>{errors.reason}</Text>}
          </Box>

          <Box mb={4}>
            <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1.5}>Remarks <Text as="span" color={PRIMARY_RED}>*</Text></Text>
            {/* ✅ Native HTML Textarea to prevent Chakra v3 errors */}
            <textarea
              value={remarks}
              onChange={(e) => { setRemarks(e.target.value); setErrors((p) => ({ ...p, remarks: undefined })); }}
              placeholder="Enter reason for cancellation"
              style={{ width: "100%", minHeight: "70px", fontSize: "12px", color: TEXT_COLOR, border: `1px solid ${errors.remarks ? "#F56565" : BORDER_COLOR}`, borderRadius: "6px", padding: "10px", outline: "none", resize: "vertical", fontFamily: "inherit" }}
            />
            {errors.remarks && <Text color="red.500" fontSize="10px" mt={1}>{errors.remarks}</Text>}
          </Box>

          <Box mb={4} display="flex" alignItems="flex-start" gap={2}>
            <input type="checkbox" checked={ack} onChange={(e) => { setAck(e.target.checked); setErrors((p) => ({ ...p, ack: undefined })); }} style={{ marginTop: "2px", cursor: "pointer", accentColor: PRIMARY_RED }} />
            <Text fontSize="11px" color={TEXT_COLOR} cursor="pointer" onClick={() => setAck(!ack)}>I understand that this record will remain in the audit history.</Text>
          </Box>
          {errors.ack && <Text color="red.500" fontSize="10px" mb={2}>{errors.ack}</Text>}

          <Flex p={3} borderRadius="6px" bg="#FFFAEB" border="1px solid #FEEFC7" gap={2.5} align="flex-start">
            <Box mt="2px" flexShrink={0}><AlertTriangleIcon size={16} color="#B54708" /></Box>
            <Text fontSize="11px" color="#93370D" lineHeight="1.5">Any money already transferred must be handled separately — cancelling only reverses the ledger entries.</Text>
          </Flex>
        </Box>

        {/* FOOTER */}
        <Flex justify="space-between" gap={3} px={7} py={4} borderTop={`1px solid ${BORDER_COLOR}`} bg="#FAFBFC">
          <Button variant="outline" h="40px" px={6} fontSize="12px" fontWeight="600" borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" onClick={onClose} disabled={saving} _hover={{ bg: "#FFF5F7" }}>Keep Voucher</Button>
          <Button h="40px" px={6} fontSize="12px" fontWeight="600" bg={PRIMARY_RED} color="white" borderRadius="6px" onClick={handleConfirm} disabled={!canSubmit || saving} loading={saving} loadingText="Cancelling..." _hover={{ bg: DARK_RED }} _disabled={{ opacity: 0.5, cursor: "not-allowed", bg: PRIMARY_RED }}>
            <CircleXIcon size={15} color="white" /> Cancel Voucher
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default CancelContraModal;