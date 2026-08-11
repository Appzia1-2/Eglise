import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  Flex,
  Badge,
  Spinner,
  SimpleGrid,
  Icon,
  Circle,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuChurch,
  LuMapPin,
  LuMail,
  LuPhone,
  LuCalendar,
  LuBuilding2,
  LuUsers,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const ChurchView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [church, setChurch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const primaryMaroon = "#ae2050";

  useEffect(() => {
    if (location.state?.church) {
      setChurch(location.state.church);
      setIsLoading(false);
    } else if (id) {
      fetchChurch(id);
    } else {
      navigate("/admin/churches");
    }
  }, [location, id, navigate]);

  const fetchChurch = async (churchId) => {
    try {
      const response = await adminApi.getChurchDetail(churchId);
      setChurch(response.data);
    } catch (error) {
      console.error("Error fetching church:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load church details.",
        type: "error",
        duration: 5000,
      });
      navigate("/admin/churches");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex justify="center" align="center" minH="300px">
            <Spinner size="xl" color={primaryMaroon} />
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  if (!church) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Text>Church not found</Text>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={6}>
        {/* Breadcrumb */}
        <HStack spacing={2} mb={4}>
          <Text fontSize="xs" color="gray.400" fontWeight="600" letterSpacing="0.5px">
            Churches / {church.name}
          </Text>
        </HStack>

        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={1}>
            <Heading fontSize="2xl" fontWeight="800" color="#333">
              {church.name}
            </Heading>
            <HStack spacing={4}>
              <Badge
                colorScheme={church.is_active ? "green" : "red"}
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
              >
                {church.is_active ? "Active" : "Inactive"}
              </Badge>
              {church.diocese_name && (
                <Text fontSize="sm" color="gray.500">
                  Diocese: {church.diocese_name}
                </Text>
              )}
            </HStack>
          </VStack>
          <HStack>
            <Button
              variant="outline"
              leftIcon={<LuArrowLeft />}
              onClick={() => navigate("/admin/churches")}
            >
              Back
            </Button>
            <Button
              bg={primaryMaroon}
              color="white"
              _hover={{ bg: "#6b0f1a" }}
              leftIcon={<LuArrowLeft />}
              onClick={() => navigate(`/admin/churches/edit/${church.id}`, { state: { church } })}
            >
              Edit Church
            </Button>
          </HStack>
        </Flex>

        {/* Divider - Using Box with border instead */}
        <Box borderBottom="1px solid" borderColor="gray.200" mb={6} />

        {/* Church Details */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Left Column - Basic Info */}
          <Box>
            <Box
              bg="white"
              borderRadius="xl"
              border="1px solid"
              borderColor="gray.200"
              p={6}
              boxShadow="sm"
            >
              <Heading size="md" fontWeight="700" color="#333" mb={4}>
                Basic Information
              </Heading>
              <VStack align="stretch" spacing={4}>
                <DetailRow
                  icon={LuChurch}
                  label="Church Name"
                  value={church.name}
                />
                <DetailRow
                  icon={LuBuilding2}
                  label="Diocese"
                  value={church.diocese_name || "Not Assigned"}
                />
                <DetailRow
                  icon={LuCalendar}
                  label="Registered On"
                  value={new Date(church.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                />
                <DetailRow
                  icon={LuUsers}
                  label="Status"
                  value={church.is_active ? "Active" : "Inactive"}
                  valueColor={church.is_active ? "green.600" : "red.600"}
                />
              </VStack>
            </Box>
          </Box>

          {/* Right Column - Contact Info */}
          <Box>
            <Box
              bg="white"
              borderRadius="xl"
              border="1px solid"
              borderColor="gray.200"
              p={6}
              boxShadow="sm"
            >
              <Heading size="md" fontWeight="700" color="#333" mb={4}>
                Contact Information
              </Heading>
              <VStack align="stretch" spacing={4}>
                <DetailRow
                  icon={LuMail}
                  label="Email"
                  value={church.email}
                />
                <DetailRow
                  icon={LuPhone}
                  label="Phone"
                  value={church.phone_number || "Not provided"}
                />
                <DetailRow
                  icon={LuMapPin}
                  label="Address"
                  value={church.address || "Not provided"}
                />
                <DetailRow
                  icon={LuMapPin}
                  label="City"
                  value={church.city || "Not provided"}
                />
              </VStack>
            </Box>
          </Box>
        </SimpleGrid>

        {/* Footer Actions */}
        <Flex gap={4} mt={6} justify="flex-end">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/churches")}
          >
            Back to List
          </Button>
          <Button
            bg={primaryMaroon}
            color="white"
            _hover={{ bg: "#6b0f1a" }}
            onClick={() => navigate(`/admin/churches/edit/${church.id}`, { state: { church } })}
          >
            Edit Church
          </Button>
        </Flex>
      </Container>
    </AdminLayout>
  );
};

// Detail Row Component
const DetailRow = ({ icon, label, value, valueColor }) => (
  <HStack spacing={4} align="center">
    <Circle
      size="36px"
      bg="rgba(174, 32, 80, 0.08)"
      color={primaryMaroon}
      flexShrink={0}
    >
      <Icon as={icon} boxSize={4} />
    </Circle>
    <Box flex="1">
      <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="0.5px">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="500" color={valueColor || "#333"}>
        {value || "—"}
      </Text>
    </Box>
  </HStack>
);

export default ChurchView;