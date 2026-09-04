import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getDeath,
  updateDeath,
  listFamilies,
  listMembers,
} from "../api/registryServices";

import {
  listTombTypes,
  listTombFees,
} from "../api/churchServices";

// ==========================================================
// COLORS
// ==========================================================

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#650A18";

const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const BLUE = "#315AB5";
const LIGHT_RED = "#FFF1F3";

// ==========================================================
// SMALL ICONS
// ==========================================================

const UserIcon = ({
  size = 20,
  color = SECONDARY_TEXT,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 21C20 17.6863 17.3137 15 14 15H10C6.68629 15 4 17.6863 4 21"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    <circle
      cx="12"
      cy="7"
      r="4"
      stroke={color}
      strokeWidth="1.8"
    />
  </svg>
);

const CalendarIcon = ({
  size = 21,
  color = SECONDARY_TEXT,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3.5"
      y="5"
      width="17"
      height="15"
      rx="2"
      stroke={color}
      strokeWidth="1.7"
    />

    <path
      d="M7 3V7M17 3V7M3.5 9.5H20.5"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const AlertIcon = ({
  size = 24,
  color = "#F07A00",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.25 4.3L2.7 17.4C1.93 18.73 2.89 20.4 4.43 20.4H19.57C21.11 20.4 22.07 18.73 21.3 17.4L13.75 4.3C12.98 2.97 11.02 2.97 10.25 4.3Z"
      stroke={color}
      strokeWidth="1.7"
      strokeLinejoin="round"
    />

    <path
      d="M12 8V13"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    <circle
      cx="12"
      cy="16.3"
      r="1"
      fill={color}
    />
  </svg>
);

const BanIcon = ({
  size = 24,
  color = PRIMARY_RED,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke={color}
      strokeWidth="1.8"
    />

    <path
      d="M6 6L18 18"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const ActivityIcon = ({
  size = 20,
  color = SECONDARY_TEXT,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="8"
      cy="8"
      r="3.5"
      stroke={color}
      strokeWidth="1.7"
    />

    <path
      d="M2.8 19.5C3.4 16.8 5.1 15.2 8 15.2C10.9 15.2 12.6 16.8 13.2 19.5"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
    />

    <path
      d="M15 4.8C17.1 5.2 18.4 6.5 18.4 8.5C18.4 10.1 17.6 11.3 16.3 12"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
    />

    <path
      d="M16 15.2C18.8 15.3 20.5 16.8 21.2 19.5"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

// ==========================================================
// MAIN COMPONENT
// ==========================================================

const DeathEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ========================================================
  // STATE
  // ========================================================

  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [tombTypes, setTombTypes] = useState([]);
  const [tombFees, setTombFees] = useState([]);

  const [record, setRecord] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingFees, setLoadingFees] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [activeTab, setActiveTab] =
    useState("details");

  const [showCancelDialog, setShowCancelDialog] =
    useState(false);

  const [formData, setFormData] = useState({
    family: "",
    member: "",
    died_on: "",
    funeral_on: "",
    tomb_type: "",
    tomb_fee: "",
    tomb_idn: "",
    reason_of_death: "",
    remarks: "",
  });

  const [initialFormData, setInitialFormData] =
    useState({
      family: "",
      member: "",
      died_on: "",
      funeral_on: "",
      tomb_type: "",
      tomb_fee: "",
      tomb_idn: "",
      reason_of_death: "",
      remarks: "",
    });

  // ========================================================
  // DIRTY STATE
  // ========================================================

  const isDirty = useMemo(
    () =>
      JSON.stringify(formData) !==
      JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const modifiedFieldCount = useMemo(() => {
    return Object.keys(formData).filter(
      (key) =>
        formData[key] !== initialFormData[key]
    ).length;
  }, [formData, initialFormData]);

  const modifiedFields = useMemo(() => {
    return Object.keys(formData).filter(
      (key) =>
        formData[key] !== initialFormData[key]
    );
  }, [formData, initialFormData]);

  // ========================================================
  // ERROR MESSAGE
  // ========================================================

  const getApiErrorMessage = useCallback(
    (error, fallback) => {
      const data = error?.response?.data;

      if (!data) return fallback;

      if (typeof data === "string") {
        return data;
      }

      if (data.error) {
        return data.error;
      }

      if (data.detail) {
        return data.detail;
      }

      if (data.non_field_errors) {
        return Array.isArray(
          data.non_field_errors
        )
          ? data.non_field_errors.join(" ")
          : data.non_field_errors;
      }

      return fallback;
    },
    []
  );

  // ========================================================
  // DATE HELPERS
  // ========================================================

  const normalizeDate = useCallback((value) => {
    if (!value) return "";

    if (
      typeof value === "string" &&
      value.length >= 10
    ) {
      return value.substring(0, 10);
    }

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "";
      }

      return date
        .toISOString()
        .substring(0, 10);
    } catch {
      return "";
    }
  }, []);

  const formatDate = useCallback(
    (value) => {
      if (!value) return "—";

      const normalized =
        normalizeDate(value);

      if (!normalized) return "—";

      const date = new Date(
        `${normalized}T00:00:00`
      );

      if (Number.isNaN(date.getTime())) {
        return "—";
      }

      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },
    [normalizeDate]
  );

  // ========================================================
  // DATA HELPERS
  // ========================================================

  const getFamilyName = useCallback(
    (family) => {
      return (
        family?.family_name ||
        family?.name ||
        "Unnamed Family"
      );
    },
    []
  );

  const getMemberName = useCallback(
    (member) => {
      return (
        member?.name ||
        member?.full_name ||
        [
          member?.first_name,
          member?.last_name,
        ]
          .filter(Boolean)
          .join(" ") ||
        "Unnamed Member"
      );
    },
    []
  );

  const getMemberNumber = useCallback(
    (member) => {
      return (
        member?.member_no ||
        member?.reg_no ||
        member?.member_number ||
        ""
      );
    },
    []
  );

  const getInitials = useCallback((name) => {
    if (!name) return "M";

    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${
      parts[parts.length - 1][0]
    }`.toUpperCase();
  }, []);

  const getRecordStatus = useCallback(() => {
    return (
      record?.status_display ||
      record?.status ||
      "Recorded"
    );
  }, [record]);

  const getUpdatedBy = useCallback(() => {
    const value =
      record?.updated_by?.name ||
      record?.updated_by?.full_name ||
      record?.updated_by?.username ||
      record?.last_updated_by_name ||
      record?.updated_by_name;

    return value || "Parish Admin";
  }, [record]);

  const getCreatedDate = useCallback(() => {
    return (
      record?.created_at ||
      record?.created_on ||
      record?.date_created ||
      record?.created
    );
  }, [record]);

  const getUpdatedDate = useCallback(() => {
    return (
      record?.updated_at ||
      record?.updated_on ||
      record?.last_updated_at ||
      record?.modified_at ||
      record?.updated
    );
  }, [record]);

  // ========================================================
  // SELECTED DATA
  // ========================================================

  const selectedMember = useMemo(() => {
    return members.find(
      (member) =>
        String(member?.id) ===
        String(formData.member)
    );
  }, [members, formData.member]);

  const selectedFamily = useMemo(() => {
    return families.find(
      (family) =>
        String(family?.id) ===
        String(formData.family)
    );
  }, [families, formData.family]);

  // ========================================================
  // LOAD RECORD
  // ========================================================

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setPageError(
          "Death record ID is missing."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError("");
        setSuccessMessage("");

        const [
          deathResponse,
          familyResponse,
          memberResponse,
          tombResponse,
        ] = await Promise.all([
          getDeath(id),
          listFamilies(),
          listMembers(),
          listTombTypes(),
        ]);

        const death =
          deathResponse?.data || {};

        setRecord(death);

        const familyData =
          familyResponse?.data?.results ??
          familyResponse?.data ??
          [];

        const memberData =
          memberResponse?.data?.results ??
          memberResponse?.data ??
          [];

        const tombData =
          tombResponse?.data?.results ??
          tombResponse?.data ??
          [];

        const familyList =
          Array.isArray(familyData)
            ? familyData
            : [];

        const memberList =
          Array.isArray(memberData)
            ? memberData
            : [];

        const tombList =
          Array.isArray(tombData)
            ? tombData
            : [];

        setFamilies(familyList);

        setMembers(
          memberList.filter(
            (member) =>
              member?.is_active !== false &&
              member?.expired !== true
          )
        );

        setTombTypes(tombList);

        // ----------------------------------------------------
        // MEMBER ID
        // ----------------------------------------------------

        const memberId =
          death?.member?.id ??
          death?.member_id ??
          (typeof death?.member === "number"
            ? death.member
            : "");

        // ----------------------------------------------------
        // FAMILY ID
        // ----------------------------------------------------

        let familyId =
          death?.family?.id ??
          death?.family_id ??
          (typeof death?.family === "number"
            ? death.family
            : "");

        if (!familyId && memberId) {
          const selected =
            memberList.find(
              (member) =>
                String(member?.id) ===
                String(memberId)
            );

          familyId =
            selected?.family?.id ??
            selected?.family_id ??
            (typeof selected?.family ===
            "number"
              ? selected.family
              : "");
        }

        // ----------------------------------------------------
        // TOMB TYPE
        // ----------------------------------------------------

        const tombTypeId =
          death?.tomb_type?.id ??
          death?.tomb_type_id ??
          (typeof death?.tomb_type === "number"
            ? death.tomb_type
            : "");

        // ----------------------------------------------------
        // TOMB FEE
        // ----------------------------------------------------

        const tombFeeId =
          death?.tomb_fee?.id ??
          death?.tomb_fee_id ??
          (typeof death?.tomb_fee === "number"
            ? death.tomb_fee
            : "");

        // ----------------------------------------------------
        // FORM DATA
        // ----------------------------------------------------

        const loadedForm = {
          family:
            familyId !== "" &&
            familyId !== null &&
            familyId !== undefined
              ? String(familyId)
              : "",

          member:
            memberId !== "" &&
            memberId !== null &&
            memberId !== undefined
              ? String(memberId)
              : "",

          died_on: normalizeDate(
            death?.died_on
          ),

          funeral_on: normalizeDate(
            death?.funeral_on
          ),

          tomb_type:
            tombTypeId !== "" &&
            tombTypeId !== null &&
            tombTypeId !== undefined
              ? String(tombTypeId)
              : "",

          tomb_fee:
            tombFeeId !== "" &&
            tombFeeId !== null &&
            tombFeeId !== undefined
              ? String(tombFeeId)
              : "",

          tomb_idn:
            death?.tomb_idn ?? "",

          reason_of_death:
            death?.reason_of_death ?? "",

          remarks:
            death?.remarks ?? "",
        };

        setFormData(loadedForm);
        setInitialFormData(loadedForm);

        // ----------------------------------------------------
        // EXISTING TOMB FEES
        // ----------------------------------------------------

        if (tombTypeId) {
          try {
            setLoadingFees(true);

            const feeResponse =
              await listTombFees(
                tombTypeId
              );

            const feeData =
              feeResponse?.data?.results ??
              feeResponse?.data ??
              [];

            setTombFees(
              Array.isArray(feeData)
                ? feeData
                : []
            );
          } catch (feeError) {
            console.error(
              "Error loading tomb fees:",
              feeError
            );

            setTombFees([]);
          } finally {
            setLoadingFees(false);
          }
        }
      } catch (error) {
        console.error(
          "Error loading death record:",
          error
        );

        const message =
          getApiErrorMessage(
            error,
            "Unable to load death record."
          );

        setPageError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    id,
    getApiErrorMessage,
    normalizeDate,
  ]);

  // ========================================================
  // LOAD FEES WHEN TOMB TYPE CHANGES
  // ========================================================

  useEffect(() => {
    if (loading) return;

    if (!formData.tomb_type) {
      setTombFees([]);

      return;
    }

    const loadFees = async () => {
      try {
        setLoadingFees(true);

        const response =
          await listTombFees(
            formData.tomb_type
          );

        const feeData =
          response?.data?.results ??
          response?.data ??
          [];

        setTombFees(
          Array.isArray(feeData)
            ? feeData
            : []
        );
      } catch (error) {
        console.error(
          "Error loading tomb fees:",
          error
        );

        setTombFees([]);
      } finally {
        setLoadingFees(false);
      }
    };

    loadFees();
  }, [
    formData.tomb_type,
    loading,
  ]);

  // ========================================================
  // FAMILY MEMBERS
  // ========================================================

  const familyMembers = useMemo(() => {
    if (!formData.family) {
      return members;
    }

    return members.filter((member) => {
      const memberFamilyId =
        member?.family?.id ??
        member?.family_id ??
        (typeof member?.family === "number"
          ? member.family
          : "");

      return (
        String(memberFamilyId) ===
        String(formData.family)
      );
    });
  }, [
    members,
    formData.family,
  ]);

  // ========================================================
  // HANDLE CHANGE
  // ========================================================

  const handleChange = useCallback(
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setFormData((previous) => ({
        ...previous,
        [name]: value,
      }));

      setFieldErrors((previous) => ({
        ...previous,
        [name]: undefined,
      }));

      setPageError("");
      setSuccessMessage("");
    },
    []
  );

  // ========================================================
  // FAMILY CHANGE
  // ========================================================

  const handleFamilyChange =
    useCallback((event) => {
      const familyId =
        event.target.value;

      setFormData((previous) => ({
        ...previous,
        family: familyId,
        member: "",
      }));

      setFieldErrors((previous) => ({
        ...previous,
        family: undefined,
        member: undefined,
      }));

      setPageError("");
    }, []);

  // ========================================================
  // TOMB TYPE CHANGE
  // ========================================================

  const handleTombTypeChange =
    useCallback((event) => {
      const tombTypeId =
        event.target.value;

      setFormData((previous) => ({
        ...previous,
        tomb_type: tombTypeId,
        tomb_fee: "",
      }));

      setFieldErrors((previous) => ({
        ...previous,
        tomb_type: undefined,
        tomb_fee: undefined,
      }));

      setPageError("");
    }, []);

  // ========================================================
  // VALIDATE
  // ========================================================

  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.family) {
      errors.family =
        "Please select a family.";
    }

    if (!formData.member) {
      errors.member =
        "Please select a member.";
    }

    if (!formData.died_on) {
      errors.died_on =
        "Date of death is required.";
    }

    if (!formData.funeral_on) {
      errors.funeral_on =
        "Date of funeral is required.";
    }

    if (
      formData.died_on &&
      formData.funeral_on &&
      formData.funeral_on <
        formData.died_on
    ) {
      errors.funeral_on =
        "Funeral date cannot be before death date.";
    }

    if (!formData.tomb_type) {
      errors.tomb_type =
        "Tomb type is required.";
    }

    if (!formData.tomb_fee) {
      errors.tomb_fee =
        "Tomb fee selection is required.";
    }

    if (
      !formData.reason_of_death.trim()
    ) {
      errors.reason_of_death =
        "Reason of death is required.";
    }

    setFieldErrors(errors);

    return (
      Object.keys(errors).length === 0
    );
  }, [formData]);

  // ========================================================
  // SUBMIT
  // ========================================================

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      setPageError("");
      setSuccessMessage("");
      setFieldErrors({});

      if (!validateForm()) {
        return;
      }

      try {
        setSaving(true);

        const payload = {
          member: Number(
            formData.member
          ),

          died_on:
            formData.died_on,

          funeral_on:
            formData.funeral_on,

          tomb_type: Number(
            formData.tomb_type
          ),

          tomb_fee: Number(
            formData.tomb_fee
          ),

          tomb_idn:
            formData.tomb_idn.trim(),

          reason_of_death:
            formData.reason_of_death.trim(),

          remarks:
            formData.remarks.trim(),
        };

        console.log(
          "Updating death record:",
          id
        );

        console.log(
          "Update payload:",
          payload
        );

        await updateDeath(
          id,
          payload
        );

        setInitialFormData({
          ...formData,
        });

        setSuccessMessage(
          "Death record updated successfully."
        );

        setSaving(false);

        setTimeout(() => {
          navigate(
            `/death/${id}`,
            {
              replace: true,
            }
          );
        }, 700);
      } catch (error) {
        console.error(
          "Error updating death record:",
          error
        );

        const responseData =
          error?.response?.data;

        if (
          responseData &&
          typeof responseData ===
            "object"
        ) {
          const normalizedErrors =
            {};

          Object.entries(
            responseData
          ).forEach(
            ([key, value]) => {
              if (
                Array.isArray(value)
              ) {
                normalizedErrors[
                  key
                ] = value.join(" ");
              } else if (
                typeof value ===
                "string"
              ) {
                normalizedErrors[
                  key
                ] = value;
              } else {
                normalizedErrors[
                  key
                ] = JSON.stringify(
                  value
                );
              }
            }
          );

          setFieldErrors(
            normalizedErrors
          );

          const messages =
            Object.entries(
              normalizedErrors
            )
              .map(
                ([key, value]) =>
                  `${key}: ${value}`
              )
              .join("\n");

          setPageError(
            messages ||
              "Unable to update death record."
          );
        } else {
          setPageError(
            getApiErrorMessage(
              error,
              "Unable to update death record."
            )
          );
        }

        setSaving(false);
      }
    },
    [
      id,
      formData,
      validateForm,
      getApiErrorMessage,
      navigate,
    ]
  );

  // ========================================================
  // CANCEL
  // ========================================================

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      navigate(`/death/${id}`);
    }
  }, [
    isDirty,
    navigate,
    id,
  ]);

  const confirmCancel =
    useCallback(() => {
      setShowCancelDialog(false);

      navigate(`/death/${id}`);
    }, [navigate, id]);

  const closeCancelDialog =
    useCallback(() => {
      setShowCancelDialog(false);
    }, []);

  // ========================================================
  // KEYBOARD SHORTCUTS
  // ========================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();

        if (!saving && !loading) {
          handleSubmit(event);
        }
      }

      if (
        event.key === "Escape" &&
        showCancelDialog
      ) {
        closeCancelDialog();
      } else if (
        event.key === "Escape" &&
        !showCancelDialog
      ) {
        handleCancel();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    handleSubmit,
    handleCancel,
    closeCancelDialog,
    saving,
    loading,
    showCancelDialog,
  ]);

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Container
          maxW="1400px"
          flex="1"
          py={10}
        >
          <Box
            minH="300px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box textAlign="center">
              <Spinner
                size="lg"
                color={PRIMARY_RED}
              />

              <Text
                color={SECONDARY_TEXT}
                fontSize="13px"
                mt={3}
              >
                Loading death record...
              </Text>
            </Box>
          </Box>
        </Container>

        <Footer />
      </Box>
    );
  }

  // ========================================================
  // DISPLAY DATA
  // ========================================================

  const memberName =
    getMemberName(
      selectedMember
    ) !== "Unnamed Member"
      ? getMemberName(
          selectedMember
        )
      : record?.member?.name ||
        record?.member_name ||
        "Member";

  const memberNumber =
    getMemberNumber(
      selectedMember
    ) ||
    record?.member?.member_no ||
    record?.member?.reg_no ||
    record?.member_no ||
    record?.registration_no ||
    "—";

  const familyName =
    getFamilyName(
      selectedFamily
    ) !== "Unnamed Family"
      ? getFamilyName(
          selectedFamily
        )
      : record?.family
          ?.family_name ||
        record?.family?.name ||
        record?.family_name ||
        "Family";

  const deathRegisterNo =
    record?.record_no ||
    record?.death_no ||
    record?.register_no ||
    record?.code ||
    `DR-${String(id).padStart(
      4,
      "0"
    )}`;

  // ========================================================
  // PAGE
  // ========================================================

  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Container
        maxW="1400px"
        px={{ base: 4, md: 5 }}
        pt={{ base: 3, md: 3 }}
        pb="105px"
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={2}
          mb={2}
          fontSize="11px"
          flexWrap="wrap"
        >
          <Text color={BLUE}>
            Activities
          </Text>

          <Text color="#A2ACBB">
            /
          </Text>

          <Text color={BLUE}>
            Death Register
          </Text>

          <Text color="#A2ACBB">
            /
          </Text>

          <Text color={BLUE}>
            {deathRegisterNo}
          </Text>

          <Text color="#A2ACBB">
            /
          </Text>

          <Text color={SECONDARY_TEXT}>
            Edit
          </Text>
        </HStack>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <Box mb={4}>
          <Heading
            color={TEXT_COLOR}
            fontSize={{
              base: "23px",
              md: "27px",
            }}
            fontWeight="600"
            lineHeight="1.1"
          >
            Edit Death Record
          </Heading>

          <Text
            color={SECONDARY_TEXT}
            fontSize="12px"
            mt={0.7}
          >
            Update death, funeral and
            burial details.
          </Text>
        </Box>

        {/* ==================================================
            TWO COLUMN CONTENT
        ================================================== */}

        <SimpleGrid
          columns={{
            base: 1,
            lg: "minmax(0, 1fr) 320px",
          }}
          gap={5}
          alignItems="start"
        >
          {/* ==================================================
              LEFT
          ================================================== */}

          <Box minW={0}>
            {/* RECORD HEADER */}

            <Box
              bg="white"
              border={`1px solid ${BORDER_COLOR}`}
              borderRadius="9px"
              px={{
                base: 4,
                md: 5,
              }}
              py={4}
              mb={4}
            >
              <Flex
                align="center"
                gap={4}
              >
                <Box
                  w="72px"
                  h="72px"
                  minW="72px"
                  borderRadius="50%"
                  bg="#FFE3E7"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    color={PRIMARY_RED}
                    fontSize="23px"
                    fontWeight="700"
                  >
                    {getInitials(
                      memberName
                    )}
                  </Text>
                </Box>

                <Box>
                  <Heading
                    color={TEXT_COLOR}
                    fontSize={{
                      base: "19px",
                      md: "21px",
                    }}
                    fontWeight="600"
                    lineHeight="1.2"
                  >
                    {memberName}
                  </Heading>

                  <HStack
                    mt={2}
                    gap={2}
                    flexWrap="wrap"
                  >
                    <Text
                      color={SECONDARY_TEXT}
                      fontSize="12px"
                    >
                      {deathRegisterNo}
                    </Text>

                    <Text color="#A2ACBB">
                      •
                    </Text>

                    <Text
                      color={SECONDARY_TEXT}
                      fontSize="12px"
                    >
                      {memberNumber}
                    </Text>

                    <Box
                      px={2}
                      py="3px"
                      borderRadius="5px"
                      bg="#F3F5F8"
                      border="1px solid #E0E5EC"
                    >
                      <Text
                        color="#536176"
                        fontSize="10px"
                        fontWeight="600"
                      >
                        {getRecordStatus()}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              </Flex>
            </Box>

            {/* MAIN FORM CARD */}

            <Box
              bg="white"
              border={`1px solid ${BORDER_COLOR}`}
              borderRadius="9px"
              overflow="hidden"
            >
              {/* TABS */}

              <Flex
                borderBottom={`1px solid ${BORDER_COLOR}`}
              >
                <TabButton
                  label="Death Details"
                  isActive={
                    activeTab ===
                    "details"
                  }
                  onClick={() =>
                    setActiveTab(
                      "details"
                    )
                  }
                  color={PRIMARY_RED}
                />

                <TabButton
                  label="Record Activity"
                  icon={
                    <ActivityIcon
                      size={18}
                    />
                  }
                  isActive={
                    activeTab ===
                    "activity"
                  }
                  onClick={() =>
                    setActiveTab(
                      "activity"
                    )
                  }
                  color={BLUE}
                />
              </Flex>

              {activeTab ===
              "details" ? (
                <Box
                  px={{
                    base: 4,
                    md: 5,
                  }}
                  py={4}
                >
                  <form
                    onSubmit={
                      handleSubmit
                    }
                  >
                    {/* SUCCESS */}

                    {successMessage && (
                      <Box
                        mb={4}
                        p={3}
                        borderRadius="7px"
                        bg="#F0FFF4"
                        border="1px solid #9AE6B4"
                      >
                        <Text
                          color="green.700"
                          fontSize="11px"
                          fontWeight="500"
                        >
                          {successMessage}
                        </Text>
                      </Box>
                    )}

                    {/* ERROR */}

                    {pageError && (
                      <Box
                        mb={4}
                        p={3}
                        borderRadius="7px"
                        bg="#FFF5F5"
                        border="1px solid #FED7D7"
                      >
                        <Text
                          color="red.600"
                          fontSize="11px"
                          whiteSpace="pre-line"
                        >
                          {pageError}
                        </Text>
                      </Box>
                    )}

                    {/* MEMBER INFORMATION */}

                    <SectionTitle>
                      Member Information
                    </SectionTitle>

                    <SimpleGrid
                      columns={{
                        base: 1,
                        md: 2,
                      }}
                      gap={4}
                      mb={4}
                    >
                      <FormField
                        label="Family"
                        required
                        error={
                          fieldErrors.family
                        }
                      >
                        <SelectField
                          name="family"
                          value={
                            formData.family
                          }
                          onChange={
                            handleFamilyChange
                          }
                          error={
                            fieldErrors.family
                          }
                        >
                          <option value="">
                            Select Family
                          </option>

                          {families.map(
                            (family) => (
                              <option
                                key={
                                  family.id
                                }
                                value={
                                  family.id
                                }
                              >
                                {getFamilyName(
                                  family
                                )}

                                {family.family_no
                                  ? ` (${family.family_no})`
                                  : family.code
                                  ? ` (${family.code})`
                                  : ""}
                              </option>
                            )
                          )}
                        </SelectField>
                      </FormField>

                      <FormField
                        label="Member Name"
                        required
                        error={
                          fieldErrors.member
                        }
                      >
                        <SelectField
                          name="member"
                          value={
                            formData.member
                          }
                          onChange={
                            handleChange
                          }
                          error={
                            fieldErrors.member
                          }
                          disabled={
                            !formData.family
                          }
                        >
                          <option value="">
                            {!formData.family
                              ? "Select Family First"
                              : familyMembers.length ===
                                0
                              ? "No active members"
                              : "Select Member"}
                          </option>

                          {familyMembers.map(
                            (member) => (
                              <option
                                key={
                                  member.id
                                }
                                value={
                                  member.id
                                }
                              >
                                {getMemberName(
                                  member
                                )}

                                {getMemberNumber(
                                  member
                                )
                                  ? ` (${getMemberNumber(
                                      member
                                    )})`
                                  : ""}
                              </option>
                            )
                          )}
                        </SelectField>
                      </FormField>
                    </SimpleGrid>

                    <Divider />

                    {/* DEATH DETAILS */}

                    <SectionTitle>
                      Death & Funeral Details
                    </SectionTitle>

                    <SimpleGrid
                      columns={{
                        base: 1,
                        md: 2,
                      }}
                      gap={4}
                      mb={4}
                    >
                      <FormField
                        label="Date of Death"
                        required
                        error={
                          fieldErrors.died_on
                        }
                      >
                        <DateInput
                          name="died_on"
                          value={
                            formData.died_on
                          }
                          onChange={
                            handleChange
                          }
                          error={
                            fieldErrors.died_on
                          }
                        />
                      </FormField>

                      <FormField
                        label="Date of Funeral"
                        required
                        error={
                          fieldErrors.funeral_on
                        }
                      >
                        <DateInput
                          name="funeral_on"
                          value={
                            formData.funeral_on
                          }
                          onChange={
                            handleChange
                          }
                          error={
                            fieldErrors.funeral_on
                          }
                        />
                      </FormField>

                      <FormField
                        label="Tomb Type"
                        required
                        error={
                          fieldErrors.tomb_type
                        }
                      >
                        <SelectField
                          name="tomb_type"
                          value={
                            formData.tomb_type
                          }
                          onChange={
                            handleTombTypeChange
                          }
                          error={
                            fieldErrors.tomb_type
                          }
                        >
                          <option value="">
                            Select Tomb Type
                          </option>

                          {tombTypes.map(
                            (tomb) => (
                              <option
                                key={
                                  tomb.id
                                }
                                value={
                                  tomb.id
                                }
                              >
                                {
                                  tomb.name
                                }
                              </option>
                            )
                          )}
                        </SelectField>
                      </FormField>

                      <FormField
                        label="Tomb Charge"
                        required
                        error={
                          fieldErrors.tomb_fee
                        }
                      >
                        <SelectField
                          name="tomb_fee"
                          value={
                            formData.tomb_fee
                          }
                          onChange={
                            handleChange
                          }
                          error={
                            fieldErrors.tomb_fee
                          }
                          disabled={
                            !formData.tomb_type ||
                            loadingFees ||
                            tombFees.length ===
                              0
                          }
                        >
                          <option value="">
                            {!formData.tomb_type
                              ? "Select Tomb Type First"
                              : loadingFees
                              ? "Loading fees..."
                              : tombFees.length ===
                                0
                              ? "No fees available"
                              : "Select Tomb Charge"}
                          </option>

                          {tombFees.map(
                            (fee) => (
                              <option
                                key={
                                  fee.id
                                }
                                value={
                                  fee.id
                                }
                              >
                                {fee.indication
                                  ? `${fee.indication} - `
                                  : ""}
                                ₹
                                {
                                  fee.tomb_fees
                                }
                              </option>
                            )
                          )}
                        </SelectField>
                      </FormField>
                    </SimpleGrid>

                    {/* TOMB IDN */}

                    <Box mb={4}>
                      <FormField
                        label="Tomb IDN"
                        error={
                          fieldErrors.tomb_idn
                        }
                      >
                        <Input
                          name="tomb_idn"
                          value={
                            formData.tomb_idn
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Enter tomb IDN"
                          h="39px"
                          borderColor={
                            fieldErrors.tomb_idn
                              ? "red.400"
                              : BORDER_COLOR
                          }
                          borderRadius="6px"
                          fontSize="12px"
                          color={
                            TEXT_COLOR
                          }
                          _focus={{
                            borderColor:
                              PRIMARY_RED,
                            boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
                          }}
                        />
                      </FormField>
                    </Box>

                    {/* REASON */}

                    <Box mb={4}>
                      <FormField
                        label="Reason of Death"
                        required
                        error={
                          fieldErrors.reason_of_death
                        }
                      >
                        <Textarea
                          name="reason_of_death"
                          value={
                            formData.reason_of_death
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Enter reason of death"
                          minH="54px"
                          resize="vertical"
                          borderColor={
                            fieldErrors.reason_of_death
                              ? "red.400"
                              : BORDER_COLOR
                          }
                          borderRadius="6px"
                          fontSize="12px"
                          color={
                            TEXT_COLOR
                          }
                          py={2}
                          _focus={{
                            borderColor:
                              PRIMARY_RED,
                            boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
                          }}
                        />
                      </FormField>
                    </Box>

                    {/* REMARKS */}

                    <Box>
                      <FormField
                        label="Remarks"
                        error={
                          fieldErrors.remarks
                        }
                      >
                        <Textarea
                          name="remarks"
                          value={
                            formData.remarks
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Enter additional remarks"
                          minH="54px"
                          resize="vertical"
                          borderColor={
                            fieldErrors.remarks
                              ? "red.400"
                              : BORDER_COLOR
                          }
                          borderRadius="6px"
                          fontSize="12px"
                          color={
                            TEXT_COLOR
                          }
                          py={2}
                          _focus={{
                            borderColor:
                              PRIMARY_RED,
                            boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
                          }}
                        />
                      </FormField>
                    </Box>
                  </form>
                </Box>
              ) : (
                <Box
                  minH="310px"
                  px={{
                    base: 4,
                    md: 5,
                  }}
                  py={5}
                >
                  <Heading
                    color={TEXT_COLOR}
                    fontSize="14px"
                    fontWeight="600"
                    mb={1}
                  >
                    Record Activity
                  </Heading>

                  <Text
                    color={
                      SECONDARY_TEXT
                    }
                    fontSize="11px"
                    mb={5}
                  >
                    Activity history for
                    this death record.
                  </Text>

                  <Box
                    border={`1px solid ${BORDER_COLOR}`}
                    borderRadius="8px"
                    p={4}
                  >
                    <HStack align="flex-start">
                      <Box
                        w="32px"
                        h="32px"
                        minW="32px"
                        borderRadius="50%"
                        bg="#F3F5F8"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <ActivityIcon
                          size={17}
                          color={BLUE}
                        />
                      </Box>

                      <Box>
                        <Text
                          color={
                            TEXT_COLOR
                          }
                          fontSize="12px"
                          fontWeight="600"
                        >
                          Death record
                          opened for
                          editing
                        </Text>

                        <Text
                          color={
                            SECONDARY_TEXT
                          }
                          fontSize="10px"
                          mt={1}
                        >
                          Current record
                          information
                          is shown in
                          the sidebar.
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* ==================================================
              RIGHT SIDEBAR
          ================================================== */}

          <Box>
            {/* MEMBER INFORMATION */}

            <SidebarCard>
              <SidebarTitle>
                Member Information
              </SidebarTitle>

              <Box
                display="flex"
                justifyContent="center"
                mb={3}
              >
                <Box
                  w="72px"
                  h="72px"
                  borderRadius="50%"
                  bg="#FFE3E7"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    color={
                      PRIMARY_RED
                    }
                    fontSize="23px"
                    fontWeight="700"
                  >
                    {getInitials(
                      memberName
                    )}
                  </Text>
                </Box>
              </Box>

              <Text
                color={TEXT_COLOR}
                fontSize="15px"
                fontWeight="600"
                textAlign="center"
              >
                {memberName}
              </Text>

              <Text
                color={BLUE}
                fontSize="12px"
                textAlign="center"
                mt={1.5}
              >
                {memberNumber}
              </Text>

              <Text
                color={
                  SECONDARY_TEXT
                }
                fontSize="12px"
                textAlign="center"
                mt={1}
              >
                {familyName}
              </Text>
            </SidebarCard>

            {/* RECORD INFORMATION */}

            <SidebarCard>
              <SidebarTitle>
                Record Information
              </SidebarTitle>

              <InfoRow
                icon={
                  <CalendarIcon
                    size={22}
                    color={BLUE}
                  />
                }
                label="Created"
                value={formatDate(
                  getCreatedDate()
                )}
              />

              <InfoRow
                icon={
                  <UserIcon
                    size={22}
                    color={BLUE}
                  />
                }
                label="Last updated"
                value={
                  getUpdatedDate() &&
                  getUpdatedBy()
                    ? `${formatDate(
                        getUpdatedDate()
                      )} by ${getUpdatedBy()}`
                    : "—"
                }
              />
            </SidebarCard>

            {/* UNSAVED */}

            {isDirty && (
              <SidebarCard
                borderColor="#F0E1C7"
                bg="#FFFDF9"
              >
                <HStack
                  align="flex-start"
                  gap={3}
                >
                  <AlertIcon
                    size={25}
                    color="#F07A00"
                  />

                  <Box>
                    <Text
                      color="#E56B00"
                      fontSize="13px"
                      fontWeight="600"
                    >
                      Unsaved Changes
                    </Text>

                    <Text
                      color="#E56B00"
                      fontSize="11px"
                      fontWeight="600"
                      mt={2}
                    >
                      {modifiedFieldCount}{" "}
                      {modifiedFieldCount ===
                      1
                        ? "field"
                        : "fields"}{" "}
                      modified
                    </Text>

                    {modifiedFields.length >
                      0 && (
                      <Box mt={1}>
                        <Text
                          color={
                            SECONDARY_TEXT
                          }
                          fontSize="9px"
                          fontWeight="500"
                        >
                          Changed:{" "}
                          {modifiedFields.join(
                            ", "
                          )}
                        </Text>
                      </Box>
                    )}

                    <Text
                      color={
                        SECONDARY_TEXT
                      }
                      fontSize="10px"
                      mt={1}
                      lineHeight="1.5"
                    >
                      Press Ctrl+S to
                      save or Esc to
                      cancel.
                    </Text>
                  </Box>
                </HStack>
              </SidebarCard>
            )}

            {/* DANGER ZONE */}

            <SidebarCard>
              <Text
                color="#B31D27"
                fontSize="13px"
                fontWeight="600"
                mb={3}
              >
                Danger Zone
              </Text>

              <HStack
                align="flex-start"
                gap={3}
              >
                <BanIcon
                  size={25}
                  color={
                    PRIMARY_RED
                  }
                />

                <Box>
                  <Text
                    color={
                      PRIMARY_RED
                    }
                    fontSize="12px"
                    fontWeight="600"
                  >
                    Archive Death
                    Record
                  </Text>

                  <Text
                    color={
                      SECONDARY_TEXT
                    }
                    fontSize="10px"
                    mt={1.5}
                    lineHeight="1.5"
                  >
                    This record will
                    remain in
                    activity history.
                  </Text>
                </Box>
              </HStack>
            </SidebarCard>
          </Box>
        </SimpleGrid>

        {/* ======================================================
            FIXED ACTION BAR
        ====================================================== */}

        <Box
          position="fixed"
          left={0}
          right={0}
          bottom={0}
          zIndex={20}
          bg="rgba(255,255,255,0.98)"
          borderTop={`1px solid ${BORDER_COLOR}`}
          boxShadow="0 -2px 12px rgba(24,35,56,0.04)"
        >
          <Container
            maxW="1400px"
            px={{
              base: 4,
              md: 5,
            }}
            py={2.5}
          >
            <Flex
              justify="flex-end"
              gap={2.5}
              align="center"
            >
              <Button
                type="button"
                variant="outline"
                h="40px"
                px={{
                  base: 5,
                  md: 7,
                }}
                fontSize="12px"
                fontWeight="600"
                borderColor={
                  PRIMARY_RED
                }
                color={PRIMARY_RED}
                borderRadius="6px"
                onClick={
                  handleCancel
                }
                disabled={saving}
                bg="white"
                _hover={{
                  bg: LIGHT_RED,
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                h="40px"
                px={{
                  base: 6,
                  md: 8,
                }}
                minW={{
                  base: "150px",
                  md: "178px",
                }}
                fontSize="12px"
                fontWeight="600"
                borderRadius="6px"
                bg={PRIMARY_RED}
                color="white"
                loading={
                  saving
                }
                onClick={
                  handleSubmit
                }
                _hover={{
                  bg: DARK_RED,
                }}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </Flex>
          </Container>
        </Box>
      </Container>

      {/* ======================================================
          CUSTOM CANCEL CONFIRMATION
          Chakra v3 compatible
      ====================================================== */}

      {showCancelDialog && (
        <Box
          position="fixed"
          inset={0}
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          px={4}
        >
          {/* BACKDROP */}

          <Box
            position="absolute"
            inset={0}
            bg="rgba(15,23,42,0.45)"
            onClick={
              closeCancelDialog
            }
          />

          {/* DIALOG */}

          <Box
            position="relative"
            zIndex={1001}
            width="100%"
            maxW="430px"
            bg="white"
            borderRadius="12px"
            boxShadow="0 20px 50px rgba(0,0,0,0.20)"
            overflow="hidden"
          >
            <Box
              px={5}
              py={4}
              borderBottom={`1px solid ${BORDER_COLOR}`}
            >
              <Heading
                fontSize="17px"
                fontWeight="600"
                color={TEXT_COLOR}
              >
                Discard Changes?
              </Heading>
            </Box>

            <Box px={5} py={5}>
              <Text
                color={
                  SECONDARY_TEXT
                }
                fontSize="13px"
                lineHeight="1.6"
              >
                You have unsaved
                changes. Are you sure
                you want to leave?
                Your changes will be
                lost.
              </Text>
            </Box>

            <Flex
              justify="flex-end"
              gap={2}
              px={5}
              py={4}
              borderTop={`1px solid ${BORDER_COLOR}`}
              bg="#FAFBFC"
            >
              <Button
                variant="outline"
                h="38px"
                px={5}
                fontSize="12px"
                borderColor={
                  BORDER_COLOR
                }
                color={TEXT_COLOR}
                onClick={
                  closeCancelDialog
                }
              >
                Keep Editing
              </Button>

              <Button
                h="38px"
                px={5}
                fontSize="12px"
                bg={PRIMARY_RED}
                color="white"
                onClick={
                  confirmCancel
                }
                _hover={{
                  bg: DARK_RED,
                }}
              >
                Discard Changes
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      <Footer />
    </Box>
  );
};

// ==========================================================
// TAB BUTTON
// ==========================================================

const TabButton = ({
  label,
  icon,
  isActive,
  onClick,
  color,
}) => {
  return (
    <Box
      position="relative"
      flex="1"
      py={3}
      px={{
        base: 4,
        md: 5,
      }}
      cursor="pointer"
      onClick={onClick}
      borderBottom={
        isActive
          ? `2px solid ${color}`
          : "2px solid transparent"
      }
      transition="all 0.2s"
    >
      <HStack
        justify="center"
        gap={2}
      >
        {icon}

        <Text
          color={
            isActive
              ? color
              : TEXT_COLOR
          }
          fontSize="12px"
          fontWeight={
            isActive
              ? "600"
              : "500"
          }
        >
          {label}
        </Text>
      </HStack>
    </Box>
  );
};

// ==========================================================
// SECTION TITLE
// ==========================================================

const SectionTitle = ({
  children,
}) => {
  return (
    <Heading
      fontSize="14px"
      fontWeight="600"
      color={TEXT_COLOR}
      mb={3}
    >
      {children}
    </Heading>
  );
};

// ==========================================================
// DIVIDER
// ==========================================================

const Divider = () => (
  <Box
    borderTop={`1px solid ${BORDER_COLOR}`}
    my={4}
  />
);

// ==========================================================
// SIDEBAR CARD
// ==========================================================

const SidebarCard = ({
  children,
  borderColor = BORDER_COLOR,
  bg = "white",
}) => {
  return (
    <Box
      bg={bg}
      border={`1px solid ${borderColor}`}
      borderRadius="9px"
      px={4}
      py={4}
      mb={3}
    >
      {children}
    </Box>
  );
};

// ==========================================================
// SIDEBAR TITLE
// ==========================================================

const SidebarTitle = ({
  children,
}) => (
  <Text
    color={TEXT_COLOR}
    fontSize="13px"
    fontWeight="600"
    mb={4}
  >
    {children}
  </Text>
);

// ==========================================================
// INFO ROW
// ==========================================================

const InfoRow = ({
  icon,
  label,
  value,
}) => (
  <HStack
    align="flex-start"
    gap={3}
    mb={4}
  >
    <Box pt="1px">
      {icon}
    </Box>

    <Box>
      <Text
        color={SECONDARY_TEXT}
        fontSize="10px"
        mb={1}
      >
        {label}
      </Text>

      <Text
        color={TEXT_COLOR}
        fontSize="11px"
        fontWeight="600"
        lineHeight="1.45"
      >
        {value}
      </Text>
    </Box>
  </HStack>
);

// ==========================================================
// FORM FIELD
// ==========================================================

const FormField = ({
  label,
  required = false,
  error,
  children,
}) => {
  return (
    <Box>
      <Text
        color={TEXT_COLOR}
        fontSize="10px"
        fontWeight="600"
        mb={1}
      >
        {label}

        {required && (
          <Text
            as="span"
            color={PRIMARY_RED}
            ml="3px"
          >
            *
          </Text>
        )}
      </Text>

      {children}

      {error && (
        <Text
          color="red.500"
          fontSize="9px"
          mt={1}
        >
          {error}
        </Text>
      )}
    </Box>
  );
};

// ==========================================================
// SELECT FIELD
// ==========================================================

const SelectField = ({
  children,
  name,
  value,
  onChange,
  disabled = false,
  error,
}) => {
  return (
    <Box
      position="relative"
      width="100%"
    >
      <Box
        as="select"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        width="100%"
        height="39px"
        fontSize="12px"
        color={
          value
            ? TEXT_COLOR
            : SECONDARY_TEXT
        }
        border={`1px solid ${
          error
            ? "#F56565"
            : BORDER_COLOR
        }`}
        borderRadius="6px"
        bg="white"
        appearance="none"
        paddingLeft="11px"
        paddingRight="32px"
        outline="none"
        cursor={
          disabled
            ? "not-allowed"
            : "pointer"
        }
        _focus={{
          borderColor:
            PRIMARY_RED,
          boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
        }}
        _disabled={{
          bg: "#F7F9FB",
          color: "#9AA4B2",
          cursor:
            "not-allowed",
        }}
      >
        {children}
      </Box>

      <Box
        position="absolute"
        right="12px"
        top="50%"
        transform="translateY(-50%)"
        pointerEvents="none"
        color={SECONDARY_TEXT}
        fontSize="10px"
        lineHeight="1"
      >
        ▼
      </Box>
    </Box>
  );
};

// ==========================================================
// DATE INPUT
// ==========================================================

const DateInput = ({
  name,
  value,
  onChange,
  error,
}) => {
  return (
    <Input
      name={name}
      type="date"
      value={value}
      onChange={onChange}
      h="39px"
      fontSize="12px"
      color={TEXT_COLOR}
      borderColor={
        error
          ? "red.400"
          : BORDER_COLOR
      }
      borderRadius="6px"
      _focus={{
        borderColor:
          PRIMARY_RED,
        boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
      }}
    />
  );
};

export default DeathEditPage;