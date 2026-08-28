// EventsAddPage.jsx

import React, { useState } from "react";

import {
  Box,
  Button,
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

import { createEvent } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const EventsAddPage = () => {
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
      setError("Event name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createEvent({
        name: trimmedName,
      });

      navigate("/events");
    } catch (err) {
      console.error(
        "Error creating event:",
        err
      );

      const apiError =
        err?.response?.data?.name?.[0] ||
        err?.response?.data?.detail ||
        "Unable to create event.";

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

      <Box
        flex="1"
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
        {/* ===================================================
            BREADCRUMB
        =================================================== */}

        <HStack
          gap={2}
          mb={2}
          color="#60708C"
          fontSize="11px"
        >
          <Text>Masters</Text>
          <Text>/</Text>
          <Text>Events Master</Text>
          <Text>/</Text>
          <Text color="#182338" fontWeight="600">Add Event</Text>
        </HStack>

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <Box mb={3}>
          <Text
            fontSize="10px"
            fontWeight="700"
            color="#D7193F"
            mb={1}
          >
            EVENTS MASTER
          </Text>

          <Heading
            color="#182338"
            fontSize={{
              base: "22px",
              md: "26px",
            }}
            lineHeight="1.1"
            mb={1}
          >
            Add Event
          </Heading>

          <Text
            color="#60708C"
            fontSize="11px"
          >
            Create a new event record.
          </Text>
        </Box>

        {/* ===================================================
            FORM CARD
        =================================================== */}

        <Box
          border="1px solid #DCE2EA"
          borderRadius="8px"
          bg="white"
          overflow="hidden"
        >
          {/* =================================================
              CARD CONTENT
          ================================================= */}

          <Box
            px={{
              base: 4,
              md: 5,
            }}
            py={{
              base: 4,
              md: 5,
            }}
          >
            {/* =================================================
                SECTION TITLE
            ================================================= */}

            <Heading
              color="#182338"
              fontSize={{
                base: "16px",
                md: "18px",
              }}
              fontWeight="700"
              mb={4}
            >
              Event Information
            </Heading>

            {/* =================================================
                FIELD
            ================================================= */}

            <Box>
              <Text
                color="#182338"
                fontSize="12px"
                fontWeight="600"
                mb={1.5}
              >
                Event Name
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
                placeholder="Enter event name"
                h="38px"
                px={4}
                fontSize="12px"
                borderColor="#DCE2EA"
                borderRadius="6px"
                color="#182338"
                _placeholder={{
                  color: "#8B98AB",
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
                    fontSize="12px"
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
              borderTop="1px solid #DCE2EA"
              mt={6}
              mb={4}
            />

            {/* =================================================
                ACTION BUTTONS
            ================================================= */}

            <Flex
              justify="flex-end"
              align="center"
              gap={2}
              direction={{
                base: "column-reverse",
                sm: "row",
              }}
            >
              {/* CANCEL */}

              <Button
                variant="outline"
                h="38px"
                minW={{
                  base: "100%",
                  sm: "120px",
                }}
                px={4}
                borderColor="#FF5A7D"
                color="#D7193F"
                bg="white"
                borderRadius="6px"
                fontSize="12px"
                fontWeight="600"
                onClick={() =>
                  navigate("/events")
                }
                _hover={{
                  bg: "#FFF0F4",
                }}
              >
                <LuArrowLeft
                  size={15}
                  style={{
                    marginRight: "7px",
                  }}
                />

                Cancel
              </Button>

              {/* SAVE */}

              <Button
                bg={PRIMARY_MAROON}
                color="white"
                h="38px"
                minW={{
                  base: "100%",
                  sm: "140px",
                }}
                px={4}
                borderRadius="6px"
                fontSize="12px"
                fontWeight="600"
                isLoading={saving}
                loadingText="Saving..."
                onClick={handleSave}
                _hover={{
                  bg: "#650A18",
                }}
              >
                <LuSave
                  size={15}
                  style={{
                    marginRight: "7px",
                  }}
                />

                Save Event
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />
    </Box>
  );
};

export default EventsAddPage;