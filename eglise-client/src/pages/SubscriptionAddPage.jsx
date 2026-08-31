import React, { useEffect, useState } from "react";

import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Text,
} from "@chakra-ui/react";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  createSubscription,
  listGrades,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const SubscriptionAddPage = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [grades, setGrades] = useState([]);

  const [formData, setFormData] = useState({
    grade: "",
    term: "",
    start_date: "",
    end_date: "",
    amount: "",
  });

  const [loadingGrades, setLoadingGrades] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD GRADES
  // ==========================================================

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoadingGrades(true);

      const response = await listGrades();

      const data = response?.data ?? response;

      if (Array.isArray(data)) {
        setGrades(data);
      } else if (Array.isArray(data?.results)) {
        setGrades(data.results);
      } else {
        setGrades([]);
      }
    } catch (err) {
      console.error("Error loading grades:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load grades."
      );
    } finally {
      setLoadingGrades(false);
    }
  };

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async () => {
    setError("");

    if (!formData.grade) {
      setError("Please select a grade.");
      return;
    }

    if (!formData.term.trim()) {
      setError("Term is required.");
      return;
    }

    if (!formData.start_date) {
      setError("Start date is required.");
      return;
    }

    if (!formData.end_date) {
      setError("End date is required.");
      return;
    }

    if (!formData.amount) {
      setError("Amount is required.");
      return;
    }

    // Date validation
    if (
      new Date(formData.end_date) <
      new Date(formData.start_date)
    ) {
      setError(
        "End date cannot be before start date."
      );
      return;
    }

    // Amount validation
    const amount = Number(formData.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      setError(
        "Amount must be greater than zero."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        grade: Number(formData.grade),
        term: formData.term.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        amount: amount,
        is_cancelled: false,
      };

      console.log(
        "Creating subscription with payload:",
        payload
      );

      await createSubscription(payload);

      navigate("/subscriptions");
    } catch (err) {
      console.error(
        "Error creating subscription:",
        err
      );

      const apiError =
        err?.response?.data?.grade?.[0] ||
        err?.response?.data?.term?.[0] ||
        err?.response?.data?.start_date?.[0] ||
        err?.response?.data?.end_date?.[0] ||
        err?.response?.data?.amount?.[0] ||
        err?.response?.data?.detail ||
        "Unable to create subscription.";

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
  // INPUT STYLE
  // ==========================================================

  const inputStyle = {
    h: "42px",
    fontSize: "13px",
    borderColor: BORDER,
    borderRadius: "7px",
    color: DARK,
    bg: "white",

    _placeholder: {
      color: "#98A2B3",
    },

    _hover: {
      borderColor: "#BFC7D4",
    },

    _focus: {
      borderColor: PRIMARY_MAROON,
      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
    },
  };

  // ==========================================================
  // LABEL
  // ==========================================================

  const FieldLabel = ({ children, required = true }) => (
    <Text
      fontSize="12px"
      fontWeight="600"
      color={DARK}
      mb="8px"
    >
      {children}

      {required && (
        <Text
          as="span"
          color={RED}
          ml="2px"
        >
          *
        </Text>
      )}
    </Text>
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      minH="100vh"
      bg="#FFFFFF"
      display="flex"
      flexDirection="column"
    >
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <Navbar />

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <Box flex="1" w="100%">
        <Box
          w="100%"
          px={{
            base: 3,
            md: 5,
          }}
          py={{
            base: 3,
            md: 5,
          }}
        >
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <HStack
            gap={2}
            mb={3}
            color={MUTED}
            fontSize="12px"
          >
            <Text>
              Activities
            </Text>

            <Text>/</Text>

            <Text>
              Subscriptions
            </Text>

            <Text>/</Text>

            <Text color={DARK}>
              Add Subscription
            </Text>
          </HStack>

          {/* ==================================================
              PAGE HEADER
          ================================================== */}

          <Flex
            justify="space-between"
            align={{
              base: "flex-start",
              md: "center",
            }}
            gap={3}
            mb={4}
            direction={{
              base: "column",
              md: "row",
            }}
          >
            <Box>
              <Text
                fontSize="11px"
                fontWeight="700"
                color={RED}
                mb={1}
              >
                SUBSCRIPTIONS
              </Text>

              <Heading
                color={DARK}
                fontSize={{
                  base: "24px",
                  md: "28px",
                }}
                lineHeight="1.2"
                mb={1}
              >
                Add Subscription
              </Heading>

              <Text
                color={MUTED}
                fontSize="12px"
              >
                Create a subscription record.
              </Text>
            </Box>
          </Flex>

          {/* ==================================================
              FORM CARD
          ================================================== */}

          <Box
            border="1px solid"
            borderColor={BORDER}
            borderRadius="9px"
            bg="white"
            p={{
              base: 4,
              md: 6,
            }}
            width="100%"
            boxShadow="0 1px 3px rgba(16, 24, 40, 0.04)"
          >
            {/* ==================================================
                CARD HEADER
            ================================================== */}

            <Box mb={5}>
              <Text
                fontSize="13px"
                fontWeight="700"
                color={RED}
                pb="10px"
                borderBottom="2px solid"
                borderColor={RED}
                display="inline-block"
              >
                Subscription Details
              </Text>
            </Box>

            {/* ==================================================
                SECTION TITLE
            ================================================== */}

            <Flex
              align="center"
              mb={4}
            >
              <Text
                fontSize="13px"
                fontWeight="700"
                color={DARK}
              >
                Subscription Information
              </Text>
            </Flex>

            {/* ==================================================
                GRADE + TERM
            ================================================== */}

            <Grid
              templateColumns={{
                base: "1fr",
                md: "1fr 1fr",
              }}
              gap={{
                base: 4,
                md: 5,
              }}
              mb={4}
            >
              {/* GRADE */}

              <Box>
                <FieldLabel>
                  Grade
                </FieldLabel>

                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  disabled={loadingGrades}
                  style={{
                    width: "100%",
                    height: "42px",
                    fontSize: "13px",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "7px",
                    padding: "0 14px",
                    color: DARK,
                    backgroundColor: "white",
                    outline: "none",
                    cursor: loadingGrades
                      ? "not-allowed"
                      : "pointer",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = PRIMARY_MAROON;
                    e.target.style.boxShadow = `0 0 0 1px ${PRIMARY_MAROON}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = BORDER;
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <option value="">
                    {loadingGrades
                      ? "Loading grades..."
                      : "Select grade"}
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
                <FieldLabel>
                  Term
                </FieldLabel>

                <Input
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  placeholder="Enter term"
                  {...inputStyle}
                />
              </Box>
            </Grid>

            {/* ==================================================
                START DATE + END DATE
            ================================================== */}

            <Grid
              templateColumns={{
                base: "1fr",
                md: "1fr 1fr",
              }}
              gap={{
                base: 4,
                md: 5,
              }}
              mb={4}
            >
              {/* START DATE */}

              <Box>
                <FieldLabel>
                  Start Date
                </FieldLabel>

                <Input
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  {...inputStyle}
                />
              </Box>

              {/* END DATE */}

              <Box>
                <FieldLabel>
                  End Date
                </FieldLabel>

                <Input
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  {...inputStyle}
                />
              </Box>
            </Grid>

            {/* ==================================================
                AMOUNT
            ================================================== */}

            <Box
              mb={5}
              maxW={{
                base: "100%",
                md: "50%",
              }}
            >
              <FieldLabel>
                Amount
              </FieldLabel>

              <Flex>
                <Box
                  width="42px"
                  height="42px"
                  border="1px solid"
                  borderColor={BORDER}
                  borderRadius="7px 0 0 7px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="#F8FAFC"
                  fontSize="14px"
                  fontWeight="600"
                  color={MUTED}
                  flexShrink={0}
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
                  h="42px"
                  fontSize="13px"
                  borderColor={BORDER}
                  borderRadius="0 7px 7px 0"
                  borderLeft="none"
                  color={DARK}
                  bg="white"
                  _placeholder={{
                    color: "#98A2B3",
                  }}
                  _hover={{
                    borderColor: "#BFC7D4",
                  }}
                  _focus={{
                    borderColor: PRIMARY_MAROON,
                    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Flex>
            </Box>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <Box
                mb={4}
                px={4}
                py={2.5}
                border="1px solid #FED7D7"
                bg="#FFF5F5"
                borderRadius="7px"
              >
                <Text
                  color="#C53030"
                  fontSize="12px"
                  fontWeight="500"
                >
                  {error}
                </Text>
              </Box>
            )}

            {/* ==================================================
                DIVIDER
            ================================================== */}

            <Box
              borderTop="1px solid"
              borderColor="#E6EAF0"
              mb={4}
            />

            {/* ==================================================
                BUTTONS
            ================================================== */}

            <Flex
              justify="flex-end"
              align="center"
              gap={3}
            >
              <Button
                variant="outline"
                borderColor={RED}
                color={RED}
                h="38px"
                px={6}
                borderRadius="7px"
                fontSize="12px"
                fontWeight="600"
                onClick={handleCancel}
                disabled={saving}
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                Cancel
              </Button>

              <Button
                h="38px"
                px={7}
                bg={PRIMARY_MAROON}
                color="white"
                borderRadius="7px"
                fontSize="12px"
                fontWeight="600"
                loading={saving}
                disabled={saving}
                onClick={handleSubmit}
                _hover={{
                  bg: "#650A18",
                }}
              >
                Save Subscription
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Footer />
    </Box>
  );
};

export default SubscriptionAddPage;