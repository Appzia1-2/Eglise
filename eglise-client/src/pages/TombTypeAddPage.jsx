import React, { useState } from "react";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Text,
} from "@chakra-ui/react";

import {
  LuArrowLeft,
  LuSave,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { createTombType } from "../api/churchServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const TombTypeAddPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Tomb type name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createTombType({
        name: trimmedName,
      });

      navigate("/tomb-type");
    } catch (err) {
      console.error(
        "Error creating tomb type:",
        err
      );

      const apiError =
        err?.response?.data?.name?.[0] ||
        err?.response?.data?.detail ||
        "Unable to create tomb type.";

      setError(apiError);
    } finally {
      setSaving(false);
    }
  };

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
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <Navbar />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <Container
        maxW="1600px"
        flex="1"
        px={{
          base: 4,
          md: 6,
          lg: 8,
        }}
        py={{
          base: 4,
          md: 5,
          lg: 6,
        }}
      >
        {/* ===================================================
            BREADCRUMB
        =================================================== */}

        <HStack
          gap={2}
          mb={{
            base: 4,
            md: 5,
          }}
          color="#526B99"
          fontSize={{
            base: "12px",
            md: "14px",
          }}
          fontWeight="500"
        >
          <Text>
            Masters
          </Text>

          <Text color="#8A98AD">
            /
          </Text>

          <Text>
            Tomb Type Master
          </Text>

          <Text color="#8A98AD">
            /
          </Text>

          <Text>
            Add Tomb Type
          </Text>
        </HStack>

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <Box mb={6}>
          <Text
            fontSize={{
              base: "11px",
              md: "13px",
            }}
            fontWeight="700"
            color="#D7193F"
            mb={1}
            letterSpacing="0.2px"
          >
            TOMB TYPE MASTER
          </Text>

          <Heading
            color="#182A4A"
            fontSize={{
              base: "28px",
              md: "34px",
              lg: "38px",
            }}
            fontWeight="700"
            lineHeight="1.15"
            mb={2}
          >
            Add Tomb Type
          </Heading>

          <Text
            color="#526B99"
            fontSize={{
              base: "13px",
              md: "15px",
            }}
          >
            Create a tomb type record.
          </Text>
        </Box>

        {/* ===================================================
            FORM CARD
        =================================================== */}

        <Box
          border="1px solid #CBD8EA"
          borderRadius="9px"
          bg="white"
          overflow="hidden"
          boxShadow="0 1px 3px rgba(20, 40, 80, 0.03)"
        >
          {/* =================================================
              CARD CONTENT
          ================================================= */}

          <Box
            px={{
              base: 4,
              md: 7,
              lg: 8,
            }}
            py={{
              base: 5,
              md: 6,
              lg: 7,
            }}
          >
            {/* =================================================
                SECTION TITLE
            ================================================= */}

            <Heading
              color="#182A4A"
              fontSize={{
                base: "18px",
                md: "21px",
              }}
              fontWeight="700"
              mb={{
                base: 5,
                md: 6,
              }}
            >
              1. Tomb Type Information
            </Heading>

            {/* =================================================
                FIELD
            ================================================= */}

            <Box>
              <Text
                color="#182A4A"
                fontSize={{
                  base: "13px",
                  md: "15px",
                }}
                fontWeight="600"
                mb={2}
              >
                Tomb Type Name

                <Text
                  as="span"
                  color="#D7193F"
                  ml={1}
                >
                  *
                </Text>
              </Text>

              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Enter tomb type name"
                h={{
                  base: "44px",
                  md: "50px",
                }}
                px={{
                  base: 4,
                  md: 5,
                }}
                fontSize={{
                  base: "14px",
                  md: "16px",
                }}
                border="1px solid #CBD8EA"
                borderRadius="7px"
                color="#182A4A"
                bg="white"
                _placeholder={{
                  color: "#7284A3",
                }}
                _hover={{
                  borderColor: "#AFC0D8",
                }}
                _focus={{
                  borderColor: PRIMARY_MAROON,
                  boxShadow:
                    `0 0 0 1px ${PRIMARY_MAROON}`,
                }}
              />

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <Box
                  mt={3}
                  px={4}
                  py={3}
                  bg="#FFF5F5"
                  border="1px solid #FECACA"
                  borderRadius="6px"
                >
                  <Text
                    color="#C53030"
                    fontSize="13px"
                  >
                    {error}
                  </Text>
                </Box>
              )}
            </Box>

            {/* =================================================
                DIVIDER
            ================================================= */}

            <Box
              borderTop="1px solid #CBD8EA"
              mt={{
                base: 7,
                md: 9,
              }}
              mb={{
                base: 5,
                md: 6,
              }}
            />

            {/* =================================================
                ACTION BUTTONS
            ================================================= */}

            <Flex
              justify="flex-end"
              align="center"
              gap={{
                base: 2,
                md: 3,
              }}
              direction={{
                base: "column-reverse",
                sm: "row",
              }}
            >
              {/* CANCEL */}

              <Button
                variant="outline"
                h={{
                  base: "42px",
                  md: "46px",
                }}
                minW={{
                  base: "100%",
                  sm: "140px",
                }}
                px={6}
                border="1px solid #D7193F"
                color="#D7193F"
                bg="white"
                borderRadius="7px"
                fontSize={{
                  base: "13px",
                  md: "15px",
                }}
                fontWeight="600"
                onClick={() =>
                  navigate("/tomb-type")
                }
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                <LuArrowLeft
                  size={17}
                  style={{
                    marginRight: "8px",
                  }}
                />

                Cancel
              </Button>

              {/* SAVE */}

              <Button
                bg={PRIMARY_MAROON}
                color="white"
                h={{
                  base: "42px",
                  md: "46px",
                }}
                minW={{
                  base: "100%",
                  sm: "160px",
                }}
                px={6}
                borderRadius="7px"
                fontSize={{
                  base: "13px",
                  md: "15px",
                }}
                fontWeight="600"
                loading={saving}
                onClick={handleSave}
                _hover={{
                  bg: "#650A18",
                }}
              >
                <LuSave
                  size={17}
                  style={{
                    marginRight: "8px",
                  }}
                />

                Save
              </Button>
            </Flex>
          </Box>
        </Box>
      </Container>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />
    </Box>
  );
};

export default TombTypeAddPage;