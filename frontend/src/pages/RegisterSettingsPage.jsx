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
  Badge,
  Button,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import {
  LuSettings,
  LuPlus,
  LuPencil,
  LuHash,
  LuFileText,
  LuCalendar,
  LuChevronRight,
  LuInfo,
} from "react-icons/lu";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GenericFormModal from "../components/GenericFormModal";
import {
  listRegisterSettings,
  createRegisterSettings,
  updateRegisterSettings,
} from "../api/registryServices";

const RegisterCard = ({ setting, onEdit }) => {
  const primaryMaroon = "var(--primary-maroon)";

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      p={6}
      border="1px solid"
      borderColor="gray.100"
      boxShadow="0 4px 20px -5px rgba(0,0,0,0.05)"
      transition="all 0.3s"
      _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
      position="relative"
      overflow="hidden"
    >
      <Flex justify="space-between" align="start" mb={6}>
        <HStack gap={4}>
          <Circle size="48px" bg="rgba(123,13,30,0.08)" color={primaryMaroon}>
            <Icon as={LuFileText} boxSize={6} />
          </Circle>
          <VStack align="start" gap={0}>
            <Heading size="md" color="gray.800" fontWeight="800">
              {setting.register_type}
            </Heading>
            <Text
              fontSize="xs"
              color="gray.400"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="widest"
            >
              Register Configuration
            </Text>
          </VStack>
        </HStack>
        <IconButton
          aria-label="Edit Setting"
          variant="ghost"
          color="gray.400"
          _hover={{ color: primaryMaroon, bg: "rgba(123,13,30,0.05)" }}
          onClick={() => onEdit(setting)}
          borderRadius="full"
        >
          <LuPencil />
        </IconButton>
      </Flex>

      <SimpleGrid columns={setting.register_type === "HEAD" ? 2 : 1} gap={6}>
        <VStack align="start" gap={1}>
          <HStack gap={2} mb={1}>
            <Icon as={LuHash} boxSize={3.5} color="gray.400" />
            <Text
              fontSize="xs"
              fontWeight="700"
              color="gray.400"
              textTransform="uppercase"
            >
              Register Setup
            </Text>
          </HStack>
          <Box
            bg="gray.50"
            p={3}
            borderRadius="xl"
            w="full"
            border="1px solid"
            borderColor="gray.100"
          >
            <VStack align="start" gap={2}>
              <HStack justify="space-between" w="full">
                <Text fontSize="xs" color="gray.500">
                  Prefix
                </Text>
                <Text fontSize="xs" fontWeight="800" color="gray.800">
                  {setting.register_prefix || "None"}
                </Text>
              </HStack>
              <HStack justify="space-between" w="full">
                <Text fontSize="xs" color="gray.500">
                  Next Number
                </Text>
                <Text fontSize="xs" fontWeight="800" color={primaryMaroon}>
                  {setting.next_register_number}
                </Text>
              </HStack>
              <HStack justify="space-between" w="full">
                <Text fontSize="xs" color="gray.500">
                  Padding
                </Text>
                <Text fontSize="xs" fontWeight="800" color="gray.800">
                  {setting.register_padding}
                </Text>
              </HStack>
              <HStack justify="space-between" w="full">
                <Text fontSize="xs" color="gray.500">
                  Suffix
                </Text>
                <Text fontSize="xs" fontWeight="800" color="gray.800">
                  {setting.register_suffix || "-"}
                </Text>
              </HStack>
            </VStack>
          </Box>
        </VStack>

        {setting.register_type === "HEAD" && (
          <VStack align="start" gap={1}>
            <HStack gap={2} mb={1}>
              <Icon as={LuFileText} boxSize={3.5} color="gray.400" />
              <Text
                fontSize="xs"
                fontWeight="700"
                color="gray.400"
                textTransform="uppercase"
              >
                Folio Setup
              </Text>
            </HStack>
            <Box
              bg="gray.50"
              p={3}
              borderRadius="xl"
              w="full"
              border="1px solid"
              borderColor="gray.100"
            >
              <VStack align="start" gap={2}>
                <HStack justify="space-between" w="full">
                  <Text fontSize="xs" color="gray.500">
                    Prefix
                  </Text>
                  <Text fontSize="xs" fontWeight="800" color="gray.800">
                    {setting.folio_prefix || "None"}
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="xs" color="gray.500">
                    Next Number
                  </Text>
                  <Text fontSize="xs" fontWeight="800" color={primaryMaroon}>
                    {setting.next_folio_number}
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="xs" color="gray.500">
                    Padding
                  </Text>
                  <Text fontSize="xs" fontWeight="800" color="gray.800">
                    {setting.folio_padding}
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="xs" color="gray.500">
                    Suffix
                  </Text>
                  <Text fontSize="xs" fontWeight="800" color="gray.800">
                    {setting.folio_suffix || "-"}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        )}
      </SimpleGrid>

      <Box mt={6} pt={6} borderTop="1px solid" borderColor="gray.50">
        <HStack justify="space-between">
          <HStack gap={3}>
            <Circle
              size="30px"
              bg={setting.use_financial_year ? "green.50" : "gray.50"}
              color={setting.use_financial_year ? "green.500" : "gray.400"}
            >
              <Icon as={LuCalendar} boxSize={3.5} />
            </Circle>
            <VStack align="start" gap={0}>
              <Text
                fontSize="xs"
                fontWeight="800"
                color={setting.use_financial_year ? "green.600" : "gray.500"}
              >
                {setting.use_financial_year
                  ? "Financial Year Active"
                  : "Standard Calendar"}
              </Text>
              {setting.use_financial_year && (
                <Text fontSize="10px" color="gray.400" fontWeight="600">
                  Year: {setting.financial_year} (
                  {setting.financial_year_format})
                </Text>
              )}
            </VStack>
          </HStack>
          <Badge
            colorPalette={setting.use_financial_year ? "green" : "gray"}
            variant="subtle"
            borderRadius="full"
            px={2}
            py={0.5}
            fontSize="10px"
          >
            {setting.use_financial_year ? "FY" : "CAL"}
          </Badge>
        </HStack>
      </Box>
    </Box>
  );
};

const RegisterSettingsPage = () => {
  const primaryMaroon = "var(--primary-maroon)";
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await listRegisterSettings();
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching register settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (setting = null) => {
    setSelectedSetting(setting);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSetting(null);
  };

  const handleSave = async (formData) => {
    try {
      setIsSaving(true);
      if (selectedSetting) {
        await updateRegisterSettings(selectedSetting.register_type, formData);
      } else {
        await createRegisterSettings(formData);
      }
      fetchSettings();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving register setting:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const fields = (formData) => [
    {
      name: "register_type",
      label: "Register Type",
      type: "select",
      required: true,
      options: ["BAPTISM", "MARRIAGE", "DEATH", "HEAD","CERTIFICATE"],
      disabledOnEdit: true,
    },
    { name: "register_prefix", label: "Register Prefix" },
    { name: "register_suffix", label: "Register Suffix" },
    {
      name: "next_register_number",
      label: "Next Register Number",
      type: "number",
      coerce: Number,
      required: true,
    },
    {
      name: "register_padding",
      label: "Register Padding",
      type: "number",
      coerce: Number,
      required: true,
    },
    ...(formData.register_type === "HEAD"
      ? [
          { name: "folio_prefix", label: "Folio Prefix" },
          { name: "folio_suffix", label: "Folio Suffix" },
          {
            name: "next_folio_number",
            label: "Next Folio Number",
            type: "number",
            coerce: Number,
            required: true,
          },
          {
            name: "folio_padding",
            label: "Folio Padding",
            type: "number",
            coerce: Number,
            required: true,
          },
        ]
      : []),
    {
      name: "use_financial_year",
      label: "Use Financial Year",
      type: "select",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
      coerce: (v) => v === "true" || v === true,
    },
    {
      name: "financial_year",
      label: "Financial Year",
      type: "number",
      coerce: (v) => (v ? Number(v) : null),
    },
    {
      name: "financial_year_start_month",
      label: "Start Month (1-12)",
      type: "number",
      coerce: (v) => (v ? Number(v) : null),
    },
    {
      name: "financial_year_end_month",
      label: "End Month (1-12)",
      type: "number",
      coerce: (v) => (v ? Number(v) : null),
    },
    { name: "financial_year_format", label: "FY Format (e.g. YYYY-YY)" },
  ];

  return (
    <Box bg="#F8F9FB" minH="100vh" display="flex" flexDirection="column">
      <Navbar />

      {/* Hero Section */}
      <Box
        bg={primaryMaroon}
        pt={16}
        pb={28}
        position="relative"
        overflow="hidden"
        backgroundImage="radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)"
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="flex-end">
            <VStack gap={4} align="start">
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
                SYSTEM PREFERENCES
              </Badge>
              <Box>
                <Heading
                  size="3xl"
                  color="white"
                  fontWeight="900"
                  letterSpacing="-0.04em"
                  mb={2}
                >
                  Register Settings
                </Heading>
                <Text color="whiteAlpha.800" fontWeight="600" fontSize="lg">
                  Configure prefixes, numbering, and financial periods for each
                  registry type.
                </Text>
              </Box>
            </VStack>
            <Button
              bg="white"
              color={primaryMaroon}
              px={6}
              borderRadius="full"
              fontWeight="800"
              fontSize="sm"
              boxShadow="xl"
              _hover={{ transform: "translateY(-2px)", bg: "gray.50" }}
              onClick={() => handleOpenModal()}
            >
              <LuPlus style={{ marginRight: "8px" }} />
              Add Configuration
            </Button>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" flex="1" mt="-14" mb={16}>
        {isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="350px" borderRadius="2xl" />
            ))}
          </SimpleGrid>
        ) : settings.length === 0 ? (
          <Box
            bg="white"
            p={16}
            borderRadius="2xl"
            textAlign="center"
            border="1px solid"
            borderColor="gray.100"
            boxShadow="sm"
          >
            <VStack gap={6}>
              <Circle size="80px" bg="gray.50" color="gray.300">
                <Icon as={LuSettings} boxSize={10} />
              </Circle>
              <VStack gap={2}>
                <Heading size="lg" color="gray.800">
                  No Register Settings Found
                </Heading>
                <Text color="gray.500" maxW="400px">
                  You haven't configured any register settings yet. Add your
                  first configuration to start using the registers.
                </Text>
              </VStack>
              <Button
                bg={primaryMaroon}
                color="white"
                px={8}
                borderRadius="full"
                onClick={() => handleOpenModal()}
              >
                Configure Registers Now
              </Button>
            </VStack>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8}>
            {settings.map((setting) => (
              <RegisterCard
                key={setting.id}
                setting={setting}
                onEdit={handleOpenModal}
              />
            ))}
          </SimpleGrid>
        )}
      </Container>

      <GenericFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        itemData={selectedSetting}
        isLoading={isSaving}
        title="Register Setting"
        fields={fields}
      />

      <Footer />
    </Box>
  );
};

export default RegisterSettingsPage;
