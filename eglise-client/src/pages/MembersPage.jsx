import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuUserPlus, LuCrown } from "react-icons/lu";
import {
  Box,
  Heading,
  Text,
  Table,
  Badge,
  Button,
  Accordion,
  HStack,
  Avatar,
  Spinner,
  Center,
} from "@chakra-ui/react";
import RegistryTable from "../components/RegistryTable";
import {
  listMembers,
  createHead,
  updateMember,
  deleteMember,
  listFamilies,
  listWards,
  listGrades,
  updateHead,
  listHeadlessHouses,
  listMembersByHouse,
  promoteToHead,
} from "../api/registryServices";

const MembersPage = () => {
  const navigate = useNavigate();
  const [wards, setWards] = useState([]);
  const [families, setFamilies] = useState([]);
  const [grades, setGrades] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [headlessHouses, setHeadlessHouses] = useState([]);
  const [houseMembers, setHouseMembers] = useState({}); // key: "familyId|SEP|houseName|SEP|sequence" -> members[]
  const [loadingHouseKey, setLoadingHouseKey] = useState(null);
  const [promotingId, setPromotingId] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [wRes, fRes, gRes, mRes] = await Promise.all([
          listWards(),
          listFamilies(),
          listGrades(),
          listMembers(),
        ]);
        setWards(wRes.data || []);
        setFamilies(fRes.data || []);
        setGrades(gRes.data || []);
        setAllMembers(mRes.data || []);
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    fetchOptions();
  }, []);

  const fetchHeadlessHouses = async () => {
    try {
      const res = await listHeadlessHouses();
      setHeadlessHouses(res.data || []);
    } catch (error) {
      console.error("Error fetching headless houses:", error);
    }
  };

  useEffect(() => {
    fetchHeadlessHouses();
  }, []);

  const houseKey = (familyId, houseName, houseSequence) =>
    `${familyId}|SEP|${houseName}|SEP|${houseSequence}`;

  const handleAccordionChange = async (details) => {
    const openKey = details.value?.[0];
    if (!openKey || houseMembers[openKey]) return; // already loaded or nothing opened

    const [familyId, houseName, houseSequence] = openKey.split("|SEP|");

    setLoadingHouseKey(openKey);
    try {
      const res = await listMembersByHouse(familyId, houseName, houseSequence);
      setHouseMembers((prev) => ({ ...prev, [openKey]: res.data || [] }));
    } catch (error) {
      console.error("Error fetching house members:", error);
      setHouseMembers((prev) => ({ ...prev, [openKey]: [] }));
    } finally {
      setLoadingHouseKey(null);
    }
  };

  const handlePromote = async (item, key) => {
    if (
      !window.confirm(
        `Promote ${item.name} to head of this house? This will give them full family head privileges.`,
      )
    )
      return;

    setPromotingId(item.id);
    try {
      await promoteToHead(item.id);
      window.alert(`${item.name} has been promoted to head.`);
      setHouseMembers((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      fetchHeadlessHouses();
    } catch (error) {
      const msg = error.response?.data?.error || "Failed to promote member.";
      window.alert(msg);
    } finally {
      setPromotingId(null);
    }
  };

  const getHeadFields = (formData, itemData) => [
    {
      name: "family",
      label: "Family",
      type: "select",
      required: true,
      options: families.map((f) => ({ value: f.id, label: f.family_name })),
      coerce: Number,
      onChange: (value, fd, setFd) => {
        const selected = families.find((f) => f.id === Number(value));
        setFd((prev) => ({
          ...prev,
          family: value,
          house_name: prev.house_name ? prev.house_name : selected?.family_name || "",
        }));
      },
    },
    {
      name: "ward",
      label: "Ward",
      type: "select",
      required: true,
      options: wards.map((w) => ({ value: w.id, label: w.ward_name })),
      coerce: Number,
    },
    { name: "house_name", label: "House Name", required: true },
    { name: "name", label: "Name", required: true },
    { name: "baptismal_name", label: "Baptismal Name" },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      required: true,
      options: [
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" },
        { value: "OTHER", label: "Other" },
      ],
    },
    { name: "email", label: "Email", type: "email", required: true },
    {
      name: "marital_status",
      label: "Marital Status",
      type: "select",
      options: [
        { value: "SINGLE", label: "Single" },
        { value: "MARRIED", label: "Married" },
        { value: "WIDOWED", label: "Widowed" },
        { value: "DIVORCED", label: "Divorced" },
      ],
      required: true,
    },
    { name: "spouse_name", label: "Spouse", type: "text", required: false },
    { name: "dob", label: "Date of Birth", type: "date", required: true },
    { name: "mobile_no", label: "Mobile No", required: true },
    { name: "phone_no", label: "Phone No" },
    { name: "blood_group", label: "Blood Group" },
    { name: "father_name", label: "Father Name" },
    { name: "mother_name", label: "Mother Name" },
    { name: "date_of_baptism", label: "Date of Baptism", type: "date" },
    { name: "parish_of_baptism", label: "Parish of Baptism" },
    { name: "educational_qualification", label: "Educational Qualification" },
    {
      name: "sunday_school_qualification",
      label: "Sunday School Qualification",
    },
    { name: "profession", label: "Profession" },
    {
      name: "grade",
      label: "Grade",
      type: "select",
      options: grades.map((g) => ({ value: g.id, label: g.name })),
      coerce: Number,
    },
    { name: "joining_date", label: "Joining Date", type: "date" },
    { name: "transferred_from", label: "Transferred From" },
    { name: "address", label: "Address", type: "textarea", fullWidth: true },
    {
      name: "family_image",
      label: "Family Image",
      type: "file",
      fullWidth: true,
    },
  ];

  const extraActions = [
    {
      icon: LuUserPlus,
      title: "Add Members",
      color: "green.500",
      hoverColor: "green.700",
      onClick: (item) => {
        navigate(`/members/${item.id}`, { state: { head: item } });
      },
    },
  ];

  const handleUpdateHead = async (id, formData) => {
    let ward, familyId;
    if (formData instanceof FormData) {
      ward = formData.get("ward");
      familyId = formData.get("family");
    } else {
      const { ward: w, family: f } = formData;
      ward = w;
      familyId = f;
    }

    const hRes = await updateHead(id, formData);

    if (familyId) {
      await updateMember(id, { family: Number(familyId) });
    }

    return hRes;
  };

  const headColumns = [
    { header: "Family Photo", key: "family_image" },
    { header: "Reg No", key: "reg_no" },
    { header: "Family Name", key: "family_name" },
    { header: "Ward", key: "ward_name" },
    { header: "Grade", key: "grade_name" },
    { header: "Total Members", key: "total_members" },
  ];

  const listHeadsWithNames = async () => {
    const [wRes, fRes, gRes, mRes] = await Promise.all([
      listWards(),
      listFamilies(),
      listGrades(),
      listMembers(),
    ]);

    const freshWards = wRes.data || [];
    const freshFamilies = fRes.data || [];
    const freshGrades = gRes.data || [];
    const allMembers = mRes.data || [];

    // 🔥 FIX: Use 'expired' not 'expire'
    const heads = allMembers.filter(
      (m) => m.is_family_head && m.is_active !== false && m.expired !== true,
    );

    const mapped = heads.map((h) => {
      const familyObj = freshFamilies.find(
        (f) => f.id === (h.family?.id || h.family),
      );
      const wardObj = freshWards.find((w) => w.id === (h.ward?.id || h.ward));
      const gradeObj = freshGrades.find(
        (g) => g.id === (h.grade?.id || h.grade),
      );
      
      // 🔥 FIX: Use 'expired' not 'expire'
      const familyCount = allMembers.filter(
        (m) =>
          (m.family?.id || m.family) === (h.family?.id || h.family) &&
          (m.house_name || "").trim().toLowerCase() ===
            (h.house_name || "").trim().toLowerCase() &&
          (m.house_sequence ?? 1) === (h.house_sequence ?? 1) &&
          m.is_active !== false &&
          m.expired !== true,
      ).length;

      return {
        ...h,
        family_name: h.family?.family_name || familyObj?.family_name || "N/A",
        ward_name: h.ward?.ward_name || wardObj?.ward_name || "N/A",
        grade_name: h.grade?.name || gradeObj?.name || "N/A",
        reg_no: familyObj?.reg_no || "N/A",
        total_members: familyCount,
      };
    });

    fetchHeadlessHouses();

    return { ...mRes, data: mapped };
  };

  return (
    <>
      <RegistryTable
        title="Member Information"
        addLabel="Create Head"
        nameKey="name"
        columnLabel="Head of Family"
        columns={headColumns}
        emptyMessage="No members found."
        listFn={listHeadsWithNames}
        createFn={createHead}
        updateFn={handleUpdateHead}
        deleteFn={deleteMember}
        fields={getHeadFields}
        extraActions={extraActions}
      />

      {headlessHouses.length > 0 && (
        <Box mt={8} mb={6}>
          <Heading size="md" mb={1} color="gray.800">
            Houses Without an Active Head
          </Heading>
          <Text fontSize="sm" color="gray.500" mb={4}>
            Click a house to expand it, view its members, and promote one to
            head.
          </Text>

          <Box
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
            overflow="hidden"
            boxShadow="sm"
            bg="white"
          >
            <Accordion.Root
              collapsible
              onValueChange={handleAccordionChange}
            >
              {headlessHouses.map((h) => {
                const key = houseKey(
                  h.family_id,
                  h.house_name,
                  h.house_sequence,
                );
                const members = houseMembers[key];
                const isLoading = loadingHouseKey === key;

                return (
                  <Accordion.Item key={key} value={key} borderColor="gray.200">
                    <Accordion.ItemTrigger
                      px={5}
                      py={4}
                      _hover={{ bg: "gray.50" }}
                    >
                      <HStack flex="1" justify="space-between">
                        <HStack spacing={4}>
                          <Text fontWeight="medium" color="gray.800">
                            {h.family_name}
                          </Text>
                          <Text color="gray.500">— {h.house_name}</Text>
                        </HStack>
                        <Badge colorScheme="orange" borderRadius="full" px={2}>
                          {h.member_count}{" "}
                          {h.member_count === 1 ? "member" : "members"}
                        </Badge>
                      </HStack>
                      <Accordion.ItemIndicator />
                    </Accordion.ItemTrigger>

                    <Accordion.ItemContent>
                      <Accordion.ItemBody px={5} pb={5}>
                        {isLoading ? (
                          <Center py={6}>
                            <Spinner
                              color="var(--primary-maroon)"
                              size="sm"
                            />
                          </Center>
                        ) : !members || members.length === 0 ? (
                          <Text color="gray.500" fontSize="sm" py={2}>
                            No members found.
                          </Text>
                        ) : (
                          <Table.Root size="sm">
                            <Table.Header>
                              <Table.Row bg="gray.50">
                                <Table.ColumnHeader>Member</Table.ColumnHeader>
                                <Table.ColumnHeader>
                                  Relationship
                                </Table.ColumnHeader>
                                <Table.ColumnHeader>
                                  Gender
                                </Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="right">
                                  Action
                                </Table.ColumnHeader>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {members.map((m) => (
                                <Table.Row key={m.id}>
                                  <Table.Cell>
                                    <HStack spacing={3}>
                                      <Avatar.Root size="xs">
                                        <Avatar.Fallback name={m.name} />
                                      </Avatar.Root>
                                      <Text>{m.name}</Text>
                                    </HStack>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Text color="gray.600">
                                      {m.relationship?.name || "—"}
                                    </Text>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Text color="gray.600">
                                      {m.gender || "—"}
                                    </Text>
                                  </Table.Cell>
                                  <Table.Cell textAlign="right">
                                    <Button
                                      size="xs"
                                      bg="var(--primary-maroon)"
                                      color="white"
                                      _hover={{ opacity: 0.9 }}
                                      loading={promotingId === m.id}
                                      onClick={() => handlePromote(m, key)}
                                    >
                                      <LuCrown style={{ marginRight: 4 }} />
                                      Promote
                                    </Button>
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table.Root>
                        )}
                      </Accordion.ItemBody>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                );
              })}
            </Accordion.Root>
          </Box>
        </Box>
      )}
    </>
  );
};

export default MembersPage;


