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
} from "react-icons/lu";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getSubscription,
  updateSubscription,
  listGrades,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const SubscriptionEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ==========================================================
  // STATE
  // ==========================================================

  const [grades, setGrades] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [subscription, setSubscription] = useState(null);

  const [formData, setFormData] = useState({
    grade: "",
    term: "",
    start_date: "",
    end_date: "",
    amount: "",
    is_cancelled: false,
    cancel_reason: "",
  });

  // Keep the original values so we can calculate unsaved changes.
  const [originalFormData, setOriginalFormData] = useState({
    grade: "",
    term: "",
    start_date: "",
    end_date: "",
    amount: "",
    is_cancelled: false,
    cancel_reason: "",
  });

  // ==========================================================
  // DATE FOR INPUT
  // ==========================================================

  const formatInputDate = (date) => {
    if (!date) {
      return "";
    }

    const value = String(date);

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const year = parsedDate.getFullYear();

    const month = String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      parsedDate.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ==========================================================
  // DISPLAY DATE
  // ==========================================================

  const formatDisplayDate = (date) => {
    if (!date) {
      return "-";
    }

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
  // AMOUNT DISPLAY
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

    return numericAmount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
        subscriptionResponse,
        gradeResponse,
      ] = await Promise.all([
        getSubscription(id),
        listGrades(),
      ]);

      // --------------------------------------------------------
      // SUBSCRIPTION
      // --------------------------------------------------------

      const subscriptionData =
        subscriptionResponse?.data ??
        subscriptionResponse;

      setSubscription(subscriptionData);

      // --------------------------------------------------------
      // GRADES
      // --------------------------------------------------------

      const gradeData =
        gradeResponse?.data ??
        gradeResponse;

      const gradeList = Array.isArray(gradeData)
        ? gradeData
        : gradeData?.results || [];

      setGrades(gradeList);

      // --------------------------------------------------------
      // GRADE ID
      // --------------------------------------------------------

      const gradeId =
        subscriptionData?.grade?.id ??
        subscriptionData?.grade ??
        "";

      // --------------------------------------------------------
      // ORIGINAL FORM DATA
      // --------------------------------------------------------

      const loadedFormData = {
        grade: gradeId
          ? String(gradeId)
          : "",

        term:
          subscriptionData?.term ?? "",

        start_date:
          subscriptionData?.start_date
            ? formatInputDate(
                subscriptionData.start_date
              )
            : "",

        end_date:
          subscriptionData?.end_date
            ? formatInputDate(
                subscriptionData.end_date
              )
            : "",

        amount:
          subscriptionData?.amount !== null &&
          subscriptionData?.amount !== undefined
            ? String(subscriptionData.amount)
            : "",

        is_cancelled: Boolean(
          subscriptionData?.is_cancelled
        ),

        cancel_reason:
          subscriptionData?.cancel_reason ??
          "",
      };

      setFormData(loadedFormData);

      // Important:
      // Save a clean copy of the initial values.
      // This is used to calculate unsaved changes.
      setOriginalFormData({
        ...loadedFormData,
      });
    } catch (err) {
      console.error(
        "Error loading subscription:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load subscription."
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

    const compare = (field, label) => {
      const original =
        originalFormData[field] ?? "";

      const current =
        formData[field] ?? "";

      if (String(original) !== String(current)) {
        fields.push(label);
      }
    };

    compare("grade", "Grade");
    compare("term", "Term");
    compare("start_date", "Start Date");
    compare("end_date", "End Date");
    compare("amount", "Amount");
    compare(
      "is_cancelled",
      "Status"
    );

    // Only count cancel reason when it is relevant.
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
  // GRADE NAME
  // ==========================================================

  const getGradeName = () => {
    const selectedGrade = grades.find(
      (grade) =>
        String(grade.id) ===
        String(formData.grade)
    );

    if (selectedGrade?.name) {
      return selectedGrade.name;
    }

    if (
      typeof subscription?.grade ===
        "object" &&
      subscription?.grade?.name
    ) {
      return subscription.grade.name;
    }

    return "Grade";
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    if (!formData.grade) {
      return "Please select a grade.";
    }

    if (!formData.term.trim()) {
      return "Term is required.";
    }

    if (!formData.start_date) {
      return "Start date is required.";
    }

    if (!formData.end_date) {
      return "End date is required.";
    }

    if (
      new Date(formData.end_date) <
      new Date(formData.start_date)
    ) {
      return "End date cannot be before start date.";
    }

    if (
      formData.amount === "" ||
      formData.amount === null
    ) {
      return "Amount is required.";
    }

    const amount = Number(
      formData.amount
    );

    if (
      Number.isNaN(amount) ||
      amount < 0
    ) {
      return "Amount must be zero or greater.";
    }

    // --------------------------------------------------------
    // CANCEL REASON
    // --------------------------------------------------------

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
        grade: Number(
          formData.grade
        ),

        term:
          formData.term.trim(),

        start_date:
          formData.start_date,

        end_date:
          formData.end_date,

        amount:
          Number(formData.amount),

        is_cancelled:
          Boolean(
            formData.is_cancelled
          ),
      };

      // Send cancel_reason when cancelled.
      // Sending it only when cancelled avoids unnecessary
      // validation problems on active subscriptions.
      if (formData.is_cancelled) {
        payload.cancel_reason =
          formData.cancel_reason.trim();
      } else {
        payload.cancel_reason = "";
      }

      console.log(
        "Updating subscription:",
        id
      );

      console.log(
        "Update payload:",
        payload
      );

      await updateSubscription(
        id,
        payload
      );

      // After successful save there are no unsaved changes.
      setOriginalFormData({
        ...formData,
      });

      navigate("/subscriptions");
    } catch (err) {
      console.error(
        "Error updating subscription:",
        err
      );

      const responseData =
        err?.response?.data;

      console.error(
        "API error response:",
        responseData
      );

      let apiError =
        "Unable to update subscription.";

      if (
        responseData?.cancel_reason
      ) {
        apiError =
          Array.isArray(
            responseData.cancel_reason
          )
            ? responseData.cancel_reason[0]
            : responseData.cancel_reason;
      } else if (
        responseData?.grade
      ) {
        apiError =
          Array.isArray(
            responseData.grade
          )
            ? responseData.grade[0]
            : responseData.grade;
      } else if (
        responseData?.term
      ) {
        apiError =
          Array.isArray(
            responseData.term
          )
            ? responseData.term[0]
            : responseData.term;
      } else if (
        responseData?.start_date
      ) {
        apiError =
          Array.isArray(
            responseData.start_date
          )
            ? responseData.start_date[0]
            : responseData.start_date;
      } else if (
        responseData?.end_date
      ) {
        apiError =
          Array.isArray(
            responseData.end_date
          )
            ? responseData.end_date[0]
            : responseData.end_date;
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
        responseData?.detail
      ) {
        apiError =
          responseData.detail;
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
    navigate("/subscriptions");
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
              Loading subscription...
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
              Activities
            </Text>

            <Text>/</Text>

            <Text>
              Subscriptions
            </Text>

            <Text>/</Text>

            <Text>
              {subscription?.subscription_number ||
                subscription?.code ||
                `SUB-${String(id).padStart(
                  6,
                  "0"
                )}`}{" "}
              / Edit
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
                SUBSCRIPTIONS
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
                Edit Subscription
              </Heading>

              <Text
                color={MUTED}
                fontSize="11px"
              >
                Update grade, term, dates,
                amount and status.
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
                loading={saving}
                disabled={saving}
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
              COMPACT SUBSCRIPTION SUMMARY
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
                    as={LuCalendarDays}
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
                    {getGradeName()}{" "}
                    Subscription
                  </Text>

                  <HStack
                    gap={2}
                    flexWrap="wrap"
                  >
                    <Text
                      fontSize="11px"
                      color={MUTED}
                    >
                      {subscription?.subscription_number ||
                        subscription?.code ||
                        `SUB-${String(
                          id
                        ).padStart(
                          6,
                          "0"
                        )}`}
                    </Text>

                    <Text
                      fontSize="11px"
                      color={MUTED}
                    >
                      {formatDisplayDate(
                        formData.start_date
                      )}{" "}
                      –{" "}
                      {formatDisplayDate(
                        formData.end_date
                      )}
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
                  <Text
                    fontSize="18px"
                    fontWeight="800"
                    color={RED}
                  >
                    T
                  </Text>
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
                    {formData.term ||
                      "Term"}
                  </Text>

                  <Text
                    fontSize="11px"
                    color={MUTED}
                  >
                    Current Term
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
              lg: "minmax(0, 2.1fr) minmax(300px, 1fr)",
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
                  Subscription Information
                </Text>
              </HStack>

              {/* GRADE + TERM */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr",
                }}
                gap={3}
                mb={3}
              >
                {/* GRADE */}

                <Box>
                  <Text
                    fontSize="11px"
                    fontWeight="700"
                    color={DARK}
                    mb={1.5}
                  >
                    Grade{" "}
                    <Text
                      as="span"
                      color={RED}
                    >
                      *
                    </Text>
                  </Text>

                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "38px",
                      border: `1px solid ${BORDER}`,
                      borderRadius: "6px",
                      padding: "0 10px",
                      fontSize: "12px",
                      background: "white",
                      color: DARK,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">
                      Select grade
                    </option>

                    {grades.map((grade) => (
                      <option
                        key={grade.id}
                        value={grade.id}
                      >
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </Box>

                {/* TERM */}

                <Box>
                  <Text
                    fontSize="11px"
                    fontWeight="700"
                    color={DARK}
                    mb={1.5}
                  >
                    Term{" "}
                    <Text
                      as="span"
                      color={RED}
                    >
                      *
                    </Text>
                  </Text>

                  <Input
                    name="term"
                    value={formData.term}
                    onChange={handleChange}
                    placeholder="Enter term"
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
                      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                    }}
                  />
                </Box>
              </Grid>

              {/* START + END */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr",
                }}
                gap={3}
                mb={3}
              >
                {/* START DATE */}

                <Box>
                  <Text
                    fontSize="11px"
                    fontWeight="700"
                    color={DARK}
                    mb={1.5}
                  >
                    Start Date{" "}
                    <Text
                      as="span"
                      color={RED}
                    >
                      *
                    </Text>
                  </Text>

                  <Box position="relative">
                    <Input
                      name="start_date"
                      type="date"
                      value={
                        formData.start_date
                      }
                      onChange={handleChange}
                      h="38px"
                      fontSize="12px"
                      borderColor={BORDER}
                      borderRadius="6px"
                      color={DARK}
                      pr="38px"
                      _focus={{
                        borderColor:
                          PRIMARY_MAROON,
                        boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />

                    <Icon
                      as={LuCalendarDays}
                      position="absolute"
                      right="10px"
                      top="50%"
                      transform="translateY(-50%)"
                      color="#98A2B3"
                      boxSize={3.5}
                      pointerEvents="none"
                    />
                  </Box>
                </Box>

                {/* END DATE */}

                <Box>
                  <Text
                    fontSize="11px"
                    fontWeight="700"
                    color={DARK}
                    mb={1.5}
                  >
                    End Date{" "}
                    <Text
                      as="span"
                      color={RED}
                    >
                      *
                    </Text>
                  </Text>

                  <Box position="relative">
                    <Input
                      name="end_date"
                      type="date"
                      value={
                        formData.end_date
                      }
                      onChange={handleChange}
                      h="38px"
                      fontSize="12px"
                      borderColor={BORDER}
                      borderRadius="6px"
                      color={DARK}
                      pr="38px"
                      _focus={{
                        borderColor:
                          PRIMARY_MAROON,
                        boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />

                    <Icon
                      as={LuCalendarDays}
                      position="absolute"
                      right="10px"
                      top="50%"
                      transform="translateY(-50%)"
                      color="#98A2B3"
                      boxSize={3.5}
                      pointerEvents="none"
                    />
                  </Box>
                </Box>
              </Grid>

              {/* AMOUNT */}

              <Box mb={3}>
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
                    value={
                      formData.amount
                    }
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
                      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                    }}
                  />
                </Flex>
              </Box>

              {/* CANCELLED */}

              <Box>
                <Text
                  fontSize="11px"
                  fontWeight="700"
                  color={DARK}
                  mb={2}
                >
                  Canceled
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
                        : "#B8C3D1"
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
                    Mark this subscription
                    as canceled
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
                    placeholder="Enter reason for cancelling this subscription"
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
                      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                    }}
                  />

                  <Text
                    mt={1}
                    fontSize="10px"
                    color={MUTED}
                  >
                    Please provide a reason
                    before cancelling.
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
                        subscription?.created_at ||
                          subscription?.created_on
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
                        subscription?.updated_at ||
                          subscription?.last_updated
                      )}

                      {subscription?.updated_by
                        ? ` by ${subscription.updated_by}`
                        : ""}
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
                  <>
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
                  </>
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
                    Archive Subscription
                    Record
                  </Text>
                </HStack>

                <Text
                  fontSize="10px"
                  color={MUTED}
                  ml="40px"
                >
                  The record will remain in
                  history.
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

export default SubscriptionEditPage;