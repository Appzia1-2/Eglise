// src/pages/VisitorViewPage.jsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuCalendarDays,
  LuFileText,
  LuMessageSquare,
  LuPencil,
  LuUserRound,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getVisitor,
  listVisitors,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

// ==========================================================
// HELPERS
// ==========================================================

const getArray = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
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

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ==========================================================
// HERO STAT ITEM
// ==========================================================

const HeroStat = ({ icon, label, value }) => (
  <Flex
    align="center"
    gap={4}
    px={{ base: 4, md: 8 }}
    py={{ base: 3, md: 0 }}
    borderLeft={{ base: "none", md: `1px solid ${BORDER}` }}
    borderTop={{ base: `1px solid ${BORDER}`, md: "none" }}
    flex="1"
    minW={0}
  >
    <Box
      color={RED}
      flexShrink={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      w="30px"
      h="30px"
    >
      <Box as={icon} boxSize="26px" strokeWidth={1.6} />
    </Box>

    <Box minW={0}>
      <Text
        fontSize="12px"
        color={MUTED}
        mb={0.5}
        fontWeight="500"
      >
        {label}
      </Text>

      <Text
        fontSize={{ base: "14px", md: "15px" }}
        fontWeight="700"
        color={DARK}
        lineHeight="1.3"
        noOfLines={2}
      >
        {value}
      </Text>
    </Box>
  </Flex>
);

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

const FieldRow = ({ label, value }) => (
  <Flex
    py={2.5}
    gap={4}
    direction={{ base: "column", sm: "row" }}
    align={{ base: "flex-start", sm: "center" }}
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

    <Text
      flex="1"
      fontSize="13px"
      color={DARK}
      whiteSpace="pre-wrap"
      wordBreak="break-word"
    >
      {value || "-"}
    </Text>
  </Flex>
);

// ==========================================================
// MAIN
// ==========================================================

const VisitorViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // ==========================================================
  // LOAD
  // ==========================================================

  useEffect(() => {
    const loadVisitor = async () => {
      try {
        setLoading(true);
        setError("");

        let data = null;

        try {
          const response = await getVisitor(id);
          data = response?.data ?? response;
        } catch (detailError) {
          const response = await listVisitors();
          const visitors = getArray(response);

          data = visitors.find(
            (item) => String(item.id) === String(id)
          );
        }

        if (!data) {
          setError("Visitor record not found.");
          return;
        }

        setVisitor(data);
      } catch (err) {
        console.error("Error loading visitor:", err);
        setError(
          err?.response?.data?.detail ||
            "Unable to load visitor record."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) loadVisitor();
  }, [id]);

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const handleEdit = () => navigate(`/visitors/${id}/edit`);
  const handleBack = () => navigate("/visitors");

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        bg="white"
      >
        <Navbar />

        <Container
          maxW="container.xl"
          px={{ base: 4, md: 6 }}
          py={8}
          flex="1"
        >
          <Text color={MUTED} fontSize="13px">
            Loading visitor record...
          </Text>
        </Container>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !visitor) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        bg="white"
      >
        <Navbar />

        <Container
          maxW="container.xl"
          px={{ base: 4, md: 6 }}
          py={8}
          flex="1"
        >
          <Text
            color={RED}
            fontWeight="600"
            fontSize="13px"
            mb={5}
          >
            {error || "Visitor record not found."}
          </Text>

          <Button
            variant="outline"
            borderColor={RED}
            color={RED}
            h="38px"
            fontSize="12px"
            borderRadius="6px"
            onClick={handleBack}
          >
            <LuArrowLeft
              size={15}
              style={{ marginRight: "7px" }}
            />
            Back to Visitor Register
          </Button>
        </Container>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // DERIVED
  // ==========================================================

  const visitorName =
    visitor.visitor_name || "Unnamed Visitor";

  const visitDate = formatDate(visitor.visitor_date);
  const address = visitor.visitor_address || "-";
  const purpose = visitor.reason_to_visit || "-";
  const remarks = visitor.remarks || "-";

  const createdDate = formatDate(visitor.created_at);
  const updatedDate = formatDate(visitor.updated_at);

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg="white"
    >
      <Navbar />

      <Container
        maxW="container.xl"
        px={{ base: 4, md: 6 }}
        py={{ base: 3, md: 4 }}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}
        <HStack
          gap={2}
          mb={4}
          fontSize="12px"
          color={MUTED}
          flexWrap="wrap"
        >
          <Text>Activities</Text>
          <Text>/</Text>
          <Text>Visitor Register</Text>
          <Text>/</Text>
          <Text color={DARK}>{visitorName}</Text>
        </HStack>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}
        <Flex
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={3}
          mb={4}
        >
          <Box>
            <Text
              fontSize="11px"
              fontWeight="700"
              color={RED}
              mb={1}
              letterSpacing="0.4px"
            >
              VISITOR REGISTER
            </Text>

            <Heading
              color={DARK}
              fontSize={{ base: "22px", md: "26px" }}
              lineHeight="1.2"
              mb={1}
            >
              Visitor Details
            </Heading>

            <Text color={MUTED} fontSize="12px">
              View complete visitor and visit information.
            </Text>
          </Box>

          <HStack gap={3} flexShrink={0}>
            <Button
              variant="outline"
              borderColor={RED}
              color={RED}
              px={5}
              h="38px"
              borderRadius="6px"
              fontSize="12px"
              fontWeight="600"
              onClick={handleBack}
              _hover={{ bg: "#FFF5F7" }}
            >
              <LuArrowLeft
                size={15}
                style={{ marginRight: "8px" }}
              />
              Back to Visitor Register
            </Button>

            <Button
              bg={RED}
              color="white"
              px={5}
              h="38px"
              borderRadius="6px"
              fontSize="12px"
              fontWeight="600"
              onClick={handleEdit}
              _hover={{ bg: "#B5122F" }}
            >
              <LuPencil
                size={14}
                style={{ marginRight: "8px" }}
              />
              Edit Visitor
            </Button>
          </HStack>
        </Flex>

        {/* ==================================================
            HERO CARD
        ================================================== */}
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
              minW={{ md: "260px" }}
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
                <LuUserRound size={38} strokeWidth={1.5} />
              </Flex>

              <Box>
                <Heading
                  fontSize={{ base: "18px", md: "22px" }}
                  color={DARK}
                  lineHeight="1.2"
                  mb={1}
                >
                  {visitorName}
                </Heading>

                <Text fontSize="12px" color={MUTED}>
                  Visitor
                </Text>
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
                label="Visit Date"
                value={visitDate}
              />

              <HeroStat
                icon={LuUserRound}
                label="Address"
                value={address}
              />

              <HeroStat
                icon={LuFileText}
                label="Purpose"
                value={purpose}
              />
            </Flex>
          </Flex>
        </Box>

        {/* ==================================================
            TABS
        ================================================== */}
        <HStack
          gap={6}
          borderBottom={`1px solid ${BORDER}`}
          mb={4}
        >
          {[
            { key: "overview", label: "Overview" },
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

        {/* ==================================================
            TAB CONTENT
        ================================================== */}
        {activeTab === "overview" ? (
          <Grid
            templateColumns={{
              base: "1fr",
              lg: "repeat(2, 1fr)",
            }}
            gap={4}
          >
            {/* VISITOR INFORMATION */}
            <Box
              border={`1px solid ${BORDER}`}
              borderRadius="10px"
              bg="white"
              p={{ base: 4, md: 5 }}
            >
              <CardHeader
                icon={LuUserRound}
                title="Visitor Information"
              />

              <FieldRow
                label="Visitor Name"
                value={visitorName}
              />
              <FieldRow label="Address" value={address} />
            </Box>

            {/* VISIT INFORMATION */}
            <Box
              border={`1px solid ${BORDER}`}
              borderRadius="10px"
              bg="white"
              p={{ base: 4, md: 5 }}
            >
              <CardHeader
                icon={LuCalendarDays}
                title="Visit Information"
              />

              <FieldRow label="Date" value={visitDate} />
              <FieldRow
                label="Purpose of Visit"
                value={purpose}
              />
            </Box>

            {/* REMARKS */}
            <Box
              border={`1px solid ${BORDER}`}
              borderRadius="10px"
              bg="white"
              p={{ base: 4, md: 5 }}
            >
              <CardHeader
                icon={LuMessageSquare}
                title="Remarks"
              />

              <Text
                fontSize="13px"
                color={DARK}
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                lineHeight="1.6"
              >
                {remarks}
              </Text>
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
              <FieldRow
                label="Last Updated"
                value={updatedDate}
              />
              <FieldRow
                label="Updated By"
                value={
                  visitor.updated_by ||
                  visitor.updated_by_name ||
                  "SuperAdmin"
                }
              />
            </Box>
          </Grid>
        ) : (
          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="10px"
            bg="white"
            p={{ base: 4, md: 5 }}
          >
            <CardHeader
              icon={LuFileText}
              title="Record Activity"
            />

            <FieldRow label="Created" value={createdDate} />
            <FieldRow
              label="Last Updated"
              value={updatedDate}
            />
            <FieldRow
              label="Updated By"
              value={
                visitor.updated_by ||
                visitor.updated_by_name ||
                "—"
              }
            />
          </Box>
        )}

        {/* ==================================================
            BOTTOM ACTION
        ================================================== */}
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
            h="36px"
            px={4}
            fontSize="12px"
            fontWeight="600"
            borderRadius="6px"
            onClick={handleBack}
            _hover={{ bg: "#FFF5F7" }}
          >
            <LuArrowLeft
              size={14}
              style={{ marginRight: "7px" }}
            />
            Back to Visitor Register
          </Button>
        </Flex>
      </Container>

      <Footer />
    </Box>
  );
};

export default VisitorViewPage;