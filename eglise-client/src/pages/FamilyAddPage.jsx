import React, { useState } from "react";

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

import { createFamily } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const FamilyAddPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    family_name: "",
    origin: "",
    history: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

    // Family Name
    if (!formData.family_name.trim()) {
      setError("Family name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        family_name: formData.family_name.trim(),
        origin: formData.origin.trim(),
        history: formData.history.trim(),
      };

      console.log("Creating family with payload:", payload);

      await createFamily(payload);

      navigate("/family");
    } catch (err) {
      console.error("Error creating family:", err);

      const apiError =
        err?.response?.data?.family_name?.[0] ||
        err?.response?.data?.origin?.[0] ||
        err?.response?.data?.history?.[0] ||
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "Unable to create family.";

      setError(apiError);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/family");
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

  const FieldLabel = ({
    children,
    required = true,
  }) => (
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
              Masters
            </Text>

            <Text>/</Text>

            <Text>
              Family Master
            </Text>

            <Text>/</Text>

            <Text color={DARK}>
              Add Family
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
                FAMILY MASTER
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
                Add Family
              </Heading>

              <Text
                color={MUTED}
                fontSize="12px"
              >
                Create a family record with origin and history
                information.
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
                Family Details
              </Text>
            </Box>

            {/* ==================================================
                SECTION TITLE
            ================================================== */}

         

            {/* ==================================================
                FAMILY NAME + ORIGIN
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
              {/* FAMILY NAME */}

              <Box>
                <FieldLabel>
                  Family Name
                </FieldLabel>

                <Input
                  name="family_name"
                  value={formData.family_name}
                  onChange={handleChange}
                  placeholder="Enter family name"
                  {...inputStyle}
                />
              </Box>

              {/* ORIGIN */}

              <Box>
                <FieldLabel required={false}>
                  Origin
                </FieldLabel>

                <Input
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  placeholder="Enter place of origin"
                  {...inputStyle}
                />
              </Box>
            </Grid>

            {/* ==================================================
                HISTORY
            ================================================== */}

            <Box mb={5}>
              <FieldLabel required={false}>
                History
              </FieldLabel>

              <Textarea
                name="history"
                value={formData.history}
                onChange={handleChange}
                placeholder="Enter family history"
                minH="100px"
                maxH="100px"
                resize="none"
                fontSize="13px"
                borderColor={BORDER}
                borderRadius="7px"
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

              <Text
                fontSize="12px"
                color={MUTED}
                mt={2}
              >
                Add background, migration, heritage, or other
                relevant family details.
              </Text>
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
                Save Family
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

export default FamilyAddPage;