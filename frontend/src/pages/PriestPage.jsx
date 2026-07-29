import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  HStack,
  VStack,
  Icon,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { LuUser, LuCalendar, LuClock } from "react-icons/lu";
import RegistryTable from "../components/RegistryTable";
import {
  listPriests,
  createPriest,
  updatePriest,
  deletePriest,
  listPriestsDropdown,
} from "../api/registryServices";

const DESIGNATION_OPTIONS = [
  { value: "MAIN", label: "Main Priest" },
  { value: "ASSISTANT", label: "Assistant Priest" },
];

const PriestPage = () => {
  const [dropdownData, setDropdownData] = useState([]);
  const [loading, setLoading] = useState(true);
  const primaryMaroon = "var(--primary-maroon)";

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const dRes = await listPriestsDropdown();
        console.log("Priests data:", dRes.data);
        setDropdownData(dRes.data || []);
      } catch (err) {
        console.error("Error fetching priest options:", err);
        setDropdownData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  // Separate current and upcoming priests
  const currentPriests = dropdownData.filter(p => p.status === 'CURRENT');
  const upcomingPriests = dropdownData.filter(p => p.status === 'UPCOMING');

  const priestFields = (formData) => [
    { name: "name", label: "Name", required: true },
    { name: "family_name", label: "Family Name" },
    { name: "phone_number", label: "Phone Number" },
    {
      name: "designation",
      label: "Designation",
      type: "select",
      required: true,
      options: DESIGNATION_OPTIONS,
    },
    {
      name: "date_from",
      label: "Serving From",
      type: "date",
      required: formData?.designation === "MAIN",
    },
    { name: "date_to", label: "Serving Until (leave blank if ongoing)", type: "date" },
    { name: "house_name", label: "House Name", required: true },
    { name: "address", label: "Address", type: "textarea", required: true },
  ];

  const priestColumns = [
    { header: "Designation", key: "designation_label" },
    { header: "House Name", key: "house_name" },
    { header: "Phone", key: "phone_number" },
    { header: "Serving From", key: "date_from" },
  ];

  const listPriestsEnriched = async () => {
    try {
      const res = await listPriests();
      const priests = res.data || [];

      const mapped = priests.map((p) => ({
        ...p,
        designation_label:
          DESIGNATION_OPTIONS.find((d) => d.value === p.designation)?.label ||
          p.designation ||
          "—",
      }));
      return { ...res, data: mapped };
    } catch (error) {
      console.error("Error fetching priests:", error);
      return listPriests();
    }
  };

  const PriestCard = ({ priest, isCurrent }) => {
    const name = priest.name;
    const designationRaw = priest.designation;
    const designationLabel = DESIGNATION_OPTIONS.find(d => d.value === designationRaw)?.label || "Designated Priest";
    const dateFrom = priest.date_from ? new Date(priest.date_from) : null;
    const dateTo = priest.date_to ? new Date(priest.date_to) : null;

    return (
      <HStack
        p={3}
        bg="white"
        borderRadius="lg"
        border="1px solid"
        borderColor={isCurrent ? "rgba(123, 13, 30, 0.1)" : "gray.100"}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{
          transform: "translateY(-2px)",
          boxShadow: "0 8px 15px -5px rgba(123, 13, 30, 0.1)",
          borderColor: "rgba(123, 13, 30, 0.2)",
          bg: "rgba(123, 13, 30, 0.01)",
        }}
        role="group"
        position="relative"
        borderLeft={isCurrent ? `4px solid ${primaryMaroon}` : "none"}
      >
        <Box
          p={2}
          bg={isCurrent ? "rgba(123, 13, 30, 0.05)" : "rgba(0, 0, 0, 0.03)"}
          borderRadius="md"
          transition="all 0.2s"
          _groupHover={{ bg: primaryMaroon, color: "white" }}
        >
          <Icon
            as={isCurrent ? LuUser : LuClock}
            fontSize="14px"
            color={isCurrent ? primaryMaroon : "gray.400"}
            _groupHover={{ color: "white" }}
          />
        </Box>
        <VStack align="start" spacing={0} flex={1}>
          <Text
            fontSize="13px"
            fontWeight="700"
            color="gray.700"
            noOfLines={1}
          >
            {name || "Unknown Priest"}
          </Text>
          <HStack spacing={2}>
            <Text
              fontSize="9px"
              fontWeight="600"
              color="gray.400"
              textTransform="uppercase"
              letterSpacing="0.05em"
            >
              {designationLabel}
            </Text>
            {dateFrom && (
              <Text
                fontSize="8px"
                color="gray.400"
                fontFamily="monospace"
              >
                {dateFrom.toLocaleDateString()}
                {dateTo && ` - ${dateTo.toLocaleDateString()}`}
                {!dateTo && " (Ongoing)"}
              </Text>
            )}
          </HStack>
        </VStack>
        <Badge
          colorScheme={isCurrent ? (designationRaw === "MAIN" ? "red" : "blue") : "gray"}
          size="sm"
          position="absolute"
          top={1}
          right={1}
          fontSize="8px"
        >
          {isCurrent ? (designationRaw === "MAIN" ? "Active Main" : "Active Asst.") : "Upcoming"}
        </Badge>
      </HStack>
    );
  };

  const QuickView = (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.100"
      boxShadow="0 4px 20px -5px rgba(0,0,0,0.05)"
      mb={6}
      position="relative"
      overflow="hidden"
    >
      <VStack align="stretch" spacing={5} position="relative" zIndex={1}>
        <HStack justify="space-between" gap={"10px"}>
          <VStack align="start" spacing={0}>
            <Heading
              size="sm"
              fontWeight="800"
              style={{
                background:
                  "linear-gradient(135deg, #7b0d1e 30%, #c0392b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Active Priest Panel
            </Heading>
            <Text fontSize="xs" color="gray.500" fontWeight="500">
              Currently serving priests
            </Text>
          </VStack>
          <Badge
            bg="rgba(123,13,30,0.08)"
            color={primaryMaroon}
            px={3}
            py={1}
            borderRadius="full"
            variant="subtle"
            fontSize="10px"
            fontWeight="bold"
          >
            {loading ? "..." : `${currentPriests.length} ACTIVE`}
          </Badge>
        </HStack>

        {loading ? (
          <Box textAlign="center" py={8}>
            <Spinner size="lg" color={primaryMaroon} />
            <Text fontSize="xs" color="gray.400" mt={2}>
              Loading priests...
            </Text>
          </Box>
        ) : (
          <>
            {/* Active Priests Section */}
            {currentPriests.length > 0 ? (
              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                spacing={4}
                gap={2}
              >
                {currentPriests.map((priest, index) => (
                  <PriestCard key={index} priest={priest} isCurrent={true} />
                ))}
              </SimpleGrid>
            ) : (
              <Text
                fontSize="xs"
                color="gray.400"
                textAlign="center"
                py={4}
              >
                No active priests currently serving.
              </Text>
            )}

            {/* Upcoming Priests Section */}
            {upcomingPriests.length > 0 && (
              <>
                <Box borderBottom="1px solid" borderColor="gray.200" my={2} />
                <Box>
                  <HStack spacing={2} mb={3}>
                    <Icon as={LuCalendar} color="gray.400" fontSize="14px" />
                    <Text fontSize="sm" fontWeight="600" color="gray.500">
                      Upcoming Priests
                    </Text>
                    <Badge
                      bg="gray.100"
                      color="gray.500"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontSize="9px"
                      fontWeight="bold"
                    >
                      {upcomingPriests.length}
                    </Badge>
                  </HStack>
                  <SimpleGrid
                    columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                    spacing={4}
                    gap={2}
                  >
                    {upcomingPriests.map((priest, index) => (
                      <PriestCard key={index} priest={priest} isCurrent={false} />
                    ))}
                  </SimpleGrid>
                </Box>
              </>
            )}
          </>
        )}
      </VStack>
    </Box>
  );

  return (
    <RegistryTable
      title="Priest Master"
      addLabel="Add Priest"
      nameKey="name"
      columns={priestColumns}
      emptyMessage="No priests found."
      listFn={listPriestsEnriched}
      createFn={createPriest}
      updateFn={updatePriest}
      deleteFn={deletePriest}
      fields={priestFields}
      topContent={QuickView}
      isMaster={true}
    />
  );
};

export default PriestPage;