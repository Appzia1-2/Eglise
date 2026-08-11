import React, { useEffect, useState } from "react";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Circle,
  Flex,
  Skeleton,
  Progress,
  Badge,
  Button,
  Image,
} from "@chakra-ui/react";

import {
  LuChurch,
  LuMapPin,
  LuCircleCheck,
  LuUsers,
  LuPencil,
  LuHouse,
  LuCreditCard,
  LuSettings,
  LuEye,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { getChurchDashboard } from "../api/churchServices";


// =========================================================
// CONSTANTS
// =========================================================

const PRIMARY_MAROON = "var(--primary-maroon)";
const BORDER_COLOR = "#E5E7EB";


// =========================================================
// MEDIA URL
// =========================================================

const getMediaUrl = (url) => {

  if (!url) {
    return null;
  }

  // Convert to string
  const value = String(url).trim();

  if (!value) {
    return null;
  }

  // Already complete URL
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  // Backend URL
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";

  const cleanBase = apiBase.replace(/\/+$/, "");

  const cleanUrl = value.replace(/^\/+/, "");

  return `${cleanBase}/${cleanUrl}`;
};


// =========================================================
// FORMAT DATE
// =========================================================

const formatDate = (date, options = {}) => {

  if (!date) {
    return "N/A";
  }

  try {

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      options
    );

  } catch {

    return "N/A";
  }
};


// =========================================================
// SECTION CARD
// =========================================================

const SectionCard = ({
  title,
  icon,
  children,
  action,
}) => {

  return (

    <Box
      border="1px solid"
      borderColor={BORDER_COLOR}
      borderRadius="9px"
      bg="white"
      overflow="hidden"
    >

      {/* HEADER */}

      <Flex
        px={{ base: 4, md: 5 }}
        py={3}
        align="center"
        justify="space-between"
        minH="58px"
      >

        <HStack gap={3}>

          <Circle
            size="34px"
            bg="rgba(123, 13, 30, 0.08)"
            color={PRIMARY_MAROON}
          >

            <Icon
              as={icon}
              boxSize={4}
            />

          </Circle>

          <Heading
            size="md"
            color={PRIMARY_MAROON}
            fontWeight="700"
          >
            {title}
          </Heading>

        </HStack>

        {action}

      </Flex>


      {/* CONTENT */}

      <Box
        px={{ base: 4, md: 5 }}
        pb={4}
      >

        {children}

      </Box>

    </Box>

  );
};


// =========================================================
// DETAIL ROW
// =========================================================

const DetailRow = ({
  label,
  value,
}) => {

  return (

    <Flex
      minH="37px"
      align="center"
      borderBottom="1px solid"
      borderColor="#EEEEEE"
      _last={{
        borderBottom: "none",
      }}
    >

      <Text
        width={{
          base: "42%",
          md: "30%",
        }}
        flexShrink={0}
        fontSize="sm"
        color="#171717"
        fontWeight="500"
      >
        {label}
      </Text>

      <Text
        flex="1"
        fontSize="sm"
        color="#5F6368"
        fontWeight="400"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {value || "N/A"}
      </Text>

    </Flex>

  );
};


// =========================================================
// ADMIN DETAIL
// =========================================================

const AdminDetail = ({
  label,
  value,
  isLast = false,
}) => {

  return (

    <Box
      textAlign="center"
      px={{ base: 2, md: 4 }}
      position="relative"
      borderRight={
        isLast
          ? "none"
          : {
              base: "none",
              md: "1px solid #DDDDDD",
            }
      }
    >

      <Text
        fontSize="xs"
        color="#333333"
        mb={1}
      >
        {label}
      </Text>

      <Text
        fontSize="sm"
        fontWeight="600"
        color="#111111"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        {value || "N/A"}
      </Text>

    </Box>

  );
};


// =========================================================
// CHURCH INFO PAGE
// =========================================================

const ChurchInfoPage = () => {

  const [data, setData] = useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [logoError, setLogoError] =
    useState(false);


  // =======================================================
  // FETCH DATA
  // =======================================================

  useEffect(() => {

    const fetchData = async () => {

      try {

        const response =
          await getChurchDashboard();

        console.log(
          "================================="
        );

        console.log(
          "CHURCH DASHBOARD RESPONSE",
          response
        );

        console.log(
          "CHURCH DATA",
          response?.data?.church
        );

        console.log(
          "LOGO FROM API",
          response?.data?.church?.logo
        );

        console.log(
          "MEMBER DATA",
          response?.data?.members
        );

        console.log(
          "================================="
        );

        setData(
          response?.data || {}
        );

      } catch (error) {

        console.error(
          "Error fetching church information:",
          error
        );

        setData({});

      } finally {

        setIsLoading(false);

      }

    };

    fetchData();

  }, []);


  // =======================================================
  // LOADING
  // =======================================================

  if (isLoading) {

    return (

      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >

        <Navbar />

        <Container
          maxW="container.xl"
          flex="1"
          py={4}
        >

          <VStack
            gap={4}
            align="stretch"
          >

            <Skeleton
              height="48px"
              borderRadius="8px"
            />

            <Skeleton
              height="105px"
              borderRadius="10px"
            />

            <SimpleGrid
              columns={{
                base: 1,
                lg: 2,
              }}
              gap={4}
            >

              <Skeleton
                height="400px"
                borderRadius="10px"
              />

              <VStack
                gap={4}
                align="stretch"
              >

                <Skeleton
                  height="235px"
                  borderRadius="10px"
                />

                <Skeleton
                  height="160px"
                  borderRadius="10px"
                />

              </VStack>

            </SimpleGrid>

            <Skeleton
              height="105px"
              borderRadius="10px"
            />

          </VStack>

        </Container>

        <Footer />

      </Box>

    );
  }


  // =======================================================
  // SAFE DATA
  // =======================================================

  const church =
    data?.church || {};

  const subscription =
    data?.subscription || {};

  const members =
    data?.members || {};


  // =======================================================
  // CHURCH INFORMATION
  // =======================================================

  const churchName =
    church?.name ||
    church?.church_name ||
    "Church Name";

  const churchCode =
    church?.code ||
    church?.church_code ||
    "N/A";

  const diocese =
    church?.diocese ||
    church?.diocese_name ||
    "N/A";

  const city =
    church?.city ||
    church?.location ||
    "N/A";

  const phone =
    church?.phone_number ||
    church?.phone ||
    "N/A";

  const email =
    church?.email ||
    church?.official_email ||
    "N/A";

  const address =
    church?.full_address ||
    church?.address ||
    "N/A";


  // =======================================================
  // ESTABLISHED YEAR
  // =======================================================

  const establishedYear =
    church?.established_year ??
    church?.establishedYear ??
    church?.establishment_year ??
    church?.establishmentYear ??
    "N/A";


  // =======================================================
  // ADMINISTRATIVE DETAILS
  // =======================================================

  const registrationNumber =
    church?.registration_number ||
    church?.registration_no ||
    church?.reg_number ||
    "N/A";

  const financialYear =
    church?.financial_year ||
    church?.financial_year_name ||
    "N/A";

  const currency =
    church?.currency ||
    church?.default_currency ||
    "INR (₹)";

  const timezone =
    church?.timezone ||
    "Asia/Kolkata";


  // =======================================================
  // LOGO
  // =======================================================

  const churchLogo =
    church?.logo ||
    church?.logo_url ||
    church?.image ||
    church?.image_url ||
    null;

  const logoUrl =
    getMediaUrl(churchLogo);


  console.log(
    "FINAL LOGO URL:",
    logoUrl
  );


  // =======================================================
  // SUBSCRIPTION
  // =======================================================

  const packageName =
    subscription?.package_name ||
    subscription?.package ||
    subscription?.plan ||
    subscription?.package_title ||
    "Standard";

  const billingCycle =
    subscription?.billing_cycle ||
    subscription?.billingCycle ||
    "Monthly";

  const memberLimit =
    Number(
      subscription?.allowed_limit ??
      subscription?.member_limit ??
      subscription?.capacity ??
      members?.allowed_limit ??
      0
    );

  const subscribedOn =
    subscription?.start_date ||
    subscription?.subscribed_on ||
    subscription?.created_at ||
    null;

  const renewalDate =
    subscription?.end_date ||
    subscription?.renewal_date ||
    subscription?.renewalDate ||
    null;


  // =======================================================
  // SUBSCRIPTION STATUS
  // =======================================================

  let subscriptionStatus = "Active";

  if (subscription?.status) {

    subscriptionStatus =
      subscription.status;

  } else if (subscription?.payment_status) {

    subscriptionStatus =
      subscription.payment_status;

  } else if (
    subscription?.is_active === false
  ) {

    subscriptionStatus =
      "Inactive";

  }


  // =======================================================
  // MEMBERS
  // =======================================================

  const currentMembers =
    Number(
      members?.current_count ??
      members?.active_count ??
      members?.count ??
      0
    );

  const allowedMembers =
    Number(
      memberLimit || 0
    );

  const memberPercentage =
    allowedMembers > 0
      ? Math.min(
          (currentMembers /
            allowedMembers) *
            100,
          100
        )
      : 0;

  const remainingMembers =
    members?.remaining != null
      ? Number(members.remaining)
      : Math.max(
          allowedMembers -
            currentMembers,
          0
        );


  // =======================================================
  // RETURN
  // =======================================================

  return (

    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >

      <Navbar />


      {/* ===================================================
          MAIN
      =================================================== */}

      <Box
        flex="1"
        overflow="hidden"
      >

        <Container
          maxW="container.xl"
          py={{
            base: 3,
            md: 4,
          }}
        >


          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <Flex
            justify="space-between"
            align="center"
            mb={3}
            gap={3}
          >

            <HStack gap={3}>

              <Circle
                size="44px"
                border="1px solid"
                borderColor="#E1E6EC"
                bg="white"
                color={PRIMARY_MAROON}
                flexShrink={0}
              >

                <Icon
                  as={LuHouse}
                  boxSize={5}
                />

              </Circle>


              <Box>

                <Heading
                  size={{
                    base: "md",
                    md: "lg",
                  }}
                  color={PRIMARY_MAROON}
                  fontWeight="700"
                  lineHeight="1.2"
                >
                  Church Information
                </Heading>

                <Text
                  fontSize="xs"
                  color="#666666"
                  mt={1}
                >
                  View and manage your church
                  profile and subscription
                </Text>

              </Box>

            </HStack>


            <Button
              variant="outline"
              borderColor={PRIMARY_MAROON}
              color={PRIMARY_MAROON}
              borderRadius="6px"
              size="sm"
              px={4}
              h="38px"
              fontWeight="600"
              flexShrink={0}
              _hover={{
                bg: "rgba(123,13,30,0.05)",
              }}
            >

              <Icon
                as={LuPencil}
                mr={2}
              />

              Edit Church Info

            </Button>

          </Flex>


          {/* =================================================
              CHURCH SUMMARY
          ================================================= */}

          <Box
            border="1px solid"
            borderColor={BORDER_COLOR}
            borderRadius="9px"
            px={{
              base: 4,
              md: 6,
            }}
            py={3}
            mb={3}
            bg="white"
          >

            <HStack
              gap={4}
              align="center"
            >


              {/* =================================================
                  LOGO
              ================================================= */}

              <Box
                width={{
                  base: "64px",
                  md: "78px",
                }}
                height={{
                  base: "64px",
                  md: "78px",
                }}
                flexShrink={0}
                border="1px solid"
                borderColor={PRIMARY_MAROON}
                borderRadius="50%"
                bg="white"
                overflow="hidden"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >

                {logoUrl && !logoError ? (

                  <Image
                    src={logoUrl}
                    alt={`${churchName} logo`}
                    width="100%"
                    height="100%"
                    objectFit="contain"
                    p={1}
                    display="block"
                    onError={(event) => {

                      console.error(
                        "================================="
                      );

                      console.error(
                        "CHURCH LOGO FAILED"
                      );

                      console.error(
                        "URL:",
                        event.currentTarget.src
                      );

                      console.error(
                        "API LOGO:",
                        churchLogo
                      );

                      console.error(
                        "================================="
                      );

                      setLogoError(true);

                    }}
                    onLoad={() => {

                      console.log(
                        "CHURCH LOGO LOADED:",
                        logoUrl
                      );

                    }}
                  />

                ) : (

                  <Icon
                    as={LuChurch}
                    boxSize={{
                      base: 7,
                      md: 9,
                    }}
                    color={PRIMARY_MAROON}
                  />

                )}

              </Box>


              {/* =================================================
                  CHURCH NAME
              ================================================= */}

              <Box
                minW={0}
              >

                <Heading
                  size={{
                    base: "lg",
                    md: "xl",
                  }}
                  color="#111111"
                  fontWeight="700"
                  lineHeight="1.15"
                  truncate
                >
                  {churchName}
                </Heading>


                <HStack
                  gap={3}
                  mt={1}
                  flexWrap="wrap"
                >

                  <Text
                    color="#555555"
                    fontSize="sm"
                    fontWeight="500"
                  >
                    {churchCode}
                  </Text>


                  <Badge
                    colorPalette="green"
                    variant="subtle"
                    borderRadius="5px"
                    px={2}
                    py="2px"
                    fontSize="xs"
                  >

                    <Icon
                      as={LuCircleCheck}
                      mr={1}
                      boxSize={3}
                    />

                    {subscriptionStatus}

                  </Badge>

                </HStack>


                <HStack
                  gap={2}
                  mt={1}
                  color="#666666"
                  fontSize="xs"
                >

                  <Icon
                    as={LuMapPin}
                    boxSize={3.5}
                  />

                  <Text truncate>

                    {diocese}

                    {city &&
                    city !== "N/A"
                      ? ` • ${city}`
                      : ""}

                  </Text>

                </HStack>

              </Box>

            </HStack>

          </Box>


          {/* =================================================
              TWO COLUMN CONTENT
          ================================================= */}

          <SimpleGrid
            columns={{
              base: 1,
              lg: 2,
            }}
            gap={3}
            alignItems="stretch"
          >


            {/* =================================================
                GENERAL INFORMATION
            ================================================= */}

            <SectionCard
              title="General Information"
              icon={LuChurch}
              action={
                <Button
                  variant="ghost"
                  color={PRIMARY_MAROON}
                  size="xs"
                  fontWeight="600"
                  _hover={{
                    bg: "rgba(123,13,30,0.05)",
                  }}
                >

                  <Icon
                    as={LuPencil}
                    mr={1}
                    boxSize={3.5}
                  />

                  Edit

                </Button>
              }
            >

              <VStack
                align="stretch"
                gap={0}
              >

                <DetailRow
                  label="Church Name"
                  value={churchName}
                />

                <DetailRow
                  label="Church Code"
                  value={churchCode}
                />

                <DetailRow
                  label="Diocese"
                  value={diocese}
                />

                <DetailRow
                  label="Established Year"
                  value={establishedYear}
                />

                <DetailRow
                  label="Phone"
                  value={phone}
                />

                <DetailRow
                  label="Email"
                  value={email}
                />

                <DetailRow
                  label="Address"
                  value={address}
                />

              </VStack>

            </SectionCard>


            {/* =================================================
                RIGHT COLUMN
            ================================================= */}

            <VStack
              gap={3}
              align="stretch"
            >


              {/* =================================================
                  SUBSCRIPTION
              ================================================= */}

              <SectionCard
                title="Subscription Details"
                icon={LuCreditCard}
                action={
                  <Badge
                    colorPalette={
                      subscription?.is_active === false
                        ? "red"
                        : "green"
                    }
                    variant="subtle"
                    borderRadius="5px"
                    px={2}
                    py="2px"
                    fontSize="xs"
                  >

                    {subscriptionStatus}

                  </Badge>
                }
              >

                <VStack
                  align="stretch"
                  gap={0}
                >

                  <Flex
                    px={3}
                    py={2}
                    bg="#FFF0F4"
                    borderRadius="5px"
                    justify="space-between"
                    align="center"
                    mb={1}
                  >

                    <Text
                      fontSize="xs"
                      color={PRIMARY_MAROON}
                      fontWeight="500"
                    >
                      Current Plan
                    </Text>

                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color="#222222"
                    >
                      {packageName}
                    </Text>

                  </Flex>


                  <DetailRow
                    label="Member Limit"
                    value={
                      allowedMembers
                        ? `${allowedMembers.toLocaleString()} members`
                        : "N/A"
                    }
                  />


                  <DetailRow
                    label="Billing Cycle"
                    value={billingCycle}
                  />


                  <DetailRow
                    label="Subscribed On"
                    value={formatDate(
                      subscribedOn,
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  />


                  <DetailRow
                    label="Renewal Date"
                    value={formatDate(
                      renewalDate,
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  />


                  <Button
                    variant="outline"
                    borderColor={PRIMARY_MAROON}
                    color={PRIMARY_MAROON}
                    mt={2}
                    w="full"
                    h="34px"
                    size="sm"
                    borderRadius="5px"
                    fontWeight="600"
                    _hover={{
                      bg: "rgba(123,13,30,0.04)",
                    }}
                  >

                    <Icon
                      as={LuEye}
                      mr={2}
                    />

                    View Subscription

                  </Button>

                </VStack>

              </SectionCard>


              {/* =================================================
                  MEMBER CAPACITY
              ================================================= */}

              <SectionCard
                title="Member Capacity"
                icon={LuUsers}
              >

                <VStack
                  align="stretch"
                  gap={2}
                >

                  <Flex
                    justify="space-between"
                    align="flex-end"
                  >

                    <Box>

                      <Text
                        fontSize="2xl"
                        lineHeight="1"
                        fontWeight="700"
                        color="#111111"
                      >
                        {currentMembers.toLocaleString()}
                      </Text>

                      <Text
                        fontSize="xs"
                        color="#666666"
                        mt={1}
                      >
                        Active Members
                      </Text>

                    </Box>


                    <Box textAlign="right">

                      <Text
                        fontSize="2xl"
                        lineHeight="1"
                        fontWeight="700"
                        color="#111111"
                      >
                        {allowedMembers.toLocaleString()}
                      </Text>

                      <Text
                        fontSize="xs"
                        color="#666666"
                        mt={1}
                      >
                        Limit
                      </Text>

                    </Box>

                  </Flex>


                  <Progress.Root
                    value={memberPercentage}
                    size="sm"
                    borderRadius="full"
                  >

                    <Progress.Track
                      bg="#EEEEEE"
                      borderRadius="full"
                    >

                      <Progress.Range
                        bg={PRIMARY_MAROON}
                        borderRadius="full"
                      />

                    </Progress.Track>

                  </Progress.Root>


                  <Flex
                    justify="space-between"
                    align="center"
                    gap={2}
                    flexWrap="wrap"
                  >

                    <Text
                      fontSize="xs"
                      color="#666666"
                    >
                      {remainingMembers.toLocaleString()}{" "}
                      member slots available
                    </Text>


                    <Badge
                      colorPalette={
                        memberPercentage >= 100
                          ? "red"
                          : memberPercentage >= 80
                          ? "orange"
                          : "green"
                      }
                      variant="subtle"
                      borderRadius="5px"
                      px={2}
                      py="2px"
                      fontSize="xs"
                    >

                      {Math.round(
                        memberPercentage
                      )}
                      % Used

                    </Badge>


                    <Button
                      variant="ghost"
                      color={PRIMARY_MAROON}
                      size="xs"
                      fontWeight="600"
                      _hover={{
                        bg: "rgba(123,13,30,0.05)",
                      }}
                    >
                      View Members
                    </Button>

                  </Flex>

                </VStack>

              </SectionCard>

            </VStack>

          </SimpleGrid>


          {/* =================================================
              ADMINISTRATIVE DETAILS
          ================================================= */}

          <Box mt={3}>

            <SectionCard
              title="Administrative Details"
              icon={LuSettings}
            >

              <SimpleGrid
                columns={{
                  base: 2,
                  md: 4,
                }}
                gap={0}
                py={1}
              >

                <AdminDetail
                  label="Registration Number"
                  value={registrationNumber}
                />

                <AdminDetail
                  label="Financial Year"
                  value={financialYear}
                />

                <AdminDetail
                  label="Default Currency"
                  value={currency}
                />

                <AdminDetail
                  label="Timezone"
                  value={timezone}
                  isLast
                />

              </SimpleGrid>

            </SectionCard>

          </Box>

        </Container>

      </Box>


      <Footer />

    </Box>

  );
};

export default ChurchInfoPage;