// src/pages/GeneralLedgerPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  Circle,
} from "@chakra-ui/react";
import { LuArrowLeft, LuPrinter, LuChevronDown } from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReportFilterBar from "../components/ReportFilterBar";
import ReportLedgerTable from "../components/ReportLedgerTable";

import { toaster } from "../components/ui/toaster";
import {
  listLedgerEntries,
  listAccountLedgers,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const formatMoney = (v) =>
  Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatAmount = (v) => `₹ ${formatMoney(v)}`;

const SummaryCell = ({ label, value, color }) => (
  <Box border={`1px solid ${BORDER}`} borderRadius="8px" p={3} bg="white">
    <Text fontSize="10px" color={MUTED} mb={1}>
      {label}
    </Text>
    <Text fontSize="16px" fontWeight="700" color={color || DARK}>
      {value}
    </Text>
  </Box>
);

const GeneralLedgerPage = () => {
  const navigate = useNavigate();

  const [ledgers, setLedgers] = useState([]);
  const [ledgerId, setLedgerId] = useState("");

  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [opening, setOpening] = useState(0);
  const [totDebit, setTotDebit] = useState(0);
  const [totCredit, setTotCredit] = useState(0);
  const [closing, setClosing] = useState(0);

  /* Load ledger list */
  useEffect(() => {
    const loadLedgers = async () => {
      try {
        const res = await listAccountLedgers();
        const data = res?.data?.results ?? res?.data ?? [];
        const list = Array.isArray(data) ? data : [];
        setLedgers(list);
        if (list.length && !ledgerId) setLedgerId(String(list[0].id));
      } catch (err) {
        console.error("Failed to load ledgers:", err);
      }
    };
    loadLedgers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Load entries when ledger or filters change */
  useEffect(() => {
    if (!ledgerId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const params = { ledger: ledgerId };
        if (dateFrom) params.from = dateFrom;
        if (dateTo) params.to = dateTo;

        const res = await listLedgerEntries(params);
        let data = res?.data?.results ?? res?.data ?? [];
        data = Array.isArray(data) ? data : [];

        setOpening(Number(res?.data?.opening_balance || 0));
        setTotDebit(Number(res?.data?.total_debit || 0));
        setTotCredit(Number(res?.data?.total_credit || 0));
        setClosing(Number(res?.data?.closing_balance || 0));

        if (search) {
          const kw = search.toLowerCase();
          data = data.filter(
            (e) =>
              String(e.narration || "").toLowerCase().includes(kw) ||
              String(e.payment_voucher || "").toLowerCase().includes(kw) ||
              String(e.receipt_voucher || "").toLowerCase().includes(kw)
          );
        }

        setEntries(data);
      } catch (err) {
        console.error(err);
        toaster.create({
          title: "Failed to load General Ledger",
          description: err?.response?.data?.detail || "Please try again.",
          type: "error",
        });
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerId, dateFrom, dateTo, search]);

  const reset = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const ledgerPicker = (
    <Box position="relative" minW="220px">
      <select
        value={ledgerId}
        onChange={(e) => setLedgerId(e.target.value)}
        style={{
          width: "100%",
          height: "38px",
          border: `1px solid ${BORDER}`,
          borderRadius: "6px",
          padding: "0 35px 0 11px",
          fontSize: "12px",
          background: "white",
          color: DARK,
          outline: "none",
          cursor: "pointer",
          appearance: "none",
        }}
      >
        <option value="">Select ledger</option>
        {ledgers.map((l) => (
          <option key={l.id} value={l.id}>
            {l.ledger_name}
          </option>
        ))}
      </select>
      <Icon
        as={LuChevronDown}
        position="absolute"
        right="11px"
        top="50%"
        transform="translateY(-50%)"
        pointerEvents="none"
        color={DARK}
        boxSize={4}
      />
    </Box>
  );

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
        <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
          <Text color={PRIMARY_MAROON} cursor="pointer" onClick={() => navigate("/reports")}>
            Reports
          </Text>
          <Text>/</Text>
          <Text>General Ledger</Text>
        </HStack>

        <Flex
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={3}
          mb={3}
          direction={{ base: "column", md: "row" }}
        >
          <Box>
            <Text fontSize="10px" fontWeight="700" color={RED} mb={1}>
              REPORTS
            </Text>
            <Heading color={DARK} fontSize={{ base: "22px", md: "26px" }} mb={1}>
              General Ledger
            </Heading>
            <Text color={MUTED} fontSize="11px">
              Statement of transactions for a single ledger.
            </Text>
          </Box>

          <HStack gap={2}>
            <Button
              variant="outline"
              borderColor="#FF5A7D"
              color={RED}
              bg="white"
              h="38px"
              px={4}
              fontSize="12px"
              borderRadius="6px"
              onClick={() => navigate("/reports")}
              _hover={{ bg: "#FFF0F4" }}
            >
              <Icon as={LuArrowLeft} mr={2} boxSize={4} />
              Back
            </Button>

            <Button
              variant="outline"
              borderColor="#FF5A7D"
              color={RED}
              bg="white"
              h="38px"
              px={4}
              fontSize="12px"
              borderRadius="6px"
              onClick={() => window.print()}
              _hover={{ bg: "#FFF0F4" }}
            >
              <Icon as={LuPrinter} mr={2} boxSize={4} />
              Print
            </Button>
          </HStack>
        </Flex>

        <Box border={`1px solid ${BORDER}`} borderRadius="8px" p={3} bg="white">
          <ReportFilterBar
            search={search}
            setSearch={setSearch}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            extraFilter={ledgerPicker}
            onReset={reset}
          />

          {/* Summary strip */}
          <SimpleGrid
            columns={{ base: 1, sm: 2, md: 4 }}
            gap={3}
            mb={3}
          >
            <SummaryCell label="Opening Balance" value={formatAmount(opening)} />
            <SummaryCell
              label="Total Debit"
              value={formatAmount(totDebit)}
              color="#16804A"
            />
            <SummaryCell
              label="Total Credit"
              value={formatAmount(totCredit)}
              color={RED}
            />
            <SummaryCell
              label="Closing Balance"
              value={formatAmount(closing)}
              color={closing < 0 ? RED : DARK}
            />
          </SimpleGrid>

          <ReportLedgerTable entries={entries} isLoading={isLoading} />

          <Text fontSize="11px" color={MUTED} mt={2} textAlign="right">
            Showing {entries.length} entries
          </Text>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default GeneralLedgerPage;