
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
  Textarea,
} from "@chakra-ui/react";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  createTombFees,
  listTombTypes,
} from "../api/churchServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const TombFeesAddPage = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [tombTypes, setTombTypes] = useState([]);

  const [formData, setFormData] = useState({
    tomb_type: "",
    tomb_fees: "",
    indication: "",
    specification: "",
  });

  const [loadingTombTypes, setLoadingTombTypes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD TOMB TYPES
  // ==========================================================

  useEffect(() => {
    fetchTombTypes();
  }, []);

  const fetchTombTypes = async () => {
    try {
      setLoadingTombTypes(true);

      const response = await listTombTypes();

      const data = response?.data ?? response;

      if (Array.isArray(data)) {
        setTombTypes(data);
      } else if (Array.isArray(data?.results)) {
        setTombTypes(data.results);
      } else {
        setTombTypes([]);
      }
    } catch (err) {
      console.error("Error loading tomb types:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load tomb types."
      );
    } finally {
      setLoadingTombTypes(false);
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

    // Tomb Type
    if (!formData.tomb_type) {
      setError("Please select a tomb type.");
      return;
    }

    // Tomb Fees
    if (
      formData.tomb_fees === "" ||
      formData.tomb_fees === null ||
      formData.tomb_fees === undefined
    ) {
      setError("Tomb fees is required.");
      return;
    }

    const tombFees = Number(formData.tomb_fees);

    if (Number.isNaN(tombFees) || tombFees < 0) {
      setError("Tomb fees must be a valid amount.");
      return;
    }

    // Indication
    if (!formData.indication.trim()) {
      setError("Indication is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        tomb_type: Number(formData.tomb_type),
        tomb_fees: tombFees,
        indication: formData.indication.trim(),
        specification: formData.specification.trim(),
      };

      console.log(
        "Creating tomb fee with payload:",
        payload
      );

      await createTombFees(payload);

      navigate("/tomb-fees");
    } catch (err) {
      console.error(
        "Error creating tomb fee:",
        err
      );

      const apiError =
        err?.response?.data?.tomb_type?.[0] ||
        err?.response?.data?.tomb_fees?.[0] ||
        err?.response?.data?.indication?.[0] ||
        err?.response?.data?.specification?.[0] ||
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "Unable to create tomb fee.";

      setError(apiError);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/tomb-fees");
  };

  // ==========================================================
  // COMMON INPUT STYLE
  // ==========================================================

  const inputStyle = {
    h: "36px",
    fontSize: "12px",
    borderColor: BORDER,
    borderRadius: "6px",
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

  const FieldLabel = ({
    children,
    required = true,
  }) => (
    <Text
      fontSize="11px"
      fontWeight="600"
      color={DARK}
      mb="6px"
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
        {/* Same full-width layout as SubscriptionPage */}

        <Box
          w="100%"
          px={{
            base: 3,
            md: 4,
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
          >
            <Text>
              Masters
            </Text>

            <Text>/</Text>

            <Text>
              Tomb Fees
            </Text>

            <Text>/</Text>

            <Text color={DARK}>
              Add Tomb Fee
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
            mb={3}
            direction={{
              base: "column",
              md: "row",
            }}
          >
            <Box>
              <Text
                fontSize="10px"
                fontWeight="700"
                color={RED}
                mb={1}
              >
                TOMB FEE MASTER
              </Text>

              <Heading
                color={DARK}
                fontSize={{
                  base: "22px",
                  md: "26px",
                }}
                lineHeight="1.1"
                mb={1}
              >
                Add Tomb Fee
              </Heading>

              <Text
                color={MUTED}
                fontSize="11px"
              >
                Create a tomb fee record with
                tomb type and fee details.
              </Text>
            </Box>
          </Flex>

          {/* ==================================================
              FORM CARD
          ================================================== */}

          <Box
            border="1px solid"
            borderColor={BORDER}
            borderRadius="8px"
            bg="white"
            p={{
              base: 4,
              md: 5,
            }}
            width="100%"
            boxShadow="0 1px 2px rgba(16, 24, 40, 0.02)"
          >
            {/* ==================================================
                CARD HEADER
            ================================================== */}

            <Box mb={4}>
              <Text
                fontSize="12px"
                fontWeight="700"
                color={RED}
                pb="8px"
                borderBottom="2px solid"
                borderColor={RED}
                display="inline-block"
              >
                Tomb Fee Details
              </Text>
            </Box>

            {/* ==================================================
                SECTION TITLE
            ================================================== */}

            <Flex
              align="center"
              mb={3}
            >
              <Text
                fontSize="12px"
                fontWeight="700"
                color={DARK}
              >
                Tomb Fee Information
              </Text>
            </Flex>

            {/* ==================================================
                TOMB TYPE + TOMB FEES
            ================================================== */}

            <Grid
              templateColumns={{
                base: "1fr",
                md: "1fr 1fr",
              }}
              gap={{
                base: 3,
                md: 4,
              }}
              mb={3}
            >
              {/* TOMB TYPE */}

              <Box>
                <FieldLabel>
                  Tomb Type
                </FieldLabel>

                <select
                  name="tomb_type"
                  value={formData.tomb_type}
                  onChange={handleChange}
                  disabled={loadingTombTypes}
                  style={{
                    width: "100%",
                    height: "36px",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "6px",
                    padding: "0 11px",
                    fontSize: "12px",
                    background: "white",
                    color: DARK,
                    outline: "none",
                    cursor: loadingTombTypes
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  <option value="">
                    {loadingTombTypes
                      ? "Loading tomb types..."
                      : "Select tomb type"}
                  </option>

                  {tombTypes.map((tombType) => (
                    <option
                      key={tombType.id}
                      value={tombType.id}
                    >
                      {tombType.name}
                    </option>
                  ))}
                </select>
              </Box>

              {/* TOMB FEES */}

              <Box>
                <FieldLabel>
                  Tomb Fees
                </FieldLabel>

                <Flex>
                  <Box
                    width="42px"
                    height="36px"
                    border="1px solid"
                    borderColor={BORDER}
                    borderRadius="6px 0 0 6px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="#F8FAFC"
                    fontSize="13px"
                    fontWeight="600"
                    color={MUTED}
                    flexShrink={0}
                  >
                    ₹
                  </Box>

                  <Input
                    name="tomb_fees"
                    type="number"
                    min="0"
                    step="0.001"
                    value={formData.tomb_fees}
                    onChange={handleChange}
                    placeholder="Enter tomb fees"
                    h="36px"
                    fontSize="12px"
                    borderColor={BORDER}
                    borderRadius="0 6px 6px 0"
                    borderLeft="none"
                    color={DARK}
                    _placeholder={{
                      color: "#98A2B3",
                    }}
                    _hover={{
                      borderColor: "#BFC7D4",
                    }}
                    _focus={{
                      borderColor:
                        PRIMARY_MAROON,
                      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                    }}
                  />
                </Flex>
              </Box>
            </Grid>

            {/* ==================================================
                INDICATION
            ================================================== */}

            <Box mb={3}>
              <FieldLabel>
                Indication
              </FieldLabel>

              <Input
                name="indication"
                value={formData.indication}
                onChange={handleChange}
                placeholder="Enter indication"
                {...inputStyle}
              />
            </Box>

            {/* ==================================================
                SPECIFICATION
            ================================================== */}

            <Box mb={4}>
              <FieldLabel required={false}>
                Specification
              </FieldLabel>

              <Textarea
                name="specification"
                value={formData.specification}
                onChange={handleChange}
                placeholder="Enter specification"
                minH="90px"
                resize="vertical"
                fontSize="12px"
                borderColor={BORDER}
                borderRadius="6px"
                color={DARK}
                bg="white"
                _placeholder={{
                  color: "#98A2B3",
                }}
                _hover={{
                  borderColor: "#BFC7D4",
                }}
                _focus={{
                  borderColor:
                    PRIMARY_MAROON,
                  boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                }}
              />
            </Box>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <Box
                mb={4}
                px={3}
                py={2}
                border="1px solid #FED7D7"
                bg="#FFF5F5"
                borderRadius="6px"
              >
                <Text
                  color="#C53030"
                  fontSize="11px"
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
              mb={3}
            />

            {/* ==================================================
                BUTTONS
            ================================================== */}

            <Flex
              justify="flex-end"
              align="center"
              gap={2}
            >
              <Button
                variant="outline"
                borderColor={RED}
                color={RED}
                h="34px"
                px={5}
                borderRadius="6px"
                fontSize="11px"
                fontWeight="600"
                onClick={handleCancel}
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                Cancel
              </Button>

              <Button
                h="34px"
                px={6}
                bg={PRIMARY_MAROON}
                color="white"
                borderRadius="6px"
                fontSize="11px"
                fontWeight="600"
                loading={saving}
                disabled={saving}
                onClick={handleSubmit}
                _hover={{
                  bg: "#650A18",
                }}
              >
                Save Tomb Fee
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

export default TombFeesAddPage;

