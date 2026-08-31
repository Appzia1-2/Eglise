import React, { useEffect, useState } from "react";

import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  HStack,
  VStack,
  Button,
  Icon,
  Image,
  Spinner,
  Badge,
  Tabs,
} from "@chakra-ui/react";

import {
  LuArrowLeft,
  LuUserRound,
  LuCalendarDays,
  LuMapPin,
  LuPhone,
  LuPencil,
  LuUsersRound,
  LuFileText,
} from "react-icons/lu";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import logoImage from "../assets/priest2.png";
import { getPriestMaster } from "../api/registryServices";

// ============================================================
// COLORS
// ============================================================

const PRIMARY_MAROON = "var(--primary-maroon)";

const COLORS = {
  text: "#182338",
  secondary: "#60708C",
  muted: "#7A8699",
  border: "#E1E6ED",
  lightBorder: "#E8ECF1",
  red: "#D7193F",
  green: "#16803A",
};

// ============================================================
// IMAGE URL
// ============================================================

const getImageUrl = (url) => {
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";

  const cleanBase = apiBase.replace(/\/+$/, "");
  const cleanUrl = url.replace(/^\/+/, "");

  return `${cleanBase}/${cleanUrl}`;
};

// ============================================================
// DATE FORMAT
// ============================================================

const formatDate = (date) => {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// ACTIVE STATUS
// ============================================================

const isActivePriest = (priest) => {
  return (
    priest?.is_active === true ||
    priest?.is_active === 1 ||
    priest?.is_active === "true" ||
    priest?.is_active === "1"
  );
};

// ============================================================
// DESIGNATION
// ============================================================

const getDesignation = (priest) => {
  if (priest?.designation_label) {
    return priest.designation_label;
  }

  if (priest?.designation === "ASSISTANT") {
    return "Assistant Vicar";
  }

  return "Vicar";
};

// ============================================================
// DURATION
// ============================================================

const getDuration = (from, to, active) => {
  if (!from) return "-";

  const start = new Date(from);

  if (Number.isNaN(start.getTime())) {
    return "-";
  }

  const end =
    active || !to
      ? new Date()
      : new Date(to);

  if (Number.isNaN(end.getTime())) {
    return "-";
  }

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  if (end.getDate() < start.getDate()) {
    months--;
  }

  if (months < 0) {
    return "-";
  }

  if (months < 1) {
    return "Less than 1 month";
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0 && remainingMonths > 0) {
    return `${years} year${years > 1 ? "s" : ""} ${remainingMonths} month${
      remainingMonths > 1 ? "s" : ""
    }`;
  }

  if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""}`;
  }

  return `${months} month${months > 1 ? "s" : ""}`;
};

// ============================================================
// INFO ROW
// ============================================================

const InfoRow = ({ label, value }) => {
  return (
    <Flex
      align="center"
      gap={{
        base: "8px",
        md: "16px",
      }}
      minH="20px"
      width="100%"
    >
      <Text
        fontSize="11px"
        color={COLORS.text}
        fontWeight="500"
        flex={{
          base: "0 0 100px",
          sm: "0 0 120px",
          md: "0 0 150px",
          lg: "0 0 160px",
        }}
      >
        {label}
      </Text>

      <Text
        fontSize="11px"
        color={COLORS.text}
        fontWeight="500"
        textAlign="left"
        flex="1"
        minW="0"
      >
        {value || "-"}
      </Text>
    </Flex>
  );
};

// ============================================================
// ADDRESS ILLUSTRATION
// ============================================================

const AddressIllustration = () => {
  return (
    <Box
      position="absolute"
      right={{
        base: "5px",
        md: "10px",
        xl: "18px",
      }}
      bottom="7px"
      width={{
        base: "100px",
        md: "145px",
        xl: "190px",
      }}
      height={{
        base: "75px",
        md: "95px",
        xl: "108px",
      }}
      pointerEvents="none"
    >
      {/* Soft background */}

      <Box
        position="absolute"
        right="0"
        bottom="0"
        width={{
          base: "80px",
          md: "105px",
          xl: "125px",
        }}
        height={{
          base: "80px",
          md: "105px",
          xl: "125px",
        }}
        borderRadius="full"
        bg="#FFF8F9"
      />

      {/* Ground */}

      <Box
        position="absolute"
        left="0"
        right="0"
        bottom="6px"
        height="2px"
        bg="#F1A0AD"
      />

      {/* Left building */}

      <Box
        position="absolute"
        left="4px"
        bottom="8px"
        width="20px"
        height="37px"
        border="2px solid #E98A99"
        borderBottom="none"
      />

      <Box
        position="absolute"
        left="1px"
        bottom="44px"
        width="26px"
        height="12px"
        border="2px solid #E98A99"
        borderBottom="none"
        borderRadius="15px 15px 0 0"
      />

      {/* Main church */}

      <Box
        position="absolute"
        left={{
          base: "27px",
          md: "37px",
          xl: "48px",
        }}
        bottom="8px"
        width={{
          base: "55px",
          md: "75px",
          xl: "92px",
        }}
        height={{
          base: "44px",
          md: "50px",
          xl: "58px",
        }}
        border="2px solid #E98A99"
        borderBottom="none"
        bg="#FFFFFF"
      />

      {/* Church roof */}

      <Box
        position="absolute"
        left={{
          base: "23px",
          md: "33px",
          xl: "44px",
        }}
        bottom={{
          base: "49px",
          md: "55px",
          xl: "63px",
        }}
        width={{
          base: "63px",
          md: "83px",
          xl: "100px",
        }}
        height="25px"
        borderTop="2px solid #E98A99"
        borderLeft="2px solid #E98A99"
        borderRight="2px solid #E98A99"
        clipPath="polygon(50% 0%, 100% 100%, 0% 100%)"
      />

      {/* Central tower */}

      <Box
        position="absolute"
        left={{
          base: "49px",
          md: "64px",
          xl: "79px",
        }}
        bottom={{
          base: "50px",
          md: "55px",
          xl: "63px",
        }}
        width={{
          base: "18px",
          md: "22px",
          xl: "25px",
        }}
        height={{
          base: "34px",
          md: "39px",
          xl: "45px",
        }}
        border="2px solid #E98A99"
        borderBottom="none"
        bg="#FFFFFF"
      />

      {/* Tower roof */}

      <Box
        position="absolute"
        left={{
          base: "47px",
          md: "61px",
          xl: "76px",
        }}
        bottom={{
          base: "82px",
          md: "91px",
          xl: "106px",
        }}
        width={{
          base: "22px",
          md: "28px",
          xl: "31px",
        }}
        height="17px"
        borderTop="2px solid #E98A99"
        borderLeft="2px solid #E98A99"
        borderRight="2px solid #E98A99"
        clipPath="polygon(50% 0%, 100% 100%, 0% 100%)"
      />

      {/* Church door */}

      <Box
        position="absolute"
        left={{
          base: "50px",
          md: "67px",
          xl: "83px",
        }}
        bottom="8px"
        width={{
          base: "13px",
          md: "16px",
          xl: "18px",
        }}
        height={{
          base: "25px",
          md: "28px",
          xl: "31px",
        }}
        border="2px solid #E98A99"
        borderBottom="none"
        borderRadius="10px 10px 0 0"
      />

      {/* Right building */}

      <Box
        position="absolute"
        right={{
          base: "28px",
          md: "35px",
          xl: "43px",
        }}
        bottom="8px"
        width={{
          base: "19px",
          md: "23px",
          xl: "26px",
        }}
        height={{
          base: "37px",
          md: "42px",
          xl: "48px",
        }}
        border="2px solid #E98A99"
        borderBottom="none"
      />

      {/* Location pin */}

      <Box
        position="absolute"
        right="0"
        bottom="7px"
        width={{
          base: "28px",
          md: "32px",
          xl: "36px",
        }}
        height={{
          base: "38px",
          md: "42px",
          xl: "46px",
        }}
      >
        <Box
          position="absolute"
          top="0"
          left="2px"
          width={{
            base: "25px",
            md: "28px",
            xl: "31px",
          }}
          height={{
            base: "25px",
            md: "28px",
            xl: "31px",
          }}
          bg={PRIMARY_MAROON}
          borderRadius="50% 50% 50% 0"
          transform="rotate(-45deg)"
        />

        <Box
          position="absolute"
          top={{
            base: "7px",
            md: "8px",
            xl: "9px",
          }}
          left={{
            base: "9px",
            md: "10px",
            xl: "11px",
          }}
          width={{
            base: "8px",
            md: "9px",
            xl: "10px",
          }}
          height={{
            base: "8px",
            md: "9px",
            xl: "10px",
          }}
          bg="#FFFFFF"
          borderRadius="full"
        />
      </Box>
    </Box>
  );
};

// ============================================================
// SECTION CARD
// ============================================================

const SectionCard = ({
  title,
  icon,
  children,
  minH,
  address = false,
}) => {
  return (
    <Box
      position="relative"
      border="1px solid #E0E5EC"
      borderRadius="8px"
      bg="#FFFFFF"
      overflow="hidden"
      minH={minH}
    >
      {/* HEADER */}

      <HStack
        px="14px"
        py="8px"
        gap="8px"
        borderBottom="1px solid #E8ECF1"
        position="relative"
        zIndex={2}
      >
        <Box
          boxSize="24px"
          borderRadius="full"
          bg="#FFF1F4"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Icon
            as={icon}
            boxSize="12px"
            color={PRIMARY_MAROON}
          />
        </Box>

        <Heading
          fontSize="14px"
          fontWeight="700"
          color={COLORS.text}
        >
          {title}
        </Heading>
      </HStack>

      {/* CONTENT */}

      <Box
        px="14px"
        py="8px"
        position="relative"
        zIndex={2}
        maxW={address ? "72%" : "100%"}
      >
        {children}
      </Box>

      {/* ADDRESS ILLUSTRATION */}

      {address && <AddressIllustration />}
    </Box>
  );
};

// ============================================================
// VIEW PRIEST PAGE
// ============================================================

const ViewPriestPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [priest, setPriest] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // ==========================================================
  // LOAD PRIEST
  // ==========================================================

  useEffect(() => {
    const loadPriest = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getPriestMaster();

        let result = response?.data;

        if (result && !Array.isArray(result)) {
          if (Array.isArray(result.results)) {
            result = result.results;
          } else if (Array.isArray(result.data)) {
            result = result.data;
          } else if (Array.isArray(result.priests)) {
            result = result.priests;
          } else if (
            Array.isArray(result.current) ||
            Array.isArray(result.previous)
          ) {
            result = [
              ...(result.current || []),
              ...(result.previous || []),
            ];
          }
        }

        if (!Array.isArray(result)) {
          result = [];
        }

        const foundPriest = result.find(
          (item) =>
            String(item.id) === String(id)
        );

        if (!foundPriest) {
          setError(
            "Priest record could not be found."
          );
          return;
        }

        setPriest(foundPriest);
      } catch (err) {
        console.error(
          "ERROR LOADING PRIEST:",
          err
        );

        setError(
          "Unable to load priest details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPriest();
    }
  }, [id]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <Box
          minH="calc(100vh - 130px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="#FFFFFF"
        >
          <VStack gap="10px">
            <Spinner
              size="lg"
              color={PRIMARY_MAROON}
            />

            <Text
              fontSize="13px"
              color={COLORS.secondary}
            >
              Loading priest details...
            </Text>
          </VStack>
        </Box>

        <Footer />
      </>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !priest) {
    return (
      <>
        <Navbar />

        <Box
          minH="calc(100vh - 130px)"
          bg="#FFFFFF"
          px="25px"
          py="30px"
        >
          <Button
            variant="outline"
            borderColor={PRIMARY_MAROON}
            color={PRIMARY_MAROON}
            onClick={() =>
              navigate("/priest-master")
            }
          >
            <Icon
              as={LuArrowLeft}
              mr="8px"
            />

            Back to Priest Master
          </Button>

          <Box
            mt="30px"
            textAlign="center"
          >
            <Text
              fontSize="16px"
              fontWeight="600"
              color={COLORS.text}
            >
              {error || "Priest not found."}
            </Text>
          </Box>
        </Box>

        <Footer />
      </>
    );
  }

  // ==========================================================
  // DATA
  // ==========================================================

  const active = isActivePriest(priest);

  const designation =
    getDesignation(priest);

  const priestId =
    `PR-${String(id).padStart(4, "0")}`;

  const image =
    priest.image_url ||
    priest.image ||
    priest.photo_url ||
    priest.photo;

  const priestImage =
    image ? getImageUrl(image) : null;

  const dateFrom =
    priest.date_from ||
    priest.serving_from;

  const dateTo =
    priest.date_to ||
    priest.serving_to;

  const addressLine1 =
    priest.address_line1 || "";

  const addressLine2 =
    priest.address_line2 || "";

  const city =
    priest.city || "";

  const state =
    priest.state || "";

  const country =
    priest.country || "";

  const postalCode =
    priest.postal_code || "";

  const familyName =
    priest.family_name || "-";

  const duration =
    getDuration(
      dateFrom,
      dateTo,
      active
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <Navbar />

      <Box
        bg="#FFFFFF"
        h="calc(100vh - 74px)"
        overflowY="auto"
      >
        <Container
          maxW="none"
          px={{
            base: 3,
            md: 5,
            xl: "20px",
          }}
          py="6px"
        >
          {/* =================================================
              BREADCRUMB
          ================================================= */}

          <HStack
            gap="6px"
            mb="2px"
            fontSize="11px"
            color={COLORS.secondary}
            h="16px"
          >
            <Text>Masters</Text>

            <Text color="#9AA4B2">
              /
            </Text>

            <Text>Priest Master</Text>

            <Text color="#9AA4B2">
              /
            </Text>

            <Text color="#344054">
              {priest.name || "Priest"}
            </Text>
          </HStack>

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <Flex
            justify="space-between"
            align={{
              base: "flex-start",
              md: "center",
            }}
            direction={{
              base: "column",
              md: "row",
            }}
            gap="12px"
            mb="9px"
          >
            <Box>
              <Text
                color={PRIMARY_MAROON}
                fontSize="10px"
                fontWeight="700"
                mb="0px"
              >
                PRIEST PROFILE
              </Text>

              <Heading
                fontSize="20px"
                lineHeight="24px"
                fontWeight="700"
                color={COLORS.text}
              >
                Priest Details
              </Heading>

              <Text
                fontSize="11px"
                color={COLORS.secondary}
                mt="0px"
              >
                View complete priest information and service details.
              </Text>
            </Box>

            <HStack
              gap="10px"
              flexWrap="wrap"
            >
              <Button
                h="34px"
                px="12px"
                variant="outline"
                borderColor={PRIMARY_MAROON}
                color={PRIMARY_MAROON}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="600"
                onClick={() =>
                  navigate("/priest-master")
                }
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                <Icon
                  as={LuArrowLeft}
                  mr="6px"
                  boxSize="13px"
                />
                Back
              </Button>

              <Button
                h="34px"
                px="14px"
                bg={PRIMARY_MAROON}
                color="#FFFFFF"
                borderRadius="5px"
                fontSize="11px"
                fontWeight="600"
                onClick={() =>
                  navigate(
                    `/priest-master/edit/${id}`
                  )
                }
                _hover={{
                  opacity: 0.9,
                }}
              >
                <Icon
                  as={LuPencil}
                  mr="5px"
                  boxSize="13px"
                />
                Edit
              </Button>
            </HStack>
          </Flex>

          {/* =================================================
              PRIEST SUMMARY
          ================================================= */}

          <Box
            border="1px solid #E0E5EC"
            borderRadius="7px"
            bg="#FFFFFF"
            mb="6px"
            overflow="hidden"
          >
            <Flex
              minH={{
                base: "auto",
                lg: "100px",
              }}
              align="stretch"
              direction={{
                base: "column",
                lg: "row",
              }}
            >
              {/* PROFILE */}

              <Box
                flex="1.65"
                px={{
                  base: "14px",
                  md: "16px",
                }}
                py="8px"
                display="flex"
                alignItems="center"
              >
                <HStack
                  gap={{
                    base: "14px",
                    md: "16px",
                  }}
                  align="center"
                >
                  {priestImage ? (
                    <Image
                      src={priestImage}
                      boxSize={{
                        base: "60px",
                        md: "68px",
                      }}
                      borderRadius="full"
                      objectFit="cover"
                      border="1px solid #E4E7EC"
                      flexShrink={0}
                    />
                  ) : (
                    <Box
                      boxSize={{
                        base: "60px",
                        md: "68px",
                      }}
                      borderRadius="full"
                      bg="#FFF1F4"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon
                        as={LuUserRound}
                        boxSize="28px"
                        color={PRIMARY_MAROON}
                      />
                    </Box>
                  )}

                  <Box>
                    <Heading
                      fontSize={{
                        base: "16px",
                        md: "18px",
                      }}
                      lineHeight="20px"
                      fontWeight="700"
                      color={COLORS.text}
                      mb="3px"
                    >
                      {priest.name ||
                        "Unnamed Priest"}
                    </Heading>

                    <HStack
                      gap="7px"
                      flexWrap="wrap"
                      fontSize="10px"
                    >
                      <HStack gap="4px">
                        <Icon
                          as={LuFileText}
                          boxSize="12px"
                          color={PRIMARY_MAROON}
                        />

                        <Text
                          color={COLORS.secondary}
                        >
                          {priestId}
                        </Text>
                      </HStack>

                      <Text color="#98A2B3">
                        •
                      </Text>

                      <HStack gap="4px">
                        <Icon
                          as={LuMapPin}
                          boxSize="12px"
                          color={PRIMARY_MAROON}
                        />

                        <Text
                          color={COLORS.secondary}
                        >
                          {city && state
                            ? `${city}, ${state}`
                            : city ||
                              state ||
                              "-"}
                        </Text>
                      </HStack>
                    </HStack>

                    <HStack
                      mt="4px"
                      gap="5px"
                    >
                      <Badge
                        bg="#F2F4F7"
                        color="#52627A"
                        borderRadius="4px"
                        px="7px"
                        py="2px"
                        fontSize="9px"
                        fontWeight="600"
                      >
                        {designation}
                      </Badge>

                      <Badge
                        bg={
                          active
                            ? "#EAF7ED"
                            : "#F2F4F7"
                        }
                        color={
                          active
                            ? COLORS.green
                            : "#52627A"
                        }
                        borderRadius="4px"
                        px="7px"
                        py="2px"
                        fontSize="9px"
                        fontWeight="600"
                      >
                        {active
                          ? "Serving"
                          : "Previous"}
                      </Badge>
                    </HStack>
                  </Box>
                </HStack>
              </Box>

              {/* FAMILY */}

              <Box
                flex="0.8"
                borderLeft={{
                  base: "none",
                  lg: "1px solid #E1E6ED",
                }}
                borderTop={{
                  base: "1px solid #E1E6ED",
                  lg: "none",
                }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="12px"
                py="6px"
              >
                <VStack gap="3px">
                  <Icon
                    as={LuUsersRound}
                    boxSize="18px"
                    color={PRIMARY_MAROON}
                  />

                  <Text
                    fontSize="10px"
                    fontWeight="600"
                    color={COLORS.text}
                    textAlign="center"
                  >
                    {familyName} Family
                  </Text>
                </VStack>
              </Box>

              {/* PHONE */}

              <Box
                flex="0.85"
                borderLeft={{
                  base: "none",
                  lg: "1px solid #E1E6ED",
                }}
                borderTop={{
                  base: "1px solid #E1E6ED",
                  lg: "none",
                }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="12px"
                py="6px"
              >
                <VStack gap="3px">
                  <Icon
                    as={LuPhone}
                    boxSize="18px"
                    color={PRIMARY_MAROON}
                  />

                  <Text
                    fontSize="10px"
                    fontWeight="600"
                    color={COLORS.text}
                    textAlign="center"
                  >
                    {priest.phone_number ||
                      "-"}
                  </Text>
                </VStack>
              </Box>

              {/* SERVING */}

              <Box
                flex="0.95"
                borderLeft={{
                  base: "none",
                  lg: "1px solid #E1E6ED",
                }}
                borderTop={{
                  base: "1px solid #E1E6ED",
                  lg: "none",
                }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="12px"
                py="6px"
              >
                <VStack gap="3px">
                  <Icon
                    as={LuCalendarDays}
                    boxSize="18px"
                    color={PRIMARY_MAROON}
                  />

                  <Text
                    fontSize="10px"
                    fontWeight="600"
                    color={COLORS.text}
                    textAlign="center"
                  >
                    {formatDate(dateFrom)}
                    {" — "}
                    {active
                      ? "Present"
                      : formatDate(dateTo)}
                  </Text>
                </VStack>
              </Box>
            </Flex>
          </Box>

          {/* =================================================
              TABS
          ================================================= */}

          <Tabs.Root
            value={activeTab}
            onValueChange={(details) =>
              setActiveTab(details.value)
            }
            variant="line"
          >
            <Tabs.List
              borderBottom="1px solid #E1E6ED"
              mb="8px"
            >
              <Tabs.Trigger
                value="overview"
                px="16px"
                py="6px"
                fontSize="12px"
                color={COLORS.secondary}
                _selected={{
                  color: PRIMARY_MAROON,
                  borderColor:
                    PRIMARY_MAROON,
                  fontWeight: "600",
                }}
              >
                Overview
              </Tabs.Trigger>

              <Tabs.Trigger
                value="service"
                px="16px"
                py="6px"
                fontSize="12px"
                color={COLORS.secondary}
                _selected={{
                  color: PRIMARY_MAROON,
                  borderColor:
                    PRIMARY_MAROON,
                  fontWeight: "600",
                }}
              >
                Service History
              </Tabs.Trigger>

              <Tabs.Trigger
                value="activity"
                px="16px"
                py="6px"
                fontSize="12px"
                color={COLORS.secondary}
                _selected={{
                  color: PRIMARY_MAROON,
                  borderColor:
                    PRIMARY_MAROON,
                  fontWeight: "600",
                }}
              >
                Record Activity
              </Tabs.Trigger>
            </Tabs.List>

            {/* =================================================
                OVERVIEW
            ================================================= */}

            <Tabs.Content value="overview">
              <SimpleGrid
                columns={{
                  base: 1,
                  lg: 2,
                }}
                gap="10px"
              >
                {/* PERSONAL INFORMATION */}

                <SectionCard
                  title="Personal Information"
                  icon={LuUserRound}
                  minH="130px"
                >
                  <VStack
                    align="stretch"
                    gap="3px"
                  >
                    <InfoRow
                      label="Priest Name"
                      value={priest.name}
                    />

                    <InfoRow
                      label="Family Name"
                      value={familyName}
                    />

                    <InfoRow
                      label="Designation"
                      value={designation}
                    />

                    <InfoRow
                      label="Priest ID"
                      value={priestId}
                    />

                    <InfoRow
                      label="Phone Number"
                      value={
                        priest.phone_number
                      }
                    />
                  </VStack>
                </SectionCard>

                {/* ADDRESS */}

                <SectionCard
                  title="Address"
                  icon={LuMapPin}
                  minH="130px"
                >
                  <Box
                    position="relative"
                    minH="110px"
                    overflow="hidden"
                  >
                    {/* ADDRESS DETAILS */}
                    <Box
                      position="relative"
                      zIndex={2}
                      width={{
                        base: "100%",
                        md: "55%",
                        lg: "60%",
                      }}
                      pr="12px"
                    >
                      <VStack
                        align="stretch"
                        gap="2px"
                      >
                        <InfoRow
                          label="Address Line 1"
                          value={addressLine1}
                        />

                        <InfoRow
                          label="Address Line 2"
                          value={addressLine2 || "-"}
                        />

                        <InfoRow
                          label="City"
                          value={city}
                        />

                        <InfoRow
                          label="State & Postal Code"
                          value={
                            state && postalCode
                              ? `${state} — ${postalCode}`
                              : state || postalCode || "-"
                          }
                        />

                        <InfoRow
                          label="Country"
                          value={country}
                        />
                      </VStack>
                    </Box>

                    {/* CHURCH IMAGE */}
                    <Box
                      position="absolute"
                      right="0"
                      bottom="0"
                      width={{
                        base: "0",
                        md: "45%",
                        lg: "40%",
                      }}
                      height="110px"
                      display={{
                        base: "none",
                        md: "flex",
                      }}
                      alignItems="flex-end"
                      justifyContent="flex-end"
                      pointerEvents="none"
                      overflow="hidden"
                    >
                      <Image
                        src={logoImage}
                        alt="Church illustration"
                        width="120%"
                        height="140%"
                        objectFit="contain"
                        objectPosition="right bottom"
                      />
                    </Box>
                  </Box>
                </SectionCard>

                {/* SERVICE INFORMATION */}

                <SectionCard
                  title="Service Information"
                  icon={LuCalendarDays}
                  minH="120px"
                >
                  <VStack
                    align="stretch"
                    gap="3px"
                  >
                    <InfoRow
                      label="Serving From"
                      value={formatDate(
                        dateFrom
                      )}
                    />

                    <InfoRow
                      label="Serving To"
                      value={
                        active
                          ? "Currently Serving"
                          : formatDate(dateTo)
                      }
                    />

                    <InfoRow
                      label="Duration"
                      value={duration}
                    />

                    <Flex
                      align="center"
                      gap={{
                        base: "8px",
                        md: "16px",
                      }}
                      minH="20px"
                    >
                      <Text
                        fontSize="11px"
                        fontWeight="500"
                        color={COLORS.text}
                        flex={{
                          base: "0 0 100px",
                          sm: "0 0 120px",
                          md: "0 0 150px",
                          lg: "0 0 160px",
                        }}
                      >
                        Status
                      </Text>

                      <Badge
                        bg={
                          active
                            ? "#EAF7ED"
                            : "#F2F4F7"
                        }
                        color={
                          active
                            ? COLORS.green
                            : "#52627A"
                        }
                        borderRadius="4px"
                        px="6px"
                        py="2px"
                        fontSize="9px"
                      >
                        {active
                          ? "Active"
                          : "Previous"}
                      </Badge>
                    </Flex>
                  </VStack>
                </SectionCard>

                {/* RECORD INFORMATION */}

                <SectionCard
                  title="Record Information"
                  icon={LuFileText}
                  minH="120px"
                >
                  <VStack
                    align="stretch"
                    gap="3px"
                  >
                    <InfoRow
                      label="Created"
                      value={formatDate(
                        priest.created_at ||
                          priest.created
                      )}
                    />

                    <InfoRow
                      label="Last Updated"
                      value={formatDate(
                        priest.updated_at ||
                          priest.updated ||
                          priest.last_updated
                      )}
                    />

                    <InfoRow
                      label="Updated By"
                      value={
                        priest.updated_by_name ||
                        priest.updated_by ||
                        "Parish Admin"
                      }
                    />
                  </VStack>
                </SectionCard>
              </SimpleGrid>
            </Tabs.Content>

            {/* =================================================
                SERVICE HISTORY
            ================================================= */}

            <Tabs.Content value="service">
              <SectionCard
                title="Service History"
                icon={LuCalendarDays}
              >
                <Box
                  border="1px solid #E0E5EC"
                  borderRadius="6px"
                  p="10px"
                >
                  <HStack
                    align="start"
                    gap="10px"
                  >
                    <Box
                      boxSize="32px"
                      borderRadius="full"
                      bg="#FFF1F4"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon
                        as={LuCalendarDays}
                        boxSize="14px"
                        color={PRIMARY_MAROON}
                      />
                    </Box>

                    <Box>
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={COLORS.text}
                      >
                        {designation}
                      </Text>

                      <Text
                        fontSize="11px"
                        color={
                          COLORS.secondary
                        }
                        mt="2px"
                      >
                        {formatDate(dateFrom)}
                        {" - "}
                        {active
                          ? "Present"
                          : formatDate(dateTo)}
                      </Text>

                      <Badge
                        mt="4px"
                        bg={
                          active
                            ? "#EAF7ED"
                            : "#F2F4F7"
                        }
                        color={
                          active
                            ? COLORS.green
                            : "#52627A"
                        }
                        borderRadius="4px"
                        px="6px"
                        py="2px"
                        fontSize="9px"
                      >
                        {active
                          ? "Serving"
                          : "Previous"}
                      </Badge>
                    </Box>
                  </HStack>
                </Box>
              </SectionCard>
            </Tabs.Content>

            {/* =================================================
                RECORD ACTIVITY
            ================================================= */}

            <Tabs.Content value="activity">
              <SectionCard
                title="Record Activity"
                icon={LuFileText}
              >
                <VStack
                  align="stretch"
                  gap="3px"
                >
                  <InfoRow
                    label="Record Created"
                    value={formatDate(
                      priest.created_at ||
                        priest.created
                    )}
                  />

                  <InfoRow
                    label="Last Updated"
                    value={formatDate(
                      priest.updated_at ||
                        priest.updated ||
                        priest.last_updated
                    )}
                  />

                  <InfoRow
                    label="Updated By"
                    value={
                      priest.updated_by_name ||
                      priest.updated_by ||
                      "Parish Admin"
                    }
                  />
                </VStack>
              </SectionCard>
            </Tabs.Content>
          </Tabs.Root>
        </Container>
      </Box>

      <Footer />
    </>
  );
};

export default ViewPriestPage;