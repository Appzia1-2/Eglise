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
  getWard,
  updateWard,
  deleteWard,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const WardEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ==========================================================
  // STATE
  // ==========================================================

  const [wardName, setWardName] = useState("");
  const [originalWardName, setOriginalWardName] = useState("");

  const [wardNumber, setWardNumber] = useState("");
  const [originalWardNumber, setOriginalWardNumber] =
    useState("");

  const [place, setPlace] = useState("");
  const [originalPlace, setOriginalPlace] = useState("");

  const [ward, setWard] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // LOAD WARD
  // ==========================================================

  useEffect(() => {
    fetchWard();
  }, [id]);

  const fetchWard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getWard(id);

      const data = response?.data ?? response;

      if (!data) {
        setError("Ward not found.");
        return;
      }

      setWard(data);

      const loadedWardName =
        data?.ward_name || "";

      const loadedWardNumber =
        data?.ward_number !== null &&
        data?.ward_number !== undefined
          ? String(data.ward_number)
          : "";

      const loadedPlace =
        data?.place || "";

      setWardName(loadedWardName);
      setOriginalWardName(loadedWardName);

      setWardNumber(loadedWardNumber);
      setOriginalWardNumber(loadedWardNumber);

      setPlace(loadedPlace);
      setOriginalPlace(loadedPlace);
    } catch (err) {
      console.error(
        "Error fetching ward:",
        err
      );

      const apiError =
        err?.response?.data?.detail ||
        "Unable to load ward.";

      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // UNSAVED CHANGES
  // ==========================================================

  const hasWardNameChanges =
    wardName.trim() !==
    originalWardName.trim();

  const hasWardNumberChanges =
    String(wardNumber).trim() !==
    String(originalWardNumber).trim();

  const hasPlaceChanges =
    place.trim() !==
    originalPlace.trim();

  const hasChanges =
    hasWardNameChanges ||
    hasWardNumberChanges ||
    hasPlaceChanges;

  const modifiedFields = [
    hasWardNameChanges,
    hasWardNumberChanges,
    hasPlaceChanges,
  ].filter(Boolean).length;

  // ==========================================================
  // UPDATE
  // ==========================================================

  const handleUpdate = async () => {
    const trimmedWardName =
      wardName.trim();

    const trimmedWardNumber =
      String(wardNumber).trim();

    const trimmedPlace =
      place.trim();

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!trimmedWardName) {
      setError(
        "Ward name is required."
      );
      return;
    }

    if (!trimmedWardNumber) {
      setError(
        "Ward number is required."
      );
      return;
    }

    const number =
      Number(trimmedWardNumber);

    if (
      !Number.isInteger(number) ||
      number <= 0
    ) {
      setError(
        "Ward number must be a positive whole number."
      );
      return;
    }

    if (!trimmedPlace) {
      setError(
        "Place is required."
      );
      return;
    }

    if (!hasChanges) {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      await updateWard(id, {
        ward_name: trimmedWardName,
        ward_number: number,
        place: trimmedPlace,
      });

      navigate(`/ward/${id}`);
    } catch (err) {
      console.error(
        "Error updating ward:",
        err
      );

      const data =
        err?.response?.data;

      const apiError =
        data?.ward_name?.[0] ||
        data?.ward_number?.[0] ||
        data?.place?.[0] ||
        data?.detail ||
        "Unable to update ward.";

      setError(apiError);
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================================
  // ARCHIVE
  // ==========================================================

  const handleArchive = async () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to archive this ward?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setArchiving(true);
      setError("");

      await deleteWard(id);

      navigate("/ward");
    } catch (err) {
      console.error(
        "Error archiving ward:",
        err
      );

      const apiError =
        err?.response?.data?.detail ||
        "Unable to archive ward.";

      setError(apiError);
    } finally {
      setArchiving(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate(`/ward/${id}`);
  };

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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
    ward?.created_at ||
    ward?.created ||
    ward?.created_on;

  const updatedDate =
    ward?.updated_at ||
    ward?.updated ||
    ward?.updated_on;

  const wardCode =
    `WD-${String(
      ward?.id || "0001"
    ).padStart(4, "0")}`;

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
        overflow="hidden"
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
            Loading ward...
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

      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <Box flexShrink={0}>
        <Navbar />
      </Box>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

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

          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <HStack
            gap={2}
            mb={2}
            color={MUTED}
            fontSize="12px"
          >
            <Text>
              Masters
            </Text>

            <Text>
              /
            </Text>

            <Text>
              Ward Master
            </Text>

            <Text>
              /
            </Text>

            <Text>
              {ward?.ward_name || "Ward"}
            </Text>

            <Text>
              /
            </Text>

            <Text>
              Edit
            </Text>
          </HStack>

          {/* ==================================================
              PAGE HEADER
          ================================================== */}

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
              Edit Ward
            </Heading>

            <Text
              color={MUTED}
              fontSize="12px"
            >
              Update ward information.
            </Text>
          </Box>

          {/* ==================================================
              TWO COLUMN LAYOUT
          ================================================== */}

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

            {/* =================================================
                LEFT COLUMN
            ================================================= */}

            <Box>

              {/* ===============================================
                  WARD HEADER CARD
              =============================================== */}

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
                      {(ward?.ward_name || "W")
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </Flex>

                  {/* WARD INFO */}

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
                      {ward?.ward_name || "-"}
                    </Heading>

                    <HStack
                      gap={3}
                      color={MUTED}
                      fontSize="12px"
                      flexWrap="wrap"
                    >
                      <Text>
                        {wardCode}
                      </Text>

                      <Text>
                        •
                      </Text>

                      <Text>
                        Ward {ward?.ward_number || "-"}
                      </Text>

                      <Text>
                        •
                      </Text>

                      <Text>
                        {ward?.place || "-"}
                      </Text>

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

              {/* ===============================================
                  WARD DETAILS CARD
              =============================================== */}

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
                    Ward Details
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
                  minH="300px"
                >
                  <Text
                    fontSize="14px"
                    fontWeight="700"
                    color={DARK}
                    mb={3}
                  >
                    Ward Information
                  </Text>

                  {/* =========================================
                      WARD NAME + WARD NUMBER SAME ROW
                  ========================================= */}

                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "minmax(0, 1fr) minmax(180px, 0.45fr)",
                    }}
                    gap={4}
                    mb={4}
                  >

                    {/* WARD NAME */}

                    <Box>
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={DARK}
                        mb={2}
                      >
                        Ward Name{" "}

                        <Text
                          as="span"
                          color={RED}
                        >
                          *
                        </Text>
                      </Text>

                      <Input
                        value={wardName}
                        onChange={(e) => {
                          setWardName(
                            e.target.value
                          );
                          setError("");
                        }}
                        placeholder="Enter ward name"
                        height="38px"
                        fontSize="12px"
                        borderColor={
                          hasWardNameChanges
                            ? RED
                            : BORDER
                        }
                        borderRadius="6px"
                        color={DARK}
                        _placeholder={{
                          color: "#8B98AB",
                        }}
                        _focus={{
                          borderColor:
                            PRIMARY_MAROON,
                          boxShadow:
                            `0 0 0 1px ${PRIMARY_MAROON}`,
                        }}
                      />
                    </Box>

                    {/* WARD NUMBER */}

                    <Box>
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={DARK}
                        mb={2}
                      >
                        Ward Number{" "}

                        <Text
                          as="span"
                          color={RED}
                        >
                          *
                        </Text>
                      </Text>

                      <Input
                        type="number"
                        value={wardNumber}
                        onChange={(e) => {
                          setWardNumber(
                            e.target.value
                          );
                          setError("");
                        }}
                        placeholder="Enter ward number"
                        height="38px"
                        fontSize="12px"
                        borderColor={
                          hasWardNumberChanges
                            ? RED
                            : BORDER
                        }
                        borderRadius="6px"
                        color={DARK}
                        _placeholder={{
                          color: "#8B98AB",
                        }}
                        _focus={{
                          borderColor:
                            PRIMARY_MAROON,
                          boxShadow:
                            `0 0 0 1px ${PRIMARY_MAROON}`,
                        }}
                      />
                    </Box>

                  </Grid>

                  {/* =========================================
                      PLACE
                  ========================================= */}

                  <Box>
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      color={DARK}
                      mb={2}
                    >
                      Place{" "}

                      <Text
                        as="span"
                        color={RED}
                      >
                        *
                      </Text>
                    </Text>

                    <Input
                      value={place}
                      onChange={(e) => {
                        setPlace(
                          e.target.value
                        );
                        setError("");
                      }}
                      placeholder="Enter place"
                      height="38px"
                      fontSize="12px"
                      borderColor={
                        hasPlaceChanges
                          ? RED
                          : BORDER
                      }
                      borderRadius="6px"
                      color={DARK}
                      _placeholder={{
                        color: "#8B98AB",
                      }}
                      _focus={{
                        borderColor:
                          PRIMARY_MAROON,
                        boxShadow:
                          `0 0 0 1px ${PRIMARY_MAROON}`,
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

            {/* =================================================
                RIGHT COLUMN
            ================================================= */}

            <Box>

              {/* ===============================================
                  RECORD INFORMATION
              =============================================== */}

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

              {/* ===============================================
                  UNSAVED CHANGES
              =============================================== */}

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
                        ? `${modifiedFields} ${
                            modifiedFields === 1
                              ? "field"
                              : "fields"
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
                        : "Make changes to the ward information."}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* ===============================================
                  DANGER ZONE
              =============================================== */}

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
                  onClick={handleArchive}
                  loading={archiving}
                  _hover={{
                    bg: "transparent",
                    color: "#A00D28",
                  }}
                >
                  <LuArchive
                    size={14}
                    style={{
                      marginRight: "8px",
                    }}
                  />

                  Archive Ward Record
                </Button>

                <Text
                  color="#8290A4"
                  fontSize="10px"
                  mt={2}
                  ml={1}
                >
                  This ward record will
                  remain in history.
                </Text>
              </Box>

            </Box>
          </Grid>
        </Container>
      </Box>

      {/* ======================================================
          BOTTOM ACTION BAR
      ====================================================== */}

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

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Box flexShrink={0}>
        <Footer />
      </Box>

    </Box>
  );
};

export default WardEditPage;