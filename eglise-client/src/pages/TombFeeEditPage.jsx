
// src/pages/TombFeesEditPage.jsx

import React, { useEffect, useState } from "react";

import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Text,
  Textarea,
} from "@chakra-ui/react";

import {
  LuSave,
  LuCalendarDays,
  LuUserRound,
  LuTriangleAlert,
  LuClock3,
  LuArchive,
  LuFileText,
} from "react-icons/lu";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getTombFees,
  updateTombFees,
  deleteTombFees,
  listTombTypes,
} from "../api/churchServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const TombFeesEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ==========================================================
  // STATE
  // ==========================================================

  const [tombFee, setTombFee] = useState(null);
  const [tombTypes, setTombTypes] = useState([]);

  const [formData, setFormData] = useState({
    tomb_type: "",
    tomb_fees: "",
    indication: "",
    specification: "",
  });

  const [originalData, setOriginalData] = useState({
    tomb_type: "",
    tomb_fees: "",
    indication: "",
    specification: "",
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [feeResponse, typesResponse] =
        await Promise.all([
          getTombFees(id),
          listTombTypes(),
        ]);

      const fee =
        feeResponse?.data ?? feeResponse;

      const types =
        typesResponse?.data ?? typesResponse;

      setTombFee(fee);

      setTombTypes(
        Array.isArray(types)
          ? types
          : Array.isArray(types?.results)
          ? types.results
          : []
      );

      const typeId =
        typeof fee?.tomb_type === "object"
          ? fee?.tomb_type?.id
          : fee?.tomb_type;

      const data = {
        tomb_type:
          typeId !== undefined &&
          typeId !== null
            ? String(typeId)
            : "",
        tomb_fees:
          fee?.tomb_fees !== undefined &&
          fee?.tomb_fees !== null
            ? String(fee.tomb_fees)
            : "",
        indication:
          fee?.indication || "",
        specification:
          fee?.specification || "",
      };

      setFormData(data);
      setOriginalData(data);
    } catch (err) {
      console.error(
        "Error loading tomb fee:",
        err
      );

      const apiError =
        err?.response?.data?.detail ||
        "Unable to load tomb fee.";

      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // UNSAVED CHANGES
  // ==========================================================

  const changedFields = [
    "tomb_type",
    "tomb_fees",
    "indication",
    "specification",
  ].filter(
    (field) =>
      String(formData[field] ?? "").trim() !==
      String(originalData[field] ?? "").trim()
  );

  const hasChanges = changedFields.length > 0;

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================================
  // UPDATE
  // ==========================================================

  const handleUpdate = async () => {
    setError("");

    if (!formData.tomb_type) {
      setError("Tomb type is required.");
      return;
    }

    if (!formData.tomb_fees) {
      setError("Tomb fees are required.");
      return;
    }

    if (!formData.indication.trim()) {
      setError("Indication is required.");
      return;
    }

    const feeAmount = Number(formData.tomb_fees);

    if (
      Number.isNaN(feeAmount) ||
      feeAmount < 0
    ) {
      setError(
        "Tomb fees must be a valid amount."
      );
      return;
    }

    if (!hasChanges) {
      return;
    }

    try {
      setUpdating(true);

      const payload = {
        tomb_type: Number(formData.tomb_type),
        tomb_fees: feeAmount,
        indication:
          formData.indication.trim(),
        specification:
          formData.specification.trim(),
      };

      await updateTombFees(id, payload);

      // Redirect to Tomb Fees list after update
      navigate("/tomb-fees");
    } catch (err) {
      console.error(
        "Error updating tomb fee:",
        err
      );

      const apiData =
        err?.response?.data;

      const apiError =
        apiData?.tomb_type?.[0] ||
        apiData?.tomb_fees?.[0] ||
        apiData?.indication?.[0] ||
        apiData?.specification?.[0] ||
        apiData?.detail ||
        "Unable to update tomb fee.";

      setError(apiError);
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================================
  // ARCHIVE / DELETE
  // ==========================================================

  const handleArchive = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this tomb fee record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setArchiving(true);
      setError("");

      await deleteTombFees(id);

      navigate("/tomb-fees");
    } catch (err) {
      console.error(
        "Error removing tomb fee:",
        err
      );

      const apiError =
        err?.response?.data?.detail ||
        "Unable to remove tomb fee.";

      setError(apiError);
    } finally {
      setArchiving(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/tomb-fees");
  };

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================================
  // DATA
  // ==========================================================

  const createdDate =
    tombFee?.created_at ||
    tombFee?.created ||
    tombFee?.created_on;

  const updatedDate =
    tombFee?.updated_at ||
    tombFee?.updated ||
    tombFee?.updated_on;

  const tombFeeCode = `TF-${String(
    tombFee?.id || "0001"
  ).padStart(4, "0")}`;

  const selectedTombType =
    tombTypes.find(
      (type) =>
        String(type.id) ===
        String(formData.tomb_type)
    );

  const tombTypeName =
    selectedTombType?.name ||
    (typeof tombFee?.tomb_type ===
    "object"
      ? tombFee?.tomb_type?.name
      : "Tomb Fee");

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Box
          flex="1"
          px={6}
          py={5}
        >
          <Text
            color={MUTED}
            fontSize="13px"
          >
            Loading tomb fee...
          </Text>
        </Box>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <Box
      minH="100vh"
      height="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* NAVBAR */}

      <Box flexShrink={0}>
        <Navbar />
      </Box>

      {/* MAIN CONTENT */}

      <Box
        flex="1"
        minH="0"
        overflow="hidden"
      >
        <Container
          maxW="none"
          height="100%"
          px={{
            base: 4,
            md: 6,
          }}
          py={{
            base: 2,
            md: 3,
          }}
        >
          {/* BREADCRUMB */}

          <HStack
            gap={2}
            mb={2}
            color={MUTED}
            fontSize="12px"
            flexWrap="wrap"
          >
            <Text>
              Masters
            </Text>

            <Text>/</Text>

            <Text>
              Tomb Fees
            </Text>

            <Text>/</Text>

            <Text>
              {tombTypeName || "Tomb Fee"}
            </Text>

            <Text>/</Text>

            <Text>
              Edit
            </Text>
          </HStack>

          {/* PAGE HEADER */}

          <Box mb={3}>
            <Heading
              color={DARK}
              fontSize={{
                base: "22px",
                md: "26px",
              }}
              lineHeight="1.15"
              mb={1}
            >
              Edit Tomb Fee
            </Heading>

            <Text
              color={MUTED}
              fontSize="12px"
            >
              Update tomb fee information.
            </Text>
          </Box>

          {/* TWO COLUMN LAYOUT */}

          <Grid
            templateColumns={{
              base: "1fr",
              lg: "minmax(0, 3fr) minmax(280px, 1fr)",
            }}
            gap={{
              base: 3,
              lg: 4,
            }}
            alignItems="start"
          >
            {/* ==================================================
                LEFT COLUMN
            ================================================== */}

            <Box>
              {/* HEADER CARD */}

              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                px={{
                  base: 3,
                  md: 4,
                }}
                py={3}
                mb={3}
              >
                <Flex
                  align="center"
                  gap={4}
                >
                  {/* AVATAR */}

                  <Flex
                    width="58px"
                    height="58px"
                    minW="58px"
                    borderRadius="50%"
                    border="1px solid #F2B8C3"
                    bg="#FFF8FA"
                    align="center"
                    justify="center"
                  >
                    <Text
                      fontSize="21px"
                      fontWeight="600"
                      color={RED}
                    >
                      T
                    </Text>
                  </Flex>

                  {/* TOMB FEE INFO */}

                  <Box>
                    <Heading
                      color={DARK}
                      fontSize={{
                        base: "20px",
                        md: "22px",
                      }}
                      lineHeight="1.2"
                      mb={1}
                    >
                      {tombTypeName ||
                        "Tomb Fee"}
                    </Heading>

                    <HStack
                      gap={3}
                      color={MUTED}
                      fontSize="12px"
                      flexWrap="wrap"
                    >
                      <Text>
                        {tombFeeCode}
                      </Text>

                      <Text>•</Text>

                      <Box
                        px={2}
                        py="2px"
                        borderRadius="5px"
                        bg="#EAF8EA"
                        border="1px solid #B7DFB7"
                        color="#238B2D"
                        fontSize="11px"
                        fontWeight="600"
                      >
                        Active
                      </Box>
                    </HStack>
                  </Box>
                </Flex>
              </Box>

              {/* DETAILS CARD */}

              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                overflow="hidden"
              >
                {/* TAB HEADER */}

                <Box
                  height="42px"
                  borderBottom="1px solid"
                  borderColor={BORDER}
                  position="relative"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    color={RED}
                    fontSize="13px"
                    fontWeight="700"
                  >
                    Tomb Fee Details
                  </Text>

                  <Box
                    position="absolute"
                    bottom="-1px"
                    left="16px"
                    width="46%"
                    maxW="520px"
                    height="2px"
                    bg={RED}
                  />
                </Box>

                {/* FORM */}

                <Box
                  px={{
                    base: 3,
                    md: 4,
                  }}
                  py={3}
                >
                  <Text
                    fontSize="14px"
                    fontWeight="700"
                    color={DARK}
                    mb={3}
                  >
                    Tomb Fee Information
                  </Text>

                  {/* TOMB TYPE */}

                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "1fr 1fr",
                    }}
                    gap={4}
                    mb={3}
                  >
                    <Box>
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={DARK}
                        mb={2}
                      >
                        Tomb Type{" "}
                        <Text
                          as="span"
                          color={RED}
                        >
                          *
                        </Text>
                      </Text>

                      <select
                        name="tomb_type"
                        value={
                          formData.tomb_type
                        }
                        onChange={
                          handleChange
                        }
                        style={{
                          width: "100%",
                          height: "38px",
                          border: `1px solid ${
                            hasChanges
                              ? RED
                              : BORDER
                          }`,
                          borderRadius:
                            "6px",
                          padding:
                            "0 11px",
                          fontSize:
                            "12px",
                          background:
                            "white",
                          color: DARK,
                          outline:
                            "none",
                          cursor:
                            "pointer",
                        }}
                      >
                        <option value="">
                          Select tomb type
                        </option>

                        {tombTypes.map(
                          (type) => (
                            <option
                              key={type.id}
                              value={
                                type.id
                              }
                            >
                              {type.name}
                            </option>
                          )
                        )}
                      </select>
                    </Box>

                    {/* FEES */}

                    <Box>
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={DARK}
                        mb={2}
                      >
                        Tomb Fees{" "}
                        <Text
                          as="span"
                          color={RED}
                        >
                          *
                        </Text>
                      </Text>

                      <Input
                        name="tomb_fees"
                        type="number"
                        min="0"
                        step="0.001"
                        value={
                          formData.tomb_fees
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter tomb fees"
                        height="38px"
                        fontSize="12px"
                        borderColor={
                          hasChanges
                            ? RED
                            : BORDER
                        }
                        borderRadius="6px"
                        color={DARK}
                        _placeholder={{
                          color:
                            "#8B98AB",
                        }}
                        _focus={{
                          borderColor:
                            PRIMARY_MAROON,
                          boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                        }}
                      />
                    </Box>
                  </Grid>

                  {/* INDICATION */}

                  <Box mb={3}>
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      color={DARK}
                      mb={2}
                    >
                      Indication{" "}
                      <Text
                        as="span"
                        color={RED}
                      >
                        *
                      </Text>
                    </Text>

                    <Input
                      name="indication"
                      value={
                        formData.indication
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter indication"
                      height="38px"
                      fontSize="12px"
                      borderColor={
                        hasChanges
                          ? RED
                          : BORDER
                      }
                      borderRadius="6px"
                      color={DARK}
                      _placeholder={{
                        color:
                          "#8B98AB",
                      }}
                      _focus={{
                        borderColor:
                          PRIMARY_MAROON,
                        boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />
                  </Box>

                  {/* SPECIFICATION */}

                  <Box>
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      color={DARK}
                      mb={2}
                    >
                      Specification
                    </Text>

                    <Textarea
                      name="specification"
                      value={
                        formData.specification
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter specification"
                      minH="90px"
                      resize="vertical"
                      fontSize="12px"
                      borderColor={
                        hasChanges
                          ? RED
                          : BORDER
                      }
                      borderRadius="6px"
                      color={DARK}
                      _placeholder={{
                        color:
                          "#8B98AB",
                      }}
                      _focus={{
                        borderColor:
                          PRIMARY_MAROON,
                        boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />
                  </Box>

                  {/* ERROR */}

                  {error && (
                    <Box
                      mt={3}
                      px={3}
                      py={2}
                      border="1px solid #FED7D7"
                      bg="#FFF5F5"
                      borderRadius="6px"
                    >
                      <Text
                        color="#C53030"
                        fontSize="11px"
                      >
                        {error}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {/* ==================================================
                RIGHT COLUMN
            ================================================== */}

            <Box>
              {/* RECORD INFORMATION */}

              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                p={3}
                mb={2}
              >
                <HStack
                  gap={2}
                  mb={3}
                >
                  <Flex
                    width="26px"
                    height="26px"
                    borderRadius="5px"
                    bg="#FFF0F4"
                    align="center"
                    justify="center"
                  >
                    <LuFileText
                      size={14}
                      color={RED}
                    />
                  </Flex>

                  <Text
                    fontSize="13px"
                    fontWeight="700"
                    color={DARK}
                  >
                    Record Information
                  </Text>
                </HStack>

                {/* CREATED */}

                <HStack
                  align="flex-start"
                  gap={2}
                  mb={3}
                >
                  <Flex
                    width="25px"
                    height="25px"
                    borderRadius="5px"
                    bg="#F4F7FA"
                    align="center"
                    justify="center"
                  >
                    <LuCalendarDays
                      size={13}
                      color={MUTED}
                    />
                  </Flex>

                  <Box>
                    <Text
                      color="#8290A4"
                      fontSize="10px"
                    >
                      Created
                    </Text>

                    <Text
                      color={DARK}
                      fontSize="12px"
                      fontWeight="600"
                    >
                      {formatDate(
                        createdDate
                      )}
                    </Text>
                  </Box>
                </HStack>

                {/* UPDATED */}

                <HStack
                  align="flex-start"
                  gap={2}
                >
                  <Flex
                    width="25px"
                    height="25px"
                    borderRadius="5px"
                    bg="#F4F7FA"
                    align="center"
                    justify="center"
                  >
                    <LuUserRound
                      size={13}
                      color={MUTED}
                    />
                  </Flex>

                  <Box>
                    <Text
                      color="#8290A4"
                      fontSize="10px"
                    >
                      Last updated
                    </Text>

                    <Text
                      color={DARK}
                      fontSize="12px"
                      fontWeight="600"
                    >
                      {formatDate(
                        updatedDate
                      )}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* UNSAVED CHANGES */}

              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                p={3}
                mb={2}
              >
                <HStack
                  gap={2}
                  mb={3}
                >
                  <Flex
                    width="26px"
                    height="26px"
                    borderRadius="5px"
                    bg="#FFF6E8"
                    align="center"
                    justify="center"
                  >
                    <LuTriangleAlert
                      size={14}
                      color="#F26B00"
                    />
                  </Flex>

                  <Text
                    fontSize="13px"
                    fontWeight="700"
                    color="#F26B00"
                  >
                    Unsaved Changes
                  </Text>
                </HStack>

                <HStack
                  align="flex-start"
                  gap={2}
                >
                  <Flex
                    width="25px"
                    height="25px"
                    borderRadius="5px"
                    bg="#FFF8EE"
                    align="center"
                    justify="center"
                  >
                    <LuClock3
                      size={13}
                      color="#F26B00"
                    />
                  </Flex>

                  <Box>
                    <Text
                      color="#F26B00"
                      fontSize="12px"
                      fontWeight="600"
                    >
                      {hasChanges
                        ? `${changedFields.length} field${
                            changedFields.length >
                            1
                              ? "s"
                              : ""
                          } modified`
                        : "No changes"}
                    </Text>

                    <Text
                      color={MUTED}
                      fontSize="10px"
                      mt={1}
                    >
                      {hasChanges
                        ? "Please review your changes before saving."
                        : "Make changes to the tomb fee information."}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* DANGER ZONE */}

              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                p={3}
              >
                <HStack
                  gap={2}
                  mb={3}
                >
                  <Flex
                    width="26px"
                    height="26px"
                    borderRadius="5px"
                    bg="#FFF0F0"
                    align="center"
                    justify="center"
                  >
                    <LuArchive
                      size={14}
                      color={RED}
                    />
                  </Flex>

                  <Text
                    fontSize="13px"
                    fontWeight="700"
                    color="#B5122F"
                  >
                    Danger Zone
                  </Text>
                </HStack>

                <Button
                  variant="ghost"
                  p={0}
                  height="auto"
                  color={RED}
                  fontSize="12px"
                  fontWeight="600"
                  justifyContent="flex-start"
                  onClick={
                    handleArchive
                  }
                  loading={archiving}
                  _hover={{
                    bg: "transparent",
                    color: "#A00D28",
                  }}
                >
                  <LuArchive
                    size={14}
                    style={{
                      marginRight:
                        "8px",
                    }}
                  />

                  Remove Tomb Fee Record
                </Button>

                <Text
                  color="#8290A4"
                  fontSize="10px"
                  mt={2}
                  ml={1}
                >
                  This tomb fee record
                  will be removed from
                  the master list.
                </Text>
              </Box>
            </Box>
          </Grid>
        </Container>
      </Box>

      {/* BOTTOM ACTION BAR */}

      <Box
        borderTop="1px solid"
        borderColor={BORDER}
        bg="white"
        px={{
          base: 4,
          md: 6,
        }}
        py={2}
        flexShrink={0}
      >
        <Flex
          justify="flex-end"
          gap={2}
        >
          {/* CANCEL */}

          <Button
            variant="outline"
            height="36px"
            minW="125px"
            borderColor={RED}
            color={RED}
            borderRadius="6px"
            fontSize="12px"
            onClick={handleCancel}
            _hover={{
              bg: "#FFF5F7",
            }}
          >
            Cancel
          </Button>

          {/* UPDATE */}

          <Button
            height="36px"
            minW="150px"
            bg={
              hasChanges
                ? PRIMARY_MAROON
                : "#D9DCE1"
            }
            color={
              hasChanges
                ? "white"
                : "#8A929D"
            }
            borderRadius="6px"
            fontSize="12px"
            disabled={!hasChanges}
            loading={updating}
            onClick={handleUpdate}
            _hover={{
              bg: hasChanges
                ? "#650A18"
                : "#D9DCE1",
            }}
          >
            <LuSave
              size={14}
              style={{
                marginRight: "7px",
              }}
            />

            Update
          </Button>
        </Flex>
      </Box>

      {/* FOOTER */}

      <Box flexShrink={0}>
        <Footer />
      </Box>
    </Box>
  );
};

export default TombFeesEditPage;
