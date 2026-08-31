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
} from "@chakra-ui/react";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { createWard } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const WardAddPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ward_name: "",
    ward_number: "",
    place: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // HANDLE CHANGE
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
    const wardName = formData.ward_name.trim();
    const wardNumber = String(formData.ward_number).trim();
    const place = formData.place.trim();

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!wardName) {
      setError("Ward name is required.");
      return;
    }

    if (!wardNumber) {
      setError("Ward number is required.");
      return;
    }

    const number = Number(wardNumber);

    if (!Number.isInteger(number) || number <= 0) {
      setError("Ward number must be a positive whole number.");
      return;
    }

    if (!place) {
      setError("Place is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      console.log("Creating ward with payload:", {
        ward_name: wardName,
        ward_number: number,
        place: place,
      });

      await createWard({
        ward_name: wardName,
        ward_number: number,
        place: place,
      });

      navigate("/ward");
    } catch (err) {
      console.error("Error creating ward:", err);

      const data = err?.response?.data;

      const apiError =
        data?.ward_number?.[0] ||
        data?.ward_name?.[0] ||
        data?.place?.[0] ||
        data?.detail ||
        "Unable to create ward.";

      setError(apiError);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/ward");
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
              Ward Master
            </Text>

            <Text>/</Text>

            <Text color={DARK}>
              Add Ward
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
                WARD MASTER
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
                Add Ward
              </Heading>

              <Text
                color={MUTED}
                fontSize="12px"
              >
                Create a ward record.
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
                Ward Details
              </Text>
            </Box>

            {/* ==================================================
                SECTION TITLE
            ================================================== */}


            {/* ==================================================
                WARD NAME + WARD NUMBER + PLACE
            ================================================== */}

            <Grid
              templateColumns={{
                base: "1fr",
                md: "1fr 1fr 1fr",
              }}
              gap={{
                base: 4,
                md: 5,
              }}
              mb={4}
            >
              {/* WARD NAME */}

              <Box>
                <FieldLabel>
                  Ward Name
                </FieldLabel>

                <Input
                  name="ward_name"
                  value={formData.ward_name}
                  onChange={handleChange}
                  placeholder="Enter ward name"
                  {...inputStyle}
                />
              </Box>

              {/* WARD NUMBER */}

              <Box>
                <FieldLabel>
                  Ward Number
                </FieldLabel>

                <Input
                  name="ward_number"
                  type="number"
                  min="1"
                  value={formData.ward_number}
                  onChange={handleChange}
                  placeholder="Enter ward number"
                  {...inputStyle}
                />
              </Box>

              {/* PLACE */}

              <Box>
                <FieldLabel>
                  Place
                </FieldLabel>

                <Input
                  name="place"
                  value={formData.place}
                  onChange={handleChange}
                  placeholder="Enter place"
                  {...inputStyle}
                />
              </Box>
            </Grid>

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
                Save Ward
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

export default WardAddPage;