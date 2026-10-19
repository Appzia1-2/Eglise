// src/admin/pages/AccountLedgerPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Badge,
} from "@chakra-ui/react";

import {
  LuPlus,
  LuSearch,
  LuBookOpen,
  LuFileCheck2,
  LuFileX2,
  LuIndianRupee,
  LuEye,
  LuPencil,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuFilter,
  LuRefreshCw,
  LuShieldCheck,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listAccountLedgers,
  listAccountGroups,
} from "../api/registryServices";

/* =========================================================
   COLORS
========================================================= */
const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const PAGE_SIZE = 5;

/* =========================================================
   HELPERS
========================================================= */
const pick = (obj, keys, fallback = "—") => {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce((acc, k) => (acc == null ? acc : acc[k]), obj);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return fallback;
};

const formatMoney = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatAmount = (amount) => `₹ ${formatMoney(amount)}`;

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =========================================================
   STAT CARD
========================================================= */
const StatCard = ({ icon, title, value }) => {
  return (
    <Box
      border={`1px solid ${BORDER}`}
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
          borderRight={`1px solid ${BORDER}`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Icon as={icon} boxSize={7} color={RED} strokeWidth={1.6} />
        </Box>

        <Box pl={4}>
          <Text fontSize="12px" color={DARK} mb={1} fontWeight="600">
            {title}
          </Text>
          <Text
            fontSize={
              typeof value === "string" && value.length > 15 ? "18px" : "24px"
            }
            fontWeight="700"
            color={DARK}
            lineHeight="1"
            whiteSpace="nowrap"
          >
            {value}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */
const AccountLedgerPage = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ledgers, setLedgers] = useState([]);
  const [groups, setGroups] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // ✅ NEW

  const [page, setPage] = useState(1);

  /* LOAD DATA */
  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [ledgersRes, groupsRes] = await Promise.all([
        listAccountLedgers(),
        listAccountGroups(),
      ]);

      const ledgersData = ledgersRes?.data?.results || ledgersRes?.data || [];
      const groupsData = groupsRes?.data?.results || groupsRes?.data || [];

      setLedgers(Array.isArray(ledgersData) ? ledgersData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error) {
      console.error("Error fetching account ledgers:", error);
      setLedgers([]);
      setGroups([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ENRICH LEDGERS */
  const enrichedLedgers = useMemo(() => {
    return ledgers.map((ledger) => {
      const groupId = ledger.account_group?.id ?? ledger.account_group;
      const groupObj = groups.find(
        (group) => String(group.id) === String(groupId)
      );

      return {
        ...ledger,
        account_group_id: groupId,
        account_group_name:
          ledger.account_group_name || groupObj?.group_name || "—",
        is_active: ledger.status ?? ledger.is_active ?? true,
        current_balance: Number(ledger.current_balance ?? 0),
        opening_balance: Number(
          pick(ledger, ["op_balance", "opening_balance"], 0)
        ),
      };
    });
  }, [ledgers, groups]);

  /* STATS */
  const stats = useMemo(() => {
    const totalLedgers = enrichedLedgers.length;

    const activeLedgers = enrichedLedgers.filter(
      (ledger) => ledger.is_active
    ).length;

    const inactiveLedgers = totalLedgers - activeLedgers;

    const currentTotal = enrichedLedgers.reduce(
      (sum, ledger) => sum + ledger.current_balance,
      0
    );

    return {
      totalLedgers,
      activeLedgers,
      inactiveLedgers,
      currentTotal,
    };
  }, [enrichedLedgers]);

  /* FILTER */
  const filteredLedgers = useMemo(() => {
    return enrichedLedgers.filter((ledger) => {
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        [ledger.ledger_name, ledger.ledger_code, ledger.alias]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(search));

      const matchesGroup =
        !groupFilter || String(ledger.account_group_id) === String(groupFilter);

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "ACTIVE" && ledger.is_active) ||
        (statusFilter === "INACTIVE" && !ledger.is_active);

      // ✅ NEW: Type Filter
      const matchesType =
        !typeFilter ||
        (typeFilter === "SYSTEM" && ledger.reserved === true) ||
        (typeFilter === "CUSTOM" && ledger.reserved !== true);

      return matchesSearch && matchesGroup && matchesStatus && matchesType;
    });
  }, [enrichedLedgers, searchTerm, groupFilter, statusFilter, typeFilter]);

  /* PAGINATION */
  const totalCount = filteredLedgers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedLedgers = filteredLedgers.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const rangeStart = totalCount === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + paginatedLedgers.length, totalCount);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, groupFilter, statusFilter, typeFilter]);

  /* PAGE NUMBERS */
  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (safePage > 3) pages.push("...");

    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (safePage < totalPages - 2) pages.push("...");
    pages.push(totalPages);

    return pages;
  }, [safePage, totalPages]);

  /* NAVIGATION */
  const handleAdd = () => navigate("/account-ledgers/add");
  const handleView = (ledger) => navigate(`/account-ledgers/${ledger.id}`);
  const handleEdit = (ledger) => navigate(`/account-ledgers/${ledger.id}/edit`);

  /* TABLE COLUMNS */
  const columns = [
    "Ledger Name",
    "Type", // ✅ NEW
    "Account Group",
    "Opening Balance",
    "Current Balance",
    "Status",
    "Actions",
  ];

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%">
        <Box w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
          {/* BREADCRUMB */}
          <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
            <Text
              color={PRIMARY_MAROON}
              cursor="pointer"
              onClick={() => navigate("/admin/masters")}
            >
              Masters
            </Text>
            <Text>/</Text>
            <Text>Account Ledger Master</Text>
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
                ACCOUNT LEDGER MASTER
              </Text>
              <Heading
                color={DARK}
                fontSize={{ base: "22px", md: "26px" }}
                lineHeight="1.1"
                mb={1}
              >
                Account Ledger Master
              </Heading>
              <Text color={MUTED} fontSize="11px">
                Manage account ledgers, opening balances and account
                classifications.
              </Text>
            </Box>

            <HStack gap={2} flexShrink={0}>
              <Button
                variant="outline"
                borderColor={BORDER}
                color={MUTED}
                bg="white"
                h="38px"
                px={4}
                fontSize="12px"
                borderRadius="6px"
                onClick={() => fetchData(true)}
                isLoading={isRefreshing}
                _hover={{
                  borderColor: PRIMARY_MAROON,
                  color: PRIMARY_MAROON,
                  bg: "#FFF7F9",
                }}
              >
                <Icon as={LuRefreshCw} mr={2} boxSize={4} />
                Refresh
              </Button>

              <Button
                bg={PRIMARY_MAROON}
                color="white"
                px={5}
                h="38px"
                fontSize="12px"
                borderRadius="6px"
                onClick={handleAdd}
                _hover={{ bg: "#650A18" }}
              >
                <Icon as={LuPlus} mr={2} boxSize={4} />
                Add Account Ledger
              </Button>
            </HStack>
          </Flex>

          {/* STAT CARDS */}
          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={3} mb={3}>
            <StatCard
              icon={LuBookOpen}
              title="Total Ledgers"
              value={stats.totalLedgers}
            />
            <StatCard
              icon={LuFileCheck2}
              title="Active Ledgers"
              value={stats.activeLedgers}
            />
            <StatCard
              icon={LuFileX2}
              title="Inactive Ledgers"
              value={stats.inactiveLedgers}
            />
            <StatCard
              icon={LuIndianRupee}
              title="Total Current Balance"
              value={formatAmount(stats.currentTotal)}
            />
          </SimpleGrid>

          {/* TABLE CARD */}
          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="8px"
            p={3}
            bg="white"
            w="100%"
          >
            {/* SEARCH / FILTER */}
            <Flex gap={3} mb={3} direction={{ base: "column", md: "row" }}>
              <Box
                position="relative"
                flex="1"
                maxW={{ base: "100%", md: "320px" }}
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search ledger, code or alias"
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

              {/* TYPE FILTER (NEW) */}
              <Box position="relative" width={{ base: "100%", md: "150px" }}>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
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
                  <option value="">All Types</option>
                  <option value="SYSTEM">System</option>
                  <option value="CUSTOM">Custom</option>
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

              {/* ACCOUNT GROUP */}
              <Box position="relative" width={{ base: "100%", md: "180px" }}>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
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
                  <option value="">All Account Groups</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.group_name}
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

              {/* STATUS */}
              <Box position="relative" width={{ base: "100%", md: "130px" }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
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

              {/* FILTER / RESET */}
              <Button
                variant="outline"
                h="38px"
                borderColor="#FF5A7D"
                color={RED}
                borderRadius="6px"
                px={4}
                fontSize="12px"
                onClick={() => {
                  setSearchTerm("");
                  setGroupFilter("");
                  setStatusFilter("");
                  setTypeFilter("");
                }}
              >
                <Icon as={LuFilter} mr={2} boxSize={4} />
                Filter
              </Button>
            </Flex>

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
                minW="1000px"
                borderCollapse="collapse"
              >
                <Box as="thead">
                  <Box as="tr" height="42px">
                    {columns.map((heading) => (
                      <Box
                        as="th"
                        key={heading}
                        textAlign={
                          ["Actions", "Opening Balance", "Current Balance"].includes(heading)
                            ? "right"
                            : "left"
                        }
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
                  {isLoading ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={columns.length}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        Loading account ledgers...
                      </Box>
                    </Box>
                  ) : paginatedLedgers.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={columns.length}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No account ledgers found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedLedgers.map((ledger) => {
                      const isReserved = ledger.reserved === true;
                      
                      return (
                      <Box
                        as="tr"
                        key={ledger.id}
                        height="42px"
                        _hover={{ bg: "#FFFBFC" }}
                      >
                        {/* NAME */}
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
                          <HStack gap={2}>
                            <Icon as={LuBookOpen} boxSize={3.5} color={RED} />
                            <Text>{pick(ledger, ["ledger_name"])}</Text>
                          </HStack>
                        </Box>

                        {/* TYPE BADGE */}
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {isReserved ? (
                            <HStack
                              gap={1}
                              display="inline-flex"
                              bg="#FFF0F4"
                              color={RED}
                              px={2}
                              py={0.5}
                              borderRadius="4px"
                              fontSize="10px"
                              fontWeight="700"
                            >
                              <Icon as={LuShieldCheck} boxSize={3} />
                              SYSTEM
                            </HStack>
                          ) : (
                            <Box
                              display="inline-block"
                              bg="#F0F4F8"
                              color={MUTED}
                              px={2}
                              py={0.5}
                              borderRadius="4px"
                              fontSize="10px"
                              fontWeight="700"
                            >
                              CUSTOM
                            </Box>
                          )}
                        </Box>

                        {/* GROUP */}
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {ledger.account_group_name}
                        </Box>

                        {/* OPENING */}
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          fontWeight="600"
                          color={DARK}
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                          textAlign="right"
                        >
                          {formatAmount(ledger.opening_balance)}
                        </Box>

                        {/* CURRENT */}
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          fontWeight="700"
                          color={ledger.current_balance < 0 ? RED : "#16804A"}
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                          textAlign="right"
                        >
                          {formatAmount(ledger.current_balance)}
                        </Box>

                        {/* STATUS */}
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          borderBottom="1px solid #E6EAF0"
                        >
                          <Badge
                            bg={ledger.is_active ? "green.50" : "gray.100"}
                            color={ledger.is_active ? "green.600" : "gray.600"}
                            fontSize="10px"
                            px={2}
                            py={1}
                            borderRadius="full"
                            fontWeight="600"
                          >
                            {ledger.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </Box>

                        {/* ACTIONS */}
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          borderBottom="1px solid #E6EAF0"
                        >
                          <HStack gap={2} justify="flex-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              h="30px"
                              color={RED}
                              px={2}
                              fontSize="11px"
                              onClick={() => handleView(ledger)}
                              _hover={{ bg: "#FFF0F4" }}
                            >
                              <Icon as={LuEye} mr={1} boxSize={3.5} />
                              View
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              h="30px"
                              color={RED}
                              px={2}
                              fontSize="11px"
                              onClick={() => handleEdit(ledger)}
                              _hover={{ bg: "#FFF0F4" }}
                            >
                              <Icon as={LuPencil} mr={1} boxSize={3.5} />
                              Edit
                            </Button>
                          </HStack>
                        </Box>
                      </Box>
                    )})
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
                {totalCount === 0
                  ? "Showing 0 account ledgers"
                  : `Showing ${rangeStart}–${rangeEnd} of ${totalCount} account ledgers`}
              </Text>

              <HStack gap={1}>
                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor={BORDER}
                  color={MUTED}
                  disabled={safePage === 1}
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                >
                  <Icon as={LuChevronLeft} boxSize={3.5} />
                  Previous
                </Button>

                {pageNumbers.map((num, index) =>
                  num === "..." ? (
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
                      key={num}
                      size="xs"
                      h="30px"
                      minW="30px"
                      variant={num === safePage ? "solid" : "outline"}
                      bg={num === safePage ? PRIMARY_MAROON : "white"}
                      color={num === safePage ? "white" : "#344054"}
                      borderColor={num === safePage ? PRIMARY_MAROON : BORDER}
                      onClick={() => setPage(num)}
                      _hover={{
                        bg: num === safePage ? "#650A18" : "#FFF0F4",
                      }}
                    >
                      {num}
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
                  onClick={() => setPage(Math.min(totalPages, safePage + 1))}
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

export default AccountLedgerPage;