// src/pages/OfferingEditPage.jsx

import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";

import {
  LuCalendarDays,
  LuCircleAlert,
  LuCircleCheck,
  LuCircleX,
  LuRefreshCw,
  LuDollarSign,
  LuCalendar,
} from "react-icons/lu";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getOffering,
  updateOffering,
  listEvents,
  listMembers,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const OfferingEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ==========================================================
  // STATE
  // ==========================================================

  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [offering, setOffering] = useState(null);

  const [formData, setFormData] = useState({
    event: "",
    member: "",
    amount: "",
    narration: "",
    is_cancelled: false,
    cancel_reason: "",
  });

  const [originalFormData, setOriginalFormData] = useState({
    event: "",
    member: "",
    amount: "",
    narration: "",
    is_cancelled: false,
    cancel_reason: "",
  });

  // ==========================================================
  // HELPER: GET ID
  // Handles:
  // event: 5
  // event: { id: 5, name: "Parish Feast" }
  // event_id: 5
  // ==========================================================

  const getId = (value) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    if (typeof value === "object") {
      return value.id ?? value.pk ?? "";
    }

    return value;
  };

  // ==========================================================
  // DISPLAY DATE
  // ==========================================================

  const formatDisplayDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ==========================================================
  // AMOUNT FORMAT
  // ==========================================================

  const formatAmount = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "0.00";
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount)) {
      return String(amount);
    }

    return numericAmount.toFixed(2);
  };

  // ==========================================================
  // GET MEMBER DISPLAY NAME
  // ==========================================================

  const getMemberDisplayName = (member) => {
    if (!member) {
      return "";
    }

    // If API already provides name
    if (member.name) {
      return member.name;
    }

    // Build name from individual fields
    const fullName = [
      member.first_name,
      member.middle_name,
      member.last_name,
      member.family_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }

    return "Member";
  };

  // ==========================================================
  // GET MEMBER CODE
  // ==========================================================

  const getMemberCode = (member) => {
    if (!member) {
      return "";
    }

    return (
      member.member_number ||
      member.member_code ||
      member.code ||
      member.membership_number ||
      ""
    );
  };

  // ==========================================================
  // GET EVENT NAME
  // ==========================================================

  const getEventDisplayName = (event) => {
    if (!event) {
      return "";
    }

    return (
      event.name ||
      event.event_name ||
      event.title ||
      "Event"
    );
  };

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        offeringResponse,
        eventResponse,
        memberResponse,
      ] = await Promise.all([
        getOffering(id),
        listEvents(),
        listMembers(),
      ]);

      // ========================================================
      // OFFERING
      // ========================================================

      const offeringData =
        offeringResponse?.data ?? offeringResponse;

      setOffering(offeringData);

      // ========================================================
      // EVENTS
      // ========================================================

      const eventData =
        eventResponse?.data ?? eventResponse;

      const eventList = Array.isArray(eventData)
        ? eventData
        : eventData?.results || [];

      setEvents(eventList);

      // ========================================================
      // MEMBERS
      // ========================================================

      const memberData =
        memberResponse?.data ?? memberResponse;

      const memberList = Array.isArray(memberData)
        ? memberData
        : memberData?.results || [];

      setMembers(memberList);

      // ========================================================
      // FIND EVENT ID
      // ========================================================

      const eventId = getId(
        offeringData?.event ??
        offeringData?.event_id
      );

      // ========================================================
      // FIND MEMBER ID
      // ========================================================

      const memberId = getId(
        offeringData?.member ??
        offeringData?.member_id
      );

      // ========================================================
      // FORM DATA
      // ========================================================

      const loadedFormData = {
        event:
          eventId !== ""
            ? String(eventId)
            : "",

        member:
          memberId !== ""
            ? String(memberId)
            : "",

        amount:
          offeringData?.amount !== null &&
          offeringData?.amount !== undefined
            ? String(offeringData.amount)
            : "",

        narration:
          offeringData?.narration ?? "",

        is_cancelled:
          Boolean(offeringData?.is_cancelled),

        cancel_reason:
          offeringData?.cancel_reason ?? "",
      };

      setFormData(loadedFormData);

      setOriginalFormData({
        ...loadedFormData,
      });

      // Debug
      console.log(
        "OFFERING API RESPONSE:",
        offeringData
      );

      console.log(
        "EVENT ID:",
        eventId
      );

      console.log(
        "MEMBER ID:",
        memberId
      );

      console.log(
        "EVENT LIST:",
        eventList
      );

      console.log(
        "MEMBER LIST:",
        memberList
      );

    } catch (err) {
      console.error(
        "Error loading offering:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        "Unable to load offering."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setError("");
  };

  // ==========================================================
  // CANCELLED TOGGLE
  // ==========================================================

  const handleCancelledToggle = () => {
    setFormData((prev) => ({
      ...prev,
      is_cancelled:
        !prev.is_cancelled,
    }));

    setError("");
  };

  // ==========================================================
  // UNSAVED CHANGES
  // ==========================================================

  const changedFields = useMemo(() => {
    const fields = [];

    const compare = (
      field,
      label
    ) => {
      const original =
        originalFormData[field] ?? "";

      const current =
        formData[field] ?? "";

      if (
        String(original) !==
        String(current)
      ) {
        fields.push(label);
      }
    };

    compare("event", "Event");
    compare("member", "Member");
    compare("amount", "Amount");
    compare("narration", "Narration");
    compare(
      "is_cancelled",
      "Status"
    );
    compare(
      "cancel_reason",
      "Cancel Reason"
    );

    return fields;
  }, [
    formData,
    originalFormData,
  ]);

  const unsavedChangesCount =
    changedFields.length;

  const hasUnsavedChanges =
    unsavedChangesCount > 0;

  // ==========================================================
  // SELECTED EVENT
  // ==========================================================

  const selectedEvent = useMemo(() => {
    return events.find(
      (event) =>
        String(event.id) ===
        String(formData.event)
    );
  }, [
    events,
    formData.event,
  ]);

  // ==========================================================
  // SELECTED MEMBER
  // ==========================================================

  const selectedMember = useMemo(() => {
    return members.find(
      (member) =>
        String(member.id) ===
        String(formData.member)
    );
  }, [
    members,
    formData.member,
  ]);

  // ==========================================================
  // GET EVENT NAME
  // ==========================================================

  const getEventName = () => {
    if (selectedEvent) {
      return getEventDisplayName(
        selectedEvent
      );
    }

    if (
      offering?.event &&
      typeof offering.event === "object"
    ) {
      return getEventDisplayName(
        offering.event
      );
    }

    return "Event";
  };

  // ==========================================================
  // GET MEMBER NAME
  // ==========================================================

  const getMemberName = () => {
    if (selectedMember) {
      return getMemberDisplayName(
        selectedMember
      );
    }

    if (
      offering?.member &&
      typeof offering.member === "object"
    ) {
      return getMemberDisplayName(
        offering.member
      );
    }

    return "Member";
  };

  // ==========================================================
  // GET MEMBER CODE FOR SUMMARY
  // ==========================================================

  const getCurrentMemberCode = () => {
    if (selectedMember) {
      return getMemberCode(
        selectedMember
      );
    }

    if (
      offering?.member &&
      typeof offering.member === "object"
    ) {
      return getMemberCode(
        offering.member
      );
    }

    return "";
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    if (!formData.event) {
      return "Please select an event.";
    }

    if (!formData.member) {
      return "Please select a member.";
    }

    if (
      !formData.amount ||
      parseFloat(formData.amount) <= 0
    ) {
      return "Please enter a valid amount greater than zero.";
    }

    if (
      formData.is_cancelled &&
      !formData.cancel_reason.trim()
    ) {
      return "Cancel reason is required when marking as cancelled.";
    }

    return "";
  };

  // ==========================================================
  // UPDATE
  // ==========================================================

  const handleSubmit = async () => {
    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        event: Number(formData.event),

        member: Number(formData.member),

        amount: parseFloat(
          formData.amount
        ),

        narration:
          formData.narration.trim(),

        is_cancelled:
          formData.is_cancelled,
      };

      if (formData.is_cancelled) {
        payload.cancel_reason =
          formData.cancel_reason.trim();
      } else {
        payload.cancel_reason = "";
      }

      await updateOffering(
        id,
        payload
      );

      setOriginalFormData({
        ...formData,
      });

      navigate("/offerings");

    } catch (err) {
      console.error(
        "Error updating offering:",
        err
      );

      const responseData =
        err?.response?.data;

      let apiError =
        "Unable to update offering.";

      if (responseData?.event) {
        apiError =
          Array.isArray(
            responseData.event
          )
            ? responseData.event[0]
            : responseData.event;

      } else if (
        responseData?.member
      ) {
        apiError =
          Array.isArray(
            responseData.member
          )
            ? responseData.member[0]
            : responseData.member;

      } else if (
        responseData?.amount
      ) {
        apiError =
          Array.isArray(
            responseData.amount
          )
            ? responseData.amount[0]
            : responseData.amount;

      } else if (
        responseData?.cancel_reason
      ) {
        apiError =
          Array.isArray(
            responseData.cancel_reason
          )
            ? responseData.cancel_reason[0]
            : responseData.cancel_reason;

      } else if (
        responseData?.detail
      ) {
        apiError =
          responseData.detail;

      } else if (
        responseData?.non_field_errors
      ) {
        apiError =
          Array.isArray(
            responseData.non_field_errors
          )
            ? responseData
                .non_field_errors[0]
            : responseData
                .non_field_errors;
      }

      setError(apiError);

    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/offerings");
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
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
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Flex
            direction="column"
            align="center"
            gap={3}
          >
            <Spinner
              size="md"
              color={PRIMARY_MAROON}
            />

            <Text
              fontSize="12px"
              color={MUTED}
            >
              Loading offering...
            </Text>
          </Flex>
        </Box>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // CURRENT STATUS
  // ==========================================================

  const currentStatus =
    formData.is_cancelled
      ? "Cancelled"
      : "Active";

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

      <Box flex="1">

        <Container
          maxW="1600px"
          px={{
            base: 4,
            md: 5,
            lg: 6,
          }}
          py={{
            base: 3,
            md: 4,
          }}
        >

          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <HStack
            gap={2}
            mb={2}
            color={MUTED}
            fontSize="11px"
            flexWrap="wrap"
          >
            <Text>
              Offerings
            </Text>

            <Text>/</Text>

            <Text>
              Member Offerings
            </Text>

            <Text>/</Text>

            <Text>
              {getMemberName()}
            </Text>

            <Text>/</Text>

            <Text>
              Edit
            </Text>
          </HStack>

          {/* ==================================================
              HEADER
          ================================================== */}

          <Flex
            justify="space-between"
            align={{
              base: "flex-start",
              lg: "flex-end",
            }}
            direction={{
              base: "column",
              lg: "row",
            }}
            gap={3}
            mb={3}
          >
            <Box>

              <Text
                fontSize="10px"
                fontWeight="700"
                color={RED}
                mb={1}
                letterSpacing="0.3px"
              >
                OFFERING MASTER
              </Text>

              <Heading
                color={DARK}
                fontSize={{
                  base: "22px",
                  md: "27px",
                }}
                lineHeight="1.1"
                mb={1}
              >
                Edit Offering
              </Heading>

              <Text
                color={MUTED}
                fontSize="11px"
              >
                Update offering information.
              </Text>

            </Box>

            <HStack
              gap={2}
              width={{
                base: "100%",
                lg: "auto",
              }}
            >

              <Button
                flex={{
                  base: 1,
                  lg: "none",
                }}
                variant="outline"
                borderColor={RED}
                color={RED}
                h="38px"
                minW="125px"
                borderRadius="6px"
                fontSize="12px"
                fontWeight="700"
                onClick={handleCancel}
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                Cancel
              </Button>

              <Button
                flex={{
                  base: 1,
                  lg: "none",
                }}
                bg={RED}
                color="white"
                h="38px"
                minW="155px"
                borderRadius="6px"
                fontSize="12px"
                fontWeight="700"
                isLoading={saving}
                loadingText="Saving..."
                onClick={handleSubmit}
                _hover={{
                  bg: "#B80035",
                }}
              >
                Update
              </Button>

            </HStack>
          </Flex>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <Box
              mb={3}
              px={3}
              py={2.5}
              border="1px solid #FED7D7"
              bg="#FFF5F5"
              borderRadius="7px"
            >
              <HStack gap={2}>
                <Icon
                  as={LuCircleAlert}
                  boxSize={4}
                  color="#C53030"
                />

                <Text
                  color="#C53030"
                  fontSize="12px"
                  fontWeight="600"
                >
                  {error}
                </Text>
              </HStack>
            </Box>
          )}

          {/* ==================================================
              OFFERING SUMMARY
          ================================================== */}

          <Box
            border="1px solid #F2CBD6"
            borderRadius="8px"
            bg="#FFF9FB"
            px={{
              base: 3,
              md: 4,
              lg: 5,
            }}
            py={3}
            mb={3}
          >

            <Grid
              templateColumns={{
                base: "1fr",
                lg: "1fr 1px 1fr",
              }}
              alignItems="center"
              gap={{
                base: 3,
                lg: 4,
              }}
            >

              {/* LEFT */}

              <Flex
                align="center"
                gap={3}
              >

                <Box
                  width="50px"
                  height="50px"
                  borderRadius="50%"
                  bg="#FFEAF0"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Icon
                    as={LuDollarSign}
                    boxSize={6}
                    color={RED}
                    strokeWidth={1.6}
                  />
                </Box>

                <Box>

                  <Text
                    fontSize={{
                      base: "17px",
                      md: "20px",
                    }}
                    fontWeight="700"
                    color={DARK}
                    mb="2px"
                  >
                    {getMemberName()}
                  </Text>

                  <HStack
                    gap={2}
                    flexWrap="wrap"
                  >

                    {getCurrentMemberCode() && (
                      <>
                        <Text
                          fontSize="11px"
                          color={MUTED}
                        >
                          {getCurrentMemberCode()}
                        </Text>

                        <Text
                          fontSize="11px"
                          color={MUTED}
                        >
                          •
                        </Text>
                      </>
                    )}

                    <Text
                      fontSize="11px"
                      color={MUTED}
                    >
                      ₹
                      {formatAmount(
                        formData.amount
                      )}
                    </Text>

                    <Text
                      fontSize="11px"
                      color={MUTED}
                    >
                      •
                    </Text>

                    <Text
                      fontSize="11px"
                      color={MUTED}
                    >
                      {getEventName()}
                    </Text>

                    <Box
                      px={2.5}
                      py="3px"
                      borderRadius="15px"
                      bg={
                        formData.is_cancelled
                          ? "#FFF0F0"
                          : "#EAF8EA"
                      }
                      color={
                        formData.is_cancelled
                          ? "#B5122F"
                          : "#238B2D"
                      }
                      fontSize="9px"
                      fontWeight="700"
                    >
                      {currentStatus}
                    </Box>

                  </HStack>

                </Box>

              </Flex>

              {/* DIVIDER */}

              <Box
                display={{
                  base: "none",
                  lg: "block",
                }}
                height="52px"
                borderLeft="1px solid #E2D5DA"
              />

              {/* RIGHT */}

              <Flex
                align="center"
                gap={3}
              >

                <Box
                  width="50px"
                  height="50px"
                  borderRadius="50%"
                  bg="#FFEAF0"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Icon
                    as={LuCalendar}
                    boxSize={6}
                    color={RED}
                    strokeWidth={1.6}
                  />
                </Box>

                <Box>

                  <Text
                    fontSize={{
                      base: "17px",
                      md: "20px",
                    }}
                    fontWeight="700"
                    color={DARK}
                    mb="1px"
                  >
                    {getEventName()}
                  </Text>

                  <Text
                    fontSize="11px"
                    color={MUTED}
                  >
                    Offering Details
                  </Text>

                </Box>

              </Flex>

            </Grid>

          </Box>

          {/* ==================================================
              MAIN GRID
          ================================================== */}

          <Grid
            templateColumns={{
              base: "1fr",
              lg:
                "minmax(0, 2.1fr) minmax(300px, 1fr)",
            }}
            gap={3}
            alignItems="start"
          >

            {/* =================================================
                LEFT FORM
            ================================================= */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="8px"
              p={{
                base: 4,
                md: 4,
                lg: 5,
              }}
              bg="white"
            >

              {/* CARD HEADER */}

              <HStack
                gap={2}
                mb={4}
              >

                <Box
                  width="30px"
                  height="30px"
                  borderRadius="7px"
                  bg="#FFF0F4"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Box
                    width="10px"
                    height="10px"
                    borderRadius="3px"
                    bg="#FFE0E8"
                  />
                </Box>

                <Text
                  fontSize="15px"
                  fontWeight="700"
                  color={DARK}
                >
                  Offering Information
                </Text>

              </HStack>

              {/* =================================================
                  EVENT + MEMBER
              ================================================= */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr",
                }}
                gap={3}
                mb={3}
              >

                {/* EVENT */}

                <Box>

                  <Text
                    fontSize="11px"
                    fontWeight="700"
                    color={DARK}
                    mb={1.5}
                  >
                    Event{" "}
                    <Text
                      as="span"
                      color={RED}
                    >
                      *
                    </Text>
                  </Text>

                  <select
                    name="event"
                    value={formData.event}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "38px",
                      border:
                        `1px solid ${BORDER}`,
                      borderRadius: "6px",
                      padding: "0 10px",
                      fontSize: "12px",
                      background: "white",
                      color: DARK,
                      outline: "none",
                      cursor: "pointer",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor =
                        PRIMARY_MAROON;

                      e.target.style.boxShadow =
                        `0 0 0 1px ${PRIMARY_MAROON}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor =
                        BORDER;

                      e.target.style.boxShadow =
                        "none";
                    }}
                  >

                    <option value="">
                      Select event
                    </option>

                    {events.map((event) => (
                      <option
                        key={event.id}
                        value={event.id}
                      >
                        {getEventDisplayName(
                          event
                        )}
                      </option>
                    ))}

                  </select>

                </Box>

                {/* MEMBER */}

                <Box>

                  <Text
                    fontSize="11px"
                    fontWeight="700"
                    color={DARK}
                    mb={1.5}
                  >
                    Member{" "}
                    <Text
                      as="span"
                      color={RED}
                    >
                      *
                    </Text>
                  </Text>

                  <select
                    name="member"
                    value={formData.member}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "38px",
                      border:
                        `1px solid ${BORDER}`,
                      borderRadius: "6px",
                      padding: "0 10px",
                      fontSize: "12px",
                      background: "white",
                      color: DARK,
                      outline: "none",
                      cursor: "pointer",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor =
                        PRIMARY_MAROON;

                      e.target.style.boxShadow =
                        `0 0 0 1px ${PRIMARY_MAROON}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor =
                        BORDER;

                      e.target.style.boxShadow =
                        "none";
                    }}
                  >

                    <option value="">
                      Select member
                    </option>

                    {members.map((member) => {
                      const memberName =
                        getMemberDisplayName(
                          member
                        );

                      const memberCode =
                        getMemberCode(
                          member
                        );

                      return (
                        <option
                          key={member.id}
                          value={member.id}
                        >
                          {memberName}
                          {memberCode
                            ? ` — ${memberCode}`
                            : ""}
                        </option>
                      );
                    })}

                  </select>

                </Box>

              </Grid>

              {/* =================================================
                  AMOUNT + NARRATION
              ================================================= */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr",
                }}
                gap={3}
                mb={3}
              >

                {/* AMOUNT */}

                <Box>

                  <Text
                    fontSize="11px"
                    fontWeight="700"
                    color={DARK}
                    mb={1.5}
                  >
                    Amount{" "}
                    <Text
                      as="span"
                      color={RED}
                    >
                      *
                    </Text>
                  </Text>

                  <Flex>

                    <Box
                      width="42px"
                      height="38px"
                      border="1px solid"
                      borderColor={BORDER}
                      borderRadius="6px 0 0 6px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg="#FAFBFC"
                      fontSize="12px"
                      color={MUTED}
                    >
                      ₹
                    </Box>

                    <Input
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="Enter amount"
                      h="38px"
                      fontSize="12px"
                      borderColor={BORDER}
                      borderRadius="0 6px 6px 0"
                      borderLeft="none"
                      color={DARK}
                      _placeholder={{
                        color: "#98A2B3",
                      }}
                      _focus={{
                        borderColor:
                          PRIMARY_MAROON,
                        boxShadow:
                          `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />

                  </Flex>

                </Box>

                {/* NARRATION */}

                <Box>

                  <Text
                    fontSize="11px"
                    fontWeight="700"
                    color={DARK}
                    mb={1.5}
                  >
                    Narration
                  </Text>

                  <Input
                    name="narration"
                    value={
                      formData.narration
                    }
                    onChange={handleChange}
                    placeholder="Enter narration (optional)"
                    h="38px"
                    fontSize="12px"
                    borderColor={BORDER}
                    borderRadius="6px"
                    color={DARK}
                    _placeholder={{
                      color: "#98A2B3",
                    }}
                    _focus={{
                      borderColor:
                        PRIMARY_MAROON,
                      boxShadow:
                        `0 0 0 1px ${PRIMARY_MAROON}`,
                    }}
                  />

                </Box>

              </Grid>

              {/* =================================================
                  STATUS
              ================================================= */}

              <Box>

                <Text
                  fontSize="11px"
                  fontWeight="700"
                  color={DARK}
                  mb={2}
                >
                  Status
                </Text>

                <HStack
                  gap={3}
                  cursor="pointer"
                  onClick={
                    handleCancelledToggle
                  }
                >

                  <Box
                    width="42px"
                    height="22px"
                    borderRadius="20px"
                    bg={
                      formData.is_cancelled
                        ? RED
                        : "#238B2D"
                    }
                    position="relative"
                    transition="all 0.2s"
                    flexShrink={0}
                  >

                    <Box
                      position="absolute"
                      top="2px"
                      left={
                        formData.is_cancelled
                          ? "22px"
                          : "2px"
                      }
                      width="18px"
                      height="18px"
                      borderRadius="50%"
                      bg="white"
                      transition="all 0.2s"
                      boxShadow="0 1px 3px rgba(0,0,0,0.2)"
                    />

                  </Box>

                  <Text
                    fontSize="12px"
                    color="#344054"
                  >
                    {formData.is_cancelled
                      ? "Cancelled"
                      : "Active"}
                  </Text>

                </HStack>

              </Box>

              {/* =================================================
                  CANCEL REASON
              ================================================= */}

              {formData.is_cancelled && (
                <Box
                  mt={3}
                  p={3}
                  border="1px solid #F2CBD6"
                  borderRadius="7px"
                  bg="#FFF9FB"
                >

                  <Text
                    fontSize="11px"
                    fontWeight="700"
                    color={DARK}
                    mb={1.5}
                  >
                    Cancel Reason{" "}
                    <Text
                      as="span"
                      color={RED}
                    >
                      *
                    </Text>
                  </Text>

                  <Textarea
                    name="cancel_reason"
                    value={
                      formData.cancel_reason
                    }
                    onChange={handleChange}
                    placeholder="Enter reason for cancelling this offering"
                    minH="70px"
                    resize="vertical"
                    fontSize="12px"
                    borderColor={
                      formData.cancel_reason.trim()
                        ? BORDER
                        : "#F2B8C3"
                    }
                    borderRadius="6px"
                    color={DARK}
                    bg="white"
                    _placeholder={{
                      color: "#98A2B3",
                    }}
                    _focus={{
                      borderColor:
                        PRIMARY_MAROON,
                      boxShadow:
                        `0 0 0 1px ${PRIMARY_MAROON}`,
                    }}
                  />

                  <Text
                    mt={1}
                    fontSize="10px"
                    color={MUTED}
                  >
                    Please provide a reason before
                    cancelling.
                  </Text>

                </Box>
              )}

            </Box>

            {/* =================================================
                RIGHT COLUMN
            ================================================= */}

            <Flex
              direction="column"
              gap={3}
            >

              {/* =================================================
                  RECORD INFORMATION
              ================================================= */}

              <Box
                border="1px solid #DCE2EA"
                borderRadius="8px"
                p={3.5}
                bg="white"
              >

                <HStack
                  gap={2}
                  mb={3}
                >

                  <Box
                    width="28px"
                    height="28px"
                    borderRadius="7px"
                    bg="#FFF0F4"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon
                      as={LuCircleCheck}
                      boxSize={3.5}
                      color={RED}
                    />
                  </Box>

                  <Text
                    fontSize="14px"
                    fontWeight="700"
                    color={DARK}
                  >
                    Record Information
                  </Text>

                </HStack>

                {/* CREATED */}

                <HStack
                  align="flex-start"
                  gap={2.5}
                  mb={3}
                >

                  <Box
                    width="28px"
                    height="28px"
                    borderRadius="7px"
                    bg="#FFF7FA"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Icon
                      as={LuCalendarDays}
                      boxSize={3.5}
                      color={RED}
                    />
                  </Box>

                  <Box>

                    <Text
                      fontSize="10px"
                      color={MUTED}
                      mb="1px"
                    >
                      Created On
                    </Text>

                    <Text
                      fontSize="12px"
                      fontWeight="700"
                      color={DARK}
                    >
                      {formatDisplayDate(
                        offering?.created_at ||
                        offering?.created_on
                      )}
                    </Text>

                  </Box>

                </HStack>

                {/* UPDATED */}

                <HStack
                  align="flex-start"
                  gap={2.5}
                >

                  <Box
                    width="28px"
                    height="28px"
                    borderRadius="7px"
                    bg="#FFF7FA"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Icon
                      as={LuCircleCheck}
                      boxSize={3.5}
                      color={RED}
                    />
                  </Box>

                  <Box>

                    <Text
                      fontSize="10px"
                      color={MUTED}
                      mb="1px"
                    >
                      Last Updated
                    </Text>

                    <Text
                      fontSize="12px"
                      fontWeight="700"
                      color={DARK}
                    >
                      {formatDisplayDate(
                        offering?.updated_at ||
                        offering?.last_updated
                      )}
                    </Text>

                  </Box>

                </HStack>

              </Box>

              {/* =================================================
                  UNSAVED CHANGES
              ================================================= */}

              <Box
                border="1px solid #DCE2EA"
                borderRadius="8px"
                p={3.5}
                bg="white"
              >

                <HStack
                  gap={2}
                  mb={3}
                >

                  <Box
                    width="28px"
                    height="28px"
                    borderRadius="7px"
                    bg={
                      hasUnsavedChanges
                        ? "#FFF7ED"
                        : "#F0FDF4"
                    }
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >

                    <Icon
                      as={
                        hasUnsavedChanges
                          ? LuCircleAlert
                          : LuCircleCheck
                      }
                      boxSize={3.5}
                      color={
                        hasUnsavedChanges
                          ? "#F97316"
                          : "#16A34A"
                      }
                    />

                  </Box>

                  <Box>

                    <Text
                      fontSize="14px"
                      fontWeight="700"
                      color={
                        hasUnsavedChanges
                          ? "#EA580C"
                          : "#15803D"
                      }
                    >
                      {hasUnsavedChanges
                        ? "Unsaved Changes"
                        : "No Unsaved Changes"}
                    </Text>

                    <Text
                      fontSize="10px"
                      color={MUTED}
                    >
                      {unsavedChangesCount}{" "}
                      {unsavedChangesCount === 1
                        ? "field"
                        : "fields"}{" "}
                      changed
                    </Text>

                  </Box>

                </HStack>

                {hasUnsavedChanges ? (
                  <HStack
                    gap={2}
                    align="flex-start"
                    mb={2}
                  >

                    <Box
                      width="28px"
                      height="28px"
                      borderRadius="7px"
                      bg="#FFF7ED"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon
                        as={LuRefreshCw}
                        boxSize={3.5}
                        color="#F97316"
                      />
                    </Box>

                    <Box>

                      <Text
                        fontSize="12px"
                        fontWeight="700"
                        color="#EA580C"
                      >
                        Review changes before
                        updating
                      </Text>

                      <Text
                        fontSize="10px"
                        color={MUTED}
                        mt="2px"
                      >
                        {changedFields.join(
                          ", "
                        )}
                      </Text>

                    </Box>

                  </HStack>
                ) : (
                  <Text
                    fontSize="11px"
                    color="#15803D"
                  >
                    Everything is saved.
                  </Text>
                )}

              </Box>

              {/* =================================================
                  DANGER ZONE
              ================================================= */}

              <Box
                border="1px solid #DCE2EA"
                borderRadius="8px"
                p={3.5}
                bg="white"
              >

                <HStack
                  gap={2}
                  mb={3}
                >

                  <Box
                    width="28px"
                    height="28px"
                    borderRadius="7px"
                    bg="#FFF0F2"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon
                      as={LuCircleX}
                      boxSize={3.5}
                      color="#B5122F"
                    />
                  </Box>

                  <Text
                    fontSize="14px"
                    fontWeight="700"
                    color="#A81224"
                  >
                    Danger Zone
                  </Text>

                </HStack>

                <HStack
                  gap={2}
                  mb={1.5}
                >

                  <Box
                    width="28px"
                    height="28px"
                    borderRadius="7px"
                    bg="#FFF0F2"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon
                      as={LuCircleX}
                      boxSize={3.5}
                      color={RED}
                    />
                  </Box>

                  <Text
                    fontSize="12px"
                    fontWeight="700"
                    color={RED}
                  >
                    Archive Offering Record
                  </Text>

                </HStack>

                <Text
                  fontSize="10px"
                  color={MUTED}
                  ml="40px"
                >
                  The record will remain in history.
                </Text>

              </Box>

            </Flex>

          </Grid>

        </Container>

      </Box>

      <Footer />

    </Box>
  );
};

export default OfferingEditPage;