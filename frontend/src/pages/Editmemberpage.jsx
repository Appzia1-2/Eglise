// EditMemberPage.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import {
  Box,
  Heading,
  Text,
  VStack,
  Button,
  Input,
  Spinner,
  Center,
  Avatar,
  Badge,
  Flex,
  Grid,
  useDisclosure,
  Alert,
  IconButton,
  Field,
  NativeSelect,
} from "@chakra-ui/react";

import {
  LuUser,
  LuUsers,
  LuCalendarDays,
  LuMapPin,
  LuPencil,
  LuRefreshCw,
  LuX,
} from "react-icons/lu";

import {
  getMemberDetail,
  updateMember,
  listRelationships,
  changeMemberHead,
  listFamilyHeads,
} from "../api/registryServices";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ============================================================
   COLORS
============================================================ */

const RED = "#C90016";
const RED_DARK = "#A90012";

const NAVY = "#111F52";
const TEXT = "#172554";
const MUTED = "#667085";

const BORDER = "#DCE3EE";

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
  if (!name) return "DM";

  return name
    .split(" ")
    .filter(Boolean)
    .map((item) => item[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

/* ============================================================
   FORM FIELD
============================================================ */

const FormField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder = "",
  error,
  touched,
  children,
  required = false,
}) => {
  const invalid = Boolean(touched && error);

  return (
    <Field.Root
      invalid={invalid}
      required={required}
      gap="0"
    >
      <Field.Label
        mb="4px"
        fontSize="11px"
        fontWeight="700"
        color={NAVY}
        lineHeight="1.2"
      >
        {label}

        {required && (
          <Field.RequiredIndicator
            color={RED}
            ml="3px"
          />
        )}
      </Field.Label>

      {children ? (
        children
      ) : (
        <Input
          name={name}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          type={type}
          placeholder={placeholder}
          h="34px"
          minH="34px"
          px="10px"
          borderColor={
            invalid
              ? RED
              : "#D7DFEA"
          }
          borderRadius="5px"
          fontSize="11.5px"
          color={NAVY}
          bg="white"
          _hover={{
            borderColor: invalid
              ? RED
              : "#B8C3D4",
          }}
          _focus={{
            borderColor: RED,
            boxShadow: `0 0 0 1px ${RED}`,
          }}
        />
      )}

      {invalid && (
        <Field.ErrorText
          fontSize="9px"
          color={RED}
          mt="3px"
        >
          {error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
};

/* ============================================================
   SELECT FIELD
============================================================ */

const SelectField = ({
  name,
  value,
  onChange,
  onBlur,
  children,
  disabled = false,
  invalid = false,
}) => {
  return (
    <NativeSelect.Root
      size="sm"
      disabled={disabled}
      width="100%"
    >
      <NativeSelect.Field
        name={name}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        height="34px"
        minHeight="34px"
        paddingInline="10px"
        paddingRight="28px"
        fontSize="11.5px"
        color={NAVY}
        bg="white"
        borderColor={
          invalid
            ? RED
            : "#D7DFEA"
        }
        borderRadius="5px"
        cursor={
          disabled
            ? "not-allowed"
            : "pointer"
        }
        opacity={disabled ? 0.7 : 1}
        _hover={{
          borderColor: disabled
            ? "#D7DFEA"
            : invalid
            ? RED
            : "#B8C3D4",
        }}
        _focus={{
          borderColor: RED,
          boxShadow: `0 0 0 1px ${RED}`,
        }}
      >
        {children}
      </NativeSelect.Field>

      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
};

/* ============================================================
   CHANGE HEAD MODAL
============================================================ */

const ChangeHeadModal = ({
  isOpen,
  onClose,
  member,
  availableHeads,
  loadingHeads,
  onConfirm,
  isSubmitting,
}) => {
  const [selectedHeadId, setSelectedHeadId] =
    useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedHeadId("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!selectedHeadId) {
      window.alert(
        "Please select a family head to transfer this member to."
      );
      return;
    }

    onConfirm(selectedHeadId);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Box
      position="fixed"
      inset="0"
      zIndex={1400}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="rgba(0, 0, 0, 0.45)"
      px="20px"
      onClick={onClose}
    >
      <Box
        width="100%"
        maxW="520px"
        bg="white"
        borderRadius="10px"
        boxShadow="0 20px 50px rgba(0, 0, 0, 0.2)"
        overflow="hidden"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}

        <Box
          borderBottom="1px solid #E5EAF1"
          px="20px"
          py="14px"
        >
          <Flex
            align="center"
            justify="space-between"
          >
            <Flex
              align="center"
              gap="10px"
            >
              <Box
                bg="#FFF0F2"
                p="6px"
                borderRadius="6px"
                color={RED}
              >
                <LuUsers size={20} />
              </Box>

              <Text
                fontSize="16px"
                fontWeight="700"
                color={NAVY}
              >
                Change Family Head
              </Text>
            </Flex>

            <IconButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close"
            >
              <LuX size={20} />
            </IconButton>
          </Flex>
        </Box>

        {/* BODY */}

        <Box
          px="20px"
          py="20px"
        >
          <Box
            bg="#FFF8FA"
            p="14px"
            borderRadius="6px"
            mb="16px"
          >
            <Text
              fontSize="12px"
              color={NAVY}
              fontWeight="600"
            >
              Transferring Member:
            </Text>

            <Text
              fontSize="14px"
              fontWeight="700"
              color={NAVY}
              mt="4px"
            >
              {member?.name || "—"}
            </Text>

            <Text
              fontSize="11px"
              color="#667085"
              mt="2px"
            >
              Current Household:{" "}
              {member?.family
                ?.family_name || "—"}{" "}
              •{" "}
              {member?.house_name || "—"}
            </Text>
          </Box>

          <Text
            fontSize="12px"
            fontWeight="600"
            color={NAVY}
            mb="8px"
          >
            Select New Family Head
          </Text>

          {loadingHeads ? (
            <Center py="30px">
              <Spinner
                size="sm"
                color={RED}
              />
            </Center>
          ) : availableHeads.length ===
            0 ? (
            /* =================================================
               CHAKRA UI V3 ALERT
            ================================================= */

            <Alert.Root
              status="warning"
              borderRadius="6px"
              px="12px"
              py="10px"
            >
              <Alert.Indicator />

              <Alert.Content>
                <Alert.Description
                  fontSize="12px"
                >
                  No active family heads
                  available to transfer
                  to.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : (
            <NativeSelect.Root
              size="sm"
              width="100%"
            >
              <NativeSelect.Field
                value={selectedHeadId}
                onChange={(event) =>
                  setSelectedHeadId(
                    event.target.value
                  )
                }
                height="40px"
                fontSize="13px"
                borderColor="#D7DFEA"
                borderRadius="6px"
              >
                <option value="">
                  Select a family head...
                </option>

                {availableHeads.map(
                  (headItem) => (
                    <option
                      key={headItem.id}
                      value={headItem.id}
                    >
                      {headItem.name} —{" "}
                      {headItem.family_name}{" "}
                      (
                      {
                        headItem.house_name
                      }
                      )
                    </option>
                  )
                )}
              </NativeSelect.Field>

              <NativeSelect.Indicator />
            </NativeSelect.Root>
          )}

          {selectedHeadId && (
            <Box
              mt="12px"
              bg="#F0F7FF"
              p="10px"
              borderRadius="6px"
            >
              <Text
                fontSize="11px"
                color="#667085"
              >
                {member?.name} will be
                moved to:
              </Text>

              <Text
                fontSize="13px"
                fontWeight="600"
                color={NAVY}
              >
                {availableHeads.find(
                  (headItem) =>
                    String(
                      headItem.id
                    ) ===
                    String(
                      selectedHeadId
                    )
                )?.name || "—"}
              </Text>
            </Box>
          )}
        </Box>

        {/* FOOTER */}

        <Flex
          borderTop="1px solid #E5EAF1"
          px="20px"
          py="14px"
          justify="flex-end"
          gap="10px"
        >
          <Button
            variant="ghost"
            onClick={onClose}
            h="36px"
            fontSize="12px"
            fontWeight="600"
            color="#667085"
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirm}
            h="36px"
            bg={RED}
            color="white"
            fontSize="12px"
            fontWeight="600"
            loading={isSubmitting}
            loadingText="Transferring..."
            _hover={{
              bg: RED_DARK,
            }}
            disabled={
              !selectedHeadId ||
              loadingHeads ||
              availableHeads.length ===
                0
            }
          >
            Transfer Member
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

/* ============================================================
   EDIT MEMBER PAGE
============================================================ */

const EditMemberPage = () => {
  const { headId, memberId } =
    useParams();

  const navigate = useNavigate();

  const [member, setMember] =
    useState(null);

  const [head, setHead] =
    useState(null);

  const [relationships, setRelationships] =
    useState([]);

  const [availableHeads, setAvailableHeads] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingHeads, setLoadingHeads] =
    useState(false);

  const [
    isSubmittingChange,
    setIsSubmittingChange,
  ] = useState(false);

  const {
    open: isChangeHeadModalOpen,
    onOpen: onChangeHeadModalOpen,
    onClose: onChangeHeadModalClose,
  } = useDisclosure();

  /* ==========================================================
     FETCH DATA
  ========================================================== */

  useEffect(() => {
    fetchData();
  }, [memberId, headId]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [
        memberResponse,
        headResponse,
        relationshipsResponse,
        headsResponse,
      ] = await Promise.all([
        getMemberDetail(memberId),
        getMemberDetail(headId),
        listRelationships(),
        listFamilyHeads(),
      ]);

      const memberData =
        memberResponse?.data ||
        memberResponse ||
        null;

      const headData =
        headResponse?.data ||
        headResponse ||
        null;

      setMember(memberData);
      setHead(headData);

      setRelationships(
        getArrayData(
          relationshipsResponse
        )
      );

      setAvailableHeads(
        getArrayData(headsResponse)
      );
    } catch (error) {
      console.error(
        "Error fetching dependent data:",
        error
      );

      window.alert(
        "Failed to load dependent data."
      );

      navigate(
        `/family-heads/${headId}/members`
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     CHANGE HEAD
  ========================================================== */

  const handleChangeHead = async (
    newHeadId
  ) => {
    if (!newHeadId) return;

    setIsSubmittingChange(true);

    try {
      await changeMemberHead(
        memberId,
        newHeadId
      );

      window.alert(
        "Member successfully transferred to new family head!"
      );

      await fetchData();

      onChangeHeadModalClose();
    } catch (error) {
      console.error(
        "Error changing head:",
        error
      );

      let errorMessage =
        "Failed to transfer member to new head.";

      if (error?.response?.data) {
        const data =
          error.response.data;

        if (
          typeof data === "object"
        ) {
          if (data.detail) {
            errorMessage =
              data.detail;
          } else if (data.error) {
            errorMessage =
              data.error;
          } else {
            const firstError =
              Object.keys(data)[0];

            if (
              firstError &&
              Array.isArray(
                data[firstError]
              )
            ) {
              errorMessage = `${firstError}: ${data[firstError][0]}`;
            } else if (
              firstError &&
              typeof data[
                firstError
              ] === "string"
            ) {
              errorMessage = `${firstError}: ${data[firstError]}`;
            }
          }
        }
      }

      window.alert(
        `❌ ${errorMessage}`
      );
    } finally {
      setIsSubmittingChange(false);
    }
  };

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const validationSchema =
    Yup.object({
      name: Yup.string()
        .trim()
        .required("Name is required"),

      relationship: Yup.number()
        .typeError(
          "Relationship is required"
        )
        .required(
          "Relationship is required"
        ),

      gender: Yup.string().required(
        "Gender is required"
      ),

      mobile_no: Yup.string()
        .trim()
        .required(
          "Mobile number is required"
        )
        .matches(
          /^[0-9]{10}$/,
          "Mobile number must be 10 digits"
        ),

      marital_status:
        Yup.string().required(
          "Marital status is required"
        ),

      dob: Yup.string().required(
        "Date of birth is required"
      ),

      email: Yup.string().email(
        "Enter a valid email address"
      ),
    });

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (
    values,
    {
      setSubmitting,
    }
  ) => {
    try {
      const updateData = {};

      if (values.name?.trim()) {
        updateData.name =
          values.name.trim();
      }

      if (
        values.baptismal_name?.trim()
      ) {
        updateData.baptismal_name =
          values.baptismal_name.trim();
      }

      if (values.gender) {
        updateData.gender =
          values.gender;
      }

      if (values.marital_status) {
        updateData.marital_status =
          values.marital_status;
      }

      if (values.dob) {
        updateData.dob =
          values.dob;
      }

      if (values.mobile_no?.trim()) {
        updateData.mobile_no =
          values.mobile_no.trim();
      }

      if (values.email?.trim()) {
        updateData.email =
          values.email.trim();
      }

      if (values.blood_group) {
        updateData.blood_group =
          values.blood_group;
      }

      if (values.spouse_name?.trim()) {
        updateData.spouse_name =
          values.spouse_name.trim();
      }

      if (values.father_name?.trim()) {
        updateData.father_name =
          values.father_name.trim();
      }

      if (values.mother_name?.trim()) {
        updateData.mother_name =
          values.mother_name.trim();
      }

      if (values.date_of_baptism) {
        updateData.date_of_baptism =
          values.date_of_baptism;
      }

      if (
        values.parish_of_baptism?.trim()
      ) {
        updateData.parish_of_baptism =
          values.parish_of_baptism.trim();
      }

      if (
        values.educational_qualification?.trim()
      ) {
        updateData.educational_qualification =
          values.educational_qualification.trim();
      }

      if (
        values.sunday_school_qualification?.trim()
      ) {
        updateData.sunday_school_qualification =
          values.sunday_school_qualification.trim();
      }

      if (values.profession?.trim()) {
        updateData.profession =
          values.profession.trim();
      }

      if (values.joining_date) {
        updateData.joining_date =
          values.joining_date;
      }

      if (
        values.relationship !== "" &&
        values.relationship != null
      ) {
        const relationshipId =
          Number(
            values.relationship
          );

        if (
          !Number.isNaN(
            relationshipId
          ) &&
          relationshipId > 0
        ) {
          updateData.relationship =
            relationshipId;
        }
      }

      console.log(
        "Sending update data:",
        updateData
      );

      await updateMember(
        memberId,
        updateData
      );

      window.alert(
        "Dependent updated successfully!"
      );

      navigate(
        `/family-heads/${headId}/members`
      );
    } catch (error) {
      console.error(
        "Error updating dependent:",
        error
      );

      let errorMessage =
        "Failed to update dependent.";

      if (error?.response?.data) {
        const data =
          error.response.data;

        if (
          typeof data === "object"
        ) {
          if (data.detail) {
            errorMessage =
              data.detail;
          } else if (data.error) {
            errorMessage =
              data.error;
          } else {
            const firstError =
              Object.keys(data)[0];

            if (
              firstError &&
              Array.isArray(
                data[firstError]
              )
            ) {
              errorMessage = `${firstError}: ${data[firstError][0]}`;
            } else if (
              firstError &&
              typeof data[
                firstError
              ] === "string"
            ) {
              errorMessage = `${firstError}: ${data[firstError]}`;
            } else {
              errorMessage =
                JSON.stringify(data);
            }
          }
        }
      }

      window.alert(
        `❌ ${errorMessage}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        bg="white"
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

  if (!member) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        bg="white"
      >
        <Navbar />

        <Center flex="1">
          <Text color={NAVY}>
            Dependent not found.
          </Text>
        </Center>

        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     FAMILY DATA
  ========================================================== */

  const familyName =
    head?.family?.family_name ||
    head?.family_name ||
    "—";

  const headName =
    head?.name || "—";

  const wardName =
    head?.ward?.ward_name ||
    head?.ward_name ||
    "—";

  const relationshipName =
    member?.relationship?.name ||
    "—";

  const age =
    member?.age ??
    getAge(member?.dob);

  const image =
    member?.family_image_url ||
    member?.image_url ||
    member?.image ||
    member?.photo ||
    member?.family_image;

  /* ==========================================================
     INITIAL VALUES
  ========================================================== */

  const initialValues = {
    name: member?.name || "",

    baptismal_name:
      member?.baptismal_name || "",

    relationship:
      member?.relationship?.id ??
      member?.relationship ??
      "",

    gender:
      member?.gender || "",

    email:
      member?.email || "",

    mobile_no:
      member?.mobile_no || "",

    blood_group:
      member?.blood_group || "",

    marital_status:
      member?.marital_status || "",

    spouse_name:
      member?.spouse_name || "",

    dob:
      member?.dob || "",

    father_name:
      member?.father_name || "",

    mother_name:
      member?.mother_name || "",

    date_of_baptism:
      member?.date_of_baptism || "",

    parish_of_baptism:
      member?.parish_of_baptism || "",

    educational_qualification:
      member?.educational_qualification ||
      "",

    sunday_school_qualification:
      member?.sunday_school_qualification ||
      "",

    profession:
      member?.profession || "",

    joining_date:
      member?.joining_date || "",
  };

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <ChangeHeadModal
        isOpen={
          isChangeHeadModalOpen
        }
        onClose={
          onChangeHeadModalClose
        }
        member={member}
        availableHeads={
          availableHeads
        }
        loadingHeads={
          loadingHeads
        }
        onConfirm={
          handleChangeHead
        }
        isSubmitting={
          isSubmittingChange
        }
      />

      <Box
        flex="1"
        px={{
          base: "18px",
          sm: "24px",
          md: "30px",
          lg: "32px",
          xl: "32px",
        }}
        pt={{
          base: "16px",
          md: "18px",
        }}
        pb="14px"
      >
        <Box
          maxW="1540px"
          mx="auto"
          width="100%"
        >
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <Flex
            align="center"
            gap="9px"
            mb="11px"
            flexWrap="wrap"
          >
            <Text
              fontSize="12px"
              color="#3674D9"
              cursor="pointer"
              onClick={() =>
                navigate(
                  "/family-heads"
                )
              }
            >
              Masters
            </Text>

            <Text color="#98A2B3">
              /
            </Text>

            <Text
              fontSize="12px"
              color="#3674D9"
              cursor="pointer"
              onClick={() =>
                navigate(
                  "/family-heads"
                )
              }
            >
              Family Head Master
            </Text>

            <Text color="#98A2B3">
              /
            </Text>

            <Text
              fontSize="12px"
              color="#3674D9"
              cursor="pointer"
              onClick={() =>
                navigate(
                  `/family-heads/${headId}/members`
                )
              }
            >
              {headName}
            </Text>

            <Text color="#98A2B3">
              /
            </Text>

            <Text
              fontSize="12px"
              color="#3674D9"
            >
              {member?.name}
            </Text>

            <Text color="#98A2B3">
              /
            </Text>

            <Text
              fontSize="12px"
              color="#3674D9"
            >
              Edit
            </Text>
          </Flex>

          {/* ==================================================
              PAGE TITLE
          ================================================== */}

          <Box mb="13px">
            <Text
              fontSize="12px"
              fontWeight="800"
              color={RED}
              letterSpacing="0.25px"
              mb="3px"
            >
              DEPENDENT MANAGEMENT
            </Text>

            <Flex
              align="center"
              justify="space-between"
              flexWrap="wrap"
              gap="12px"
            >
              <Box>
                <Heading
                  fontSize={{
                    base: "24px",
                    md: "27px",
                  }}
                  fontWeight="700"
                  color={NAVY}
                  lineHeight="1.1"
                >
                  Edit Dependent
                </Heading>

                <Text
                  fontSize="11.5px"
                  color="#667085"
                  mt="5px"
                >
                  Update dependent,
                  relationship and parish
                  information.
                </Text>
              </Box>

              <Button
                onClick={
                  onChangeHeadModalOpen
                }
                h="36px"
                bg="white"
                color={NAVY}
                border="1px solid #D7DFEA"
                borderRadius="5px"
                fontSize="11.5px"
                fontWeight="600"
                gap="7px"
                _hover={{
                  bg: "#F5F6FA",
                  borderColor:
                    "#B8C3D4",
                }}
              >
                <LuRefreshCw
                  size={16}
                />
                Change Head
              </Button>
            </Flex>
          </Box>

          {/* ==================================================
              DEPENDENT SUMMARY
          ================================================== */}

          <Box
            bg="white"
            border="1px solid"
            borderColor={BORDER}
            borderRadius="7px"
            minH="116px"
            px={{
              base: "18px",
              md: "27px",
            }}
            py="12px"
            mb="12px"
          >
            <Grid
              templateColumns={{
                base: "1fr",
                lg: "1.35fr 1.15fr 1fr 0.9fr auto",
              }}
              alignItems="center"
            >
              <Flex
                align="center"
                gap="25px"
                pr="20px"
              >
                <Avatar.Root
                  width="86px"
                  height="86px"
                  flexShrink="0"
                >
                  {image ? (
                    <Avatar.Image
                      src={image}
                      alt={member?.name}
                    />
                  ) : null}

                  <Avatar.Fallback
                    bg="#FFE8EB"
                    color={RED}
                    fontWeight="700"
                    fontSize="18px"
                    name={member?.name}
                  >
                    {getInitials(
                      member?.name
                    )}
                  </Avatar.Fallback>
                </Avatar.Root>

                <Box>
                  <Text
                    fontSize="21px"
                    fontWeight="700"
                    color={NAVY}
                    lineHeight="1.2"
                  >
                    {member?.name ||
                      "Dependent"}
                  </Text>

                  <Text
                    fontSize="13px"
                    color={NAVY}
                    mt="8px"
                  >
                    {relationshipName}
                  </Text>
                </Box>
              </Flex>

              <Flex
                align="center"
                gap="12px"
                minH="52px"
                borderLeft={{
                  lg: `1px solid ${BORDER}`,
                }}
                px={{
                  lg: "28px",
                }}
              >
                <Box color={NAVY}>
                  <LuUser
                    size={21}
                  />
                </Box>

                <Box>
                  <Text
                    fontSize="13px"
                    fontWeight="600"
                    color={NAVY}
                  >
                    {headName}
                  </Text>

                  <Text
                    fontSize="11px"
                    color="#667085"
                    mt="3px"
                  >
                    Family Head
                  </Text>
                </Box>
              </Flex>

              <Flex
                align="center"
                gap="12px"
                minH="52px"
                borderLeft={{
                  lg: `1px solid ${BORDER}`,
                }}
                px={{
                  lg: "28px",
                }}
              >
                <Box color={NAVY}>
                  <LuUsers
                    size={22}
                  />
                </Box>

                <Text
                  fontSize="13px"
                  fontWeight="500"
                  color={NAVY}
                >
                  {familyName}
                </Text>
              </Flex>

              <Flex
                align="center"
                gap="12px"
                minH="52px"
                borderLeft={{
                  lg: `1px solid ${BORDER}`,
                }}
                px={{
                  lg: "28px",
                }}
              >
                <Box color={NAVY}>
                  <LuCalendarDays
                    size={21}
                  />
                </Box>

                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color={NAVY}
                >
                  {age !== "—"
                    ? `${age} Years`
                    : "—"}
                </Text>
              </Flex>

              <Box
                pl={{
                  lg: "25px",
                }}
              >
                <Badge
                  px="11px"
                  py="5px"
                  borderRadius="6px"
                  bg={
                    member?.is_active !==
                    false
                      ? "#EAF8EE"
                      : "#FEE2E2"
                  }
                  border="1px solid"
                  borderColor={
                    member?.is_active !==
                    false
                      ? "#C4E8CC"
                      : "#FECACA"
                  }
                  color={
                    member?.is_active !==
                    false
                      ? "#24913E"
                      : "#DC2626"
                  }
                  fontSize="10.5px"
                  fontWeight="500"
                >
                  {member?.is_active !==
                  false
                    ? "Active"
                    : "Deceased"}
                </Badge>
              </Box>
            </Grid>
          </Box>

          {/* ==================================================
              CONTENT AREA
          ================================================== */}

          <Grid
            templateColumns={{
              base: "1fr",
              lg: "minmax(0, 3.05fr) minmax(300px, 1fr)",
            }}
            gap="22px"
            alignItems="start"
          >
            {/* =================================================
                LEFT FORM
            ================================================= */}

            <Formik
              enableReinitialize
              initialValues={
                initialValues
              }
              validationSchema={
                validationSchema
              }
              validateOnBlur={true}
              validateOnChange={false}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                isSubmitting,
              }) => (
                <Form>
                  <Box
                    bg="white"
                    border="1px solid"
                    borderColor={BORDER}
                    borderRadius="7px"
                    p={{
                      base: "16px",
                      md: "19px",
                    }}
                  >
                    <Heading
                      fontSize="15px"
                      fontWeight="700"
                      color={NAVY}
                      mb="14px"
                    >
                      Dependent
                      Information
                    </Heading>

                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(3, 1fr)",
                      }}
                      gap={{
                        base: "12px",
                        md: "12px 22px",
                      }}
                    >
                      {/* FAMILY HEAD */}

                      <Field.Root
                        required
                        gap="0"
                      >
                        <Field.Label
                          mb="4px"
                          fontSize="11px"
                          fontWeight="700"
                          color={NAVY}
                        >
                          Family Head

                          <Field.RequiredIndicator
                            color={RED}
                            ml="3px"
                          />
                        </Field.Label>

                        <SelectField
                          name="family_head"
                          value={
                            head?.id || ""
                          }
                          disabled
                          onChange={() => {}}
                        >
                          <option
                            value={
                              head?.id ||
                              ""
                            }
                          >
                            {headName} —{" "}
                            {familyName}
                          </option>
                        </SelectField>
                      </Field.Root>

                      {/* NAME */}

                      <FormField
                        label="Name"
                        name="name"
                        value={
                          values.name
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                        error={
                          errors.name
                        }
                        touched={
                          touched.name
                        }
                        required
                      />

                      {/* BAPTISM NAME */}

                      <FormField
                        label="Baptism Name"
                        name="baptismal_name"
                        value={
                          values.baptismal_name
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                      />

                      {/* RELATIONSHIP */}

                      <FormField
                        label="Relationship"
                        name="relationship"
                        value={
                          values.relationship
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                        error={
                          errors.relationship
                        }
                        touched={
                          touched.relationship
                        }
                        required
                      >
                        <SelectField
                          name="relationship"
                          value={
                            values.relationship
                          }
                          onChange={
                            handleChange
                          }
                          onBlur={
                            handleBlur
                          }
                          invalid={Boolean(
                            touched.relationship &&
                              errors.relationship
                          )}
                        >
                          <option value="">
                            Select
                            relationship
                          </option>

                          {relationships.map(
                            (
                              relationship
                            ) => (
                              <option
                                key={
                                  relationship.id
                                }
                                value={
                                  relationship.id
                                }
                              >
                                {
                                  relationship.name
                                }
                              </option>
                            )
                          )}
                        </SelectField>
                      </FormField>

                      {/* GENDER */}

                      <FormField
                        label="Gender"
                        name="gender"
                        value={
                          values.gender
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                        error={
                          errors.gender
                        }
                        touched={
                          touched.gender
                        }
                        required
                      >
                        <SelectField
                          name="gender"
                          value={
                            values.gender
                          }
                          onChange={
                            handleChange
                          }
                          onBlur={
                            handleBlur
                          }
                          invalid={Boolean(
                            touched.gender &&
                              errors.gender
                          )}
                        >
                          <option value="">
                            Select
                          </option>

                          <option value="MALE">
                            Male
                          </option>

                          <option value="FEMALE">
                            Female
                          </option>

                          <option value="OTHER">
                            Other
                          </option>
                        </SelectField>
                      </FormField>

                      {/* EMAIL */}

                      <FormField
                        label="Email"
                        name="email"
                        value={
                          values.email
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                        type="email"
                        error={
                          errors.email
                        }
                        touched={
                          touched.email
                        }
                      />

                      {/* MARITAL STATUS */}

                      <FormField
                        label="Marital Status"
                        name="marital_status"
                        value={
                          values.marital_status
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                        error={
                          errors.marital_status
                        }
                        touched={
                          touched.marital_status
                        }
                        required
                      >
                        <SelectField
                          name="marital_status"
                          value={
                            values.marital_status
                          }
                          onChange={
                            handleChange
                          }
                          onBlur={
                            handleBlur
                          }
                          invalid={Boolean(
                            touched.marital_status &&
                              errors.marital_status
                          )}
                        >
                          <option value="">
                            Select
                          </option>

                          <option value="SINGLE">
                            Single
                          </option>

                          <option value="MARRIED">
                            Married
                          </option>

                          <option value="WIDOWED">
                            Widowed
                          </option>

                          <option value="DIVORCED">
                            Divorced
                          </option>
                        </SelectField>
                      </FormField>

                      {/* SPOUSE */}

                      <FormField
                        label="Spouse"
                        name="spouse_name"
                        value={
                          values.spouse_name
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                      />

                      {/* DOB */}

                      <FormField
                        label="Date of Birth"
                        name="dob"
                        value={
                          values.dob
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                        type="date"
                        error={
                          errors.dob
                        }
                        touched={
                          touched.dob
                        }
                        required
                      />

                      {/* MOBILE */}

                      <Field.Root
                        required
                        invalid={Boolean(
                          touched.mobile_no &&
                            errors.mobile_no
                        )}
                        gap="0"
                      >
                        <Field.Label
                          mb="4px"
                          fontSize="11px"
                          fontWeight="700"
                          color={NAVY}
                        >
                          Mobile Number

                          <Field.RequiredIndicator
                            color={RED}
                            ml="3px"
                          />
                        </Field.Label>

                        <Flex
                          width="100%"
                        >
                          <Box width="78px">
                            <NativeSelect.Root
                              size="sm"
                              disabled
                            >
                              <NativeSelect.Field
                                value="+91"
                                onChange={() => {}}
                                height="34px"
                                minHeight="34px"
                                paddingInline="8px"
                                fontSize="11.5px"
                                color={NAVY}
                                bg="white"
                                borderColor="#D7DFEA"
                                borderRight="0"
                                borderRadius="5px 0 0 5px"
                              >
                                <option value="+91">
                                  +91
                                </option>
                              </NativeSelect.Field>

                              <NativeSelect.Indicator />
                            </NativeSelect.Root>
                          </Box>

                          <Input
                            name="mobile_no"
                            value={
                              values.mobile_no
                            }
                            onChange={
                              handleChange
                            }
                            onBlur={
                              handleBlur
                            }
                            h="34px"
                            minH="34px"
                            px="10px"
                            borderLeftRadius="0"
                            fontSize="11.5px"
                            color={NAVY}
                            borderColor={
                              touched.mobile_no &&
                              errors.mobile_no
                                ? RED
                                : "#D7DFEA"
                            }
                            _focus={{
                              borderColor:
                                RED,
                              boxShadow: `0 0 0 1px ${RED}`,
                            }}
                          />
                        </Flex>

                        {touched.mobile_no &&
                          errors.mobile_no && (
                            <Field.ErrorText
                              fontSize="9px"
                              color={RED}
                              mt="3px"
                            >
                              {
                                errors.mobile_no
                              }
                            </Field.ErrorText>
                          )}
                      </Field.Root>

                      {/* BLOOD GROUP */}

                      <FormField
                        label="Blood Group"
                        name="blood_group"
                        value={
                          values.blood_group
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                      >
                        <SelectField
                          name="blood_group"
                          value={
                            values.blood_group
                          }
                          onChange={
                            handleChange
                          }
                          onBlur={
                            handleBlur
                          }
                        >
                          <option value="">
                            Select
                          </option>

                          <option value="O+">
                            O+
                          </option>

                          <option value="O-">
                            O-
                          </option>

                          <option value="A+">
                            A+
                          </option>

                          <option value="A-">
                            A-
                          </option>

                          <option value="B+">
                            B+
                          </option>

                          <option value="B-">
                            B-
                          </option>

                          <option value="AB+">
                            AB+
                          </option>

                          <option value="AB-">
                            AB-
                          </option>
                        </SelectField>
                      </FormField>

                      {/* FATHER */}

                      <FormField
                        label="Father Name"
                        name="father_name"
                        value={
                          values.father_name
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                      />

                      {/* MOTHER */}

                      <FormField
                        label="Mother Name"
                        name="mother_name"
                        value={
                          values.mother_name
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                      />

                      {/* DATE OF BAPTISM */}

                      <FormField
                        label="Date of Baptism"
                        name="date_of_baptism"
                        value={
                          values.date_of_baptism
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                        type="date"
                      />

                      {/* PARISH */}

                      <FormField
                        label="Parish of Baptism"
                        name="parish_of_baptism"
                        value={
                          values.parish_of_baptism
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                      />

                      {/* EDUCATION */}

                      <FormField
                        label="Education Qualification"
                        name="educational_qualification"
                        value={
                          values.educational_qualification
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                      />

                      {/* SUNDAY SCHOOL */}

                      <FormField
                        label="Sunday School Qualification"
                        name="sunday_school_qualification"
                        value={
                          values.sunday_school_qualification
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                      />

                      {/* PROFESSION */}

                      <FormField
                        label="Profession"
                        name="profession"
                        value={
                          values.profession
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                      />

                      {/* JOINING DATE */}

                      <FormField
                        label="Joining Date"
                        name="joining_date"
                        value={
                          values.joining_date
                        }
                        onChange={
                          handleChange
                        }
                        onBlur={
                          handleBlur
                        }
                        type="date"
                      />

                      <Box />
                      <Box />
                    </Grid>

                    {/* ACTION BUTTONS */}

                    <Flex
                      justify="flex-end"
                      gap="13px"
                      mt="15px"
                      pt="13px"
                    >
                      <Button
                        type="button"
                        h="36px"
                        minW="140px"
                        bg="white"
                        color={RED}
                        border="1px solid"
                        borderColor={RED}
                        borderRadius="5px"
                        fontSize="11.5px"
                        fontWeight="600"
                        onClick={() =>
                          navigate(
                            `/family-heads/${headId}/members`
                          )
                        }
                        _hover={{
                          bg: "#FFF7F8",
                        }}
                      >
                        Cancel
                      </Button>

                      <Button
                        type="submit"
                        h="36px"
                        minW="150px"
                        bg={RED}
                        color="white"
                        borderRadius="5px"
                        fontSize="11.5px"
                        fontWeight="600"
                        loading={
                          isSubmitting
                        }
                        loadingText="Saving..."
                        _hover={{
                          bg: RED_DARK,
                        }}
                      >
                        Save Changes
                      </Button>
                    </Flex>
                  </Box>
                </Form>
              )}
            </Formik>

            {/* =================================================
                RIGHT SIDEBAR
            ================================================= */}

            <VStack
              align="stretch"
              gap="16px"
            >
              {/* RECORD INFORMATION */}

              <Box
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="7px"
                p="19px"
              >
                <Heading
                  fontSize="15px"
                  color={NAVY}
                  fontWeight="700"
                  mb="21px"
                >
                  Record Information
                </Heading>

                <Flex
                  align="flex-start"
                  gap="13px"
                  pb="20px"
                  borderBottom="1px solid"
                  borderColor="#E5EAF1"
                >
                  <Box
                    color={NAVY}
                    mt="1px"
                  >
                    <LuCalendarDays
                      size={20}
                    />
                  </Box>

                  <Box>
                    <Text
                      fontSize="11px"
                      color={NAVY}
                      fontWeight="700"
                    >
                      Created
                    </Text>

                    <Text
                      fontSize="12px"
                      color={NAVY}
                      mt="5px"
                    >
                      {member?.created_at
                        ? formatDate(
                            member.created_at
                          )
                        : "—"}
                    </Text>
                  </Box>
                </Flex>

                <Flex
                  align="flex-start"
                  gap="13px"
                  pt="20px"
                >
                  <Box
                    color={NAVY}
                    mt="1px"
                  >
                    <LuPencil
                      size={20}
                    />
                  </Box>

                  <Box>
                    <Text
                      fontSize="11px"
                      color={NAVY}
                      fontWeight="700"
                    >
                      Last updated
                    </Text>

                    <Text
                      fontSize="12px"
                      color={NAVY}
                      mt="5px"
                    >
                      {member?.updated_at
                        ? formatDate(
                            member.updated_at
                          )
                        : "—"}
                    </Text>

                    {member?.updated_by && (
                      <Text
                        fontSize="10px"
                        color="#667085"
                        mt="3px"
                      >
                        by{" "}
                        {getObjectName(
                          member.updated_by
                        )}
                      </Text>
                    )}
                  </Box>
                </Flex>
              </Box>

              {/* FAMILY CONTEXT */}

              <Box
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="7px"
                p="19px"
              >
                <Heading
                  fontSize="15px"
                  color={NAVY}
                  fontWeight="700"
                  mb="19px"
                >
                  Family Context
                </Heading>

                <Flex
                  align="center"
                  gap="18px"
                >
                  <Box
                    width="78px"
                    height="78px"
                    flexShrink="0"
                    borderRadius="full"
                    bg="#FFF0F2"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color={RED}
                  >
                    <LuUsers
                      size={36}
                    />
                  </Box>

                  <Box>
                    <Text
                      fontSize="17px"
                      fontWeight="700"
                      color={NAVY}
                    >
                      {familyName}
                    </Text>

                    <Flex
                      align="center"
                      gap="9px"
                      mt="11px"
                    >
                      <LuUser
                        size={17}
                        color={NAVY}
                      />

                      <Text
                        fontSize="12px"
                        color={NAVY}
                      >
                        {headName}
                      </Text>
                    </Flex>

                    <Text
                      fontSize="10px"
                      color="#667085"
                      ml="26px"
                      mt="2px"
                    >
                      Family Head
                    </Text>

                    <Flex
                      align="center"
                      gap="9px"
                      mt="12px"
                    >
                      <LuMapPin
                        size={17}
                        color={NAVY}
                      />

                      <Text
                        fontSize="12px"
                        color={NAVY}
                      >
                        {wardName}
                      </Text>
                    </Flex>
                  </Box>
                </Flex>

                <Button
                  variant="ghost"
                  p="0"
                  mt="23px"
                  height="auto"
                  color={RED}
                  fontSize="12px"
                  fontWeight="700"
                  onClick={() =>
                    navigate(
                      `/family-heads/${headId}`
                    )
                  }
                  _hover={{
                    bg: "transparent",
                    color: RED_DARK,
                  }}
                >
                  View Family

                  <Text
                    as="span"
                    fontSize="19px"
                    ml="8px"
                    lineHeight="1"
                  >
                    →
                  </Text>
                </Button>
              </Box>
            </VStack>
          </Grid>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default EditMemberPage;