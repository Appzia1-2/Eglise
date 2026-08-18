// FamilyHeadDashboard.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
  Avatar,
  VStack,
  Badge,
  useDisclosure,
  Table,
} from "@chakra-ui/react";

import {
  LuChevronLeft,
  LuChevronRight,
  LuCircleAlert,
  LuEye,
  LuFilter,
  LuGraduationCap,
  LuMapPin,
  LuPencil,
  LuPhone,
  LuPlus,
  LuSearch,
  LuUserPlus,
  LuUsers,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listMembers,
  listWards,
  listGrades,
  listFamilies,
} from "../api/registryServices";

const PAGE_SIZE = 6;

/* ============================================================
   HELPERS
============================================================ */

const getArrayData = (response) => {
  const data = response?.data ?? response ?? [];

  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
};

const getId = (value) => {
  if (value && typeof value === "object") {
    return value.id ?? null;
  }

  return value ?? null;
};

const getImageUrl = (image) => {
  if (!image) return null;

  const imageString = String(image);

  if (
    imageString.startsWith("http://") ||
    imageString.startsWith("https://") ||
    imageString.startsWith("data:")
  ) {
    return imageString;
  }

  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";

  return `${apiBase.replace(/\/+$/, "")}/${imageString.replace(
    /^\/+/,
    ""
  )}`;
};

/* ============================================================
   COMPONENT
============================================================ */

const FamilyHeadDashboard = () => {
  const navigate = useNavigate();

  /* ==========================================================
     DISCLOSURES
  ========================================================== */

  const {
    open: isOpen,
    onOpen,
    onClose,
  } = useDisclosure();

  const {
    open: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();

  /* ==========================================================
     STATE
  ========================================================== */

  const [heads, setHeads] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [headlessFamilies, setHeadlessFamilies] = useState([]);
  const [selectedHousehold, setSelectedHousehold] = useState(null);

  const [wards, setWards] = useState([]);
  const [grades, setGrades] = useState([]);
  const [families, setFamilies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterWard, setFilterWard] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [page, setPage] = useState(1);

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        wardsResponse,
        gradesResponse,
        familiesResponse,
        membersResponse,
      ] = await Promise.all([
        listWards(),
        listGrades(),
        listFamilies(),
        listMembers(),
      ]);

      const wardsList = getArrayData(wardsResponse);
      const gradesList = getArrayData(gradesResponse);
      const familiesList = getArrayData(familiesResponse);
      const membersList = getArrayData(membersResponse);

      setWards(wardsList);
      setGrades(gradesList);
      setFamilies(familiesList);
      setAllMembers(membersList);

      /* ======================================================
         FAMILY HEADS
      ====================================================== */

      const familyHeads = membersList
        .filter(
          (member) =>
            member.is_family_head &&
            !member.expired
        )
        .map((head) => {
          const familyId = getId(head.family);

          const familyObj = familiesList.find(
            (family) =>
              Number(family.id) === Number(familyId)
          );

          const wardId = getId(head.ward);

          const wardObj = wardsList.find(
            (ward) =>
              Number(ward.id) === Number(wardId)
          );

          const gradeId = getId(head.grade);

          const gradeObj = gradesList.find(
            (grade) =>
              Number(grade.id) === Number(gradeId)
          );

          const houseName = String(
            head.house_name || ""
          )
            .trim()
            .toLowerCase();

          const houseSequence =
            head.house_sequence ?? 1;

          const totalDependents =
            membersList.filter((member) => {
              const memberFamilyId =
                getId(member.family);

              const memberHouseName = String(
                member.house_name || ""
              )
                .trim()
                .toLowerCase();

              const memberHouseSequence =
                member.house_sequence ?? 1;

              return (
                Number(memberFamilyId) ===
                  Number(familyId) &&
                memberHouseName === houseName &&
                Number(memberHouseSequence) ===
                  Number(houseSequence) &&
                member.is_active &&
                !member.expired &&
                !member.is_family_head
              );
            }).length;

          const rawImage =
            head.family_image ||
            head.image ||
            head.photo ||
            head.profile_image ||
            null;

          const image = getImageUrl(rawImage);

          return {
            ...head,

            family_id: familyId,
            ward_id: wardId,
            grade_id: gradeId,

            family_name:
              familyObj?.family_name ||
              head.family_name ||
              "N/A",

            ward_name:
              wardObj?.ward_name ||
              head.ward_name ||
              "N/A",

            grade_name:
              gradeObj?.name ||
              head.grade_name ||
              "N/A",

            total_dependents: totalDependents,

            family_image: image,
          };
        });

      setHeads(familyHeads);

      /* ======================================================
         HEADLESS FAMILIES
      ====================================================== */

      const headless = [];
      const processedKeys = new Set();

      membersList
        .filter(
          (member) =>
            member.is_active &&
            !member.expired
        )
        .forEach((member) => {
          const familyId = getId(member.family);

          const houseName = String(
            member.house_name || ""
          )
            .trim()
            .toLowerCase();

          const houseSeq =
            member.house_sequence ?? 1;

          const key = `${familyId}-${houseName}-${houseSeq}`;

          if (processedKeys.has(key)) {
            return;
          }

          processedKeys.add(key);

          const hasHead = membersList.some(
            (m) =>
              Number(getId(m.family)) ===
                Number(familyId) &&
              String(m.house_name || "")
                .trim()
                .toLowerCase() === houseName &&
              Number(m.house_sequence ?? 1) ===
                Number(houseSeq) &&
              m.is_family_head &&
              m.is_active &&
              !m.expired
          );

          if (!hasHead) {
            const householdMembers =
              membersList.filter(
                (m) =>
                  Number(getId(m.family)) ===
                    Number(familyId) &&
                  String(m.house_name || "")
                    .trim()
                    .toLowerCase() === houseName &&
                  Number(m.house_sequence ?? 1) ===
                    Number(houseSeq) &&
                  m.is_active &&
                  !m.expired
              );

            const familyObj =
              familiesList.find(
                (f) =>
                  Number(f.id) ===
                  Number(familyId)
              );

            const firstMember =
              householdMembers[0];

            const wardObj = firstMember?.ward
              ? wardsList.find(
                  (w) =>
                    Number(w.id) ===
                    Number(
                      getId(firstMember.ward)
                    )
                )
              : null;

            headless.push({
              family_id: familyId,

              family_name:
                familyObj?.family_name ||
                "Unknown Family",

              house_name:
                member.house_name ||
                "Unnamed House",

              house_sequence: houseSeq,

              member_count:
                householdMembers.length,

              members: householdMembers,

              ward:
                wardObj?.ward_name ||
                "N/A",
            });
          }
        });

      setHeadlessFamilies(headless);
    } catch (err) {
      console.error(
        "Error loading family heads:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load family head records."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadData();
  }, []);

  /* ==========================================================
     FILTERED DATA
  ========================================================== */

  const filteredHeads = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return heads.filter((head) => {
      const name = String(
        head.name || ""
      ).toLowerCase();

      const familyName = String(
        head.family_name || ""
      ).toLowerCase();

      const houseName = String(
        head.house_name || ""
      ).toLowerCase();

      const mobile = String(
        head.mobile_no ||
          head.mobile ||
          head.phone ||
          ""
      ).toLowerCase();

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        familyName.includes(keyword) ||
        houseName.includes(keyword) ||
        mobile.includes(keyword);

      const wardId =
        head.ward_id ??
        getId(head.ward);

      const matchesWard =
        !filterWard ||
        Number(wardId) ===
          Number(filterWard);

      const gradeId =
        head.grade_id ??
        getId(head.grade);

      const matchesGrade =
        !filterGrade ||
        Number(gradeId) ===
          Number(filterGrade);

      const matchesStatus =
        !filterStatus ||
        (filterStatus === "ACTIVE"
          ? Boolean(head.is_active)
          : !head.is_active);

      return (
        matchesSearch &&
        matchesWard &&
        matchesGrade &&
        matchesStatus
      );
    });
  }, [
    heads,
    search,
    filterWard,
    filterGrade,
    filterStatus,
  ]);

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalItems =
    filteredHeads.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalItems / PAGE_SIZE
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const startIndex =
    (safePage - 1) *
    PAGE_SIZE;

  const paginatedHeads =
    filteredHeads.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

  /* ==========================================================
     RESET PAGE
  ========================================================== */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    filterWard,
    filterGrade,
    filterStatus,
  ]);

  /* ==========================================================
     CLEAR FILTERS
  ========================================================== */

  const clearFilters = () => {
    setSearch("");
    setFilterWard("");
    setFilterGrade("");
    setFilterStatus("");
    setPage(1);
  };

  /* ==========================================================
     PAGE NUMBERS
  ========================================================== */

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    const pages = [];

    pages.push(1);

    if (safePage > 3) {
      pages.push("...");
    }

    const start = Math.max(
      2,
      safePage - 1
    );

    const end = Math.min(
      totalPages - 1,
      safePage + 1
    );

    for (
      let i = start;
      i <= end;
      i++
    ) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (
      safePage <
      totalPages - 2
    ) {
      pages.push("...");
    }

    if (
      !pages.includes(totalPages)
    ) {
      pages.push(totalPages);
    }

    return pages;
  };

  /* ==========================================================
     SHOWING RANGE
  ========================================================== */

  const showingFrom =
    totalItems === 0
      ? 0
      : startIndex + 1;

  const showingTo = Math.min(
    startIndex +
      paginatedHeads.length,
    totalItems
  );

  /* ==========================================================
     PROMOTE HEADLESS
  ========================================================== */

  const handlePromoteFromHeadless = (
    familyId,
    houseName,
    houseSequence
  ) => {
    onClose();

    navigate(
      "/headless/promote",
      {
        state: {
          family_id: familyId,
          house_name: houseName,
          house_sequence:
            houseSequence,
        },
      }
    );
  };

  /* ==========================================================
     VIEW DETAILS
  ========================================================== */

  const handleViewDetails = (
    household
  ) => {
    setSelectedHousehold(
      household
    );
    onDetailOpen();
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <Box
      minH="100vh"
      bg="var(--white)"
      display="flex"
      flexDirection="column"
      overflowX="hidden"
    >
      <Navbar />

      <Container
        maxW="none"
        width="100%"
        minW="0"
        px={{
          base: "18px",
          sm: "22px",
          md: "28px",
          lg: "34px",
          xl: "36px",
        }}
        pt={{
          base: "18px",
          md: "20px",
          lg: "16px",
        }}
        pb="28px"
        flex="1"
        overflow="hidden"
      >
        {/* BREADCRUMB */}

        <HStack
          gap="10px"
          mb="13px"
          fontSize="12px"
          lineHeight="1"
        >
          <Text
            color="var(--light-gray)"
            fontWeight="500"
          >
            Masters
          </Text>

          <Text color="var(--muted-border)">
            /
          </Text>

          <Text
            color="var(--light-gray)"
            fontWeight="500"
          >
            Family Head Master
          </Text>
        </HStack>

        {/* HEADER */}

        <Flex
          justify="space-between"
          align={{
            base: "flex-start",
            lg: "center",
          }}
          direction={{
            base: "column",
            lg: "row",
          }}
          gap="16px"
          mb="20px"
          width="100%"
          minW="0"
        >
          <Box
            minW="0"
            flex="1"
          >
            <Text
              fontSize="11px"
              fontWeight="700"
              color="var(--primary-maroon)"
              mb="4px"
              letterSpacing="0.35px"
            >
              FAMILY HEAD MASTER
            </Text>

            <Heading
              color="var(--dark-text)"
              fontSize={{
                base: "26px",
                md: "29px",
                lg: "32px",
              }}
              fontWeight="700"
              lineHeight="1.15"
              letterSpacing="-0.4px"
            >
              Family Head Master Dashboard
            </Heading>

            <Text
              color="var(--light-gray)"
              fontSize="13px"
              mt="6px"
            >
              Manage family heads, parish
              membership and dependent
              information.
            </Text>
          </Box>

          {/* HEADER ACTIONS */}

          <HStack
            gap="12px"
            flexShrink={0}
            width={{
              base: "100%",
              lg: "auto",
            }}
          >
            <Button
              flex={{
                base: 1,
                lg: "initial",
              }}
              variant="outline"
              borderColor="var(--warning-color)"
              color="var(--warning-color)"
              bg="var(--white)"
              h="40px"
              minW={{
                base: "auto",
                lg: "175px",
              }}
              px="16px"
              fontSize="12px"
              borderRadius="6px"
              fontWeight="500"
              onClick={onOpen}
              _hover={{
                bg: "var(--warning-bg)",
                borderColor:
                  "var(--warning-color)",
              }}
              position="relative"
            >
              <LuCircleAlert size={17} />

              <Text ml="7px">
                Headless Families
              </Text>

              {headlessFamilies.length >
                0 && (
                <Badge
                  position="absolute"
                  top="-6px"
                  right="-6px"
                  bg="var(--danger)"
                  color="var(--white)"
                  borderRadius="full"
                  px="6px"
                  py="1px"
                  fontSize="10px"
                  minW="20px"
                  textAlign="center"
                >
                  {headlessFamilies.length}
                </Badge>
              )}
            </Button>

            <Button
              flex={{
                base: 1,
                lg: "initial",
              }}
              bg="var(--primary-maroon)"
              color="var(--white)"
              h="40px"
              minW={{
                base: "auto",
                lg: "175px",
              }}
              px="17px"
              fontSize="12px"
              borderRadius="6px"
              fontWeight="500"
              onClick={() =>
                navigate(
                  "/family-heads/create"
                )
              }
              _hover={{
                bg: "var(--primary-maroon)",
                opacity: 0.9,
              }}
            >
              <LuPlus size={17} />

              <Text ml="7px">
                Add Family Head
              </Text>
            </Button>
          </HStack>
        </Flex>

        {/* FILTER BAR */}

        <Box
          width="100%"
          minW="0"
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            sm: "1.5fr 1fr",
            lg: "minmax(0, 1.55fr) minmax(130px, .85fr) minmax(130px, .85fr) minmax(130px, .85fr) 105px",
          }}
          gap={{
            base: "9px",
            lg: "10px",
          }}
          mb="23px"
        >
          <Box
            position="relative"
            minW="0"
          >
            <Box
              position="absolute"
              left="12px"
              top="50%"
              transform="translateY(-50%)"
              color="var(--primary-maroon)"
              zIndex={1}
            >
              <LuSearch size={17} />
            </Box>

            <Input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search name, family, house or mobile"
              pl="36px"
              pr="10px"
              h="38px"
              minH="38px"
              width="100%"
              fontSize="11px"
              borderColor="var(--border-color)"
              borderRadius="5px"
              color="var(--dark-text)"
              bg="var(--white)"
              _placeholder={{
                color:
                  "var(--light-gray)",
              }}
              _focus={{
                borderColor:
                  "var(--primary-maroon)",
                boxShadow:
                  "0 0 0 1px var(--primary-maroon)",
              }}
            />
          </Box>

          {/* WARD */}

          <Box minW="0">
            <select
              value={filterWard}
              onChange={(e) =>
                setFilterWard(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                height: "38px",
                padding: "0 9px",
                border:
                  "1px solid var(--border-color)",
                borderRadius: "5px",
                fontSize: "11px",
                color:
                  "var(--light-gray)",
                background:
                  "var(--white)",
                outline: "none",
              }}
            >
              <option value="">
                All Wards
              </option>

              {wards.map((ward) => (
                <option
                  key={ward.id}
                  value={ward.id}
                >
                  {ward.ward_name}
                </option>
              ))}
            </select>
          </Box>

          {/* GRADE */}

          <Box minW="0">
            <select
              value={filterGrade}
              onChange={(e) =>
                setFilterGrade(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                height: "38px",
                padding: "0 9px",
                border:
                  "1px solid var(--border-color)",
                borderRadius: "5px",
                fontSize: "11px",
                color:
                  "var(--light-gray)",
                background:
                  "var(--white)",
                outline: "none",
              }}
            >
              <option value="">
                All Grades
              </option>

              {grades.map((grade) => (
                <option
                  key={grade.id}
                  value={grade.id}
                >
                  {grade.name}
                </option>
              ))}
            </select>
          </Box>

          {/* STATUS */}

          <Box minW="0">
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                height: "38px",
                padding: "0 9px",
                border:
                  "1px solid var(--border-color)",
                borderRadius: "5px",
                fontSize: "11px",
                color:
                  "var(--light-gray)",
                background:
                  "var(--white)",
                outline: "none",
              }}
            >
              <option value="">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </Box>

          {/* CLEAR */}

          <Button
            width="100%"
            minW="0"
            h="38px"
            minH="38px"
            px="10px"
            variant="outline"
            borderColor="var(--primary-maroon)"
            color="var(--primary-maroon)"
            bg="var(--white)"
            fontSize="11px"
            borderRadius="5px"
            fontWeight="500"
            onClick={() => {
              if (
                search ||
                filterWard ||
                filterGrade ||
                filterStatus
              ) {
                clearFilters();
              }
            }}
            _hover={{
              bg:
                "var(--light-maroon-bg)",
            }}
          >
            <LuFilter size={15} />

            <Text ml="6px">
              {search ||
              filterWard ||
              filterGrade ||
              filterStatus
                ? "Clear"
                : "Filter"}
            </Text>
          </Button>
        </Box>

        {/* DIRECTORY HEADER */}

        <Flex
          justify="space-between"
          align="flex-end"
          mb="12px"
        >
          <Box>
            <Heading
              color="var(--dark-text)"
              fontSize={{
                base: "19px",
                md: "20px",
              }}
              fontWeight="700"
              lineHeight="1.2"
            >
              Family Head Directory
            </Heading>

            <Text
              color="var(--light-gray)"
              fontSize="12px"
              mt="4px"
            >
              Showing {showingFrom}-
              {showingTo} of{" "}
              {totalItems} family heads
            </Text>
          </Box>
        </Flex>

        {/* ERROR */}

        {error && (
          <Box
            mb="14px"
            p="10px 13px"
            border="1px solid"
            borderColor="var(--danger)"
            bg="var(--light-bg)"
            borderRadius="6px"
          >
            <Text
              color="var(--danger)"
              fontSize="12px"
            >
              {error}
            </Text>
          </Box>
        )}

        {/* LOADING / EMPTY / CARDS */}

        {loading ? (
          <Box
            border="1px solid"
            borderColor="var(--border-color)"
            borderRadius="7px"
            py="90px"
            textAlign="center"
            bg="var(--white)"
          >
            <Text
              color="var(--light-gray)"
              fontSize="13px"
            >
              Loading family heads...
            </Text>
          </Box>
        ) : paginatedHeads.length ===
          0 ? (
          <Box
            border="1px solid"
            borderColor="var(--border-color)"
            borderRadius="7px"
            py="90px"
            textAlign="center"
            bg="var(--white)"
          >
            <Text
              color="var(--light-gray)"
              fontSize="13px"
            >
              No family heads found.
            </Text>

            <Button
              mt="14px"
              bg="var(--primary-maroon)"
              color="var(--white)"
              fontSize="12px"
              onClick={clearFilters}
              _hover={{
                bg:
                  "var(--primary-maroon)",
                opacity: 0.9,
              }}
            >
              Clear Filters
            </Button>
          </Box>
        ) : (
          <SimpleGrid
            width="100%"
            minW="0"
            columns={{
              base: 1,
              md: 2,
              xl: 3,
            }}
            gap={{
              base: "13px",
              md: "15px",
              xl: "16px",
            }}
          >
            {paginatedHeads.map(
              (head) => (
                <Box
                  key={head.id}
                  width="100%"
                  minW="0"
                  bg="var(--white)"
                  border="1px solid"
                  borderColor="var(--border-color)"
                  borderRadius="7px"
                  overflow="hidden"
                  height={{
                    base: "auto",
                    xl: "201px",
                  }}
                  minH="201px"
                  transition="all 0.18s ease"
                  _hover={{
                    borderColor:
                      "var(--muted-border)",
                    boxShadow:
                      "0 5px 18px rgba(30,45,70,0.08)",
                    transform:
                      "translateY(-1px)",
                  }}
                >
                  {/* CARD MAIN */}

                  <Box
                    px={{
                      base: "14px",
                      md: "15px",
                    }}
                    pt={{
                      base: "14px",
                      md: "15px",
                    }}
                    pb="10px"
                    height="160px"
                  >
                    <Flex
                      gap="15px"
                      align="flex-start"
                      width="100%"
                      minW="0"
                    >
                      {/* AVATAR */}

                      <Avatar.Root
                        width={{
                          base: "88px",
                          md: "91px",
                          xl: "93px",
                        }}
                        height={{
                          base: "88px",
                          md: "91px",
                          xl: "93px",
                        }}
                        minWidth={{
                          base: "88px",
                          md: "91px",
                          xl: "93px",
                        }}
                        borderRadius="50%"
                        flexShrink={0}
                      >
                        {head.family_image && (
                          <Avatar.Image
                            src={
                              head.family_image
                            }
                            alt={
                              head.name ||
                              "Family Head"
                            }
                            width="100%"
                            height="100%"
                            objectFit="cover"
                          />
                        )}

                        <Avatar.Fallback
                          name={
                            head.name ||
                            "Family Head"
                          }
                          bg="var(--light-maroon-bg)"
                          color="var(--primary-maroon)"
                          fontSize="27px"
                          fontWeight="600"
                        />
                      </Avatar.Root>

                      {/* CARD CONTENT */}

                      <Box
                        flex="1"
                        minW="0"
                        overflow="hidden"
                      >
                        {/* NAME + STATUS */}

                        <Flex
                          justify="space-between"
                          align="flex-start"
                          gap="9px"
                          width="100%"
                        >
                          <Box
                            minW="0"
                            flex="1"
                          >
                            <Heading
                              fontSize={{
                                base: "17px",
                                md: "18px",
                              }}
                              color="var(--dark-text)"
                              fontWeight="700"
                              lineHeight="1.2"
                              lineClamp={1}
                            >
                              {head.name ||
                                "Unnamed"}
                            </Heading>

                            {/* FAMILY + HOUSE TEXT BLACK */}

                            <Flex
                              align="center"
                              gap="6px"
                              mt="6px"
                              minW="0"
                              maxW="100%"
                            >
                              <Text
                                fontSize="11.5px"
                                color="var(--dark-text)"
                                fontWeight="500"
                                lineClamp={1}
                                minW="0"
                              >
                                {head.family_name ||
                                  "N/A"}
                              </Text>

                              <Text
                                color="var(--dark-text)"
                                fontSize="10px"
                                flexShrink={0}
                              >
                                •
                              </Text>

                              <Text
                                fontSize="11.5px"
                                color="var(--dark-text)"
                                fontWeight="500"
                                lineClamp={1}
                                minW="0"
                              >
                                {head.house_name ||
                                  "N/A"}
                              </Text>
                            </Flex>
                          </Box>

                          {/* STATUS */}

                          <Box
                            flexShrink={0}
                            px="8px"
                            py="4px"
                            borderRadius="4px"
                            bg="var(--light-bg)"
                            color={
                              head.is_active
                                ? "var(--success)"
                                : "var(--light-gray)"
                            }
                            border="1px solid"
                            borderColor={
                              head.is_active
                                ? "var(--success)"
                                : "var(--muted-border)"
                            }
                            fontSize="10.5px"
                            fontWeight="500"
                            lineHeight="1"
                          >
                            {head.is_active
                              ? "Active"
                              : "Inactive"}
                          </Box>
                        </Flex>

                        {/* DETAILS */}

                        <VStack
                          align="stretch"
                          gap="5px"
                          mt="10px"
                        >
                          {/* WARD */}

                          <HStack
                            gap="8px"
                            minW="0"
                          >
                            {/* DETAILS ICON BLACK */}

                            <Box
                              color="var(--dark-text)"
                              flexShrink={0}
                            >
                              <LuMapPin
                                size={14}
                              />
                            </Box>

                            {/* DETAILS TEXT BLACK */}

                            <Text
                              fontSize="10.5px"
                              color="var(--dark-text)"
                              fontWeight="500"
                              lineClamp={1}
                            >
                              {head.ward_name ||
                                "N/A"}
                            </Text>
                          </HStack>

                          {/* GRADE */}

                          <HStack
                            gap="8px"
                            minW="0"
                          >
                            <Box
                              color="var(--dark-text)"
                              flexShrink={0}
                            >
                              <LuGraduationCap
                                size={14}
                              />
                            </Box>

                            <Text
                              fontSize="10.5px"
                              color="var(--dark-text)"
                              fontWeight="500"
                              lineClamp={1}
                            >
                              {head.grade_name ||
                                "N/A"}
                            </Text>
                          </HStack>

                          {/* PHONE */}

                          <HStack
                            gap="8px"
                            minW="0"
                          >
                            <Box
                              color="var(--dark-text)"
                              flexShrink={0}
                            >
                              <LuPhone
                                size={14}
                              />
                            </Box>

                            <Text
                              fontSize="10.5px"
                              color="var(--dark-text)"
                              fontWeight="500"
                              lineClamp={1}
                            >
                              {head.mobile_no ||
                                head.mobile ||
                                head.phone ||
                                "N/A"}
                            </Text>
                          </HStack>

                          {/* DEPENDENTS */}

                          <HStack
                            gap="8px"
                            minW="0"
                          >
                            <Box
                              color="var(--dark-text)"
                              flexShrink={0}
                            >
                              <LuUsers
                                size={14}
                              />
                            </Box>

                            <Text
                              fontSize="10.5px"
                              color="var(--dark-text)"
                              fontWeight="500"
                              lineClamp={1}
                            >
                              {head.total_dependents ??
                                0}{" "}
                              {(head.total_dependents ??
                                0) === 1
                                ? "Dependent"
                                : "Dependents"}
                            </Text>
                          </HStack>
                        </VStack>
                      </Box>
                    </Flex>
                  </Box>

                  {/* =================================================
                      ACTION BAR BELOW DIVIDER
                      ONLY THESE ICONS ARE MAROON
                  ================================================== */}

                  <Box
                    borderTop="1px solid"
                    borderColor="var(--divider-color)"
                    px="12px"
                    py="5px"
                    height="40px"
                    bg="var(--white)"
                  >
                    <Flex
                      justify="flex-end"
                      align="center"
                      height="100%"
                    >
                      <HStack gap="6px">
                        {/* MEMBERS ICON MAROON */}

                        <Button
                          variant="ghost"
                          h="27px"
                          minW="27px"
                          p="0"
                          color="var(--primary-maroon)"
                          title="Members"
                          onClick={() =>
                            navigate(
                              `/family-heads/${head.id}/members`
                            )
                          }
                          _hover={{
                            bg:
                              "var(--light-maroon-bg)",
                            color:
                              "var(--primary-maroon)",
                          }}
                        >
                          <LuUserPlus
                            size={17}
                          />
                        </Button>

                        {/* VIEW ICON MAROON */}

                        <Button
                          variant="ghost"
                          h="27px"
                          minW="27px"
                          p="0"
                          color="var(--primary-maroon)"
                          title="View"
                          onClick={() =>
                            navigate(
                              `/family-heads/${head.id}`
                            )
                          }
                          _hover={{
                            bg:
                              "var(--light-maroon-bg)",
                            color:
                              "var(--primary-maroon)",
                          }}
                        >
                          <LuEye
                            size={17}
                          />
                        </Button>

                        {/* EDIT ICON MAROON */}

                        <Button
                          variant="ghost"
                          h="27px"
                          minW="27px"
                          p="0"
                          color="var(--primary-maroon)"
                          title="Edit"
                          onClick={() =>
                            navigate(
                              `/family-heads/${head.id}/edit`
                            )
                          }
                          _hover={{
                            bg:
                              "var(--light-maroon-bg)",
                            color:
                              "var(--primary-maroon)",
                          }}
                        >
                          <LuPencil
                            size={17}
                          />
                        </Button>
                      </HStack>
                    </Flex>
                  </Box>
                </Box>
              )
            )}
          </SimpleGrid>
        )}

        {/* PAGINATION */}

        <Flex
          mt="13px"
          align="center"
          justify="space-between"
          direction={{
            base: "column",
            md: "row",
          }}
          gap="12px"
          width="100%"
        >
          <Text
            color="var(--light-gray)"
            fontSize="11px"
          >
            Showing {showingFrom}-
            {showingTo} of {totalItems}{" "}
            family heads
          </Text>

          <HStack
            gap="4px"
            flexShrink={0}
          >
            {/* PREVIOUS */}

            <Button
              variant="outline"
              h="32px"
              px="10px"
              borderColor="var(--border-color)"
              color="var(--primary-maroon)"
              bg="var(--white)"
              fontSize="11px"
              fontWeight="400"
              borderRadius="5px"
              disabled={safePage === 1}
              onClick={() =>
                setPage((prev) =>
                  Math.max(
                    1,
                    prev - 1
                  )
                )
              }
              _hover={{
                bg:
                  "var(--light-maroon-bg)",
              }}
            >
              <LuChevronLeft
                size={14}
              />

              <Text ml="3px">
                Previous
              </Text>
            </Button>

            {/* PAGE NUMBERS */}

            {getPageNumbers().map(
              (
                pageNumber,
                index
              ) => {
                if (
                  pageNumber ===
                  "..."
                ) {
                  return (
                    <Text
                      key={`dots-${index}`}
                      px="5px"
                      color="var(--light-gray)"
                      fontSize="12px"
                    >
                      ...
                    </Text>
                  );
                }

                return (
                  <Button
                    key={pageNumber}
                    h="32px"
                    minW="32px"
                    px="7px"
                    border="1px solid"
                    borderColor={
                      safePage ===
                      pageNumber
                        ? "var(--primary-maroon)"
                        : "var(--border-color)"
                    }
                    bg={
                      safePage ===
                      pageNumber
                        ? "var(--primary-maroon)"
                        : "var(--white)"
                    }
                    color={
                      safePage ===
                      pageNumber
                        ? "var(--white)"
                        : "var(--info)"
                    }
                    fontSize="11px"
                    fontWeight="500"
                    borderRadius="5px"
                    onClick={() =>
                      setPage(
                        pageNumber
                      )
                    }
                    _hover={{
                      bg:
                        safePage ===
                        pageNumber
                          ? "var(--primary-maroon)"
                          : "var(--light-bg)",
                    }}
                  >
                    {pageNumber}
                  </Button>
                );
              }
            )}

            {/* NEXT */}

            <Button
              variant="outline"
              h="32px"
              px="10px"
              borderColor="var(--border-color)"
              color="var(--primary-maroon)"
              bg="var(--white)"
              fontSize="11px"
              fontWeight="400"
              borderRadius="5px"
              disabled={
                safePage ===
                totalPages
              }
              onClick={() =>
                setPage((prev) =>
                  Math.min(
                    totalPages,
                    prev + 1
                  )
                )
              }
              _hover={{
                bg:
                  "var(--light-maroon-bg)",
              }}
            >
              <Text mr="3px">
                Next
              </Text>

              <LuChevronRight
                size={14}
              />
            </Button>
          </HStack>
        </Flex>
      </Container>

      {/* =========================================================
          HEADLESS FAMILIES DIALOG
      ========================================================== */}

      <Dialog.Root
        open={isOpen}
        onOpenChange={(details) => {
          if (!details.open) {
            onClose();
          }
        }}
        size="xl"
        placement="center"
        scrollBehavior="inside"
      >
        <Dialog.Backdrop />

        <Dialog.Positioner>
          <Dialog.Content maxW="800px">
            <Dialog.Header>
              <Flex
                align="center"
                gap="12px"
                pr="35px"
              >
                <Box
                  bg="var(--warning-bg)"
                  p="8px"
                  borderRadius="8px"
                  color="var(--warning-color)"
                >
                  <LuCircleAlert
                    size={22}
                  />
                </Box>

                <Box>
                  <Dialog.Title>
                    <Heading
                      size="md"
                      color="var(--dark-text)"
                    >
                      Headless Families
                    </Heading>
                  </Dialog.Title>

                  <Text
                    fontSize="sm"
                    color="var(--light-gray)"
                    fontWeight="400"
                    mt="2px"
                  >
                    Households with active
                    members but no active
                    family head
                  </Text>
                </Box>
              </Flex>
            </Dialog.Header>

            <Dialog.CloseTrigger asChild>
              <Button
                variant="ghost"
                position="absolute"
                top="10px"
                right="10px"
                minW="32px"
                h="32px"
                p="0"
                fontSize="18px"
                color="var(--light-gray)"
              >
                ×
              </Button>
            </Dialog.CloseTrigger>

            <Dialog.Body py="20px">
              {headlessFamilies.length ===
              0 ? (
                <Box
                  textAlign="center"
                  py="40px"
                >
                  <Box
                    bg="var(--success-bg)"
                    p="16px"
                    borderRadius="50%"
                    display="inline-flex"
                    mb="16px"
                    color="var(--success)"
                  >
                    <LuUsers size={32} />
                  </Box>

                  <Heading
                    size="sm"
                    color="var(--dark-text)"
                    mb="6px"
                  >
                    All Families Have Heads
                  </Heading>

                  <Text
                    color="var(--light-gray)"
                    fontSize="sm"
                  >
                    Every household with
                    active members has a
                    family head assigned.
                  </Text>
                </Box>
              ) : (
                <VStack
                  align="stretch"
                  gap="14px"
                >
                  {headlessFamilies.map(
                    (
                      item,
                      index
                    ) => (
                      <Box
                        key={`${item.family_id}-${item.house_sequence}-${index}`}
                        border="1px solid"
                        borderColor="var(--border-color)"
                        borderRadius="8px"
                        p="16px"
                        bg="var(--white)"
                        _hover={{
                          borderColor:
                            "var(--warning-color)",
                          boxShadow:
                            "0 2px 12px rgba(0,0,0,0.05)",
                        }}
                      >
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
                        >
                          <Box flex="1">
                            <Flex
                              align="center"
                              gap="8px"
                              mb="4px"
                            >
                              <Heading
                                size="sm"
                                color="var(--dark-text)"
                              >
                                {
                                  item.family_name
                                }
                              </Heading>

                              <Badge
                                bg="var(--danger)"
                                color="var(--white)"
                                fontSize="10px"
                                px="6px"
                                py="2px"
                                borderRadius="full"
                              >
                                No Head
                              </Badge>
                            </Flex>

                            <HStack
                              gap="16px"
                              flexWrap="wrap"
                            >
                              <HStack gap="4px">
                                <LuMapPin
                                  size={13}
                                  color="var(--light-gray)"
                                />

                                <Text
                                  fontSize="12px"
                                  color="var(--light-gray)"
                                >
                                  {item.house_name ||
                                    "Unnamed House"}
                                </Text>
                              </HStack>

                              <HStack gap="4px">
                                <LuUsers
                                  size={13}
                                  color="var(--light-gray)"
                                />

                                <Text
                                  fontSize="12px"
                                  color="var(--light-gray)"
                                >
                                  {
                                    item.member_count
                                  }{" "}
                                  {item.member_count ===
                                  1
                                    ? "member"
                                    : "members"}
                                </Text>
                              </HStack>

                              {item.ward && (
                                <Text
                                  fontSize="12px"
                                  color="var(--light-gray)"
                                >
                                  Ward:{" "}
                                  {item.ward}
                                </Text>
                              )}
                            </HStack>

                            {item.members
                              .length >
                              0 && (
                              <Box mt="8px">
                                <Text
                                  fontSize="11px"
                                  color="var(--light-gray)"
                                  mb="4px"
                                >
                                  Members:
                                </Text>

                                <Flex
                                  gap="4px"
                                  flexWrap="wrap"
                                >
                                  {item.members
                                    .slice(
                                      0,
                                      5
                                    )
                                    .map(
                                      (
                                        member
                                      ) => (
                                        <Badge
                                          key={
                                            member.id
                                          }
                                          bg="var(--light-maroon-bg)"
                                          color="var(--primary-maroon)"
                                          fontSize="10px"
                                          px="6px"
                                          py="2px"
                                          borderRadius="4px"
                                        >
                                          {
                                            member.name
                                          }

                                          {member.is_family_head && (
                                            <Box
                                              as="span"
                                              ml="4px"
                                            >
                                              👑
                                            </Box>
                                          )}
                                        </Badge>
                                      )
                                    )}

                                  {item.members
                                    .length >
                                    5 && (
                                    <Badge
                                      bg="var(--border-color)"
                                      color="var(--light-gray)"
                                      fontSize="10px"
                                      px="6px"
                                      py="2px"
                                      borderRadius="4px"
                                    >
                                      +
                                      {item
                                        .members
                                        .length -
                                        5}{" "}
                                      more
                                    </Badge>
                                  )}
                                </Flex>
                              </Box>
                            )}
                          </Box>

                          <HStack
                            gap="8px"
                            flexShrink={0}
                            width={{
                              base: "100%",
                              md: "auto",
                            }}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              borderColor="var(--primary-maroon)"
                              color="var(--primary-maroon)"
                              fontSize="11px"
                              px="12px"
                              h="32px"
                              onClick={() =>
                                handleViewDetails(
                                  item
                                )
                              }
                              _hover={{
                                bg: "var(--light-maroon-bg)",
                              }}
                              flex={{
                                base: 1,
                                md: "initial",
                              }}
                            >
                              <LuEye
                                size={14}
                              />

                              <Text ml="6px">
                                View Details
                              </Text>
                            </Button>

                            <Button
                              size="sm"
                              bg="var(--primary-maroon)"
                              color="var(--white)"
                              fontSize="11px"
                              px="16px"
                              h="32px"
                              onClick={() =>
                                handlePromoteFromHeadless(
                                  item.family_id,
                                  item.house_name,
                                  item.house_sequence
                                )
                              }
                              _hover={{
                                bg:
                                  "var(--primary-maroon)",
                                opacity: 0.9,
                              }}
                              flex={{
                                base: 1,
                                md: "initial",
                              }}
                            >
                              <LuUserPlus
                                size={14}
                              />

                              <Text ml="6px">
                                Promote Head
                              </Text>
                            </Button>
                          </HStack>
                        </Flex>
                      </Box>
                    )
                  )}
                </VStack>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Flex
                width="100%"
                justify="space-between"
                align="center"
                gap="12px"
              >
                <Text
                  color="var(--light-gray)"
                  fontSize="11px"
                >
                  {headlessFamilies.length}{" "}
                  headless{" "}
                  {headlessFamilies.length ===
                  1
                    ? "family"
                    : "families"}{" "}
                  found
                </Text>

                <Dialog.CloseTrigger
                  asChild
                >
                  <Button
                    variant="outline"
                    borderColor="var(--border-color)"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </Dialog.CloseTrigger>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* =========================================================
          DETAIL VIEW DIALOG
      ========================================================== */}

      <Dialog.Root
        open={isDetailOpen}
        onOpenChange={(details) => {
          if (!details.open) {
            onDetailClose();
            setSelectedHousehold(null);
          }
        }}
        size="xl"
        placement="center"
        scrollBehavior="inside"
      >
        <Dialog.Backdrop />

        <Dialog.Positioner>
          <Dialog.Content maxW="700px">
            <Dialog.Header>
              <Flex
                align="center"
                gap="12px"
                pr="35px"
              >
                <Box
                  bg="var(--light-maroon-bg)"
                  p="8px"
                  borderRadius="8px"
                  color="var(--primary-maroon)"
                >
                  <LuUsers size={22} />
                </Box>

                <Box>
                  <Dialog.Title>
                    <Heading
                      size="md"
                      color="var(--dark-text)"
                    >
                      {selectedHousehold?.family_name ||
                        "Family Details"}
                    </Heading>
                  </Dialog.Title>

                  <Text
                    fontSize="sm"
                    color="var(--light-gray)"
                    fontWeight="400"
                    mt="2px"
                  >
                    House:{" "}
                    {selectedHousehold?.house_name ||
                      "Unnamed"}{" "}
                    •{" "}
                    {selectedHousehold?.member_count ||
                      0}{" "}
                    members
                  </Text>
                </Box>
              </Flex>
            </Dialog.Header>

            <Dialog.CloseTrigger asChild>
              <Button
                variant="ghost"
                position="absolute"
                top="10px"
                right="10px"
                minW="32px"
                h="32px"
                p="0"
                fontSize="18px"
                color="var(--light-gray)"
              >
                ×
              </Button>
            </Dialog.CloseTrigger>

            <Dialog.Body py="20px">
              {selectedHousehold ? (
                <VStack
                  align="stretch"
                  gap="16px"
                >
                  <SimpleGrid
                    columns={{
                      base: 1,
                      sm: 2,
                    }}
                    gap="12px"
                  >
                    {[
                      [
                        "Family",
                        selectedHousehold.family_name,
                      ],
                      [
                        "House",
                        selectedHousehold.house_name ||
                          "Unnamed House",
                      ],
                      [
                        "Ward",
                        selectedHousehold.ward ||
                          "N/A",
                      ],
                      [
                        "Member Count",
                        `${selectedHousehold.member_count} members`,
                      ],
                    ].map(
                      ([label, value]) => (
                        <Box
                          key={label}
                          p="12px"
                          border="1px solid"
                          borderColor="var(--border-color)"
                          borderRadius="6px"
                          bg="var(--light-bg)"
                        >
                          <Text
                            fontSize="10px"
                            color="var(--light-gray)"
                            textTransform="uppercase"
                            letterSpacing="0.5px"
                          >
                            {label}
                          </Text>

                          <Text
                            fontSize="14px"
                            fontWeight="600"
                            color="var(--dark-text)"
                            mt="2px"
                          >
                            {value}
                          </Text>
                        </Box>
                      )
                    )}
                  </SimpleGrid>

                  {/* MEMBERS TABLE */}

                  <Box>
                    <Text
                      fontSize="13px"
                      fontWeight="600"
                      color="var(--dark-text)"
                      mb="10px"
                    >
                      Member Details
                    </Text>

                    <Box
                      border="1px solid"
                      borderColor="var(--border-color)"
                      borderRadius="6px"
                      overflowX="auto"
                    >
                      <Table.Root
                        size="sm"
                        variant="outline"
                        width="100%"
                      >
                        <Table.Header
                          bg="var(--light-bg)"
                        >
                          <Table.Row>
                            <Table.ColumnHeader
                              fontSize="10px"
                              textTransform="uppercase"
                              color="var(--light-gray)"
                              whiteSpace="nowrap"
                            >
                              Name
                            </Table.ColumnHeader>

                            <Table.ColumnHeader
                              fontSize="10px"
                              textTransform="uppercase"
                              color="var(--light-gray)"
                              whiteSpace="nowrap"
                            >
                              Gender
                            </Table.ColumnHeader>

                            <Table.ColumnHeader
                              fontSize="10px"
                              textTransform="uppercase"
                              color="var(--light-gray)"
                              whiteSpace="nowrap"
                            >
                              Relationship
                            </Table.ColumnHeader>

                            <Table.ColumnHeader
                              fontSize="10px"
                              textTransform="uppercase"
                              color="var(--light-gray)"
                              whiteSpace="nowrap"
                            >
                              Mobile
                            </Table.ColumnHeader>

                            <Table.ColumnHeader
                              fontSize="10px"
                              textTransform="uppercase"
                              color="var(--light-gray)"
                              whiteSpace="nowrap"
                            >
                              Status
                            </Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>

                        <Table.Body>
                          {selectedHousehold.members.map(
                            (member) => (
                              <Table.Row
                                key={
                                  member.id
                                }
                              >
                                <Table.Cell
                                  fontSize="12px"
                                  fontWeight="500"
                                  color="var(--dark-text)"
                                  whiteSpace="nowrap"
                                >
                                  {
                                    member.name
                                  }

                                  {member.is_family_head && (
                                    <Badge
                                      ml="6px"
                                      bg="var(--primary-maroon)"
                                      color="var(--white)"
                                      fontSize="9px"
                                      px="4px"
                                      py="1px"
                                      borderRadius="3px"
                                    >
                                      Head
                                    </Badge>
                                  )}
                                </Table.Cell>

                                <Table.Cell
                                  fontSize="12px"
                                  color="var(--dark-text)"
                                  whiteSpace="nowrap"
                                >
                                  {member.gender ||
                                    "N/A"}
                                </Table.Cell>

                                <Table.Cell
                                  fontSize="12px"
                                  color="var(--dark-text)"
                                  whiteSpace="nowrap"
                                >
                                  {member.relationship
                                    ?.name ||
                                    "N/A"}
                                </Table.Cell>

                                <Table.Cell
                                  fontSize="12px"
                                  color="var(--dark-text)"
                                  whiteSpace="nowrap"
                                >
                                  {member.mobile_no ||
                                    member.phone ||
                                    "N/A"}
                                </Table.Cell>

                                <Table.Cell>
                                  <Badge
                                    bg={
                                      member.is_active
                                        ? "var(--success)"
                                        : "var(--light-gray)"
                                    }
                                    color="var(--white)"
                                    fontSize="9px"
                                    px="6px"
                                    py="1px"
                                    borderRadius="3px"
                                  >
                                    {member.is_active
                                      ? "Active"
                                      : "Inactive"}
                                  </Badge>
                                </Table.Cell>
                              </Table.Row>
                            )
                          )}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                  </Box>
                </VStack>
              ) : (
                <Text
                  color="var(--light-gray)"
                  textAlign="center"
                  py="20px"
                >
                  No details available.
                </Text>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Flex
                width="100%"
                justify="flex-end"
                gap="12px"
              >
                <Button
                  variant="outline"
                  borderColor="var(--primary-maroon)"
                  color="var(--primary-maroon)"
                  onClick={() => {
                    onDetailClose();
                    setSelectedHousehold(
                      null
                    );
                  }}
                >
                  Close
                </Button>

                {selectedHousehold && (
                  <Button
                    bg="var(--primary-maroon)"
                    color="var(--white)"
                    onClick={() => {
                      onDetailClose();

                      handlePromoteFromHeadless(
                        selectedHousehold.family_id,
                        selectedHousehold.house_name,
                        selectedHousehold.house_sequence
                      );
                    }}
                    _hover={{
                      bg:
                        "var(--primary-maroon)",
                      opacity: 0.9,
                    }}
                  >
                    <LuUserPlus
                      size={14}
                    />

                    <Text ml="6px">
                      Promote Head
                    </Text>
                  </Button>
                )}
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <Footer />

      {/* =========================================================
          CSS
      ========================================================== */}

      <style>
        {`
          html,
          body,
          #root {
            max-width: 100%;
            overflow-x: hidden !important;
          }

          * {
            box-sizing: border-box;
          }

          :root {
            --warning-color: #d97706;
            --warning-bg: #fef3c7;
            --danger: #dc2626;
            --success: #16a34a;
            --success-bg: #dcfce7;
          }

          @media print {
            nav,
            header,
            footer {
              display: none !important;
            }

            button,
            input,
            select {
              display: none !important;
            }

            body {
              background: var(--white) !important;
              overflow: visible !important;
            }

            .chakra-container {
              max-width: 100% !important;
              width: 100% !important;
            }

            @page {
              margin: 10mm;
            }
          }

          @media (max-width: 1199px) {
            .family-head-filter-row {
              gap: 8px !important;
            }
          }

          @media (max-width: 991px) {
            .family-head-card {
              min-height: auto !important;
              height: auto !important;
            }
          }

          @media (max-width: 600px) {
            body {
              overflow-x: hidden !important;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default FamilyHeadDashboard;