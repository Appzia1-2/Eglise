// src/pages/CommitteeViewPage.jsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuCalendarDays,
  LuClock3,
  LuFileDown,
  LuFileText,
  LuInfo,
  LuPencil,
  LuPrinter,
  LuUserRound,
  LuUsers,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getCommittee,
  listMembers,
  listDesignations,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

// ==========================================================
// HELPERS
// ==========================================================

const getArrayData = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(
    typeof value === "string" && value.length === 10
      ? `${value}T00:00:00`
      : value
  );

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getCommitteeStatus = (committee) => {
  if (!committee?.committee_from_date || !committee?.committee_to_date) {
    return { key: "UNKNOWN", label: "Unknown" };
  }

  const today = new Date(`${getTodayString()}T00:00:00`);
  const from = new Date(`${committee.committee_from_date}T00:00:00`);
  const to = new Date(`${committee.committee_to_date}T00:00:00`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { key: "UNKNOWN", label: "Unknown" };
  }

  if (today < from) return { key: "UPCOMING", label: "Upcoming" };
  if (today > to) return { key: "COMPLETED", label: "Completed" };
  return { key: "ACTIVE", label: "Active" };
};

const StatusPill = ({ status, size = "md" }) => {
  const palette = {
    ACTIVE: { bg: "#E7F7EE", color: "#1E9E4A", border: "#B7E4C7" },
    UPCOMING: { bg: "#EAF2FE", color: "#2C5EC9", border: "#B7CEF6" },
    COMPLETED: { bg: "#EEF1F5", color: "#4B5A70", border: "#D6DCE4" },
    UNKNOWN: { bg: "#FFF5E5", color: "#B7791F", border: "#F2D9A6" },
  };
  const c = palette[status.key] || palette.UNKNOWN;

  return (
    <Box
      as="span"
      px={size === "sm" ? 2 : 2.5}
      py={size === "sm" ? "1px" : "3px"}
      borderRadius="5px"
      bg={c.bg}
      border={`1px solid ${c.border}`}
      color={c.color}
      fontSize={size === "sm" ? "10.5px" : "12px"}
      fontWeight="600"
      display="inline-block"
      whiteSpace="nowrap"
    >
      {status.label}
    </Box>
  );
};

// Duration: "1 Year", "6 Months", "3 Days", etc.
const computeDuration = (from, to) => {
  if (!from || !to) return "-";

  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";

  const dayDiff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

  if (dayDiff <= 0) return "-";
  if (dayDiff < 30) return `${dayDiff} Day${dayDiff !== 1 ? "s" : ""}`;

  const monthDiff = Math.round(dayDiff / 30);

  if (monthDiff < 12) {
    return `${monthDiff} Month${monthDiff !== 1 ? "s" : ""}`;
  }

  const yearDiff = Math.round((monthDiff / 12) * 10) / 10;
  return `${yearDiff} Year${yearDiff !== 1 ? "s" : ""}`;
};

// ==========================================================
// CARD HEADER
// ==========================================================

const CardHeader = ({ icon, title }) => (
  <HStack gap={3} mb={4}>
    <Flex
      w="38px"
      h="38px"
      minW="38px"
      borderRadius="full"
      bg="#FDECEE"
      align="center"
      justify="center"
      color={RED}
    >
      <Box as={icon} boxSize="18px" strokeWidth={1.8} />
    </Flex>

    <Heading fontSize="16px" color={DARK} fontWeight="700">
      {title}
    </Heading>
  </HStack>
);

// ==========================================================
// FIELD ROW
// ==========================================================

const FieldRow = ({ label, value, align = "flex-start" }) => (
  <Flex
    py={2}
    gap={4}
    direction={{ base: "column", sm: "row" }}
    align={align}
  >
    <Text
      w={{ base: "100%", sm: "150px" }}
      minW={{ sm: "150px" }}
      fontSize="12px"
      color={MUTED}
      fontWeight="500"
    >
      {label}
    </Text>

    <Box flex="1" fontSize="13px" color={DARK}>
      {value || "-"}
    </Box>
  </Flex>
);

// ==========================================================
// HERO STAT
// ==========================================================

const HeroStat = ({ icon, label, value }) => (
  <Flex
    align="center"
    gap={3}
    px={{ base: 4, md: 6 }}
    py={{ base: 3, md: 0 }}
    borderLeft={{ base: "none", md: `1px solid ${BORDER}` }}
    borderTop={{ base: `1px solid ${BORDER}`, md: "none" }}
    flex="1"
    minW={0}
    justify={{ base: "flex-start", md: "center" }}
  >
    <Box color={RED} flexShrink={0} display="flex" alignItems="center">
      <Box as={icon} boxSize="24px" strokeWidth={1.6} />
    </Box>

    <Box minW={0}>
      <Text
        fontSize={{ base: "14px", md: "15px" }}
        fontWeight="700"
        color={DARK}
        lineHeight="1.3"
        noOfLines={2}
      >
        {value}
      </Text>
      <Text fontSize="11px" color={MUTED} mt={0.5}>
        {label}
      </Text>
    </Box>
  </Flex>
);

// ==========================================================
// PAGE
// ==========================================================

const CommitteeViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [committee, setCommittee] = useState(null);
  const [members, setMembers] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // ==========================================================
  // LOAD
  // ==========================================================

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [cRes, mRes, dRes] = await Promise.all([
          getCommittee(id),
          listMembers(),
          listDesignations(),
        ]);

        const cData = cRes?.data ?? cRes;

        if (!cData) {
          setError("Committee record not found.");
          return;
        }

        setCommittee(cData);
        setMembers(getArrayData(mRes));
        setDesignations(getArrayData(dRes));
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.detail ||
            "Unable to load committee record."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  // ==========================================================
  // LOOKUPS
  // ==========================================================

  const getMemberName = (memberId) => {
    const m = members.find((x) => Number(x.id) === Number(memberId));
    if (!m) return `Member #${memberId}`;
    return (
      m.name ||
      m.member_name ||
      m.full_name ||
      `${m.first_name || ""} ${m.last_name || ""}`.trim() ||
      `Member #${memberId}`
    );
  };

  const getDesignationName = (designationId) => {
    const d = designations.find(
      (x) => Number(x.id) === Number(designationId)
    );
    if (!d) return `Designation #${designationId}`;
    return d.designation_name || d.name || `Designation #${designationId}`;
  };

    // ==========================================================
  // PRINT / PDF
  // ==========================================================

  const handlePrint = () => navigate(`/committees/${id}/print`);
  const handleGeneratePdf = () => navigate(`/committees/${id}/print`);

  // ==========================================================
  // LOADING / ERROR
  // ==========================================================

  if (loading) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={5}>
          <Text color={MUTED} fontSize="13px">
            Loading committee...
          </Text>
        </Box>
        <Footer />
      </Box>
    );
  }

  if (error || !committee) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={5}>
          <Text
            color={RED}
            fontWeight="600"
            fontSize="13px"
            mb={3}
          >
            {error || "Committee record not found."}
          </Text>
          <Button
            variant="outline"
            borderColor={RED}
            color={RED}
            size="sm"
            onClick={() => navigate("/committees")}
          >
            Back to Committee List
          </Button>
        </Box>
        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // DERIVED
  // ==========================================================

  const committeeCode =
    committee.committee_code ||
    `COM-${String(committee.id).padStart(3, "0")}`;

  const status = getCommitteeStatus(committee);

  const memberList = Array.isArray(committee.members)
    ? committee.members
    : [];

  const duration = computeDuration(
    committee.committee_from_date,
    committee.committee_to_date
  );

  const createdDate = formatDate(committee.created_at);
  const updatedDate = formatDate(committee.updated_at);

  // ==========================================================
  // RENDER
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
        <Box px={{ base: 4, md: 6 }} py={{ base: 3, md: 4 }}>
          {/* BREADCRUMB */}
          <HStack gap={2} mb={3} color={MUTED} fontSize="12px">
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Committee List</Text>
            <Text>/</Text>
            <Text color={DARK}>{committeeCode}</Text>
          </HStack>

          {/* HEADER */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
            mb={4}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <Text
                fontSize="11px"
                fontWeight="700"
                color={RED}
                mb={1}
                letterSpacing="0.4px"
              >
                COMMITTEE PROFILE
              </Text>

              <Heading
                color={DARK}
                fontSize={{ base: "22px", md: "26px" }}
                lineHeight="1.2"
                mb={1}
              >
                Committee Details
              </Heading>

              <Text color={MUTED} fontSize="12px">
                View complete committee information, term and
                members.
              </Text>
            </Box>

            <HStack gap={2} flexShrink={0} flexWrap="wrap">
              <Button
                variant="outline"
                borderColor={RED}
                color={RED}
                h="40px"
                px={4}
                borderRadius="7px"
                fontSize="12px"
                fontWeight="600"
                onClick={() => navigate("/committees")}
                _hover={{ bg: "#FFF5F7" }}
              >
                <LuArrowLeft
                  size={15}
                  style={{ marginRight: "6px" }}
                />
                Back to Committee List
              </Button>

              <Button
                variant="outline"
                borderColor={RED}
                color={RED}
                h="40px"
                px={4}
                borderRadius="7px"
                fontSize="12px"
                fontWeight="600"
                onClick={handlePrint}
                _hover={{ bg: "#FFF5F7" }}
              >
                <LuPrinter
                  size={15}
                  style={{ marginRight: "6px" }}
                />
                Print
              </Button>

              <Button
                variant="outline"
                borderColor={RED}
                color={RED}
                h="40px"
                px={4}
                borderRadius="7px"
                fontSize="12px"
                fontWeight="600"
                onClick={handleGeneratePdf}
                _hover={{ bg: "#FFF5F7" }}
              >
                <LuFileDown
                  size={15}
                  style={{ marginRight: "6px" }}
                />
                Generate PDF
              </Button>

              <Button
                bg={RED}
                color="white"
                h="40px"
                px={5}
                borderRadius="7px"
                fontSize="12px"
                fontWeight="600"
                onClick={() =>
                  navigate(`/committees/${committee.id}/edit`)
                }
                _hover={{ bg: "#B5122F" }}
              >
                <LuPencil
                  size={14}
                  style={{ marginRight: "6px" }}
                />
                Edit Committee
              </Button>
            </HStack>
          </Flex>

          {/* HERO CARD */}
          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="10px"
            bg="white"
            mb={4}
            px={{ base: 4, md: 5 }}
            py={{ base: 4, md: 5 }}
          >
            <Flex
              align="center"
              gap={{ base: 4, md: 6 }}
              direction={{ base: "column", md: "row" }}
            >
              {/* IDENTITY */}
              <Flex
                align="center"
                gap={4}
                flexShrink={0}
                minW={{ md: "280px" }}
              >
                <Flex
                  w="72px"
                  h="72px"
                  minW="72px"
                  borderRadius="full"
                  bg="#FDECEE"
                  align="center"
                  justify="center"
                  color={RED}
                >
                  <LuUsers size={38} strokeWidth={1.5} />
                </Flex>

                <Box>
                  <Heading
                    fontSize={{ base: "18px", md: "22px" }}
                    color={DARK}
                    lineHeight="1.2"
                    mb={2}
                  >
                    {committee.committee_name}
                  </Heading>

                  <HStack gap={3} flexWrap="wrap">
                    <Text fontSize="12px" color={MUTED}>
                      {committeeCode}
                    </Text>

                    <StatusPill status={status} />
                  </HStack>
                </Box>
              </Flex>

              {/* STATS */}
              <Flex
                flex="1"
                direction={{ base: "column", md: "row" }}
                align="stretch"
                gap={0}
              >
                <HeroStat
                  icon={LuCalendarDays}
                  label="Date From"
                  value={formatDate(committee.committee_from_date)}
                />
                <HeroStat
                  icon={LuCalendarDays}
                  label="Date To"
                  value={formatDate(committee.committee_to_date)}
                />
                <HeroStat
                  icon={LuUsers}
                  label="Committee Members"
                  value={`${memberList.length} Members`}
                />
              </Flex>
            </Flex>
          </Box>

          {/* TABS */}
          <HStack
            gap={6}
            borderBottom={`1px solid ${BORDER}`}
            mb={4}
          >
            {[
              { key: "overview", label: "Overview" },
              { key: "members", label: "Members" },
              { key: "activity", label: "Record Activity" },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Box
                  key={tab.key}
                  position="relative"
                  pb={3}
                  cursor="pointer"
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Text
                    fontSize="13px"
                    fontWeight={isActive ? "700" : "500"}
                    color={isActive ? RED : MUTED}
                  >
                    {tab.label}
                  </Text>

                  {isActive && (
                    <Box
                      position="absolute"
                      left="0"
                      right="0"
                      bottom="-1px"
                      h="2px"
                      bg={RED}
                    />
                  )}
                </Box>
              );
            })}
          </HStack>

          {/* ================================================
              TAB: OVERVIEW
          ================================================ */}
          {activeTab === "overview" && (
            <Grid
              templateColumns={{
                base: "1fr",
                lg: "repeat(2, 1fr)",
              }}
              gap={4}
            >
              {/* COMMITTEE INFORMATION */}
              <Box
                border={`1px solid ${BORDER}`}
                borderRadius="10px"
                bg="white"
                p={{ base: 4, md: 5 }}
              >
                <CardHeader
                  icon={LuInfo}
                  title="Committee Information"
                />

                <FieldRow
                  label="Committee #"
                  value={committeeCode}
                />
                <FieldRow
                  label="Committee Name"
                  value={committee.committee_name}
                />
              </Box>

              {/* COMMITTEE PERIOD */}
              <Box
                border={`1px solid ${BORDER}`}
                borderRadius="10px"
                bg="white"
                p={{ base: 4, md: 5 }}
              >
                <CardHeader
                  icon={LuCalendarDays}
                  title="Committee Period"
                />

                <FieldRow
                  label="Date From"
                  value={formatDate(
                    committee.committee_from_date
                  )}
                />
                <FieldRow
                  label="Date To"
                  value={formatDate(committee.committee_to_date)}
                />
                <FieldRow label="Duration" value={duration} />
                <FieldRow
                  label="Status"
                  value={<StatusPill status={status} size="sm" />}
                />
              </Box>

              {/* COMMITTEE MEMBERS (mini table) */}
              <Box
                border={`1px solid ${BORDER}`}
                borderRadius="10px"
                bg="white"
                p={{ base: 4, md: 5 }}
              >
                <CardHeader
                  icon={LuUsers}
                  title="Committee Members"
                />

                {memberList.length === 0 ? (
                  <Text fontSize="13px" color={MUTED}>
                    No members added.
                  </Text>
                ) : (
                  <Box as="table" width="100%" borderCollapse="collapse">
                    <Box as="thead">
                      <Box as="tr">
                        {["Committee Member", "Designation", "Phone"].map(
                          (h) => (
                            <Box
                              as="th"
                              key={h}
                              textAlign="left"
                              pb={2}
                              borderBottom={`1px solid ${BORDER}`}
                              fontSize="12px"
                              fontWeight="700"
                              color={RED}
                            >
                              {h}
                            </Box>
                          )
                        )}
                      </Box>
                    </Box>

                    <Box as="tbody">
                      {memberList.map((m, i) => (
                        <Box as="tr" key={i}>
                          <Box
                            as="td"
                            py={2}
                            fontSize="12.5px"
                            color={DARK}
                            borderBottom={`1px solid #F1F3F6`}
                          >
                            {getMemberName(m.member)}
                          </Box>
                          <Box
                            as="td"
                            py={2}
                            fontSize="12.5px"
                            color="#344054"
                            borderBottom={`1px solid #F1F3F6`}
                          >
                            {getDesignationName(m.designation)}
                          </Box>
                          <Box
                            as="td"
                            py={2}
                            fontSize="12.5px"
                            color="#344054"
                            borderBottom={`1px solid #F1F3F6`}
                          >
                            {m.phone || "-"}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* RECORD INFORMATION */}
              <Box
                border={`1px solid ${BORDER}`}
                borderRadius="10px"
                bg="white"
                p={{ base: 4, md: 5 }}
              >
                <CardHeader
                  icon={LuFileText}
                  title="Record Information"
                />

                <FieldRow label="Created" value={createdDate} />
                <FieldRow label="Last Updated" value={updatedDate} />
                <FieldRow
                  label="Updated By"
                  value={
                    committee.updated_by_name ||
                    committee.updated_by ||
                    "—"
                  }
                />
              </Box>
            </Grid>
          )}

          {/* ================================================
              TAB: MEMBERS (full table)
          ================================================ */}
          {activeTab === "members" && (
            <Box
              border={`1px solid ${BORDER}`}
              borderRadius="10px"
              bg="white"
              overflow="hidden"
            >
              <Box px={{ base: 4, md: 5 }} py={4}>
                <CardHeader
                  icon={LuUsers}
                  title="All Committee Members"
                />
              </Box>

              <Box overflowX="auto">
                <Box
                  as="table"
                  width="100%"
                  borderCollapse="collapse"
                  minW="600px"
                >
                  <Box as="thead">
                    <Box as="tr" bg="#FAFBFD">
                      {["#", "Committee Member", "Designation", "Phone"].map(
                        (h) => (
                          <Box
                            as="th"
                            key={h}
                            textAlign="left"
                            px={4}
                            py={3}
                            fontSize="11px"
                            textTransform="uppercase"
                            letterSpacing="0.7px"
                            color={MUTED}
                            borderBottom={`1px solid ${BORDER}`}
                            whiteSpace="nowrap"
                          >
                            {h}
                          </Box>
                        )
                      )}
                    </Box>
                  </Box>

                  <Box as="tbody">
                    {memberList.length === 0 ? (
                      <Box as="tr">
                        <Box
                          as="td"
                          colSpan={4}
                          textAlign="center"
                          py={10}
                          color={MUTED}
                          fontSize="13px"
                        >
                          No members added to this committee.
                        </Box>
                      </Box>
                    ) : (
                      memberList.map((m, i) => (
                        <Box
                          as="tr"
                          key={i}
                          _hover={{ bg: "#FFFBFC" }}
                        >
                          <Box
                            as="td"
                            px={4}
                            py={3}
                            borderBottom={`1px solid #E6EAF0`}
                            fontSize="12.5px"
                            color={MUTED}
                          >
                            {i + 1}
                          </Box>
                          <Box
                            as="td"
                            px={4}
                            py={3}
                            borderBottom={`1px solid #E6EAF0`}
                            fontSize="13px"
                            fontWeight="600"
                            color={DARK}
                          >
                            {getMemberName(m.member)}
                          </Box>
                          <Box
                            as="td"
                            px={4}
                            py={3}
                            borderBottom={`1px solid #E6EAF0`}
                            fontSize="13px"
                            color="#344054"
                          >
                            {getDesignationName(m.designation)}
                          </Box>
                          <Box
                            as="td"
                            px={4}
                            py={3}
                            borderBottom={`1px solid #E6EAF0`}
                            fontSize="13px"
                            color="#344054"
                          >
                            {m.phone || "-"}
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* ================================================
              TAB: RECORD ACTIVITY
          ================================================ */}
          {activeTab === "activity" && (
            <Box
              border={`1px solid ${BORDER}`}
              borderRadius="10px"
              bg="white"
              p={{ base: 4, md: 5 }}
            >
              <CardHeader
                icon={LuClock3}
                title="Record Activity"
              />

              <FieldRow label="Created" value={createdDate} />
              <FieldRow label="Last Updated" value={updatedDate} />
              <FieldRow
                label="Updated By"
                value={
                  committee.updated_by_name ||
                  committee.updated_by ||
                  "—"
                }
              />
            </Box>
          )}

          {/* BOTTOM ACTIONS */}
          <Flex
            justify="flex-end"
            mt={5}
            pt={4}
            borderTop={`1px solid #E6EAF0`}
          >
            <Button
              variant="outline"
              borderColor={RED}
              color={RED}
              h="38px"
              px={5}
              fontSize="12px"
              fontWeight="600"
              borderRadius="7px"
              onClick={() => navigate("/committees")}
              _hover={{ bg: "#FFF5F7" }}
            >
              <LuArrowLeft
                size={14}
                style={{ marginRight: "7px" }}
              />
              Back to Committee List
            </Button>
          </Flex>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default CommitteeViewPage;