import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Spinner,
  Center,
  SimpleGrid,
  Avatar,
} from "@chakra-ui/react";

import {
  LuCalendarDays,
  LuUsers,
  LuInfo,
  LuPencil,
} from "react-icons/lu";

import {
  getMember,
  updateHead,
  listFamilies,
  listWards,
  listGrades,
} from "../api/registryServices";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EditFamilyHeadPage = () => {
  const { headId } = useParams();
  const navigate = useNavigate();

  const [head, setHead] = useState(null);
  const [families, setFamilies] = useState([]);
  const [wards, setWards] = useState([]);
  const [grades, setGrades] = useState([]);

  const [loading, setLoading] = useState(true);

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [step, setStep] = useState(1);

  // ============================================================
  // FETCH DATA
  // ============================================================

  useEffect(() => {
    fetchData();
  }, [headId]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [hRes, fRes, wRes, gRes] = await Promise.all([
        getMember(headId),
        listFamilies(),
        listWards(),
        listGrades(),
      ]);

      const headData = hRes.data;

      setHead(headData);

      setFamilies(
        Array.isArray(fRes.data)
          ? fRes.data
          : fRes.data?.results || []
      );

      setWards(
        Array.isArray(wRes.data)
          ? wRes.data
          : wRes.data?.results || []
      );

      setGrades(
        Array.isArray(gRes.data)
          ? gRes.data
          : gRes.data?.results || []
      );

      if (headData?.family_image) {
        setPhotoPreview(headData.family_image);
      }
    } catch (error) {
      console.error("Error fetching family head:", error);

      window.alert("Failed to load family head.");

      navigate("/family-heads");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getRelationId = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "object") {
      return value.id ?? "";
    }

    return value;
  };

  const getFamilyName = (familyId) => {
    const family = families.find(
      (item) => String(item.id) === String(familyId)
    );

    return (
      family?.family_name ||
      family?.name ||
      head?.family?.family_name ||
      "Family"
    );
  };

  const getWardName = (wardId) => {
    const ward = wards.find(
      (item) => String(item.id) === String(wardId)
    );

    return (
      ward?.ward_name ||
      ward?.name ||
      head?.ward?.ward_name ||
      "Ward"
    );
  };

  const getGradeName = (gradeId) => {
    const grade = grades.find(
      (item) => String(item.id) === String(gradeId)
    );

    return (
      grade?.name ||
      grade?.grade_name ||
      head?.grade?.name ||
      "Grade"
    );
  };

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validationSchema = Yup.object({
    family: Yup.string().required("Family is required"),

    ward: Yup.string().required("Ward is required"),

    grade: Yup.string().required("Grade is required"),

    house_name: Yup.string()
      .trim()
      .required("House name is required"),

    name: Yup.string()
      .trim()
      .required("Name is required"),

    gender: Yup.string()
      .required("Gender is required"),

    dob: Yup.string()
      .required("Date of birth is required"),

    email: Yup.string()
      .email("Invalid email")
      .required("Email is required"),

    mobile_no: Yup.string()
      .trim()
      .required("Mobile number is required"),

    marital_status: Yup.string()
      .required("Marital status is required"),

    address: Yup.string()
      .trim()
      .required("Address is required"),
  });

  // ============================================================
  // INITIAL VALUES
  // ============================================================

  const initialValues = useMemo(() => {
    if (!head) {
      return {};
    }

    return {
      family: getRelationId(head.family),
      ward: getRelationId(head.ward),
      grade: getRelationId(head.grade),

      house_name: head.house_name || "",
      name: head.name || "",
      baptismal_name: head.baptismal_name || "",

      gender: head.gender || "",
      dob: head.dob || "",
      blood_group: head.blood_group || "",

      email: head.email || "",
      mobile_no: head.mobile_no || "",
      phone_no: head.phone_no || "",

      marital_status: head.marital_status || "",
      spouse_name: head.spouse_name || "",
      father_name: head.father_name || "",
      mother_name: head.mother_name || "",

      address: head.address || "",

      date_of_baptism: head.date_of_baptism || "",
      parish_of_baptism: head.parish_of_baptism || "",

      educational_qualification:
        head.educational_qualification || "",

      sunday_school_qualification:
        head.sunday_school_qualification || "",

      profession: head.profession || "",

      joining_date: head.joining_date || "",
      transferred_from: head.transferred_from || "",
    };
  }, [head, families, wards, grades]);

  // ============================================================
  // PHOTO
  // ============================================================

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      window.alert("Image must be less than 2 MB.");
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (values) => {
    if (step === 1) {
      setStep(2);
      return;
    }

    try {
      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        const value = values[key];

        if (
          value !== null &&
          value !== undefined &&
          value !== ""
        ) {
          formData.append(key, value);
        }
      });

      if (photoFile) {
        formData.append("family_image", photoFile);
      }

      await updateHead(headId, formData);

      window.alert("Family head updated successfully!");

      navigate(`/family-heads/${headId}`);
    } catch (error) {
      console.error(
        "Update family head error:",
        error
      );

      const responseData = error?.response?.data;

      let message =
        responseData?.error ||
        responseData?.detail ||
        "Failed to update family head.";

      if (
        typeof responseData === "object" &&
        !responseData?.error &&
        !responseData?.detail
      ) {
        const firstError =
          Object.values(responseData)[0];

        if (Array.isArray(firstError)) {
          message = firstError[0];
        } else if (
          typeof firstError === "string"
        ) {
          message = firstError;
        }
      }

      window.alert(message);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <Center minH="70vh">
          <VStack gap={3}>
            <Spinner
              size="lg"
              color="var(--primary-maroon)"
            />

            <Text color="gray.500">
              Loading family head...
            </Text>
          </VStack>
        </Center>

        <Footer />
      </>
    );
  }

  // ============================================================
  // NOT FOUND
  // ============================================================

  if (!head) {
    return (
      <>
        <Navbar />

        <Box p={6}>
          <Text>
            Family head not found.
          </Text>
        </Box>

        <Footer />
      </>
    );
  }

  // ============================================================
  // COLORS / STYLES
  // ============================================================

  const primaryColor =
    "var(--primary-maroon)";

  const errorColor =
    "var(--danger)";

  // Reduced field height
  const inputStyle = {
    height: "32px",
    minHeight: "32px",
    borderWidth: "1px",
    borderColor: "#d7dce5",
    borderRadius: "6px",
    background: "var(--white)",
    fontSize: "12px",
    color: "#17233f",
    boxShadow: "none",
    paddingLeft: "9px",
    paddingRight: "9px",
  };

  const selectStyle = {
    width: "100%",
    height: "32px",
    minHeight: "32px",
    paddingLeft: "9px",
    paddingRight: "28px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#d7dce5",
    borderRadius: "6px",
    background: "var(--white)",
    color: "#17233f",
    fontSize: "12px",
    outline: "none",
  };

  // ============================================================
  // FIELD COMPONENT
  // ============================================================

  const FieldWrapper = ({
    label,
    required = false,
    children,
    error,
  }) => {
    return (
      <Box width="100%">
        <Text
          fontSize="11px"
          fontWeight="600"
          color="#17233f"
          mb="3px"
        >
          {label}

          {required && (
            <Text
              as="span"
              color={errorColor}
              ml="3px"
            >
              *
            </Text>
          )}
        </Text>

        {children}

        {error && (
          <Text
            color={errorColor}
            fontSize="10px"
            mt="2px"
            lineHeight="1.2"
          >
            {error}
          </Text>
        )}
      </Box>
    );
  };

  // ============================================================
  // STEP TABS
  // ============================================================

  const StepTabs = () => {
    return (
      <Box
        borderBottom="1px solid #e1e5ec"
        bg="var(--white)"
      >
        <HStack
          gap={0}
          align="stretch"
        >
          <Button
            flex="1"
            height="50px"
            borderRadius="0"
            bg="transparent"
            borderBottom={
              step === 1
                ? `2px solid ${primaryColor}`
                : "2px solid transparent"
            }
            color={
              step === 1
                ? primaryColor
                : "#17233f"
            }
            _hover={{
              bg: "transparent",
            }}
            onClick={() => setStep(1)}
            px={4}
          >
            <VStack gap={0}>
              <Text
                fontSize="12px"
                fontWeight="700"
              >
                Family & Personal
              </Text>

              <Text
                fontSize="10px"
                fontWeight="400"
                color={
                  step === 1
                    ? "#607198"
                    : "#71809d"
                }
              >
                Family, personal, address and photo
              </Text>
            </VStack>
          </Button>

          <Button
            flex="1"
            height="50px"
            borderRadius="0"
            bg="transparent"
            borderBottom={
              step === 2
                ? `2px solid ${primaryColor}`
                : "2px solid transparent"
            }
            color={
              step === 2
                ? primaryColor
                : "#17233f"
            }
            _hover={{
              bg: "transparent",
            }}
            onClick={() => setStep(2)}
            px={4}
          >
            <VStack gap={0}>
              <Text
                fontSize="12px"
                fontWeight="700"
              >
                Sacraments, Education & Parish
              </Text>

              <Text
                fontSize="10px"
                fontWeight="400"
                color={
                  step === 2
                    ? "#607198"
                    : "#71809d"
                }
              >
                Faith life, education and parish details
              </Text>
            </VStack>
          </Button>
        </HStack>
      </Box>
    );
  };

  // ============================================================
  // FAMILY SUMMARY
  // ============================================================

  const FamilySummary = ({ values }) => {
    const familyName =
      getFamilyName(values.family);

    const wardName =
      getWardName(values.ward);

    const gradeName =
      getGradeName(values.grade);

    return (
      <Box
        bg="var(--white)"
        borderWidth="1px"
        borderColor="#dfe3ea"
        borderRadius="10px"
        px={{ base: 4, md: 5 }}
        py={3}
        mb={4}
      >
        <HStack
          gap={{ base: 3, md: 5 }}
          align="flex-start"
          flexWrap="wrap"
        >
          {/* PROFILE */}
          <Avatar.Root size="md">
            {photoPreview && (
              <Avatar.Image
                src={photoPreview}
                alt={values.name || "Family"}
              />
            )}

            <Avatar.Fallback>
              {values.name
                ?.charAt(0)
                ?.toUpperCase() || "F"}
            </Avatar.Fallback>
          </Avatar.Root>

          {/* NAME / FAMILY */}
          <Box
            minW="180px"
            flex="0 0 auto"
          >
            <Text
              fontSize="17px"
              fontWeight="700"
              color="#17233f"
              lineHeight="1.2"
            >
              {values.name ||
                "Family Head"}
            </Text>

            <Text
              fontSize="11px"
              color="#536a94"
              mt="3px"
            >
              {familyName}
            </Text>
          </Box>

          {/* DIVIDER */}
          <Box
            height="34px"
            width="1px"
            bg="#e1e5ec"
            display={{
              base: "none",
              md: "block",
            }}
          />

          {/* WARD */}
          <Box
            minW="85px"
            pt="1px"
            flex="0 0 auto"
          >
            <Text
              fontSize="13px"
              fontWeight="600"
              color="#17233f"
              lineHeight="1.3"
            >
              {wardName}
            </Text>
          </Box>

          {/* DIVIDER */}
          <Box
            height="34px"
            width="1px"
            bg="#e1e5ec"
            display={{
              base: "none",
              md: "block",
            }}
          />

          {/* GRADE */}
          <Box
            minW="80px"
            pt="1px"
            flex="0 0 auto"
          >
            <Text
              fontSize="13px"
              fontWeight="600"
              color="#17233f"
              lineHeight="1.3"
            >
              {gradeName}
            </Text>
          </Box>

          {/* DIVIDER */}
          <Box
            height="30px"
            width="1px"
            bg="#e1e5ec"
            display={{
              base: "none",
              md: "block",
            }}
          />

          {/* ACTIVE */}
          <Box
            px={3}
            py="5px"
            borderRadius="6px"
            bg={
              head.is_active === false
                ? "#f2f3f5"
                : "var(--light-maroon-bg)"
            }
            borderWidth="1px"
            borderColor={
              head.is_active === false
                ? "#d9dce1"
                : "#ffd5da"
            }
            flex="0 0 auto"
          >
            <Text
              fontSize="11px"
              color={
                head.is_active === false
                  ? "#687386"
                  : "#e21d2a"
              }
              fontWeight="600"
              lineHeight="1"
            >
              {head.is_active === false
                ? "Inactive"
                : "Active"}
            </Text>
          </Box>
        </HStack>
      </Box>
    );
  };

  // ============================================================
  // RIGHT SIDEBAR
  // ============================================================

  const RightSidebar = ({ values }) => {
    const familyName =
      getFamilyName(values.family);

    const wardName =
      getWardName(values.ward);

    const gradeName =
      getGradeName(values.grade);

    return (
      <VStack
        align="stretch"
        gap={4}
      >
        {/* RECORD INFORMATION */}
        <Box
          bg="var(--white)"
          borderWidth="1px"
          borderColor="#dfe3ea"
          borderRadius="10px"
          p={4}
        >
          <Heading
            size="sm"
            color="#17233f"
            mb={4}
            fontSize="15px"
          >
            Record Information
          </Heading>

          <HStack
            align="start"
            gap={3}
          >
            <Box
              color="#344b76"
              fontSize="18px"
            >
              <LuCalendarDays />
            </Box>

            <Box>
              <Text
                fontSize="11px"
                fontWeight="700"
                color="#17233f"
              >
                Created
              </Text>

              <Text
                fontSize="11px"
                color="#17233f"
                mt={1}
              >
                {formatDate(
                  head.created_at ||
                    head.created ||
                    head.date_created
                )}
              </Text>
            </Box>
          </HStack>

          <Box
            borderTop="1px solid #e1e5ec"
            my={4}
          />

          <HStack
            align="start"
            gap={3}
          >
            <Box
              color="#344b76"
              fontSize="18px"
            >
              <LuPencil />
            </Box>

            <Box>
              <Text
                fontSize="11px"
                fontWeight="700"
                color="#17233f"
              >
                Last updated
              </Text>

              <Text
                fontSize="11px"
                color="#17233f"
                mt={1}
              >
                {formatDate(
                  head.updated_at ||
                    head.updated ||
                    head.last_updated
                )}

                {head.updated_by_name
                  ? ` by ${head.updated_by_name}`
                  : ""}
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* FAMILY OVERVIEW */}
        <Box
          bg="var(--white)"
          borderWidth="1px"
          borderColor="#dfe3ea"
          borderRadius="10px"
          p={4}
        >
          <Heading
            size="sm"
            color="#17233f"
            mb={4}
            fontSize="15px"
          >
            Family Overview
          </Heading>

          <HStack
            align="start"
            gap={3}
          >
            <Box
              width="58px"
              height="58px"
              borderRadius="50%"
              bg="var(--light-maroon-bg)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="#e21d2a"
              fontSize="26px"
              flexShrink={0}
            >
              <LuUsers />
            </Box>

            <Box>
              <Text
                fontSize="14px"
                fontWeight="700"
                color="#17233f"
              >
                {familyName}
              </Text>

              <Text
                fontSize="12px"
                color="#344b76"
                mt={1.5}
              >
                {wardName}
              </Text>

              <Text
                fontSize="12px"
                color="#344b76"
                mt={1}
              >
                {gradeName}
              </Text>

              <Button
                variant="ghost"
                color={primaryColor}
                fontSize="12px"
                fontWeight="600"
                px={0}
                mt={2}
                height="auto"
                _hover={{
                  bg: "transparent",
                  opacity: 0.8,
                }}
                onClick={() => {
                  if (values.family) {
                    navigate(
                      `/families/${values.family}`
                    );
                  }
                }}
              >
                View Family
                <Text ml={2}>→</Text>
              </Button>
            </Box>
          </HStack>
        </Box>
      </VStack>
    );
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      {/* NAVBAR */}
      <Navbar />

      <Box
        bg="var(--white)"
        minH="calc(100vh - 80px)"
        px={{ base: 4, md: 7 }}
        py={{ base: 4, md: 6 }}
      >
        <Box
          maxW="1570px"
          mx="auto"
        >
          {/* BREADCRUMB */}
          <HStack
            gap={2.5}
            mb={3}
            flexWrap="wrap"
          >
            <Text
              fontSize="12px"
              color="#536a94"
            >
              Masters
            </Text>

            <Text color="#9aa5b8">
              /
            </Text>

            <Text
              fontSize="12px"
              color="#536a94"
            >
              Family Head Master
            </Text>

            <Text color="#9aa5b8">
              /
            </Text>

            <Text
              fontSize="12px"
              color="#536a94"
            >
              {head.name ||
                "Family Head"}
            </Text>

            <Text color="#9aa5b8">
              /
            </Text>

            <Text
              fontSize="12px"
              color="#17233f"
            >
              Edit
            </Text>
          </HStack>

          {/* PAGE TITLE */}
          <Box mb={4}>
            <Text
              fontSize="11px"
              fontWeight="700"
              color="var(--primary-maroon)"
              mb={1}
            >
              FAMILY HEAD MASTER
            </Text>

            <Heading
              fontSize={{
                base: "24px",
                md: "28px",
              }}
              lineHeight="1.1"
              color="#17233f"
            >
              Edit Family Head
            </Heading>

            <Text
              fontSize="12px"
              color="#536a94"
              mt={1.5}
            >
              Update family head, contact,
              address and parish information.
            </Text>
          </Box>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              isSubmitting,
              setTouched,
              validateForm,
            }) => (
              <Form>
                {/* FAMILY SUMMARY */}
                <FamilySummary
                  values={values}
                />

                {/* MAIN CONTENT */}
                <Box
                  display={{
                    base: "block",
                    lg: "grid",
                  }}
                  gridTemplateColumns={{
                    lg:
                      "minmax(0, 3.2fr) minmax(280px, 1fr)",
                  }}
                  gap={4}
                  alignItems="start"
                >
                  {/* LEFT CARD */}
                  <Box
                    bg="var(--white)"
                    borderWidth="1px"
                    borderColor="#dfe3ea"
                    borderRadius="10px"
                    overflow="hidden"
                  >
                    <StepTabs />

                    {/* =================================================
                        STEP 1
                    ================================================= */}
                    {step === 1 && (
                      <Box
                        p={{
                          base: 4,
                          md: 5,
                        }}
                      >
                        <Heading
                          fontSize="16px"
                          color="#17233f"
                          mb={4}
                        >
                          Family & Personal Information
                        </Heading>

                        <Box
                          display={{
                            base: "block",
                            xl: "grid",
                          }}
                          gridTemplateColumns={{
                            xl:
                              "210px minmax(0, 1fr)",
                          }}
                          gap={4}
                        >
                          {/* PHOTO */}
                          <Box>
                            <VStack
                              gap={1.5}
                              align="center"
                            >
                              <Box
                                width="120px"
                                height="120px"
                                borderRadius="50%"
                                overflow="hidden"
                                bg="#f7f7f8"
                              >
                                <Avatar.Root
                                  width="120px"
                                  height="120px"
                                >
                                  {photoPreview && (
                                    <Avatar.Image
                                      src={
                                        photoPreview
                                      }
                                      alt={
                                        values.name ||
                                        "Family"
                                      }
                                      width="120px"
                                      height="120px"
                                    />
                                  )}

                                  <Avatar.Fallback
                                    fontSize="36px"
                                  >
                                    {values.name
                                      ?.charAt(0)
                                      ?.toUpperCase() ||
                                      "F"}
                                  </Avatar.Fallback>
                                </Avatar.Root>
                              </Box>

                              <Text
                                fontSize="12px"
                                fontWeight="600"
                                color="#17233f"
                                mt={1}
                              >
                                Family Photo
                              </Text>

                              <Text
                                fontSize="10px"
                                color="#536a94"
                              >
                                PNG/JPG up to 2 MB
                              </Text>

                              <Input
                                id="photo-input"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                display="none"
                                onChange={
                                  handlePhotoChange
                                }
                              />

                              <Button
                                as="label"
                                htmlFor="photo-input"
                                variant="outline"
                                color={primaryColor}
                                borderColor={
                                  primaryColor
                                }
                                fontSize="12px"
                                height="32px"
                                px={4}
                                cursor="pointer"
                                mt={1}
                                _hover={{
                                  bg: "var(--light-maroon-bg)",
                                }}
                              >
                                ↑&nbsp; Replace Photo
                              </Button>

                              {photoPreview && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  color="#607198"
                                  fontSize="11px"
                                  height="23px"
                                  onClick={
                                    removePhoto
                                  }
                                  _hover={{
                                    bg: "transparent",
                                    color:
                                      primaryColor,
                                  }}
                                >
                                  Remove
                                </Button>
                              )}
                            </VStack>
                          </Box>

                          {/* FORM */}
                          <VStack
                            gap={2.5}
                            align="stretch"
                          >
                            {/* ROW 1 */}
                            <SimpleGrid
                              columns={{
                                base: 1,
                                md: 3,
                              }}
                              gap={3}
                            >
                              {/* FAMILY */}
                              <FieldWrapper
                                label="Family Name"
                                required
                                error={
                                  touched.family
                                    ? errors.family
                                    : ""
                                }
                              >
                                <select
                                  name="family"
                                  value={
                                    values.family
                                  }
                                  onChange={
                                    handleChange
                                  }
                                  onBlur={
                                    handleBlur
                                  }
                                  style={{
                                    ...selectStyle,
                                    borderColor:
                                      touched.family &&
                                      errors.family
                                        ? errorColor
                                        : "#d7dce5",
                                  }}
                                >
                                  <option value="">
                                    Select family
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
                                        {
                                          family.family_name
                                        }
                                      </option>
                                    )
                                  )}
                                </select>
                              </FieldWrapper>

                              {/* WARD */}
                              <FieldWrapper
                                label="Ward"
                                required
                                error={
                                  touched.ward
                                    ? errors.ward
                                    : ""
                                }
                              >
                                <select
                                  name="ward"
                                  value={
                                    values.ward
                                  }
                                  onChange={
                                    handleChange
                                  }
                                  onBlur={
                                    handleBlur
                                  }
                                  style={{
                                    ...selectStyle,
                                    borderColor:
                                      touched.ward &&
                                      errors.ward
                                        ? errorColor
                                        : "#d7dce5",
                                  }}
                                >
                                  <option value="">
                                    Select ward
                                  </option>

                                  {wards.map(
                                    (ward) => (
                                      <option
                                        key={
                                          ward.id
                                        }
                                        value={
                                          ward.id
                                        }
                                      >
                                        {ward.ward_name ||
                                          ward.name}
                                      </option>
                                    )
                                  )}
                                </select>
                              </FieldWrapper>

                              {/* GRADE */}
                              <FieldWrapper
                                label="Grade"
                                required
                                error={
                                  touched.grade
                                    ? errors.grade
                                    : ""
                                }
                              >
                                <select
                                  name="grade"
                                  value={
                                    values.grade
                                  }
                                  onChange={
                                    handleChange
                                  }
                                  onBlur={
                                    handleBlur
                                  }
                                  style={{
                                    ...selectStyle,
                                    borderColor:
                                      touched.grade &&
                                      errors.grade
                                        ? errorColor
                                        : "#d7dce5",
                                  }}
                                >
                                  <option value="">
                                    Select grade
                                  </option>

                                  {grades.map(
                                    (grade) => (
                                      <option
                                        key={
                                          grade.id
                                        }
                                        value={
                                          grade.id
                                        }
                                      >
                                        {grade.name ||
                                          grade.grade_name}
                                      </option>
                                    )
                                  )}
                                </select>
                              </FieldWrapper>
                            </SimpleGrid>

                            {/* ROW 2 */}
                            <SimpleGrid
                              columns={{
                                base: 1,
                                md: 3,
                              }}
                              gap={3}
                            >
                              {/* HOUSE NAME */}
                              <FieldWrapper
                                label="House Name"
                                required
                                error={
                                  touched.house_name
                                    ? errors.house_name
                                    : ""
                                }
                              >
                                <Input
                                  name="house_name"
                                  value={
                                    values.house_name
                                  }
                                  onChange={
                                    handleChange
                                  }
                                  onBlur={
                                    handleBlur
                                  }
                                  placeholder="Enter house name"
                                  style={{
                                    ...inputStyle,
                                    borderColor:
                                      touched.house_name &&
                                      errors.house_name
                                        ? errorColor
                                        : "#d7dce5",
                                  }}
                                />
                              </FieldWrapper>

                              {/* NAME */}
                              <FieldWrapper
                                label="Name"
                                required
                                error={
                                  touched.name
                                    ? errors.name
                                    : ""
                                }
                              >
                                <Input
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
                                  placeholder="Enter name"
                                  style={{
                                    ...inputStyle,
                                    borderColor:
                                      touched.name &&
                                      errors.name
                                        ? errorColor
                                        : "#d7dce5",
                                  }}
                                />
                              </FieldWrapper>

                              {/* BAPTISM NAME */}
                              <FieldWrapper label="Baptism Name">
                                <Input
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
                                  placeholder="Enter baptism name"
                                  style={
                                    inputStyle
                                  }
                                />
                              </FieldWrapper>
                            </SimpleGrid>

                            {/* ROW 3 */}
                            <SimpleGrid
                              columns={{
                                base: 1,
                                md: 3,
                              }}
                              gap={3}
                            >
                              {/* GENDER */}
                              <FieldWrapper
                                label="Gender"
                                required
                                error={
                                  touched.gender
                                    ? errors.gender
                                    : ""
                                }
                              >
                                <select
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
                                  style={{
                                    ...selectStyle,
                                    borderColor:
                                      touched.gender &&
                                      errors.gender
                                        ? errorColor
                                        : "#d7dce5",
                                  }}
                                >
                                  <option value="">
                                    Select gender
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
                                </select>
                              </FieldWrapper>

                              {/* DOB */}
                              <FieldWrapper
                                label="Date of Birth"
                                required
                                error={
                                  touched.dob
                                    ? errors.dob
                                    : ""
                                }
                              >
                                <Input
                                  type="date"
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
                                  style={{
                                    ...inputStyle,
                                    borderColor:
                                      touched.dob &&
                                      errors.dob
                                        ? errorColor
                                        : "#d7dce5",
                                  }}
                                />
                              </FieldWrapper>

                              {/* BLOOD GROUP */}
                              <FieldWrapper label="Blood Group">
                                <select
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
                                  style={
                                    selectStyle
                                  }
                                >
                                  <option value="">
                                    Select blood group
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
                                </select>
                              </FieldWrapper>
                            </SimpleGrid>

                            {/* ROW 4 */}
                            <SimpleGrid
                              columns={{
                                base: 1,
                                md: 3,
                              }}
                              gap={3}
                            >
                              {/* EMAIL */}
                              <FieldWrapper
                                label="Email"
                                required
                                error={
                                  touched.email
                                    ? errors.email
                                    : ""
                                }
                              >
                                <Input
                                  type="email"
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
                                  placeholder="Enter email address"
                                  style={{
                                    ...inputStyle,
                                    borderColor:
                                      touched.email &&
                                      errors.email
                                        ? errorColor
                                        : "#d7dce5",
                                  }}
                                />
                              </FieldWrapper>

                              {/* MOBILE */}
                              <FieldWrapper
                                label="Mobile Number"
                                required
                                error={
                                  touched.mobile_no
                                    ? errors.mobile_no
                                    : ""
                                }
                              >
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
                                  placeholder="Enter mobile number"
                                  style={{
                                    ...inputStyle,
                                    borderColor:
                                      touched.mobile_no &&
                                      errors.mobile_no
                                        ? errorColor
                                        : "#d7dce5",
                                  }}
                                />
                              </FieldWrapper>

                              {/* PHONE */}
                              <FieldWrapper label="Phone Number">
                                <Input
                                  name="phone_no"
                                  value={
                                    values.phone_no
                                  }
                                  onChange={
                                    handleChange
                                  }
                                  onBlur={
                                    handleBlur
                                  }
                                  placeholder="Enter phone number"
                                  style={
                                    inputStyle
                                  }
                                />
                              </FieldWrapper>
                            </SimpleGrid>

                            {/* ROW 5 */}
                            <SimpleGrid
                              columns={{
                                base: 1,
                                md: 3,
                              }}
                              gap={3}
                            >
                              {/* MARITAL STATUS */}
                              <FieldWrapper
                                label="Marital Status"
                                required
                                error={
                                  touched.marital_status
                                    ? errors.marital_status
                                    : ""
                                }
                              >
                                <select
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
                                  style={{
                                    ...selectStyle,
                                    borderColor:
                                      touched.marital_status &&
                                      errors.marital_status
                                        ? errorColor
                                        : "#d7dce5",
                                  }}
                                >
                                  <option value="">
                                    Select marital status
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
                                </select>
                              </FieldWrapper>

                              {/* SPOUSE */}
                              <FieldWrapper label="Spouse Name">
                                <Input
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
                                  placeholder="Enter spouse name"
                                  style={
                                    inputStyle
                                  }
                                />
                              </FieldWrapper>

                              {/* FATHER */}
                              <FieldWrapper label="Father Name">
                                <Input
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
                                  placeholder="Enter father name"
                                  style={
                                    inputStyle
                                  }
                                />
                              </FieldWrapper>
                            </SimpleGrid>

                            {/* ROW 6 */}
                            <SimpleGrid
                              columns={{
                                base: 1,
                                md: 3,
                              }}
                              gap={3}
                            >
                              {/* MOTHER */}
                              <FieldWrapper label="Mother Name">
                                <Input
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
                                  placeholder="Enter mother name"
                                  style={
                                    inputStyle
                                  }
                                />
                              </FieldWrapper>

                              {/* ADDRESS */}
                              <Box
                                gridColumn={{
                                  base: "auto",
                                  md: "span 2",
                                }}
                              >
                                <FieldWrapper
                                  label="Address"
                                  required
                                  error={
                                    touched.address
                                      ? errors.address
                                      : ""
                                  }
                                >
                                  <Input
                                    name="address"
                                    value={
                                      values.address
                                    }
                                    onChange={
                                      handleChange
                                    }
                                    onBlur={
                                      handleBlur
                                    }
                                    placeholder="Enter complete address"
                                    style={{
                                      ...inputStyle,
                                      borderColor:
                                        touched.address &&
                                        errors.address
                                          ? errorColor
                                          : "#d7dce5",
                                    }}
                                  />
                                </FieldWrapper>
                              </Box>
                            </SimpleGrid>
                          </VStack>
                        </Box>

                        {/* STEP 1 BUTTONS */}
                        <HStack
                          justify="flex-end"
                          mt={4}
                          pt={3}
                          borderTop="1px solid #e1e5ec"
                          gap={2}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            borderColor="#c9d0dc"
                            color="#17233f"
                            height="32px"
                            px={5}
                            fontSize="12px"
                            onClick={() =>
                              navigate(
                                `/family-heads/${headId}`
                              )
                            }
                          >
                            Cancel
                          </Button>

                          <Button
                            type="button"
                            bg={primaryColor}
                            color="var(--white)"
                            height="32px"
                            px={6}
                            fontSize="12px"
                            _hover={{
                              opacity: 0.9,
                            }}
                            onClick={async () => {
                              const formErrors =
                                await validateForm();

                              const step1Fields = [
                                "family",
                                "ward",
                                "grade",
                                "house_name",
                                "name",
                                "gender",
                                "dob",
                                "email",
                                "mobile_no",
                                "marital_status",
                                "address",
                              ];

                              const step1Errors = {};

                              step1Fields.forEach(
                                (field) => {
                                  if (
                                    formErrors[field]
                                  ) {
                                    step1Errors[
                                      field
                                    ] =
                                      formErrors[
                                        field
                                      ];
                                  }
                                }
                              );

                              if (
                                Object.keys(
                                  step1Errors
                                ).length > 0
                              ) {
                                setTouched({
                                  family: true,
                                  ward: true,
                                  grade: true,
                                  house_name: true,
                                  name: true,
                                  gender: true,
                                  dob: true,
                                  email: true,
                                  mobile_no: true,
                                  marital_status:
                                    true,
                                  address: true,
                                });

                                return;
                              }

                              setStep(2);
                            }}
                          >
                            Save & Continue
                          </Button>

                          <Text
                            fontSize="11px"
                            color="#536a94"
                            ml={1}
                            whiteSpace="nowrap"
                          >
                            Step 1 of 2
                          </Text>
                        </HStack>
                      </Box>
                    )}

                    {/* =================================================
                        STEP 2
                    ================================================= */}
                    {step === 2 && (
                      <Box
                        p={{
                          base: 4,
                          md: 5,
                        }}
                      >
                        <Box
                          display={{
                            base: "block",
                            md: "grid",
                          }}
                          gridTemplateColumns={{
                            md:
                              "minmax(0, 2fr) minmax(240px, 1fr)",
                          }}
                          gap={5}
                        >
                          {/* SACRAMENTS */}
                          <Box
                            pr={{
                              base: 0,
                              md: 5,
                            }}
                            borderRight={{
                              base: "none",
                              md:
                                "1px solid #e1e5ec",
                            }}
                          >
                            <Heading
                              fontSize="16px"
                              color="#17233f"
                              mb={4}
                            >
                              2. Sacraments & Education
                            </Heading>

                            <VStack
                              gap={3}
                              align="stretch"
                            >
                              <SimpleGrid
                                columns={{
                                  base: 1,
                                  md: 2,
                                }}
                                gap={3}
                              >
                                <FieldWrapper label="Date of Baptism">
                                  <Input
                                    type="date"
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
                                    style={
                                      inputStyle
                                    }
                                  />
                                </FieldWrapper>

                                <FieldWrapper label="Parish of Baptism">
                                  <Input
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
                                    placeholder="Enter parish of baptism"
                                    style={
                                      inputStyle
                                    }
                                  />
                                </FieldWrapper>
                              </SimpleGrid>

                              <SimpleGrid
                                columns={{
                                  base: 1,
                                  md: 2,
                                }}
                                gap={3}
                              >
                                <FieldWrapper label="Educational Qualification">
                                  <Input
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
                                    placeholder="Enter qualification"
                                    style={
                                      inputStyle
                                    }
                                  />
                                </FieldWrapper>

                                <FieldWrapper label="Sunday School Qualification">
                                  <Input
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
                                    placeholder="Enter qualification"
                                    style={
                                      inputStyle
                                    }
                                  />
                                </FieldWrapper>
                              </SimpleGrid>

                              <SimpleGrid
                                columns={{
                                  base: 1,
                                  md: 2,
                                }}
                                gap={3}
                              >
                                <FieldWrapper label="Profession">
                                  <Input
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
                                    placeholder="Enter profession"
                                    style={
                                      inputStyle
                                    }
                                  />
                                </FieldWrapper>
                              </SimpleGrid>
                            </VStack>
                          </Box>

                          {/* PARISH MEMBERSHIP */}
                          <Box>
                            <Heading
                              fontSize="16px"
                              color="#17233f"
                              mb={4}
                            >
                              3. Parish Membership
                            </Heading>

                            <VStack
                              gap={3}
                              align="stretch"
                            >
                              <FieldWrapper label="Joining Date">
                                <Input
                                  type="date"
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
                                  style={
                                    inputStyle
                                  }
                                />
                              </FieldWrapper>

                              <FieldWrapper label="Transferred From">
                                <Input
                                  name="transferred_from"
                                  value={
                                    values.transferred_from
                                  }
                                  onChange={
                                    handleChange
                                  }
                                  onBlur={
                                    handleBlur
                                  }
                                  placeholder="Enter previous parish"
                                  style={
                                    inputStyle
                                  }
                                />
                              </FieldWrapper>
                            </VStack>
                          </Box>
                        </Box>

                        {/* INFO */}
                        <Box
                          mt={4}
                          borderWidth="1px"
                          borderColor="#dfe3ea"
                          borderRadius="7px"
                          px={3}
                          py={2.5}
                          bg="#fbfcfe"
                        >
                          <HStack
                            align="center"
                            gap={2.5}
                          >
                            <Box
                              color="#1264d8"
                              fontSize="17px"
                            >
                              <LuInfo />
                            </Box>

                            <Text
                              fontSize="11px"
                              color="#536a94"
                            >
                              Family assignment is managed
                              from the Family & Personal tab.
                            </Text>
                          </HStack>
                        </Box>

                        {/* BUTTONS */}
                        <HStack
                          justify="flex-end"
                          mt={4}
                          pt={3}
                          borderTop="1px solid #e1e5ec"
                          gap={2}
                          flexWrap="wrap"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            borderColor={
                              primaryColor
                            }
                            color={
                              primaryColor
                            }
                            height="32px"
                            px={6}
                            fontSize="12px"
                            onClick={() => {
                              setStep(1);
                            }}
                          >
                            Back
                          </Button>

                          <Button
                            type="submit"
                            bg={primaryColor}
                            color="var(--white)"
                            height="32px"
                            px={6}
                            fontSize="12px"
                            loading={isSubmitting}
                            _hover={{
                              opacity: 0.9,
                            }}
                          >
                            Update Family Head
                          </Button>

                          <Text
                            fontSize="11px"
                            color="#536a94"
                            ml={1}
                            whiteSpace="nowrap"
                          >
                            Step 2 of 2
                          </Text>
                        </HStack>
                      </Box>
                    )}
                  </Box>

                  {/* RIGHT SIDEBAR */}
                  <RightSidebar
                    values={values}
                  />
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Box>

      {/* FOOTER */}
      <Footer />
    </>
  );
};

export default EditFamilyHeadPage;