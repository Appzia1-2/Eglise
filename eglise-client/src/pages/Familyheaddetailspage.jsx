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
import ChurchPrintModal from "../components/ChurchPrintModal";

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
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
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
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAge = (dob) => {
  if (!dob) return "—";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "—";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
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
   SMALL INFO ROW (Screen)
============================================================ */

const InfoRow = ({ icon, label, value, width = "170px" }) => {
  return (
    <Flex align="center" gap="10px" minW="0">
      {icon && <Box color={RED} flexShrink="0">{icon}</Box>}
      <Text fontSize="11px" color={TEXT} minW={width} flexShrink="0">
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
   SECTION CARD (Screen)
============================================================ */

const SectionCard = ({ title, icon, children }) => {
  return (
    <Box
      bg="var(--white)"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="7px"
      px={{ base: "14px", md: "18px" }}
      py="12px"
      width="100%"
    >
      <Flex align="center" gap="9px" mb="8px">
        <Box color={RED}>{icon}</Box>
        <Text color={NAVY} fontSize="16px" fontWeight="700">
          {title}
        </Text>
      </Flex>
      {children}
    </Box>
  );
};

/* ============================================================
   PRINT CONTENT (Static replica for PDF)
============================================================ */

const FamilyHeadPrintContent = ({ head, familyName, wardName, gradeName, members, relationships }) => {
  if (!head) return null;

  const address = head?.address || "—";

  const getRelation = (member) => {
    if (!member?.relationship) return "—";
    if (typeof member.relationship === "object") return member.relationship.name || "—";
    const found = relationships.find((r) => String(r.id) === String(member.relationship));
    return found?.name || "—";
  };

  const getMemberPhone = (member) => {
    return member?.mobile_no || member?.phone_no || "—";
  };

  const thStyle = {
    padding: "6px 8px",
    fontSize: "10px",
    fontWeight: "700",
    color: NAVY,
    textAlign: "left",
    background: "#F8FAFC",
    borderBottom: `1px solid ${BORDER}`,
    fontFamily: "Georgia, serif",
  };

  const tdStyle = {
    padding: "6px 8px",
    fontSize: "10px",
    color: NAVY,
    borderBottom: `1px solid ${BORDER}`,
    fontFamily: "Georgia, serif",
  };

  const labelStyle = { fontSize: "9px", fontWeight: "600", color: MUTED, textTransform: "uppercase" };
  const valStyle = { fontSize: "11px", fontWeight: "600", color: NAVY, marginBottom: "8px" };

  return (
    <div style={{ fontFamily: "Georgia, serif", color: NAVY }}>
      {/* PROFILE CARD */}
      <div style={{ display: "flex", gap: "20px", border: `1px solid ${BORDER}`, padding: "16px", borderRadius: "6px", marginBottom: "16px", backgroundColor: "#FCFDFF" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#FFE8EB", color: RED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "bold", flexShrink: 0 }}>
          {getInitials(head.name)}
        </div>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 4px 0" }}>{head.name}</h2>
          <p style={{ fontSize: "12px", margin: "0 0 10px 0", color: MUTED }}>{familyName} • {head.house_name}</p>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div><div style={labelStyle}>Ward</div><div style={valStyle}>{wardName}</div></div>
            <div><div style={labelStyle}>Grade</div><div style={valStyle}>{gradeName}</div></div>
            <div><div style={labelStyle}>Phone</div><div style={valStyle}>{head.mobile_no || head.phone_no || "—"}</div></div>
            <div><div style={labelStyle}>Email</div><div style={valStyle}>{head.email || "—"}</div></div>
          </div>
        </div>
      </div>

      {/* PERSONAL DETAILS */}
      <div style={{ border: `1px solid ${BORDER}`, padding: "14px", borderRadius: "6px", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: "bold", borderBottom: `1px solid ${BORDER}`, paddingBottom: "6px", marginBottom: "12px" }}>Personal & Family Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <div><div style={labelStyle}>Gender</div><div style={valStyle}>{head.gender || "—"}</div></div>
          <div><div style={labelStyle}>Date of Birth</div><div style={valStyle}>{head.dob ? formatDate(head.dob) : "—"}</div></div>
          <div><div style={labelStyle}>Marital Status</div><div style={valStyle}>{head.marital_status || "—"}</div></div>
          <div><div style={labelStyle}>Spouse</div><div style={valStyle}>{head.spouse_name || "—"}</div></div>
          <div><div style={labelStyle}>Father</div><div style={valStyle}>{head.father_name || "—"}</div></div>
          <div><div style={labelStyle}>Mother</div><div style={valStyle}>{head.mother_name || "—"}</div></div>
          <div><div style={labelStyle}>Blood Group</div><div style={valStyle}>{head.blood_group || "—"}</div></div>
          <div><div style={labelStyle}>Profession</div><div style={valStyle}>{head.profession || "—"}</div></div>
          <div><div style={labelStyle}>Joining Date</div><div style={valStyle}>{head.joining_date ? formatDate(head.joining_date) : "—"}</div></div>
          <div style={{ gridColumn: "1 / -1" }}><div style={labelStyle}>Address</div><div style={valStyle}>{address}</div></div>
        </div>
      </div>

      {/* DEPENDENTS TABLE */}
      <div style={{ border: `1px solid ${BORDER}`, padding: "14px", borderRadius: "6px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: "bold", borderBottom: `1px solid ${BORDER}`, paddingBottom: "6px", marginBottom: "12px" }}>Family Dependents ({members.length})</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Relationship</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Age</th>
              <th style={thStyle}>Phone</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr key={i}>
                <td style={tdStyle}>{m.name || "Unnamed"}</td>
                <td style={tdStyle}>{getRelation(m)}</td>
                <td style={tdStyle}>{m.gender || "—"}</td>
                <td style={tdStyle}>{m.age ? `${m.age} Years` : "—"}</td>
                <td style={tdStyle}>{getMemberPhone(m)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
  const [relationships, setRelationships] = useState([]);
  const [wards, setWards] = useState([]);
  const [grades, setGrades] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [church, setChurch] = useState({ name: "Church Name", address: "" }); 

  useEffect(() => {
    fetchData();
  }, [headId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [headResponse, membersResponse, relationshipsResponse, wardsResponse, gradesResponse, familiesResponse] =
        await Promise.all([
          getMember(headId),
          listMembersByHead(headId),
          listRelationships(),
          listWards(),
          listGrades(),
          listFamilies(),
        ]);

      setHead(headResponse?.data || headResponse || null);
      setMembers(getArrayData(membersResponse));
      setRelationships(getArrayData(relationshipsResponse));
      setWards(getArrayData(wardsResponse));
      setGrades(getArrayData(gradesResponse));
      setFamilies(getArrayData(familiesResponse));
    } catch (error) {
      console.error("Error fetching family head:", error);
      window.alert("Failed to load family head details.");
      navigate("/family-heads");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     RELATED DATA (With robust fallbacks)
  ========================================================== */

  const familyName = useMemo(() => {
    if (!head) return "—";
    if (head.family_name) return head.family_name;
    if (typeof head.family === "object" && head.family?.family_name) return head.family.family_name;
    const familyId = typeof head.family === "object" ? head.family?.id : head.family;
    const found = families.find((item) => String(item.id) === String(familyId));
    return found?.family_name || getObjectName(head.family) || "—";
  }, [head, families]);

  const wardName = useMemo(() => {
    if (!head) return "—";
    if (head.ward_name) return head.ward_name;
    if (typeof head.ward === "object" && (head.ward?.ward_name || head.ward?.name)) {
      return head.ward.ward_name || head.ward.name;
    }
    const wardId = typeof head.ward === "object" ? head.ward?.id : head.ward;
    const found = wards.find((item) => String(item.id) === String(wardId));
    return found?.ward_name || found?.name || getObjectName(head.ward) || "—";
  }, [head, wards]);

  const gradeName = useMemo(() => {
    if (!head) return "—";
    if (head.grade_name) return head.grade_name;
    if (typeof head.grade === "object" && head.grade?.name) return head.grade.name;
    const gradeId = typeof head.grade === "object" ? head.grade?.id : head.grade;
    const found = grades.find((item) => String(item.id) === String(gradeId));
    return found?.name || getObjectName(head.grade) || "—";
  }, [head, grades]);

  const getRelationship = (member) => {
    const relationship = member?.relationship;
    if (!relationship) return "—";
    if (typeof relationship === "object") return getObjectName(relationship);
    const found = relationships.find((item) => String(item?.id) === String(relationship));
    return found?.name || found?.label || found?.title || "—";
  };

  const getMemberPhone = (member) => {
    return member?.mobile_no || member?.mobile || member?.phone_number || member?.phone || "—";
  };

  const headAge = head?.age ?? getAge(head?.dob);
  const memberSince = head?.joining_date || head?.member_since || head?.membership_date;
  const address = head?.address || [head?.address_line1, head?.address_line2, head?.city, head?.state, head?.postal_code].filter(Boolean).join(", ");

  if (loading) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg="var(--white)">
        <Navbar />
        <Center flex="1"><Spinner size="lg" color={RED} /></Center>
        <Footer />
      </Box>
    );
  }

  if (!head) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column">
        <Navbar />
        <Center flex="1"><Text color={TEXT}>Family head not found.</Text></Center>
        <Footer />
      </Box>
    );
  }

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg={PAGE_BG}>
      <Navbar />

      <Box
        flex="1"
        px={{ base: "18px", sm: "24px", md: "30px", lg: "42px", xl: "48px" }}
        pt={{ base: "18px", md: "20px" }}
        pb="20px"
      >
        <Box maxW="1580px" mx="auto" width="100%">
          {/* BREADCRUMB */}
          <Flex align="center" gap="8px" mb="10px" fontSize="11px">
            <Text color="#667085" cursor="pointer" onClick={() => navigate("/family-heads")}>Masters</Text>
            <Text color="#A3ADBE">/</Text>
            <Text color="#667085" cursor="pointer" onClick={() => navigate("/family-heads")}>Family Head Master</Text>
            <Text color="#A3ADBE">/</Text>
            <Text color="#667085">Family Head Details</Text>
          </Flex>

          {/* PAGE HEADER */}
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap="15px" mb="12px" flexDirection={{ base: "column", md: "row" }}>
            <Box>
              <Heading color={NAVY} fontSize={{ base: "25px", md: "29px", lg: "31px" }} lineHeight="1.15" fontWeight="700">
                Family Head Details
              </Heading>
              <Text color="#667085" fontSize="11px" mt="5px">
                View family head profile, parish membership and dependent information.
              </Text>
            </Box>

            <HStack gap="10px" flexWrap="wrap">
              <Button h="40px" px="18px" bg="var(--white)" color={RED} border="1px solid" borderColor={RED} borderRadius="5px" fontSize="11px" fontWeight="500" onClick={() => navigate("/family-heads")} _hover={{ bg: "#FFF8F8" }}>
                <LuArrowLeft size={17} /><Text ml="6px">Back</Text>
              </Button>

              {/* PRINT BUTTON */}
              <Button h="40px" px="18px" bg="var(--white)" color={RED} border="1px solid" borderColor={RED} borderRadius="5px" fontSize="11px" fontWeight="500" onClick={() => setIsPrintOpen(true)} _hover={{ bg: "#FFF8F8" }}>
                <LuFileDown size={17} /><Text ml="6px">Print</Text>
              </Button>

              {/* GENERATE PDF BUTTON */}
              <Button h="40px" px="18px" bg="var(--white)" color={RED} border="1px solid" borderColor={RED} borderRadius="5px" fontSize="11px" fontWeight="500" onClick={() => setIsPrintOpen(true)} _hover={{ bg: "#FFF8F8" }}>
                <LuFileDown size={17} /><Text ml="6px">Generate PDF</Text>
              </Button>

              <Button h="40px" px="18px" bg={RED} color="var(--white)" borderRadius="5px" fontSize="11px" fontWeight="500" onClick={() => navigate(`/family-heads/${headId}/edit`)} _hover={{ bg: RED_DARK }}>
                <LuPencil size={17} /><Text ml="6px">Edit Family Head</Text>
              </Button>
            </HStack>
          </Flex>

          {/* MAIN TWO COLUMN AREA */}
          <Grid templateColumns={{ base: "1fr", lg: "410px 1fr" }} gap={{ base: "14px", lg: "26px" }} alignItems="start">
            
            {/* LEFT PROFILE CARD */}
            <Box bg="var(--white)" border="1px solid" borderColor={BORDER} borderRadius="8px" px="28px" py="16px">
              <VStack gap="7px" align="center">
                <Avatar.Root size="2xl">
                  {(head?.family_image || head?.image || head?.photo || head?.image_url) ? (
                    <Avatar.Image src={head?.family_image || head?.image || head?.photo || head?.image_url} alt={head?.name || "Family Head"} />
                  ) : null}
                  <Avatar.Fallback>{getInitials(head?.name)}</Avatar.Fallback>
                </Avatar.Root>

                <Heading color={NAVY} fontSize="28px" lineHeight="1.1" fontWeight="700" textAlign="center">
                  {head?.name || "Family Head"}
                </Heading>

                <Flex align="center" justify="center" gap="8px" color="#62708B" fontSize="13px" flexWrap="wrap" textAlign="center">
                  <Text>{familyName}</Text>
                  <Text>•</Text>
                  <Text>{head?.house_name || "—"}</Text>
                </Flex>

                <Badge display="inline-flex" alignItems="center" gap="7px" px="12px" py="6px" bg={head?.is_active ? "#E9F8ED" : "var(--divider-color)"} border="1px solid" borderColor={head?.is_active ? "#B9E7C4" : "#D8D8D8"} color={head?.is_active ? "#25813B" : "#666666"} borderRadius="5px" fontSize="11px" fontWeight="500" mt="2px">
                  <Box w="10px" h="10px" borderRadius="full" bg={head?.is_active ? "#16A34A" : "#777777"} />
                  {head?.is_active ? "Active" : "Inactive"}
                </Badge>
              </VStack>

              <Box h="1px" bg="#E4E9F1" my="14px" />

              <VStack align="stretch" gap="13px">
                <InfoRow icon={<LuMapPin size={22} />} label="Ward" value={wardName} width="92px" />
                <InfoRow icon={<LuGraduationCap size={22} />} label="Grade" value={gradeName} width="92px" />
                <InfoRow icon={<LuCalendarDays size={22} />} label="Member Since" value={memberSince ? formatDate(memberSince) : "—"} width="92px" />
                <InfoRow icon={<LuMail size={22} />} label="Email" value={head?.email} width="92px" />
                <InfoRow icon={<LuPhone size={22} />} label="Mobile Number" value={head?.mobile_no || head?.phone_no || head?.phone_number} width="92px" />
              </VStack>
            </Box>

            {/* RIGHT CONTENT */}
            <VStack align="stretch" gap="8px">
              <SectionCard title="Personal & Family" icon={<LuUser size={21} />}>
                <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="0">
                  <Box pr={{ md: "22px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Baptism Name" value={head?.baptismal_name || head?.baptism_name} width="92px" />
                      <InfoRow label="Gender" value={head?.gender} width="92px" />
                      <InfoRow label="Date of Birth" value={head?.dob ? formatDate(head.dob) : "—"} width="92px" />
                    </VStack>
                  </Box>
                  <Box px={{ md: "22px" }} py={{ base: "10px", md: "0" }} borderRight={{ md: "1px solid #E0E6EF" }} borderTop={{ base: "1px solid #E0E6EF", md: "none" }} borderBottom={{ base: "1px solid #E0E6EF", md: "none" }} my={{ base: "9px", md: "0" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Age" value={headAge !== "—" ? `${headAge} Years` : "—"} width="92px" />
                      <InfoRow label="Blood Group" value={head?.blood_group} width="92px" />
                      <InfoRow label="Marital Status" value={head?.marital_status} width="92px" />
                    </VStack>
                  </Box>
                  <Box pl={{ md: "22px" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Spouse Name" value={head?.spouse_name} width="92px" />
                      <InfoRow label="Father Name" value={head?.father_name} width="92px" />
                      <InfoRow label="Mother Name" value={head?.mother_name} width="92px" />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              <SectionCard title="Contact & Address" icon={<LuMapPin size={21} />}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1.3fr" }} gap="0">
                  <Box pr={{ md: "25px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="House Name" value={head?.house_name} width="92px" />
                      <InfoRow label="Ward" value={wardName} width="92px" />
                    </VStack>
                  </Box>
                  <Box pl={{ md: "25px" }} mt={{ base: "10px", md: "0" }}>
                    <Flex align="flex-start" gap="10px">
                      <Box color={RED} flexShrink="0"><LuMapPin size={21} /></Box>
                      <Box>
                        <Text fontSize="11px" color={TEXT} mb="3px">Address</Text>
                        <Text fontSize="11px" color={NAVY} fontWeight="500" lineHeight="1.5">{address || "—"}</Text>
                      </Box>
                    </Flex>
                  </Box>
                </Grid>
              </SectionCard>

              <SectionCard title="Sacraments, Education & Parish" icon={<LuBookOpen size={21} />}>
                <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap="0">
                  <Box pr={{ md: "18px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow icon={<LuCalendarDays size={18} />} label="Date of Baptism" value={head?.date_of_baptism ? formatDate(head.date_of_baptism) : "—"} width="92px" />
                      <InfoRow icon={<LuHouse size={18} />} label="Parish of Baptism" value={head?.parish_of_baptism} width="92px" />
                    </VStack>
                  </Box>
                  <Box px={{ md: "18px" }} py={{ base: "10px", md: "0" }} borderRight={{ md: "1px solid #E0E6EF" }} borderTop={{ base: "1px solid #E0E6EF", md: "none" }} borderBottom={{ base: "1px solid #E0E6EF", md: "none" }} my={{ base: "9px", md: "0" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow icon={<LuCalendarDays size={18} />} label="Joining Date" value={head?.joining_date ? formatDate(head.joining_date) : "—"} width="92px" />
                      <InfoRow icon={<LuArrowLeftRight size={18} />} label="Transferred From" value={head?.transferred_from} width="92px" />
                    </VStack>
                  </Box>
                  <Box px={{ md: "18px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow icon={<LuGraduationCap size={18} />} label="Education" value={head?.educational_qualification} width="92px" />
                      <InfoRow icon={<LuBookOpen size={18} />} label="Sunday School" value={head?.sunday_school_qualification} width="92px" />
                    </VStack>
                  </Box>
                  <Box pl={{ md: "18px" }} mt={{ base: "10px", md: "0" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow icon={<LuBriefcaseBusiness size={18} />} label="Profession" value={head?.profession} width="92px" />
                      <InfoRow icon={<LuUser size={18} />} label="Status" value={head?.is_active ? "Active" : "Inactive"} width="92px" />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              <Box bg="var(--white)" border="1px solid" borderColor={BORDER} borderRadius="7px" px="10px" py="8px">
                <Flex align="center" gap="8px" mb="7px" px="2px">
                  <Text color={NAVY} fontSize="16px" fontWeight="700">Dependents</Text>
                  <Text color="#6C7890" fontSize="10px">{members.length} family members linked to this family head</Text>
                </Flex>

                {members.length === 0 ? (
                  <Box py="18px" textAlign="center"><Text fontSize="11px" color={MUTED}>No dependent records found.</Text></Box>
                ) : (
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="8px">
                    {members.map((member, index) => {
                      const memberName = member?.name || "Unnamed";
                      const relation = getRelationship(member);
                      const age = member?.age ?? getAge(member?.dob);
                      const phone = getMemberPhone(member);
                      const initials = getInitials(memberName);

                      return (
                        <Box key={member?.id || index} border="1px solid" borderColor="#DCE4EF" borderRadius="7px" px="12px" py="7px" bg="var(--white)">
                          <Flex align="center" gap="10px">
                            <Avatar.Root size="md" flexShrink="0">
                              <Avatar.Fallback bg={index % 4 === 0 ? "#FFE0E0" : index % 4 === 1 ? "#DFF5E5" : index % 4 === 2 ? "#EEE2FF" : "#FFF0CF"} color={NAVY} fontSize="13px" fontWeight="600">
                                {initials}
                              </Avatar.Fallback>
                            </Avatar.Root>

                            <Box flex="1" minW="0">
                              <Text color={NAVY} fontSize="11px" fontWeight="700" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{memberName}</Text>
                              <Badge mt="2px" bg="#EEF5FF" border="1px solid #D5E4FF" color="#2864C7" borderRadius="4px" px="6px" py="2px" fontSize="9px" fontWeight="500">{relation}</Badge>
                            </Box>

                            <Box minW="110px" borderLeft="1px solid #E1E6EE" pl="12px">
                              <Flex align="center" gap="6px" mb="5px">
                                <LuUser size={15} color={NAVY} />
                                <Text fontSize="10px" color={TEXT}>{age !== "—" ? `${age} Years` : "—"}</Text>
                              </Flex>
                              <Flex align="center" gap="6px">
                                <LuPhone size={15} color={NAVY} />
                                <Text fontSize="10px" color={TEXT} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{phone}</Text>
                              </Flex>
                            </Box>
                          </Flex>
                        </Box>
                      );
                    })}
                  </Grid>
                )}
              </Box>

              <Box bg="var(--white)" border="1px solid" borderColor={BORDER} borderRadius="7px" px="14px" py="9px">
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} alignItems="center" gap="10px">
                  <Flex align="center" gap="10px">
                    <Box color="#175CD3"><LuInfo size={22} /></Box>
                    <Text fontSize="12px" fontWeight="700" color={NAVY}>Record Information</Text>
                  </Flex>
                  <Flex align="center" gap="9px" borderLeft={{ md: "1px solid #DDE4EE" }} pl={{ md: "24px" }}>
                    <Box color={NAVY}><LuCalendarDays size={20} /></Box>
                    <Box>
                      <Text fontSize="9px" color={MUTED}>Created on</Text>
                      <Text fontSize="10px" color={NAVY} fontWeight="500">{head?.created_at ? formatDate(head.created_at) : "—"}</Text>
                    </Box>
                  </Flex>
                  <Flex align="center" gap="9px" borderLeft={{ md: "1px solid #DDE4EE" }} pl={{ md: "24px" }}>
                    <Box color={NAVY}><LuUser size={20} /></Box>
                    <Box>
                      <Text fontSize="9px" color={MUTED}>Last updated</Text>
                      <Text fontSize="10px" color={NAVY} fontWeight="500">{head?.updated_at ? formatDate(head.updated_at) : "Never"}</Text>
                    </Box>
                  </Flex>
                </Grid>
              </Box>
            </VStack>
          </Grid>
        </Box>
      </Box>

      {/* PRINT MODAL */}
      <ChurchPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="FAMILY HEAD PROFILE"
        subtitle={`${head?.name} • ${familyName}`}
        church={church}
        pdfFileName={`family-head-${head?.name?.replace(/\s+/g, '-').toLowerCase()}.pdf`}
        orientation="portrait"
        showHeader={false} // Hides the default church header to show your custom layout
      >
        <FamilyHeadPrintContent
          head={head}
          familyName={familyName}
          wardName={wardName}
          gradeName={gradeName}
          members={members}
          relationships={relationships}
        />
      </ChurchPrintModal>

      <Footer />
    </Box>
  );
};

export default FamilyHeadDetailsPage;