import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Grid,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

import {
  LuArrowLeft,
  LuBookOpen,
  LuCalendarDays,
  LuFileDown,
  LuInfo,
  LuMapPin,
  LuPencil,
  LuPhone,
  LuPrinter,
  LuUser,
  LuMail,
  LuGraduationCap,
  LuBriefcaseBusiness,
  LuArrowLeftRight,
  LuHouse,
} from "react-icons/lu";

import {
  getMember,
  listFamilies,
  listGrades,
  listWards,
  listMembersByHead,
  listRelationships,
} from "../api/registryServices";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ============================================================
   COLORS
============================================================ */

const RED = "#B40000";
const RED_DARK = "#970000";

const NAVY = "#14245B";
const NAVY_LIGHT = "#26396C";

const TEXT = "#26345A";
const MUTED = "#68758F";

const BORDER = "var(--border-color)";
const PAGE_BG = "var(--white)";

/* ============================================================
   HELPERS
============================================================ */

const getArrayData = (response) => {
  const data = response?.data ?? response ?? [];

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const getObjectName = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return (
      value.name ||
      value.label ||
      value.title ||
      value.family_name ||
      value.ward_name ||
      ""
    );
  }

  return String(value);
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAge = (dob) => {
  if (!dob) return "—";

  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return "—";
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const month =
    today.getMonth() -
    birthDate.getMonth();

  if (
    month < 0 ||
    (month === 0 &&
      today.getDate() <
        birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : "—";
};

const getInitials = (name) => {
  if (!name) return "FH";

  return name
    .split(" ")
    .filter(Boolean)
    .map((item) => item[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

/* ============================================================
   SMALL INFO ROW
============================================================ */

const InfoRow = ({
  icon,
  label,
  value,
  width = "170px",
}) => {
  return (
    <Flex
      align="center"
      gap="10px"
      minW="0"
    >
      {icon && (
        <Box
          color={RED}
          flexShrink="0"
        >
          {icon}
        </Box>
      )}

      <Text
        fontSize="11px"
        color={TEXT}
        minW={width}
        flexShrink="0"
      >
        {label}
      </Text>

      <Text
        fontSize="11px"
        color={NAVY}
        fontWeight="500"
        minW="0"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {value || "—"}
      </Text>
    </Flex>
  );
};

/* ============================================================
   SECTION CARD
============================================================ */

const SectionCard = ({
  title,
  icon,
  children,
}) => {
  return (
    <Box
      bg="var(--white)"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="7px"
      px={{
        base: "14px",
        md: "18px",
      }}
      py="12px"
      width="100%"
    >
      <Flex
        align="center"
        gap="9px"
        mb="8px"
      >
        <Box color={RED}>
          {icon}
        </Box>

        <Text
          color={NAVY}
          fontSize="16px"
          fontWeight="700"
        >
          {title}
        </Text>
      </Flex>

      {children}
    </Box>
  );
};

/* ============================================================
   FAMILY HEAD DETAILS PAGE
============================================================ */

const FamilyHeadDetailsPage = () => {
  const { headId } = useParams();
  const navigate = useNavigate();

  const [head, setHead] = useState(null);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] =
    useState([]);

  const [wards, setWards] = useState([]);
  const [grades, setGrades] = useState([]);
  const [families, setFamilies] = useState([]);

  const [loading, setLoading] = useState(true);

  /* ==========================================================
     FETCH DATA
  ========================================================== */

  useEffect(() => {
    fetchData();
  }, [headId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        headResponse,
        membersResponse,
        relationshipsResponse,
        wardsResponse,
        gradesResponse,
        familiesResponse,
      ] = await Promise.all([
        getMember(headId),
        listMembersByHead(headId),
        listRelationships(),
        listWards(),
        listGrades(),
        listFamilies(),
      ]);

      setHead(
        headResponse?.data ||
          headResponse ||
          null
      );

      setMembers(
        getArrayData(membersResponse)
      );

      setRelationships(
        getArrayData(
          relationshipsResponse
        )
      );

      setWards(
        getArrayData(wardsResponse)
      );

      setGrades(
        getArrayData(gradesResponse)
      );

      setFamilies(
        getArrayData(familiesResponse)
      );
    } catch (error) {
      console.error(
        "Error fetching family head:",
        error
      );

      window.alert(
        "Failed to load family head details."
      );

      navigate("/family-heads");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     RELATED FAMILY
  ========================================================== */

  const family = useMemo(() => {
    if (!head) return null;

    const familyId =
      typeof head.family === "object"
        ? head.family?.id
        : head.family;

    return (
      families.find(
        (item) =>
          String(item.id) ===
          String(familyId)
      ) || null
    );
  }, [head, families]);

  /* ==========================================================
     RELATED WARD
  ========================================================== */

  const ward = useMemo(() => {
    if (!head) return null;

    const wardId =
      typeof head.ward === "object"
        ? head.ward?.id
        : head.ward;

    return (
      wards.find(
        (item) =>
          String(item.id) ===
          String(wardId)
      ) || null
    );
  }, [head, wards]);

  /* ==========================================================
     RELATED GRADE
  ========================================================== */

  const grade = useMemo(() => {
    if (!head) return null;

    const gradeId =
      typeof head.grade === "object"
        ? head.grade?.id
        : head.grade;

    return (
      grades.find(
        (item) =>
          String(item.id) ===
          String(gradeId)
      ) || null
    );
  }, [head, grades]);

  /* ==========================================================
     RELATIONSHIP
  ========================================================== */

  const getRelationship = (member) => {
    const relationship =
      member?.relationship;

    if (!relationship) {
      return "—";
    }

    if (
      typeof relationship ===
      "object"
    ) {
      return getObjectName(
        relationship
      );
    }

    const found =
      relationships.find(
        (item) =>
          String(item?.id) ===
          String(relationship)
      );

    return (
      found?.name ||
      found?.label ||
      found?.title ||
      "—"
    );
  };

  /* ==========================================================
     MEMBER STATUS
  ========================================================== */

  const getMemberStatus = (member) => {
    if (
      member?.is_active === false ||
      String(
        member?.status || ""
      ).toUpperCase() ===
        "INACTIVE"
    ) {
      return "Inactive";
    }

    return "Active";
  };

  /* ==========================================================
     MEMBER PHONE
  ========================================================== */

  const getMemberPhone = (member) => {
    return (
      member?.mobile_no ||
      member?.mobile ||
      member?.phone_number ||
      member?.phone ||
      "—"
    );
  };

  /* ==========================================================
     HEADER DATA
  ========================================================== */

  const familyName =
    family?.family_name ||
    head?.family_name ||
    getObjectName(head?.family) ||
    "—";

  const wardName =
    ward?.ward_name ||
    ward?.name ||
    head?.ward_name ||
    getObjectName(head?.ward) ||
    "—";

  const gradeName =
    grade?.name ||
    head?.grade_name ||
    getObjectName(head?.grade) ||
    "—";

  const headAge =
    head?.age ??
    getAge(head?.dob);

  const memberSince =
    head?.joining_date ||
    head?.member_since ||
    head?.membership_date;

  const address =
    head?.address ||
    [
      head?.address_line1,
      head?.address_line2,
      head?.city,
      head?.state,
      head?.postal_code,
    ]
      .filter(Boolean)
      .join(", ");

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        bg="var(--white)"
      >
        <Navbar />

        <Center flex="1">
          <Spinner
            size="lg"
            color={RED}
          />
        </Center>

        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     NOT FOUND
  ========================================================== */

  if (!head) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Center flex="1">
          <Text color={TEXT}>
            Family head not found.
          </Text>
        </Center>

        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg={PAGE_BG}
    >
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <Navbar />

      {/* ======================================================
          MAIN
      ====================================================== */}

      <Box
        flex="1"
        px={{
          base: "18px",
          sm: "24px",
          md: "30px",
          lg: "42px",
          xl: "48px",
        }}
        pt={{
          base: "18px",
          md: "20px",
        }}
        pb="20px"
      >
        <Box
          maxW="1580px"
          mx="auto"
          width="100%"
        >
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <Flex
            align="center"
            gap="8px"
            mb="10px"
            fontSize="11px"
          >
            <Text
              color="#667085"
              cursor="pointer"
              onClick={() =>
                navigate(
                  "/family-heads"
                )
              }
            >
              Masters
            </Text>

            <Text color="#A3ADBE">
              /
            </Text>

            <Text
              color="#667085"
              cursor="pointer"
              onClick={() =>
                navigate(
                  "/family-heads"
                )
              }
            >
              Family Head Master
            </Text>

            <Text color="#A3ADBE">
              /
            </Text>

            <Text color="#667085">
              Family Head Details
            </Text>
          </Flex>

          {/* ==================================================
              PAGE HEADER
          ================================================== */}

          <Flex
            justify="space-between"
            align={{
              base: "flex-start",
              md: "center",
            }}
            gap="15px"
            mb="12px"
            flexDirection={{
              base: "column",
              md: "row",
            }}
          >
            <Box>
              <Heading
                color={NAVY}
                fontSize={{
                  base: "25px",
                  md: "29px",
                  lg: "31px",
                }}
                lineHeight="1.15"
                fontWeight="700"
              >
                Family Head Details
              </Heading>

              <Text
                color="#667085"
                fontSize="11px"
                mt="5px"
              >
                View family head profile,
                parish membership and
                dependent information.
              </Text>
            </Box>

            <HStack
              gap="10px"
              flexWrap="wrap"
            >
              {/* BACK */}

              <Button
                h="40px"
                px="18px"
                bg="var(--white)"
                color={RED}
                border="1px solid"
                borderColor={RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() =>
                  navigate(
                    "/family-heads"
                  )
                }
                _hover={{
                  bg: "#FFF8F8",
                }}
              >
                <LuArrowLeft size={17} />

                <Text ml="6px">
                  Back
                </Text>
              </Button>

              {/* PRINT */}

              <Button
                h="40px"
                px="18px"
                bg="var(--white)"
                color={RED}
                border="1px solid"
                borderColor={RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() =>
                  navigate(
                    `/family-heads/${headId}/print`
                  )
                }
                _hover={{
                  bg: "#FFF8F8",
                }}
              >
                <LuFileDown size={17} />

                <Text ml="6px">
                  Print
                </Text>
              </Button>

              {/* PDF */}

              <Button
                h="40px"
                px="18px"
                bg="var(--white)"
                color={RED}
                border="1px solid"
                borderColor={RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() =>
                  window.print()
                }
                _hover={{
                  bg: "#FFF8F8",
                }}
              >
                <LuFileDown size={17} />

                <Text ml="6px">
                  Generate PDF
                </Text>
              </Button>

              {/* EDIT */}

              <Button
                h="40px"
                px="18px"
                bg={RED}
                color="var(--white)"
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() =>
                  navigate(
                    `/family-heads/${headId}/edit`
                  )
                }
                _hover={{
                  bg: RED_DARK,
                }}
              >
                <LuPencil size={17} />

                <Text ml="6px">
                  Edit Family Head
                </Text>
              </Button>
            </HStack>
          </Flex>

          {/* ==================================================
              MAIN TWO COLUMN AREA
          ================================================== */}

          <Grid
            templateColumns={{
              base: "1fr",
              lg: "410px 1fr",
            }}
            gap={{
              base: "14px",
              lg: "26px",
            }}
            alignItems="start"
          >
            {/* =================================================
                LEFT PROFILE CARD
            ================================================= */}

            <Box
              bg="var(--white)"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="8px"
              px="28px"
              py="16px"
            >
              {/* PROFILE */}

              <VStack
                gap="7px"
                align="center"
              >
                <Avatar.Root
                  size="2xl"
                >
                  {(
                    head?.family_image ||
                    head?.image ||
                    head?.photo ||
                    head?.image_url
                  ) ? (
                    <Avatar.Image
                      src={
                        head?.family_image ||
                        head?.image ||
                        head?.photo ||
                        head?.image_url
                      }
                      alt={
                        head?.name ||
                        "Family Head"
                      }
                    />
                  ) : null}

                  <Avatar.Fallback>
                    {getInitials(
                      head?.name
                    )}
                  </Avatar.Fallback>
                </Avatar.Root>

                <Heading
                  color={NAVY}
                  fontSize="28px"
                  lineHeight="1.1"
                  fontWeight="700"
                  textAlign="center"
                >
                  {head?.name ||
                    "Family Head"}
                </Heading>

                {/* FAMILY + HOUSE */}

                <Flex
                  align="center"
                  justify="center"
                  gap="8px"
                  color="#62708B"
                  fontSize="13px"
                  flexWrap="wrap"
                  textAlign="center"
                >
                  <Text>
                    {familyName}
                  </Text>

                  <Text>
                    •
                  </Text>

                  <Text>
                    {head?.house_name ||
                      "—"}
                  </Text>
                </Flex>

                {/* ACTIVE */}

                <Badge
                  display="inline-flex"
                  alignItems="center"
                  gap="7px"
                  px="12px"
                  py="6px"
                  bg={
                    head?.is_active
                      ? "#E9F8ED"
                      : "var(--divider-color)"
                  }
                  border="1px solid"
                  borderColor={
                    head?.is_active
                      ? "#B9E7C4"
                      : "#D8D8D8"
                  }
                  color={
                    head?.is_active
                      ? "#25813B"
                      : "#666666"
                  }
                  borderRadius="5px"
                  fontSize="11px"
                  fontWeight="500"
                  mt="2px"
                >
                  <Box
                    w="10px"
                    h="10px"
                    borderRadius="full"
                    bg={
                      head?.is_active
                        ? "#16A34A"
                        : "#777777"
                    }
                  />

                  {head?.is_active
                    ? "Active"
                    : "Inactive"}
                </Badge>
              </VStack>

              {/* DIVIDER */}

              <Box
                h="1px"
                bg="#E4E9F1"
                my="14px"
              />

              {/* LEFT INFORMATION */}

              <VStack
                align="stretch"
                gap="13px"
              >
                <InfoRow
                  icon={
                    <LuMapPin
                      size={22}
                    />
                  }
                  label="Ward"
                  value={wardName}
                  width="92px"
                />

                <InfoRow
                  icon={
                    <LuGraduationCap
                      size={22}
                    />
                  }
                  label="Grade"
                  value={gradeName}
                  width="92px"
                />

                <InfoRow
                  icon={
                    <LuCalendarDays
                      size={22}
                    />
                  }
                  label="Member Since"
                  value={
                    memberSince
                      ? formatDate(
                          memberSince
                        )
                      : "—"
                  }
                  width="92px"
                />

                <InfoRow
                  icon={
                    <LuMail
                      size={22}
                    />
                  }
                  label="Email"
                  value={
                    head?.email
                  }
                  width="92px"
                />

                <InfoRow
                  icon={
                    <LuPhone
                      size={22}
                    />
                  }
                  label="Mobile Number"
                  value={
                    head?.mobile_no ||
                    head?.phone_no ||
                    head?.phone_number
                  }
                  width="92px"
                />
              </VStack>
            </Box>

            {/* =================================================
                RIGHT CONTENT
            ================================================= */}

            <VStack
              align="stretch"
              gap="8px"
            >
              {/* =================================================
                  PERSONAL & FAMILY
              ================================================= */}

              <SectionCard
                title="Personal & Family"
                icon={
                  <LuUser
                    size={21}
                  />
                }
              >
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "repeat(3, 1fr)",
                  }}
                  gap="0"
                >
                  {/* COLUMN 1 */}

                  <Box
                    pr={{
                      md: "22px",
                    }}
                    borderRight={{
                      md: "1px solid #E0E6EF",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        label="Baptism Name"
                        value={
                          head?.baptismal_name ||
                          head?.baptism_name
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Gender"
                        value={
                          head?.gender
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Date of Birth"
                        value={
                          head?.dob
                            ? formatDate(
                                head.dob
                              )
                            : "—"
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  {/* COLUMN 2 */}

                  <Box
                    px={{
                      md: "22px",
                    }}
                    py={{
                      base: "10px",
                      md: "0",
                    }}
                    borderRight={{
                      md: "1px solid #E0E6EF",
                    }}
                    borderTop={{
                      base: "1px solid #E0E6EF",
                      md: "none",
                    }}
                    borderBottom={{
                      base: "1px solid #E0E6EF",
                      md: "none",
                    }}
                    my={{
                      base: "9px",
                      md: "0",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        label="Age"
                        value={
                          headAge !==
                          "—"
                            ? `${headAge} Years`
                            : "—"
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Blood Group"
                        value={
                          head?.blood_group
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Marital Status"
                        value={
                          head?.marital_status
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  {/* COLUMN 3 */}

                  <Box
                    pl={{
                      md: "22px",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        label="Spouse Name"
                        value={
                          head?.spouse_name
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Father Name"
                        value={
                          head?.father_name
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Mother Name"
                        value={
                          head?.mother_name
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              {/* =================================================
                  CONTACT & ADDRESS
              ================================================= */}

              <SectionCard
                title="Contact & Address"
                icon={
                  <LuMapPin
                    size={21}
                  />
                }
              >
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "1fr 1.3fr",
                  }}
                  gap="0"
                >
                  <Box
                    pr={{
                      md: "25px",
                    }}
                    borderRight={{
                      md: "1px solid #E0E6EF",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        label="House Name"
                        value={
                          head?.house_name
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Ward"
                        value={wardName}
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  <Box
                    pl={{
                      md: "25px",
                    }}
                    mt={{
                      base: "10px",
                      md: "0",
                    }}
                  >
                    <Flex
                      align="flex-start"
                      gap="10px"
                    >
                      <Box
                        color={RED}
                        flexShrink="0"
                      >
                        <LuMapPin
                          size={21}
                        />
                      </Box>

                      <Box>
                        <Text
                          fontSize="11px"
                          color={TEXT}
                          mb="3px"
                        >
                          Address
                        </Text>

                        <Text
                          fontSize="11px"
                          color={NAVY}
                          fontWeight="500"
                          lineHeight="1.5"
                        >
                          {address ||
                            "—"}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                </Grid>
              </SectionCard>

              {/* =================================================
                  SACRAMENTS EDUCATION PARISH
              ================================================= */}

              <SectionCard
                title="Sacraments, Education & Parish"
                icon={
                  <LuBookOpen
                    size={21}
                  />
                }
              >
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "repeat(4, 1fr)",
                  }}
                  gap="0"
                >
                  {/* COLUMN 1 */}

                  <Box
                    pr={{
                      md: "18px",
                    }}
                    borderRight={{
                      md: "1px solid #E0E6EF",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        icon={
                          <LuCalendarDays
                            size={18}
                          />
                        }
                        label="Date of Baptism"
                        value={
                          head?.date_of_baptism
                            ? formatDate(
                                head.date_of_baptism
                              )
                            : "—"
                        }
                        width="92px"
                      />

                      <InfoRow
                        icon={
                          <LuHouse
                            size={18}
                          />
                        }
                        label="Parish of Baptism"
                        value={
                          head?.parish_of_baptism
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  {/* COLUMN 2 */}

                  <Box
                    px={{
                      md: "18px",
                    }}
                    py={{
                      base: "10px",
                      md: "0",
                    }}
                    borderRight={{
                      md: "1px solid #E0E6EF",
                    }}
                    borderTop={{
                      base: "1px solid #E0E6EF",
                      md: "none",
                    }}
                    borderBottom={{
                      base: "1px solid #E0E6EF",
                      md: "none",
                    }}
                    my={{
                      base: "9px",
                      md: "0",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        icon={
                          <LuCalendarDays
                            size={18}
                          />
                        }
                        label="Joining Date"
                        value={
                          head?.joining_date
                            ? formatDate(
                                head.joining_date
                              )
                            : "—"
                        }
                        width="92px"
                      />

                      <InfoRow
                        icon={
                          <LuArrowLeftRight
                            size={18}
                          />
                        }
                        label="Transferred From"
                        value={
                          head?.transferred_from
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  {/* COLUMN 3 */}

                  <Box
                    px={{
                      md: "18px",
                    }}
                    borderRight={{
                      md: "1px solid #E0E6EF",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        icon={
                          <LuGraduationCap
                            size={18}
                          />
                        }
                        label="Educational Qualification"
                        value={
                          head?.educational_qualification
                        }
                        width="92px"
                      />

                      <InfoRow
                        icon={
                          <LuBookOpen
                            size={18}
                          />
                        }
                        label="Sunday School Qualification"
                        value={
                          head?.sunday_school_qualification
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  {/* COLUMN 4 */}

                  <Box
                    pl={{
                      md: "18px",
                    }}
                    mt={{
                      base: "10px",
                      md: "0",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        icon={
                          <LuBriefcaseBusiness
                            size={18}
                          />
                        }
                        label="Profession"
                        value={
                          head?.profession
                        }
                        width="92px"
                      />

                      <InfoRow
                        icon={
                          <LuUser
                            size={18}
                          />
                        }
                        label="Status"
                        value={
                          head?.is_active
                            ? "Active"
                            : "Inactive"
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              {/* =================================================
                  DEPENDENTS
              ================================================= */}

              <Box
                bg="var(--white)"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="7px"
                px="10px"
                py="8px"
              >
                {/* DEPENDENT HEADER */}

                <Flex
                  align="center"
                  gap="8px"
                  mb="7px"
                  px="2px"
                >
                  <Text
                    color={NAVY}
                    fontSize="16px"
                    fontWeight="700"
                  >
                    Dependents
                  </Text>

                  <Text
                    color="#6C7890"
                    fontSize="10px"
                  >
                    {members.length} family
                    members linked to this
                    family head
                  </Text>
                </Flex>

                {/* DEPENDENT GRID */}

                {members.length === 0 ? (
                  <Box
                    py="18px"
                    textAlign="center"
                  >
                    <Text
                      fontSize="11px"
                      color={MUTED}
                    >
                      No dependent records
                      found.
                    </Text>
                  </Box>
                ) : (
                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "repeat(2, 1fr)",
                    }}
                    gap="8px"
                  >
                    {members.map(
                      (member, index) => {
                        const memberName =
                          member?.name ||
                          "Unnamed";

                        const relation =
                          getRelationship(
                            member
                          );

                        const status =
                          getMemberStatus(
                            member
                          );

                        const age =
                          member?.age ??
                          getAge(
                            member?.dob
                          );

                        const phone =
                          getMemberPhone(
                            member
                          );

                        const initials =
                          getInitials(
                            memberName
                          );

                        return (
                          <Box
                            key={
                              member?.id ||
                              index
                            }
                            border="1px solid"
                            borderColor="#DCE4EF"
                            borderRadius="7px"
                            px="12px"
                            py="7px"
                            bg="var(--white)"
                          >
                            <Flex
                              align="center"
                              gap="10px"
                            >
                              {/* AVATAR */}

                              <Avatar.Root
                                size="md"
                                flexShrink="0"
                              >
                                <Avatar.Fallback
                                  bg={
                                    index %
                                      4 ===
                                    0
                                      ? "#FFE0E0"
                                      : index %
                                          4 ===
                                        1
                                      ? "#DFF5E5"
                                      : index %
                                          4 ===
                                        2
                                      ? "#EEE2FF"
                                      : "#FFF0CF"
                                  }
                                  color={
                                    NAVY
                                  }
                                  fontSize="13px"
                                  fontWeight="600"
                                >
                                  {
                                    initials
                                  }
                                </Avatar.Fallback>

                                {(
                                  member?.image_url ||
                                  member?.image ||
                                  member?.photo
                                ) ? (
                                  <Avatar.Image
                                    src={
                                      member?.image_url ||
                                      member?.image ||
                                      member?.photo
                                    }
                                  />
                                ) : null}
                              </Avatar.Root>

                              {/* NAME + RELATION */}

                              <Box
                                flex="1"
                                minW="0"
                              >
                                <Text
                                  color={NAVY}
                                  fontSize="11px"
                                  fontWeight="700"
                                  whiteSpace="nowrap"
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                >
                                  {
                                    memberName
                                  }
                                </Text>

                                <Badge
                                  mt="2px"
                                  bg="#EEF5FF"
                                  border="1px solid #D5E4FF"
                                  color="#2864C7"
                                  borderRadius="4px"
                                  px="6px"
                                  py="2px"
                                  fontSize="9px"
                                  fontWeight="500"
                                >
                                  {
                                    relation
                                  }
                                </Badge>
                              </Box>

                              {/* AGE + PHONE */}

                              <Box
                                minW="110px"
                                borderLeft="1px solid #E1E6EE"
                                pl="12px"
                              >
                                <Flex
                                  align="center"
                                  gap="6px"
                                  mb="5px"
                                >
                                  <LuUser
                                    size={15}
                                    color={
                                      NAVY
                                    }
                                  />

                                  <Text
                                    fontSize="10px"
                                    color={
                                      TEXT
                                    }
                                  >
                                    {age !==
                                    "—"
                                      ? `${age} Years`
                                      : "—"}
                                  </Text>
                                </Flex>

                                <Flex
                                  align="center"
                                  gap="6px"
                                >
                                  <LuPhone
                                    size={15}
                                    color={
                                      NAVY
                                    }
                                  />

                                  <Text
                                    fontSize="10px"
                                    color={
                                      TEXT
                                    }
                                    whiteSpace="nowrap"
                                    overflow="hidden"
                                    textOverflow="ellipsis"
                                  >
                                    {phone}
                                  </Text>
                                </Flex>
                              </Box>
                            </Flex>
                          </Box>
                        );
                      }
                    )}
                  </Grid>
                )}
              </Box>

              {/* =================================================
                  RECORD INFORMATION
                  DIRECTLY BELOW DEPENDENTS
              ================================================= */}

              <Box
                bg="var(--white)"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="7px"
                px="14px"
                py="9px"
              >
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "1fr 1fr 1fr",
                  }}
                  alignItems="center"
                  gap="10px"
                >
                  {/* TITLE */}

                  <Flex
                    align="center"
                    gap="10px"
                  >
                    <Box color="#175CD3">
                      <LuInfo
                        size={22}
                      />
                    </Box>

                    <Text
                      fontSize="12px"
                      fontWeight="700"
                      color={NAVY}
                    >
                      Record Information
                    </Text>
                  </Flex>

                  {/* CREATED */}

                  <Flex
                    align="center"
                    gap="9px"
                    borderLeft={{
                      md: "1px solid #DDE4EE",
                    }}
                    pl={{
                      md: "24px",
                    }}
                  >
                    <Box color={NAVY}>
                      <LuCalendarDays
                        size={20}
                      />
                    </Box>

                    <Box>
                      <Text
                        fontSize="9px"
                        color={MUTED}
                      >
                        Created on
                      </Text>

                      <Text
                        fontSize="10px"
                        color={NAVY}
                        fontWeight="500"
                      >
                        {head?.created_at
                          ? formatDate(
                              head.created_at
                            )
                          : "—"}
                      </Text>
                    </Box>
                  </Flex>

                  {/* UPDATED */}

                  <Flex
                    align="center"
                    gap="9px"
                    borderLeft={{
                      md: "1px solid #DDE4EE",
                    }}
                    pl={{
                      md: "24px",
                    }}
                  >
                    <Box color={NAVY}>
                      <LuUser
                        size={20}
                      />
                    </Box>

                    <Box>
                      <Text
                        fontSize="9px"
                        color={MUTED}
                      >
                        Last updated
                      </Text>

                      <Text
                        fontSize="10px"
                        color={NAVY}
                        fontWeight="500"
                      >
                        {head?.updated_at
                          ? formatDate(
                              head.updated_at
                            )
                          : "Never"}
                      </Text>
                    </Box>
                  </Flex>
                </Grid>
              </Box>
            </VStack>
          </Grid>
        </Box>
      </Box>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Footer />
    </Box>
  );
};

export default FamilyHeadDetailsPage;