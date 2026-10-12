// src/pages/BankBookPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Flex, Heading, HStack, Icon, Text } from "@chakra-ui/react";
import { LuArrowLeft, LuPrinter } from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReportFilterBar from "../components/ReportFilterBar";
import ReportLedgerTable from "../components/ReportLedgerTable";

import { toaster } from "../components/ui/toaster";
import { listLedgerEntries } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const BankBookPage = () => {
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const params = { book: "bank" };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await listLedgerEntries(params);
      let data = res?.data?.results ?? res?.data ?? [];
      data = Array.isArray(data) ? data : [];

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
        title: "Failed to load Bank Book",
        description: err?.response?.data?.detail || "Please try again.",
        type: "error",
      });
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, search]);

  const reset = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
        <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
          <Text color={PRIMARY_MAROON} cursor="pointer" onClick={() => navigate("/reports")}>
            Reports
          </Text>
          <Text>/</Text>
          <Text>Bank Book</Text>
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
              Bank Book
            </Heading>
            <Text color={MUTED} fontSize="11px">
              All bank-ledger entries.
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
            onReset={reset}
          />

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

export default BankBookPage;