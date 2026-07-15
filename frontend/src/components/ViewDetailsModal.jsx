import React, { useState, useEffect, useRef } from "react";
import { listMembersByHead, listRelationships } from "../api/registryServices";
import {
  Box,
  VStack,
  Text,
  Flex,
  Icon,
  SimpleGrid,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogPositioner,
  Button,
  HStack,
  Separator,
} from "@chakra-ui/react";
import {
  LuX,
  LuUser,
  LuMail,
  LuPhone,
  LuMapPin,
  LuChurch,
  LuCalendar,
  LuInfo,
  LuGraduationCap,
  LuBriefcase,
  LuHeart,
  LuPrinter,
} from "react-icons/lu";
import { useReactToPrint } from "react-to-print";

const SectionHeader = ({ icon, title, primaryMaroon }) => (
  <HStack
    spacing={2}
    mb={4}
    mt={6}
    align="center"
    className="print-section-header"
  >
    <Box
      p={1.5}
      bg="rgba(123, 13, 30, 0.08)"
      borderRadius="lg"
      color={primaryMaroon}
      className="print-header-icon"
    >
      <Icon as={icon} fontSize="16px" />
    </Box>
    <Text
      fontSize="xs"
      fontWeight="800"
      color={primaryMaroon}
      textTransform="uppercase"
      letterSpacing="0.1em"
    >
      {title}
    </Text>
    <Separator flex="1" borderColor="gray.100" className="print-separator" />
  </HStack>
);

const DetailField = ({ label, value, icon }) => (
  <VStack
    align="start"
    spacing={1}
    p={3}
    borderRadius="xl"
    bg="gray.50"
    border="1px solid"
    borderColor="gray.100"
    className="print-detail-field"
    transition="all 0.2s"
    _hover={{
      bg: "white",
      borderColor: "rgba(123, 13, 30, 0.2)",
      boxShadow: "sm",
    }}
  >
    <HStack spacing={1.5} color="gray.400">
      {icon && <Icon as={icon} fontSize="10px" />}
      <Text
        fontSize="10px"
        fontWeight="800"
        textTransform="uppercase"
        letterSpacing="0.05em"
      >
        {label}
      </Text>
    </HStack>
    <Text
      fontSize="sm"
      fontWeight="600"
      color="gray.700"
      noOfLines={2}
      className="print-detail-value"
    >
      {value}
    </Text>
  </VStack>
);

const ViewDetailsModal = ({ isOpen, onClose, itemData, title, fields }) => {
  const primaryMaroon = "var(--primary-maroon)";
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [relationships, setRelationships] = useState([]);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle:
      itemData?.name || itemData?.family_name || title || "Details",
    pageStyle: `
      @page {
        size: A4;
        margin: 8mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          background: white !important;
          font-size: 11px !important;
        }
        .print-container {
          padding: 0 !important;
          margin: 0 !important;
          box-shadow: none !important;
        }
        .print-hero {
          height: 40px !important;
        }
        .print-profile-summary {
          margin-top: -30px !important;
          padding-bottom: 10px !important;
          border-bottom: 1px solid #eee !important;
        }
        .print-profile-img-box {
          width: 70px !important;
          height: 70px !important;
          margin-bottom: 5px !important;
          border-radius: 12px !important;
        }
        .print-profile-img {
          width: 70px !important;
          height: 70px !important;
          border-radius: 10px !important;
        }
        .print-content-area {
          padding-left: 0 !important;
          padding-right: 0 !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
        .print-section-header {
          margin-top: 15px !important;
          margin-bottom: 8px !important;
          border-bottom: 2px solid #ae2050 !important;
          padding-bottom: 4px !important;
        }
        .print-header-icon {
          display: none !important;
        }
        .print-separator {
          display: none !important;
        }
        .print-detail-field {
          padding: 3px 8px !important;
          border-radius: 6px !important;
          background-color: transparent !important;
          border: 1px solid #f0f0f0 !important;
        }
        .print-detail-value {
          font-size: 10px !important;
        }
        .print-info-grid {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 8px !important;
        }
        .print-family-grid {
          gap: 8px !important;
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
        }
        .print-family-member {
          padding: 4px 8px !important;
          background-color: transparent !important;
          border: 1px solid #f0f0f0 !important;
        }  
        .print-member-details-box {
          margin-top: 0 !important;
          padding-top: 4px !important;
          gap: 2px !important;
        }
        .print-member-detail-item {
          font-size: 8.5px !important;
        }
        .print-member-separator {
          display: none !important;
        }
        .print-timestamp {
          display: flex !important;
          justify-content: flex-end;
          font-size: 8px !important;
          color: #888 !important;
          margin-bottom: 5px !important;
        }
        .print-footer {
          display: flex !important;
          justify-content: center;
          font-size: 8px !important;
          color: #888 !important;
          margin-top: 20px !important;
          padding-top: 10px !important;
          border-top: 1px solid #eee !important;
        }
      }
      .print-timestamp, .print-footer {
        display: none;
      }
    `,
  });

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const res = await listRelationships();
        setRelationships(res.data || []);
      } catch (err) {
        console.error("Error fetching relationships in modal:", err);
      }
    };
    if (isOpen) {
      fetchRelationships();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      if (isOpen && itemData?.is_family_head && itemData?.id) {
        setLoadingMembers(true);
        try {
          const res = await listMembersByHead(itemData.id);
          setFamilyMembers(res.data || []);
        } catch (err) {
          console.error("Error fetching family members in modal:", err);
        } finally {
          setLoadingMembers(false);
        }
      } else {
        setFamilyMembers([]);
      }
    };
    fetchFamilyMembers();
  }, [isOpen, itemData]);

  if (!itemData) return null;

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    return `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const renderValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") {
      return (
        value.name ||
        value.family_name ||
        value.ward_name ||
        value.designation_name ||
        JSON.stringify(value)
      );
    }
    return String(value);
  };

  // Categories mapping
  const personalKeys = [
    "gender",
    "relationship",
    "dob",
    "blood_group",
    "marital_status",
    "spouse_name",
    "father_name",
    "mother_name",
  ];
  const churchKeys = [
    "baptismal_name",
    "date_of_baptism",
    "parish_of_baptism",
    "ward",
    "family",
    "grade",
    "joining_date",
    "sunday_school_qualification",
    "transferred_from",
  ];
  const contactKeys = ["email", "mobile_no", "phone_no", "address"];
  const miscKeys = ["educational_qualification", "profession"];

  const getIconForKey = (key) => {
    if (key.includes("email")) return LuMail;
    if (key.includes("mobile") || key.includes("phone")) return LuPhone;
    if (key.includes("date") || key.includes("dob") || key.includes("joining"))
      return LuCalendar;
    if (
      key.includes("parish") ||
      key.includes("church") ||
      key.includes("ward") ||
      key.includes("family")
    )
      return LuChurch;
    if (key.includes("address")) return LuMapPin;
    if (key.includes("qualification")) return LuGraduationCap;
    if (key.includes("profession")) return LuBriefcase;
    if (
      key.includes("blood") ||
      key.includes("marital") ||
      key.includes("spouse")
    )
      return LuHeart;
    return LuInfo;
  };

  const excludedFields = [
    "id",
    "created_at",
    "updated_at",
    "family_image",
    "is_deceased",
    "new_head_id",
    "mark_as_deceased",
  ];

  const displayFields = Array.isArray(fields)
    ? fields
        .filter((f) => !excludedFields.includes(f.name))
        .map((f) => ({ label: f.label, key: f.name }))
    : Object.keys(itemData)
        .filter((key) => !excludedFields.includes(key))
        .map((key) => ({
          label: key
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          key: key,
        }));

  const imageKey =
    displayFields.find(
      (f) =>
        f.key.toLowerCase().includes("image") ||
        f.key.toLowerCase().includes("photo"),
    )?.key || "family_image";
  const profileImage = itemData[imageKey];
  const mainName = itemData.name || itemData.family_name || title;

  // Filter fields into groups and check if they have content
  const personalFields = displayFields.filter(
    (f) =>
      personalKeys.includes(f.key) ||
      (miscKeys.includes(f.key) && !churchKeys.includes(f.key)),
  );
  const churchFields = displayFields.filter((f) => churchKeys.includes(f.key));
  const contactFields = displayFields.filter((f) =>
    contactKeys.includes(f.key),
  );

  const handledKeys = [
    ...personalKeys,
    ...churchKeys,
    ...contactKeys,
    ...miscKeys,
    imageKey,
  ];
  // const unhandledFields = displayFields.filter(
  //   (f) => !handledKeys.includes(f.key),
  // );

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="center"
      size="xl"
    >
      <DialogBackdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
      <DialogPositioner alignItems="center">
        <DialogContent
          borderRadius="24px"
          overflow="hidden"
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          maxH="90vh"
          display="flex"
          flexDirection="column"
          border="none"
        >
          <DialogCloseTrigger
            position="absolute"
            right={4}
            top={4}
            color="white"
            bg="whiteAlpha.300"
            borderRadius="full"
            _hover={{ bg: "whiteAlpha.400" }}
            p={2}
            zIndex={10}
          >
            <Icon as={LuX} fontSize="20px" />
          </DialogCloseTrigger>

          <DialogBody
            p={0}
            bg="white"
            flex="1"
            overflowY="auto"
            css={{
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-track": { background: "gray.50" },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(123, 13, 30, 0.2)",
                borderRadius: "10px",
              },
            }}
          >
            <Box ref={printRef} bg="white" w="full" className="print-container">
              {/* Print Only Header: Date & Time */}
              <Flex className="print-timestamp" display="none">
                <Text>Printed on: {new Date().toLocaleString()}</Text>
              </Flex>

              {/* Hero Banner Area */}
              <Box
                h={profileImage ? "140px" : "100px"}
                bgGradient={`linear(to-br, ${primaryMaroon}, #9b1b30)`}
                position="relative"
                w="full"
                className="print-hero"
              />

              {/* Profile Summary Header */}
              <Flex
                direction="column"
                align="center"
                mt={profileImage ? "-60px" : "-30px"}
                px={8}
                pb={6}
                borderBottom="1px solid"
                borderColor="gray.50"
                position="relative"
                className="print-profile-summary"
              >
                {profileImage && (
                  <Box
                    p={1}
                    bg="white"
                    borderRadius="3xl"
                    boxShadow="xl"
                    position="relative"
                    mb={4}
                    className="print-profile-img-box"
                  >
                    <Box
                      as="img"
                      src={getFullImageUrl(profileImage)}
                      w="120px"
                      h="120px"
                      borderRadius="2xl"
                      objectFit="cover"
                      className="print-profile-img"
                    />
                  </Box>
                )}

                <VStack
                  mt={profileImage ? 0 : 4}
                  spacing={0}
                  textAlign="center"
                >
                  <Text
                    fontSize="2xl"
                    fontWeight="800"
                    color="gray.800"
                    letterSpacing="tight"
                  >
                    {mainName}
                  </Text>
                  <HStack color="gray.500" spacing={2} justify="center">
                    {itemData.baptismal_name && (
                      <Text fontSize="sm" fontWeight="600">
                        {itemData.baptismal_name}
                      </Text>
                    )}
                    {itemData.baptismal_name && itemData.house_name && (
                      <Text opacity={0.3}>•</Text>
                    )}
                    {itemData.house_name && (
                      <Text
                        fontSize="xs"
                        fontWeight="700"
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                      >
                        {itemData.house_name}
                      </Text>
                    )}
                  </HStack>
                </VStack>
              </Flex>

              {/* Content Sections */}
              <Box px={10} pb={12} className="print-content-area">
                {/* Family Members Section (For Heads) */}
                {itemData.is_family_head && (
                  <>
                    <SectionHeader
                      icon={LuUser}
                      title="Family Members"
                      primaryMaroon={primaryMaroon}
                    />
                    {loadingMembers ? (
                      <Text fontSize="xs" color="gray.500">
                        Loading family members...
                      </Text>
                    ) : familyMembers.length > 0 ? (
                      <SimpleGrid
                        columns={{ base: 1, md: 2 }}
                        gap={4}
                        className="print-family-grid"
                      >
                        {familyMembers.map((member) => (
                          <Box
                            key={member.id}
                            p={3}
                            borderRadius="xl"
                            bg="rgba(123, 13, 30, 0.03)"
                            border="1px solid"
                            borderColor="rgba(123, 13, 30, 0.1)"
                            className="print-family-member"
                          >
                            <VStack align="stretch" spacing={2.5}>
                              <HStack justify="space-between" align="start">
                                <VStack align="start" gap={"1px"}>
                                  <Text
                                    fontSize="sm"
                                    fontWeight="700"
                                    color="gray.800"
                                  >
                                    {member.name}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {(() => {
                                      const rel = member.relationship;
                                      if (typeof rel === "object" && rel?.name)
                                        return rel.name;
                                      const relId = Number(rel);
                                      const relObj = relationships.find(
                                        (r) => Number(r.id) === relId,
                                      );
                                      return relObj?.name || "Member";
                                    })()}
                                  </Text>
                                </VStack>
                                {member.dob && (
                                  <Box
                                    px={2}
                                    py={1}
                                    bg="white"
                                    borderRadius="md"
                                    boxShadow="xs"
                                  >
                                    <Text
                                      fontSize="10px"
                                      fontWeight="800"
                                      color={primaryMaroon}
                                    >
                                      {new Date().getFullYear() -
                                        new Date(member.dob).getFullYear()}{" "}
                                      YRS
                                    </Text>
                                  </Box>
                                )}
                              </HStack>

                              <VStack
                                align="start"
                                spacing={1}
                                pt={1.5}
                                borderTop="1px solid"
                                borderColor="rgba(123, 13, 30, 0.06)"
                                className="print-member-details-box"
                              >
                                {member.dob && (
                                  <HStack
                                    spacing={1.5}
                                    fontSize="10px"
                                    color="gray.600"
                                    className="print-member-detail-item"
                                  >
                                    <Icon as={LuCalendar} fontSize="10px" />
                                    <Text fontWeight="600">
                                      DOB: {member.dob}
                                    </Text>
                                  </HStack>
                                )}
                                {member.profession && (
                                  <HStack
                                    spacing={1.5}
                                    fontSize="10px"
                                    color="gray.600"
                                    className="print-member-detail-item"
                                  >
                                    <Icon as={LuBriefcase} fontSize="10px" />
                                    <Text fontWeight="600">
                                      {member.profession}
                                    </Text>
                                  </HStack>
                                )}
                                {member.educational_qualification && (
                                  <HStack
                                    spacing={1.5}
                                    fontSize="10px"
                                    color="gray.600"
                                    className="print-member-detail-item"
                                  >
                                    <Icon
                                      as={LuGraduationCap}
                                      fontSize="10px"
                                    />
                                    <Text fontWeight="600">
                                      {member.educational_qualification}
                                    </Text>
                                  </HStack>
                                )}
                              </VStack>
                            </VStack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Text fontSize="xs" color="gray.500">
                        No family members found.
                      </Text>
                    )}
                  </>
                )}
                {/* Personal Info Section */}
                {personalFields.length > 0 && (
                  <>
                    <SectionHeader
                      icon={LuUser}
                      title="Personal Information"
                      primaryMaroon={primaryMaroon}
                    />
                    <SimpleGrid
                      columns={{ base: 1, md: 3 }}
                      gap={4}
                      className="print-info-grid"
                    >
                      {personalFields.map((f, idx) => {
                        const val =
                          itemData[`${f.key}_name`] !== undefined
                            ? itemData[`${f.key}_name`]
                            : itemData[f.key];
                        return (
                          <DetailField
                            key={idx}
                            label={f.label}
                            value={renderValue(val)}
                            icon={getIconForKey(f.key)}
                          />
                        );
                      })}
                    </SimpleGrid>
                  </>
                )}

                {/* Church Info Section */}
                {churchFields.length > 0 && (
                  <>
                    <SectionHeader
                      icon={LuChurch}
                      title="Church & Parish Data"
                      primaryMaroon={primaryMaroon}
                    />
                    <SimpleGrid
                      columns={{ base: 1, md: 3 }}
                      gap={4}
                      className="print-info-grid"
                    >
                      {churchFields.map((f, idx) => {
                        const val =
                          itemData[`${f.key}_name`] !== undefined
                            ? itemData[`${f.key}_name`]
                            : itemData[f.key];
                        return (
                          <DetailField
                            key={idx}
                            label={f.label}
                            value={renderValue(val)}
                            icon={getIconForKey(f.key)}
                          />
                        );
                      })}
                    </SimpleGrid>
                  </>
                )}

                {/* Contact Info Section */}
                {contactFields.length > 0 && (
                  <>
                    <SectionHeader
                      icon={LuMail}
                      title="Contact Details"
                      primaryMaroon={primaryMaroon}
                    />
                    <SimpleGrid
                      columns={{ base: 1, md: 2 }}
                      gap={4}
                      className="print-info-grid"
                    >
                      {contactFields.map((f, idx) => {
                        const val =
                          itemData[`${f.key}_name`] !== undefined
                            ? itemData[`${f.key}_name`]
                            : itemData[f.key];
                        return (
                          <DetailField
                            key={idx}
                            label={f.label}
                            value={renderValue(val)}
                            icon={getIconForKey(f.key)}
                          />
                        );
                      })}
                    </SimpleGrid>
                  </>
                )}

                {/* Remaining Fields (Catch-all) omitted for brevity */}
              </Box>

              {/* Print Only Footer: Site URL */}
              <Flex className="print-footer" display="none">
                <Text>{window.location.origin}</Text>
              </Flex>
            </Box>
          </DialogBody>

          <DialogFooter
            p={6}
            bg="gray.50"
            borderTop="1px solid"
            borderColor="gray.100"
            justifyContent="center"
          >
            <HStack spacing={4}>
              <Button
                onClick={handlePrint}
                variant="outline"
                color={primaryMaroon}
                borderColor={primaryMaroon}
                borderRadius="xl"
                h="45px"
                px={8}
                fontSize="md"
                fontWeight="bold"
                _hover={{
                  bg: "rgba(123, 13, 30, 0.05)",
                  transform: "translateY(-1px)",
                }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.2s"
              >
                <Icon as={LuPrinter} mr={2} />
                Print Details
              </Button>
              <Button
                onClick={onClose}
                bg={primaryMaroon}
                color="white"
                borderRadius="xl"
                h="45px"
                px={8}
                fontSize="md"
                fontWeight="bold"
                _hover={{
                  bg: "#6b0f1a",
                  transform: "translateY(-1px)",
                  boxShadow: "lg",
                }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.2s"
              >
                Done Viewing
              </Button>
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default ViewDetailsModal;
