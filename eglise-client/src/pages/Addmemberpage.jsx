import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import {
  LuHouse,
  LuMapPin,
  LuBookOpen,
  LuUsers,
  LuUserPlus,
} from "react-icons/lu";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  NativeSelect,
  Spinner,
  Center,
  Field,
  Avatar,
  Badge,
  Grid,
  GridItem,
  Breadcrumb,
} from "@chakra-ui/react";

import {
  getMember,
  listRelationships,
  listGrades,
  createMember,
  listFamilyMembers,
} from "../api/registryServices";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ============================================================
   HELPERS
============================================================ */

const getId = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "object") {
    return value.id ?? null;
  }

  return value;
};

const getArrayData = (response) => {
  if (!response) return [];

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.data?.results)) {
    return response.data.results;
  }

  if (Array.isArray(response.data?.data)) {
    return response.data.data;
  }

  return [];
};

/* ============================================================
   GET DISPLAY NAME
============================================================ */

const getDisplayName = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.family_name ||
      value.ward_name ||
      value.grade_name ||
      value.title ||
      null
    );
  }

  return String(value);
};

/* ============================================================
   ERROR MESSAGE
============================================================ */

const getBackendErrorMessage = (error) => {
  const data = error?.response?.data;

  console.error("FULL BACKEND ERROR:", data);

  if (!data) {
    return "Unable to connect to the server.";
  }

  if (Array.isArray(data.non_field_errors)) {
    return data.non_field_errors.join(" ");
  }

  if (Array.isArray(data.detail)) {
    return data.detail.join(" ");
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  const fieldNames = [
    "name",
    "baptismal_name",
    "relationship",
    "gender",
    "email",
    "mobile_no",
    "phone_no",
    "blood_group",
    "marital_status",
    "spouse_name",
    "dob",
    "father_name",
    "mother_name",
    "date_of_baptism",
    "parish_of_baptism",
    "educational_qualification",
    "sunday_school_qualification",
    "profession",
    "grade",
    "joining_date",
    "transferred_from",
    "family",
    "house_name",
    "house_sequence",
  ];

  for (const field of fieldNames) {
    if (
      Array.isArray(data[field]) &&
      data[field].length > 0
    ) {
      return `${field.replaceAll("_", " ")}: ${data[field].join(
        " "
      )}`;
    }

    if (typeof data[field] === "string") {
      return `${field.replaceAll("_", " ")}: ${data[field]}`;
    }
  }

  return "Failed to add dependent.";
};

/* ============================================================
   COMPONENT
============================================================ */

const AddMemberPage = () => {
  const { headId } = useParams();
  const navigate = useNavigate();

  const [head, setHead] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [grades, setGrades] = useState([]);
  const [dependentCount, setDependentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ============================================================
     LOAD DATA
  ============================================================ */

  useEffect(() => {
    if (headId) {
      fetchData();
    }
  }, [headId]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [hRes, rRes, gRes] = await Promise.all([
        getMember(headId),
        listRelationships(),
        listGrades(),
      ]);

      const headData = hRes?.data;

      setHead(headData);
      setRelationships(getArrayData(rRes));
      setGrades(getArrayData(gRes));

      console.log("FAMILY HEAD:", headData);
      console.log(
        "RELATIONSHIPS:",
        getArrayData(rRes)
      );
      console.log(
        "GRADES:",
        getArrayData(gRes)
      );

      /* ========================================================
         FAMILY / HOUSE DETAILS
      ======================================================== */

      const familyId = getId(headData?.family);

      if (familyId && listFamilyMembers) {
        try {
          const membersResponse =
            await listFamilyMembers(familyId);

          const members = getArrayData(
            membersResponse
          );

          console.log(
            "FAMILY MEMBERS:",
            members
          );

          const dependents = members.filter(
            (member) =>
              !member.is_family_head &&
              member.is_active !== false
          );

          setDependentCount(
            dependents.length
          );
        } catch (memberError) {
          console.error(
            "Could not load family members:",
            memberError
          );

          setDependentCount(
            Number(
              headData?.dependents_count ??
                headData?.total_dependents ??
                0
            )
          );
        }
      } else {
        setDependentCount(
          Number(
            headData?.dependents_count ??
              headData?.total_dependents ??
              0
          )
        );
      }
    } catch (error) {
      console.error(
        "Error fetching form data:",
        error
      );

      window.alert(
        getBackendErrorMessage(error) ||
          "Failed to load form data."
      );

      navigate(
        `/family-heads/${headId}/members`
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     VALIDATION
  ============================================================ */

  const validationSchema = Yup.object({
    name: Yup.string()
      .trim()
      .required("Name is required"),

    relationship: Yup.number()
      .typeError("Relationship is required")
      .required("Relationship is required"),

    gender: Yup.string()
      .oneOf(
        ["MALE", "FEMALE"],
        "Please select a valid gender"
      )
      .required("Gender is required"),

    /*
     * EMAIL IS REQUIRED
     */
    email: Yup.string()
      .trim()
      .email("Invalid email address")
      .required("Email is required"),

    mobile_no: Yup.string()
      .matches(
        /^[0-9]{10}$/,
        "Mobile number must contain exactly 10 digits"
      )
      .required("Mobile number is required"),

    marital_status: Yup.string()
      .required("Marital status is required"),
  });

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = async (
    values,
    { setSubmitting }
  ) => {
    try {
      const familyId = getId(
        head?.family
      );

      if (!familyId) {
        window.alert(
          "Family information is missing from the selected family head."
        );
        return;
      }

      if (!head?.house_name) {
        window.alert(
          "House name is missing from the selected family head."
        );
        return;
      }

      /*
       * EMAIL IS NOW ALWAYS INCLUDED
       */
      const memberData = {
        name: values.name.trim(),

        relationship: Number(
          values.relationship
        ),

        gender: values.gender,

        email: values.email
          .trim()
          .toLowerCase(),

        family: Number(familyId),

        house_name: String(
          head.house_name
        ).trim(),

        house_sequence: Number(
          head.house_sequence ?? 1
        ),

        is_active: true,

        mobile_no: values.mobile_no
          .replace(/\D/g, "")
          .slice(0, 10),
      };

      /* ========================================================
         OPTIONAL VALUES
      ======================================================== */

      if (
        values.baptismal_name?.trim()
      ) {
        memberData.baptismal_name =
          values.baptismal_name.trim();
      }

      if (values.phone_no?.trim()) {
        memberData.phone_no =
          values.phone_no.trim();
      }

      if (values.blood_group) {
        memberData.blood_group =
          values.blood_group;
      }

      if (values.marital_status) {
        memberData.marital_status =
          values.marital_status;
      }

      if (values.spouse_name?.trim()) {
        memberData.spouse_name =
          values.spouse_name.trim();
      }

      if (values.dob) {
        memberData.dob = values.dob;
      }

      if (values.father_name?.trim()) {
        memberData.father_name =
          values.father_name.trim();
      }

      if (values.mother_name?.trim()) {
        memberData.mother_name =
          values.mother_name.trim();
      }

      if (values.date_of_baptism) {
        memberData.date_of_baptism =
          values.date_of_baptism;
      }

      if (
        values.parish_of_baptism?.trim()
      ) {
        memberData.parish_of_baptism =
          values.parish_of_baptism.trim();
      }

      if (
        values.educational_qualification?.trim()
      ) {
        memberData.educational_qualification =
          values.educational_qualification.trim();
      }

      if (
        values.sunday_school_qualification?.trim()
      ) {
        memberData.sunday_school_qualification =
          values.sunday_school_qualification.trim();
      }

      if (values.profession?.trim()) {
        memberData.profession =
          values.profession.trim();
      }

      if (values.grade) {
        memberData.grade =
          Number(values.grade);
      }

      if (values.joining_date) {
        memberData.joining_date =
          values.joining_date;
      }

      if (values.transferred_from?.trim()) {
        memberData.transferred_from =
          values.transferred_from.trim();
      }

      console.log(
        "CREATING DEPENDENT:",
        memberData
      );

      await createMember(memberData);

      window.alert(
        "Dependent added successfully!"
      );

      navigate(
        `/family-heads/${headId}/members`
      );
    } catch (error) {
      console.error(
        "CREATE MEMBER ERROR:",
        error
      );

      console.error(
        "BACKEND RESPONSE:",
        error?.response?.data
      );

      const message =
        getBackendErrorMessage(error);

      window.alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        minH="100vh"
        bg="white"
      >
        <Navbar />

        <Center flex="1">
          <Spinner
            size="lg"
            color="var(--primary-maroon)"
          />
        </Center>

        <Footer />
      </Box>
    );
  }

  /* ============================================================
     NO HEAD
  ============================================================ */

  if (!head) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        minH="100vh"
      >
        <Navbar />

        <Center flex="1">
          <Text color="gray.600">
            Family head not found.
          </Text>
        </Center>

        <Footer />
      </Box>
    );
  }

  /* ============================================================
     FAMILY DATA
  ============================================================ */

  const familyName =
    typeof head.family === "object"
      ? head.family?.family_name ||
        head.family?.name ||
        "Family"
      : head.family_name ||
        "Family";

  const wardName =
    getDisplayName(
      head.ward_name ??
        head.ward
    ) || "N/A";

  const gradeName =
    getDisplayName(
      head.grade_name ??
        head.grade
    ) || "N/A";

  const familyImage =
    head.family_image ||
    head.family_image_url ||
    head.image_url ||
    head.image ||
    null;

  /* ============================================================
     FIELD STYLES
  ============================================================ */

  const inputProps = {
    h: "34px",
    minH: "34px",
    borderColor: "#D9E1EC",
    borderRadius: "5px",
    fontSize: "12px",
    color: "#14265B",
    _placeholder: {
      color: "#7890B8",
    },
  };

  const labelProps = {
    fontSize: "11px",
    fontWeight: "600",
    color: "#14265B",
    mb: "2px",
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Box
      display="flex"
      flexDirection="column"
      minH="100vh"
      bg="white"
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
        bg="white"
      >
        <Box
          maxW="1400px"
          mx="auto"
          px={{
            base: "16px",
            md: "24px",
            lg: "30px",
          }}
          py={{
            base: "14px",
            md: "16px",
          }}
        >
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <Breadcrumb.Root
            mb="8px"
            fontSize="11px"
          >
            <Breadcrumb.List>
              <Breadcrumb.Item>
                <Breadcrumb.Link
                  href="/family-heads"
                  color="#3974D8"
                >
                  Masters
                </Breadcrumb.Link>
              </Breadcrumb.Item>

              <Breadcrumb.Separator />

              <Breadcrumb.Item>
                <Breadcrumb.Link
                  href="/family-heads"
                  color="#3974D8"
                >
                  Family Head Master
                </Breadcrumb.Link>
              </Breadcrumb.Item>

              <Breadcrumb.Separator />

              <Breadcrumb.Item>
                <Breadcrumb.Link
                  color="#3974D8"
                >
                  {head.name}
                </Breadcrumb.Link>
              </Breadcrumb.Item>

              <Breadcrumb.Separator />

              <Breadcrumb.Item>
                <Breadcrumb.CurrentLink
                  color="#3974D8"
                >
                  Add Dependent
                </Breadcrumb.CurrentLink>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>

          {/* ==================================================
              PAGE HEADER
          ================================================== */}

          <VStack
            align="start"
            gap="1px"
            mb="9px"
          >
            <Text
              fontSize="10px"
              fontWeight="700"
              color="#E00000"
              textTransform="uppercase"
            >
              Family Head Master
            </Text>

            <Heading
              fontSize={{
                base: "23px",
                md: "25px",
              }}
              lineHeight="1.05"
              fontWeight="600"
              color="#14265B"
              fontFamily="Outfit, sans-serif"
            >
              Add Dependent
            </Heading>

            <Text
              fontSize="11px"
              color="#7081A3"
            >
              Register a dependent under the selected
              family head.
            </Text>
          </VStack>

          {/* ==================================================
              FAMILY HEAD SUMMARY
          ================================================== */}

          <Box
            bg="white"
            border="1px solid #DDE4EE"
            borderRadius="6px"
            h={{
              base: "auto",
              md: "76px",
            }}
            mb="10px"
            px={{
              base: "14px",
              md: "18px",
            }}
            py={{
              base: "10px",
              md: "6px",
            }}
            boxShadow="0 1px 2px rgba(0,0,0,0.02)"
          >
            <Grid
              templateColumns={{
                base: "1fr",
                md: "210px 1fr 1fr 1fr 1fr 1fr",
              }}
              alignItems="center"
              h="100%"
              gap={{
                base: "10px",
                md: "0",
              }}
            >
              {/* PERSON */}

              <HStack
                gap="9px"
                h="100%"
              >
                <Avatar.Root
                  size="md"
                  flexShrink={0}
                >
                  {familyImage ? (
                    <Avatar.Image
                      src={familyImage}
                      alt={head.name}
                      objectFit="cover"
                    />
                  ) : null}

                  <Avatar.Fallback
                    name={head.name}
                    bg="#E9EDF5"
                    color="#14265B"
                    fontWeight="700"
                    fontSize="13px"
                  />
                </Avatar.Root>

                <VStack
                  align="start"
                  gap="0"
                  minW="0"
                >
                  <Heading
                    fontSize="14px"
                    fontWeight="700"
                    color="#14265B"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    maxW="170px"
                  >
                    {head.name}
                  </Heading>

                  <Text
                    fontSize="10px"
                    color="#14265B"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    maxW="170px"
                  >
                    {familyName}
                  </Text>
                </VStack>
              </HStack>

              {/* HOUSE */}

              <HStack
                gap="7px"
                borderLeft={{
                  md: "1px solid #DDE4EE",
                }}
                pl={{
                  md: "20px",
                }}
                h={{
                  md: "40px",
                }}
              >
                <Box color="#172B67">
                  <LuHouse size={17} />
                </Box>

                <VStack
                  align="start"
                  gap="0"
                >
                  <Text
                    fontSize="9px"
                    color="#7890B8"
                  >
                    House
                  </Text>

                  <Text
                    fontSize="11px"
                    fontWeight="600"
                    color="#14265B"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    maxW="130px"
                  >
                    {head.house_name ||
                      "N/A"}
                  </Text>
                </VStack>
              </HStack>

              {/* WARD */}

              <HStack
                gap="7px"
                borderLeft={{
                  md: "1px solid #DDE4EE",
                }}
                pl={{
                  md: "20px",
                }}
                h={{
                  md: "40px",
                }}
              >
                <Box color="#172B67">
                  <LuMapPin size={17} />
                </Box>

                <VStack
                  align="start"
                  gap="0"
                >
                  <Text
                    fontSize="9px"
                    color="#7890B8"
                  >
                    Ward
                  </Text>

                  <Text
                    fontSize="11px"
                    fontWeight="600"
                    color="#14265B"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    maxW="130px"
                  >
                    {wardName}
                  </Text>
                </VStack>
              </HStack>

              {/* GRADE */}

              <HStack
                gap="7px"
                borderLeft={{
                  md: "1px solid #DDE4EE",
                }}
                pl={{
                  md: "20px",
                }}
                h={{
                  md: "40px",
                }}
              >
                <Box color="#172B67">
                  <LuBookOpen size={17} />
                </Box>

                <VStack
                  align="start"
                  gap="0"
                >
                  <Text
                    fontSize="9px"
                    color="#7890B8"
                  >
                    Grade
                  </Text>

                  <Text
                    fontSize="11px"
                    fontWeight="600"
                    color="#14265B"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    maxW="130px"
                  >
                    {gradeName}
                  </Text>
                </VStack>
              </HStack>

              {/* STATUS */}

              <HStack
                justify={{
                  md: "center",
                }}
                borderLeft={{
                  md: "1px solid #DDE4EE",
                }}
                h="40px"
              >
                <Badge
                  colorPalette="green"
                  variant="subtle"
                  borderRadius="4px"
                  px="8px"
                  py="3px"
                  fontSize="10px"
                  fontWeight="500"
                >
                  Active
                </Badge>
              </HStack>

              {/* DEPENDENTS */}

              <HStack
                gap="7px"
                borderLeft={{
                  md: "1px solid #DDE4EE",
                }}
                pl={{
                  md: "20px",
                }}
                h={{
                  md: "40px",
                }}
              >
                <Box color="#172B67">
                  <LuUsers size={17} />
                </Box>

                <VStack
                  align="start"
                  gap="0"
                >
                  <Text
                    fontSize="9px"
                    color="#7890B8"
                  >
                    Dependents
                  </Text>

                  <Text
                    fontSize="11px"
                    fontWeight="600"
                    color="#14265B"
                  >
                    {dependentCount}
                  </Text>
                </VStack>
              </HStack>
            </Grid>
          </Box>

          {/* ==================================================
              FORM
          ================================================== */}

          <Box
            bg="white"
            border="1px solid #DDE4EE"
            borderRadius="6px"
            px={{
              base: "14px",
              md: "16px",
            }}
            pt="10px"
            pb="5px"
          >
            <Heading
              fontSize="14px"
              fontWeight="700"
              color="#14265B"
              mb="8px"
            >
              Dependent Information
            </Heading>

            <Formik
              initialValues={{
                name: "",
                baptismal_name: "",
                relationship: "",
                gender: "",
                email: "",
                mobile_no: "",
                phone_no: "",
                blood_group: "",
                marital_status: "",
                spouse_name: "",
                dob: "",
                father_name: "",
                mother_name: "",
                date_of_baptism: "",
                parish_of_baptism: "",
                educational_qualification: "",
                sunday_school_qualification: "",
                profession: "",
                grade: "",
                joining_date: "",
                transferred_from: "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                setFieldValue,
                isSubmitting,
              }) => (
                <Form>
                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "repeat(3, 1fr)",
                    }}
                    columnGap={{
                      base: "14px",
                      md: "24px",
                    }}
                    rowGap="7px"
                  >
                    {/* =================================================
                        COLUMN 1
                    ================================================= */}

                    <GridItem>
                      <VStack
                        align="stretch"
                        gap="7px"
                      >
                        {/* NAME */}

                        <Field.Root
                          invalid={
                            touched.name &&
                            Boolean(errors.name)
                          }
                        >
                          <Field.Label
                            {...labelProps}
                          >
                            Name{" "}
                            <Text
                              as="span"
                              color="#E00000"
                            >
                              *
                            </Text>
                          </Field.Label>

                          <Input
                            name="name"
                            value={values.name}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            {...inputProps}
                          />

                          {touched.name &&
                            errors.name && (
                              <Field.ErrorText fontSize="10px">
                                {errors.name}
                              </Field.ErrorText>
                            )}
                        </Field.Root>

                        {/* GENDER */}

                        <Field.Root
                          invalid={
                            touched.gender &&
                            Boolean(errors.gender)
                          }
                        >
                          <Field.Label
                            {...labelProps}
                          >
                            Gender{" "}
                            <Text
                              as="span"
                              color="#E00000"
                            >
                              *
                            </Text>
                          </Field.Label>

                          <NativeSelect.Root>
                            <NativeSelect.Field
                              name="gender"
                              value={
                                values.gender
                              }
                              onChange={
                                handleChange
                              }
                              {...inputProps}
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
                            </NativeSelect.Field>
                          </NativeSelect.Root>

                          {touched.gender &&
                            errors.gender && (
                              <Field.ErrorText fontSize="10px">
                                {errors.gender}
                              </Field.ErrorText>
                            )}
                        </Field.Root>

                        {/* SPOUSE */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps}
                          >
                            Spouse
                          </Field.Label>

                          <Input
                            name="spouse_name"
                            value={
                              values.spouse_name
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter spouse name"
                            {...inputProps}
                          />
                        </Field.Root>

                        {/* BLOOD GROUP */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps}
                          >
                            Blood Group
                          </Field.Label>

                          <NativeSelect.Root>
                            <NativeSelect.Field
                              name="blood_group"
                              value={
                                values.blood_group
                              }
                              onChange={
                                handleChange
                              }
                              {...inputProps}
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
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                        </Field.Root>

                        {/* DATE OF BAPTISM */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps}
                          >
                            Date of Baptism
                          </Field.Label>

                          <Input
                            type="date"
                            name="date_of_baptism"
                            value={
                              values.date_of_baptism
                            }
                            onChange={
                              handleChange
                            }
                            {...inputProps}
                          />
                        </Field.Root>

                        {/* SUNDAY SCHOOL */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps}
                          >
                            Sunday School Qualification
                          </Field.Label>

                          <Input
                            name="sunday_school_qualification"
                            value={
                              values.sunday_school_qualification
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter qualification"
                            {...inputProps}
                          />
                        </Field.Root>
                      </VStack>
                    </GridItem>

                    {/* =================================================
                        COLUMN 2
                    ================================================= */}

                    <GridItem>
                      <VStack
                        align="stretch"
                        gap="7px"
                      >
                        {/* BAPTISM NAME */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps}
                          >
                            Baptism Name
                          </Field.Label>

                          <Input
                            name="baptismal_name"
                            value={
                              values.baptismal_name
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter baptism name"
                            {...inputProps}
                          />
                        </Field.Root>

                        {/* EMAIL */}

                        <Field.Root
                          invalid={
                            touched.email &&
                            Boolean(errors.email)
                          }
                        >
                          <Field.Label
                            {...labelProps}
                          >
                            Email{" "}
                            <Text
                              as="span"
                              color="#E00000"
                            >
                              *
                            </Text>
                          </Field.Label>

                          <Input
                            type="email"
                            name="email"
                            value={
                              values.email
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter email address"
                            {...inputProps}
                          />

                          {touched.email &&
                            errors.email && (
                              <Field.ErrorText fontSize="10px">
                                {errors.email}
                              </Field.ErrorText>
                            )}
                        </Field.Root>

                        {/* DOB */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps}
                          >
                            Date of Birth
                          </Field.Label>

                          <Input
                            type="date"
                            name="dob"
                            value={values.dob}
                            onChange={
                              handleChange
                            }
                            {...inputProps}
                          />
                        </Field.Root>

                        {/* FATHER */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps}
                          >
                            Father Name
                          </Field.Label>

                          <Input
                            name="father_name"
                            value={
                              values.father_name
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter father name"
                            {...inputProps}
                          />
                        </Field.Root>

                        {/* PARISH */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps}
                          >
                            Parish of Baptism
                          </Field.Label>

                          <Input
                            name="parish_of_baptism"
                            value={
                              values.parish_of_baptism
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter parish"
                            {...inputProps}
                          />
                        </Field.Root>

                        {/* PROFESSION */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps}
                          >
                            Profession
                          </Field.Label>

                          <Input
                            name="profession"
                            value={
                              values.profession
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter profession"
                            {...inputProps}
                          />
                        </Field.Root>
                      </VStack>
                    </GridItem>

                    {/* =================================================
                        COLUMN 3
                    ================================================= */}

                    <GridItem>
                      <VStack
                        align="stretch"
                        gap="7px"
                      >
                        {/* RELATIONSHIP */}

                        <Field.Root
                          invalid={
                            touched.relationship &&
                            Boolean(
                              errors.relationship
                            )
                          }
                        >
                          <Field.Label
                            {...labelProps}
                          >
                            Relationship{" "}
                            <Text
                              as="span"
                              color="#E00000"
                            >
                              *
                            </Text>
                          </Field.Label>

                          <NativeSelect.Root>
                            <NativeSelect.Field
                              name="relationship"
                              value={
                                values.relationship
                              }
                              onChange={
                                handleChange
                              }
                              {...inputProps}
                            >
                              <option value="">
                                Select relationship
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
                            </NativeSelect.Field>
                          </NativeSelect.Root>

                          {touched.relationship &&
                            errors.relationship && (
                              <Field.ErrorText fontSize="10px">
                                {
                                  errors.relationship
                                }
                              </Field.ErrorText>
                            )}
                        </Field.Root>

                        {/* MARITAL STATUS */}

                        <Field.Root
                          invalid={
                            touched.marital_status &&
                            Boolean(
                              errors.marital_status
                            )
                          }
                        >
                          <Field.Label
                            {...labelProps}
                          >
                            Marital Status{" "}
                            <Text
                              as="span"
                              color="#E00000"
                            >
                              *
                            </Text>
                          </Field.Label>

                          <NativeSelect.Root>
                            <NativeSelect.Field
                              name="marital_status"
                              value={
                                values.marital_status
                              }
                              onChange={
                                handleChange
                              }
                              {...inputProps}
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
                            </NativeSelect.Field>
                          </NativeSelect.Root>

                          {touched.marital_status &&
                            errors.marital_status && (
                              <Field.ErrorText fontSize="10px">
                                {
                                  errors.marital_status
                                }
                              </Field.ErrorText>
                            )}
                        </Field.Root>

                        {/* MOBILE */}

                        <Field.Root
                          invalid={
                            touched.mobile_no &&
                            Boolean(
                              errors.mobile_no
                            )
                          }
                        >
                          <Field.Label
                            {...labelProps}
                          >
                            Mobile Number{" "}
                            <Text
                              as="span"
                              color="#E00000"
                            >
                              *
                            </Text>
                          </Field.Label>

                          <Input
                            name="mobile_no"
                            value={
                              values.mobile_no
                            }
                            onChange={(event) => {
                              const digits =
                                event.target.value
                                  .replace(
                                    /\D/g,
                                    ""
                                  )
                                  .slice(
                                    0,
                                    10
                                  );

                              setFieldValue(
                                "mobile_no",
                                digits
                              );
                            }}
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="Enter mobile number"
                            {...inputProps}
                          />

                          {touched.mobile_no &&
                            errors.mobile_no && (
                              <Field.ErrorText fontSize="10px">
                                {
                                  errors.mobile_no
                                }
                              </Field.ErrorText>
                            )}
                        </Field.Root>

                        {/* MOTHER */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps}
                          >
                            Mother Name
                          </Field.Label>

                          <Input
                            name="mother_name"
                            value={
                              values.mother_name
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter mother name"
                            {...inputProps}
                          />
                        </Field.Root>

                        {/* EDUCATION */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps}
                          >
                            Education Qualification
                          </Field.Label>

                          <Input
                            name="educational_qualification"
                            value={
                              values.educational_qualification
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter education"
                            {...inputProps}
                          />
                        </Field.Root>

                        {/* JOINING DATE */}

                        <Field.Root>
                          <Field.Label
                            {...labelProps
                            }
                          >
                            Joining Date
                          </Field.Label>

                          <Input
                            type="date"
                            name="joining_date"
                            value={
                              values.joining_date
                            }
                            onChange={
                              handleChange
                            }
                            {...inputProps}
                          />
                        </Field.Root>
                      </VStack>
                    </GridItem>
                  </Grid>

                  {/* =================================================
                      BUTTONS
                  ================================================= */}

                  <HStack
                    justify="flex-end"
                    gap="9px"
                    mt="10px"
                    pt="7px"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      border="1px solid #E00000"
                      color="#E00000"
                      bg="white"
                      h="34px"
                      minW="115px"
                      borderRadius="5px"
                      fontSize="11px"
                      fontWeight="600"
                      onClick={() =>
                        navigate(
                          `/family-heads/${headId}/members`
                        )
                      }
                      _hover={{
                        bg: "#FFF5F5",
                      }}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      bg="#E00000"
                      color="white"
                      h="34px"
                      minW="150px"
                      borderRadius="5px"
                      fontSize="11px"
                      fontWeight="600"
                      loading={isSubmitting}
                      loadingText="Adding..."
                      _hover={{
                        bg: "#C90000",
                      }}
                    >
                      <LuUserPlus
                        size={14}
                      />
                      Add Dependent
                    </Button>
                  </HStack>
                </Form>
              )}
            </Formik>
          </Box>
        </Box>
      </Box>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Footer />
    </Box>
  );
};

export default AddMemberPage;