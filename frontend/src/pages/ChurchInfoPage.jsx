import React, { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import {
  LuChurch,
  LuMapPin,
  LuMail,
  LuPhone,
  LuCircleCheck,
  LuShieldCheck,
  LuUsers,
  LuCalendar,
  LuArrowUpRight,
} from "react-icons/lu";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getChurchDashboard } from "../api/churchServices";

const InfoCard = ({ title, children, icon }) => (
  <Box
    bg="white"
    p={8}
    borderRadius="2xl"
    border="1px solid"
    borderColor="gray.100"
    boxShadow="0 4px 20px -5px rgba(0,0,0,0.05)"
    position="relative"
    overflow="hidden"
    transition="all 0.3s"
    _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
  >
    <HStack gap={4} mb={8}>
      <Circle
        size="40px"
        bg="rgba(123,13,30,0.08)"
        color="var(--primary-maroon)"
      >
        <Icon as={icon} boxSize={5} />
      </Circle>
      <Heading
        size="md"
        color="gray.800"
        fontWeight="800"
        letterSpacing="tight"
      >
        {title}
      </Heading>
    </HStack>
    {children}
  </Box>
);

const DetailRow = ({ label, value, icon }) => (
  <HStack
    gap={5}
    py={4}
    borderBottom="1px solid"
    borderColor="gray.50"
    _last={{ borderBottom: "none" }}
    transition="background 0.2s"
    _hover={{ bg: "gray.25" }}
  >
    <Circle
      size="32px"
      bg="gray.50"
      color="gray.400"
      transition="all 0.2s"
      _hover={{ bg: "rgba(123,13,30,0.05)", color: "var(--primary-maroon)" }}
    >
      <Icon as={icon} boxSize={4} />
    </Circle>
    <Box flex="1">
      <Text
        fontSize="xs"
        fontWeight="700"
        color="gray.400"
        textTransform="uppercase"
        letterSpacing="widest"
        mb={1}
      >
        {label}
      </Text>
      <Text as="div" fontSize="md" fontWeight="700" color="gray.800">
        {value || "N/A"}
      </Text>
    </Box>
  </HStack>
);

const MetricCard = ({ label, value, limit, color, icon }) => {
  const percentage = (value / limit) * 100;
  const isCustomColor = color?.startsWith("var(") || color?.startsWith("#");

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.100"
      boxShadow="sm"
    >
      <HStack justify="space-between" mb={4}>
        <Circle
          size="40px"
          bg={isCustomColor ? "rgba(123,13,30,0.05)" : `${color}.50`}
          color={isCustomColor ? color : `${color}.500`}
        >
          <Icon as={icon} boxSize={5} />
        </Circle>
        <Badge
          colorPalette={isCustomColor ? "red" : color}
          variant="subtle"
          borderRadius="full"
          px={3}
        >
          {Math.round(percentage)}% Capacity
        </Badge>
      </HStack>
      <VStack align="start" gap={1} mb={4}>
        <Text fontSize="sm" fontWeight="600" color="gray.500">
          {label}
        </Text>
        <HStack align="baseline" gap={1}>
          <Text fontSize="3xl" fontWeight="800" color="gray.900">
            {value}
          </Text>
          <Text fontSize="sm" fontWeight="600" color="gray.400">
            / {limit}
          </Text>
        </HStack>
      </VStack>
      <Progress.Root
        value={percentage}
        colorPalette={isCustomColor ? "red" : color}
        size="sm"
        borderRadius="full"
      >
        <Progress.Track bg={isCustomColor ? "red.50" : `${color}.50`}>
          <Progress.Range
            borderRadius="full"
            bg={isCustomColor ? color : undefined}
          />
        </Progress.Track>
      </Progress.Root>
    </Box>
  );
};

const ChurchInfoPage = () => {
  const primaryMaroon = "var(--primary-maroon)";
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getChurchDashboard();
        setData(response.data);
      } catch (error) {
        console.error("Error fetching church info:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Box bg="gray.50" minH="100vh" display="flex" flexDirection="column">
        <Navbar />
        <Container maxW="container.xl" flex="1" py={12}>
          <Skeleton height="200px" borderRadius="3xl" mb={12} />
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={10}>
            <Skeleton height="500px" borderRadius="2xl" />
            <Skeleton height="500px" borderRadius="2xl" />
          </SimpleGrid>
        </Container>
        <Footer />
      </Box>
    );
  }

  const { church, subscription, members } = data || {};

  return (
    <Box bg="#F8F9FB" minH="100vh" display="flex" flexDirection="column">
      <Navbar />

      {/* Hero Section */}
      <Box
        bg={primaryMaroon}
        pt={20}
        pb={32}
        position="relative"
        overflow="hidden"
        backgroundImage="radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)"
      >
        <Container maxW="container.xl">
          <VStack gap={6} align="start">
            <Badge
              bg="rgba(255,255,255,0.15)"
              color="white"
              px={4}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="700"
              backdropFilter="blur(8px)"
              border="1px solid rgba(255,255,255,0.2)"
            >
              CHURCH CONFIGURATION
            </Badge>
            <Box>
              <Heading
                size="4xl"
                color="white"
                fontWeight="900"
                letterSpacing="-0.04em"
                mb={2}
              >
                {church?.name || "Church Profile"}
              </Heading>
              <HStack gap={6} color="whiteAlpha.800" fontWeight="600">
                <HStack gap={2}>
                  <Icon as={LuMapPin} />
                  <Text fontSize="lg">{church?.city || "Location N/A"}</Text>
                </HStack>
                <HStack gap={2}>
                  <Icon as={LuCircleCheck} color="green.300" />
                  <Text fontSize="lg">System Active</Text>
                </HStack>
              </HStack>
            </Box>
          </VStack>
        </Container>
      </Box>

      <Container maxW="container.xl" flex="1" mt="-20" mb={16}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={10} alignItems="start">
          {/* Left Column: General Info */}
          <VStack gap={10} align="stretch">
            <InfoCard title="General Information" icon={LuChurch}>
              <VStack align="stretch" gap={0}>
                <DetailRow
                  label="Church Name"
                  value={church?.name}
                  icon={LuChurch}
                />
                <DetailRow
                  label="Diocese"
                  value={church?.diocese}
                  icon={LuShieldCheck}
                />
                <DetailRow
                  label="City / Location"
                  value={church?.city}
                  icon={LuMapPin}
                />
                <DetailRow
                  label="Official Email"
                  value={church?.email}
                  icon={LuMail}
                />
                <DetailRow
                  label="Contact Number"
                  value={church?.phone}
                  icon={LuPhone}
                />
              </VStack>
            </InfoCard>

            <Box
              h="100px"
              bg="white"
              px={8}
              borderRadius="2xl"
              border="1px solid"
              borderColor="gray.100"
              backgroundImage={`linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url('https://www.transparenttextures.com/patterns/cubes.png')`}
              display="flex"
              alignItems="center"
            >
              <HStack gap={6} align="center" width="full">
                <Circle
                  size="50px"
                  bg="rgba(123,13,30,0.05)"
                  color={primaryMaroon}
                >
                  <Icon as={LuCalendar} boxSize={6} />
                </Circle>
                <VStack gap={0} align="start">
                  <Heading size="md" color="gray.800">
                    Need Assistance?
                  </Heading>
                  <Text color="gray.500" fontSize="sm">
                    Contact support for billing or plan upgrades
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </VStack>

          {/* Right Column: Subscription & Status */}
          <VStack gap={10} align="stretch">
            <InfoCard title="Subscription Details" icon={LuShieldCheck}>
              <VStack align="stretch" gap={6}>
                <Box
                  bg="gray.50"
                  p={6}
                  borderRadius="xl"
                  border="1px dashed"
                  borderColor="gray.200"
                >
                  <HStack justify="space-between" mb={4}>
                    <VStack align="start" gap={0}>
                      <Text
                        fontSize="xs"
                        fontWeight="700"
                        color="gray.400"
                        textTransform="uppercase"
                      >
                        Active Plan
                      </Text>
                      <Heading size="lg" color={primaryMaroon}>
                        {subscription?.package || "Standard"}
                      </Heading>
                    </VStack>
                    <Icon as={LuArrowUpRight} boxSize={8} color="gray.300" />
                  </HStack>
                </Box>

                <SimpleGrid columns={2} gap={8}>
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="700"
                      color="gray.400"
                      textTransform="uppercase"
                      mb={1}
                    >
                      Billing Cycle
                    </Text>
                    <Text fontWeight="800" fontSize="sm" color="gray.800">
                      {subscription?.billing_cycle || "Monthly"}
                    </Text>
                  </Box>
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="700"
                      color="gray.400"
                      textTransform="uppercase"
                      mb={1}
                    >
                      Renewal Date
                    </Text>
                    <Text fontWeight="800" fontSize="sm" color="gray.800">
                      {subscription?.start_date
                        ? new Date(subscription.start_date).toLocaleDateString()
                        : "N/A"}
                    </Text>
                  </Box>
                </SimpleGrid>

                {subscription?.update_required ? (
                  <Flex
                    bg="red.50"
                    p={4}
                    borderRadius="xl"
                    align="center"
                    gap={4}
                    border="1px solid"
                    borderColor="red.100"
                  >
                    <Circle
                      size="40px"
                      bg="white"
                      color="red.500"
                      boxShadow="sm"
                    >
                      <Icon as={LuCalendar} boxSize={5} />
                    </Circle>
                    <Box>
                      <Text fontWeight="800" color="red.700" fontSize="sm">
                        Update Required
                      </Text>
                      <Text fontSize="xs" color="red.600" fontWeight="600">
                        Please upgrade your plan to continue
                      </Text>
                    </Box>
                  </Flex>
                ) : (
                  <Flex
                    bg="green.50"
                    p={4}
                    borderRadius="xl"
                    align="center"
                    gap={4}
                    border="1px solid"
                    borderColor="green.100"
                  >
                    <Circle
                      size="40px"
                      bg="white"
                      color="green.500"
                      boxShadow="sm"
                    >
                      <Icon as={LuCircleCheck} boxSize={5} />
                    </Circle>
                    <Box>
                      <Text fontWeight="800" color="green.700" fontSize="sm">
                        Subscription Managed
                      </Text>
                      <Text fontSize="xs" color="green.600" fontWeight="600">
                        Your account is in good standing
                      </Text>
                    </Box>
                  </Flex>
                )}
              </VStack>
            </InfoCard>

            {/* <Box
              bg="white"
              p={8}
              borderRadius="2xl"
              border="1px solid"
              borderColor="gray.100"
              backgroundImage={`linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url('https://www.transparenttextures.com/patterns/cubes.png')`}
            >
              <VStack gap={4} align="center" textAlign="center">
                <Circle
                  size="60px"
                  bg="rgba(123,13,30,0.05)"
                  color={primaryMaroon}
                >
                  <Icon as={LuCalendar} boxSize={8} />
                </Circle>
                <VStack gap={1}>
                  <Heading size="md" color="gray.800">
                    Need Assistance?
                  </Heading>
                  <Text color="gray.500" fontSize="sm">
                    Contact support for billing or plan upgrades
                  </Text>
                </VStack>
              </VStack>
            </Box> */}

            {/* Quick Stats Grid */}
            <MetricCard
              label="Members Enrolled"
              value={members?.current_count}
              limit={members?.allowed_limit}
              color={primaryMaroon}
              icon={LuUsers}
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            />
          </VStack>
        </SimpleGrid>
      </Container>

      <Footer />
    </Box>
  );
};

export default ChurchInfoPage;
