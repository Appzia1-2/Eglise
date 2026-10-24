import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";

import {
  LuCalendarDays,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuBuilding2,
  LuFilter,
  LuPencil,
  LuPlus,
  LuSearch,
  LuTrash2,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listBankAccounts,
  deleteBankAccount,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const BankAccountsPage = () => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await listBankAccounts();
      const data = response?.data ?? response;
      const items = Array.isArray(data) ? data : data?.results || [];

      setAccounts(items);
    } catch (err) {
      console.error("Error loading bank accounts:", err);
      setError("Unable to load bank accounts.");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((a) => {
        return (
          String(a.bank_name || "").toLowerCase().includes(searchText) ||
          String(a.account_number || "").toLowerCase().includes(searchText) ||
          String(a.branch || "").toLowerCase().includes(searchText) ||
          String(a.ifsc_code || "").toLowerCase().includes(searchText)
        );
      });
    }

    if (filter === "ACTIVE") {
      result = result.filter((a) => a.is_active);
    } else if (filter === "INACTIVE") {
      result = result.filter((a) => !a.is_active);
    } else if (filter === "RECENTLY_UPDATED") {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((a) => {
        if (!a.updated_at) return false;
        const updated = new Date(a.updated_at);
        if (Number.isNaN(updated.getTime())) return false;
        return updated >= sevenDaysAgo && updated <= now;
      });
    }

    return result;
  }, [accounts, search, filter]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAccounts.length / pageSize)
  );

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;

  const paginatedAccounts = filteredAccounts.slice(
    startIndex,
    startIndex + pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // ==========================================================
  // STATS
  // ==========================================================

  const totalAccounts = accounts.length;
  const activeCount = accounts.filter((a) => a.is_active).length;

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDateTime = (date) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "-";
    return parsedDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this bank account?"
    );
    if (!confirmed) return;

    try {
      await deleteBankAccount(id);
      await loadAccounts();
    } catch (err) {
      console.error("Error deleting bank account:", err);
      alert(
        err?.response?.data?.detail ||
          "Unable to delete. This account may be in use by existing receipts or payments."
      );
    }
  };

  // ==========================================================
  // STAT CARD
  // ==========================================================

  const StatCard = ({ icon, title, value }) => (
    <Box
      border="1px solid #DCE2EA"
      borderRadius="8px"
      h="78px"
      px={4}
      bg="white"
      display="flex"
      alignItems="center"
    >
      <Flex align="center" width="100%" height="100%">
        <Box
          width="65px"
          height="100%"
          borderRight="1px solid #DCE2EA"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Icon as={icon} boxSize={8} color={RED} strokeWidth={1.6} />
        </Box>

        <Box pl={4}>
          <Text fontSize="12px" color={DARK} mb={1} fontWeight="600">
            {title}
          </Text>
          <Text fontSize="24px" fontWeight="700" color={DARK} lineHeight="1">
            {value}
          </Text>
        </Box>
      </Flex>
    </Box>
  );

  // ==========================================================
  // PAGINATION NUMBERS
  // ==========================================================

  const renderPages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (safePage > 3) pages.push("...");

      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (safePage < totalPages - 2) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%">
        <Box w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
          {/* BREADCRUMB */}
          <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Accounts</Text>
            <Text>/</Text>
            <Text>Bank Accounts</Text>
          </HStack>

          {/* HEADER */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
            mb={3}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <Text fontSize="10px" fontWeight="700" color={RED} mb={1}>
                BANK ACCOUNTS
              </Text>

              <Heading
                color={DARK}
                fontSize={{ base: "22px", md: "26px" }}
                lineHeight="1.1"
                mb={1}
              >
                Bank Accounts
              </Heading>

              <Text color={MUTED} fontSize="11px">
                Manage the church's bank accounts. These are used on receipts,
                payments and contra vouchers.
              </Text>
            </Box>

            <Button
              bg={PRIMARY_MAROON}
              color="white"
              px={5}
              h="38px"
              fontSize="12px"
              borderRadius="6px"
              flexShrink={0}
              onClick={() => navigate("/bank-accounts/add")}
              _hover={{ bg: "#650A18" }}
            >
              <Icon as={LuPlus} mr={2} boxSize={4} />
              Add Bank Account
            </Button>
          </Flex>

          {/* STAT CARDS */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} mb={3}>
            <StatCard
              icon={LuBuilding2}
              title="Total Bank Accounts"
              value={totalAccounts}
            />
            <StatCard
              icon={LuCalendarDays}
              title="Active Accounts"
              value={activeCount}
            />
          </SimpleGrid>

          {/* TABLE CARD */}
          <Box border="1px solid #DCE2EA" borderRadius="8px" p={3} bg="white" w="100%">
            {/* SEARCH / FILTER */}
            <Flex
              gap={3}
              mb={3}
              direction={{ base: "column", md: "row" }}
            >
              <Box
                position="relative"
                maxW={{ base: "100%", md: "380px" }}
                flex="1"
              >
                <Icon
                  as={LuSearch}
                  position="absolute"
                  left="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  color={MUTED}
                  zIndex={1}
                  boxSize={4}
                />

                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search bank, account no., branch, IFSC"
                  pl="38px"
                  h="38px"
                  borderColor={BORDER}
                  borderRadius="6px"
                  fontSize="12px"
                  _focus={{
                    borderColor: PRIMARY_MAROON,
                    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Box>

              <Box position="relative" width={{ base: "100%", md: "210px" }}>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    border: "1px solid #DCE2EA",
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
                  <option value="ALL">All Records</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                  <option value="RECENTLY_UPDATED">Recently Updated</option>
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

              <Button
                variant="outline"
                h="38px"
                borderColor="#FF5A7D"
                color={RED}
                borderRadius="6px"
                px={4}
                fontSize="12px"
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                }}
              >
                <Icon as={LuFilter} mr={2} boxSize={4} />
                Filter
              </Button>
            </Flex>

            {/* ERROR */}
            {error && (
              <Box
                mb={3}
                p={2}
                borderRadius="6px"
                bg="#FFF5F5"
                border="1px solid #FED7D7"
              >
                <Text color="red.600" fontSize="12px">
                  {error}
                </Text>
              </Box>
            )}

            {/* TABLE */}
            <Box
              overflowX="auto"
              overflowY="hidden"
              border="1px solid #E6EAF0"
              borderRadius="6px"
              width="100%"
            >
              <Box
                as="table"
                width="100%"
                minW="950px"
                borderCollapse="collapse"
              >
                <Box as="thead">
                  <Box as="tr" height="42px">
                    {[
                      "Bank Name",
                      "Account No.",
                      "IFSC",
                      "Branch",
                      "Status",
                      "Last Updated",
                      "Actions",
                    ].map((heading) => (
                      <Box
                        as="th"
                        key={heading}
                        textAlign="left"
                        px={4}
                        py={2}
                        fontSize="11px"
                        fontWeight="700"
                        color={DARK}
                        borderBottom="1px solid #E6EAF0"
                        whiteSpace="nowrap"
                        bg="white"
                      >
                        {heading}
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box as="tbody">
                  {loading ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={7}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        Loading bank accounts...
                      </Box>
                    </Box>
                  ) : paginatedAccounts.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={7}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No bank accounts found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedAccounts.map((account) => (
                      <Box
                        as="tr"
                        key={account.id}
                        height="42px"
                        _hover={{ bg: "#FFFBFC" }}
                      >
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          fontWeight="600"
                          color={DARK}
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {account.bank_name || "-"}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          fontFamily="monospace"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {account.masked_account_number ||
                            account.account_number ||
                            "-"}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          fontFamily="monospace"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {account.ifsc_code || "-"}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {account.branch || "-"}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          <Box
                            as="span"
                            display="inline-block"
                            px={2}
                            py="2px"
                            borderRadius="full"
                            fontSize="10px"
                            fontWeight="600"
                            bg={account.is_active ? "#E7F5EC" : "#F2F4F7"}
                            color={account.is_active ? "#067647" : "#475467"}
                          >
                            {account.is_active ? "Active" : "Inactive"}
                          </Box>
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {formatDateTime(account.updated_at)}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={1}
                          borderBottom="1px solid #E6EAF0"
                        >
                          <HStack gap={2}>
                            <Button
                              variant="ghost"
                              size="sm"
                              h="30px"
                              color={RED}
                              px={2}
                              fontSize="11px"
                              onClick={() =>
                                navigate(`/bank-accounts/${account.id}/edit`)
                              }
                              _hover={{ bg: "#FFF0F4" }}
                            >
                              <Icon as={LuPencil} mr={1} boxSize={3.5} />
                              Edit
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              h="30px"
                              color="#B42318"
                              px={2}
                              fontSize="11px"
                              onClick={() => handleDelete(account.id)}
                              _hover={{ bg: "#FEF3F2" }}
                            >
                              <Icon as={LuTrash2} mr={1} boxSize={3.5} />
                              Delete
                            </Button>
                          </HStack>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            </Box>

            {/* PAGINATION */}
            <Flex
              justify="space-between"
              align="center"
              mt={3}
              gap={3}
              direction={{ base: "column", md: "row" }}
            >
              <Text fontSize="11px" color={MUTED}>
                {filteredAccounts.length === 0
                  ? "Showing 0 bank accounts"
                  : `Showing ${startIndex + 1}–${Math.min(
                      startIndex + paginatedAccounts.length,
                      filteredAccounts.length
                    )} of ${filteredAccounts.length} bank accounts`}
              </Text>

              <HStack gap={1}>
                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor={BORDER}
                  color={MUTED}
                  disabled={safePage === 1}
                  onClick={() =>
                    setCurrentPage(Math.max(1, safePage - 1))
                  }
                >
                  <Icon as={LuChevronLeft} boxSize={3.5} />
                  Previous
                </Button>

                {renderPages().map((page, index) =>
                  page === "..." ? (
                    <Text
                      key={`dots-${index}`}
                      px={1.5}
                      fontSize="11px"
                      color={MUTED}
                    >
                      ...
                    </Text>
                  ) : (
                    <Button
                      key={page}
                      size="xs"
                      h="30px"
                      minW="30px"
                      variant={page === safePage ? "solid" : "outline"}
                      bg={page === safePage ? PRIMARY_MAROON : "white"}
                      color={page === safePage ? "white" : "#344054"}
                      borderColor={
                        page === safePage ? PRIMARY_MAROON : BORDER
                      }
                      onClick={() => setCurrentPage(page)}
                      _hover={{
                        bg: page === safePage ? "#650A18" : "#FFF0F4",
                      }}
                    >
                      {page}
                    </Button>
                  )
                )}

                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor="#FF5A7D"
                  color={RED}
                  disabled={safePage === totalPages}
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, safePage + 1))
                  }
                >
                  Next
                  <Icon as={LuChevronRight} ml={1} boxSize={3.5} />
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default BankAccountsPage;