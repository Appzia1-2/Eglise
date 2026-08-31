import React, { useRef, useState } from "react";

import {
  Box,
  Button,
  HStack,
  Select,
  Text,
  VStack,
  Dialog,
} from "@chakra-ui/react";

import html2pdf from "html2pdf.js";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#650A18";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const GOLD = "#E6B566";

const DeathRegisterPrintModal = ({
  isOpen,
  onClose,
  death,
}) => {
  const printRef = useRef(null);

  const [pageSize, setPageSize] =
    useState("A4");

  const [orientation, setOrientation] =
    useState("Portrait");

  const member =
    death?.member || {};

  const tombFee =
    death?.tomb_fee_details || {};

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const getDateFormatted = (
    dateString
  ) => {
    if (!dateString) {
      return "N/A";
    }

    try {
      const date = new Date(dateString);

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );
    } catch {
      return dateString;
    }
  };

  // ==========================================================
  // PRINT
  // ==========================================================

  const handlePrint = () => {
    const element = printRef.current;

    if (!element) {
      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1000,height=900"
      );

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>
            Death Register - ${
              death?.reg_no || ""
            }
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 20px;
              background: white;
              font-family: Georgia, serif;
            }

            @page {
              size: ${pageSize} ${
                orientation === "Portrait"
                  ? "portrait"
                  : "landscape"
              };
              margin: 10mm;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>

        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  const handleDownloadPDF = async () => {
    const element = printRef.current;

    if (!element) {
      return;
    }

    const fileName = `Death-Register-${
      death?.reg_no || death?.id || "Record"
    }.pdf`;

    const options = {
      margin: 10,

      filename: fileName,

      image: {
        type: "jpeg",
        quality: 0.98,
      },

      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      },

      jsPDF: {
        orientation:
          orientation === "Portrait"
            ? "p"
            : "l",

        unit: "mm",

        format: pageSize,
      },

      pagebreak: {
        mode: [
          "avoid-all",
          "css",
          "legacy",
        ],
      },
    };

    try {
      await html2pdf()
        .set(options)
        .from(element)
        .save();
    } catch (error) {
      console.error(
        "PDF generation error:",
        error
      );
    }
  };

  // ==========================================================
  // MODAL - Chakra UI v3 compatible
  // ==========================================================

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={onClose}
      size="2xl"
      placement="center"
    >
      <Dialog.Backdrop />
      
      <Dialog.Content
        maxW="1000px"
        maxH="90vh"
        overflow="auto"
      >
        {/* HEADER */}
        <Dialog.Header
          bg={PRIMARY_RED}
          color="white"
          fontSize="16px"
          fontWeight="600"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text>
            Death Certificate Preview
          </Text>

          <Dialog.CloseTrigger
            color="white"
            mt={0}
          />
        </Dialog.Header>

        {/* BODY */}
        <Dialog.Body p={4}>
          {/* CONTROLS */}
          <HStack
            gap={3}
            mb={4}
            pb={3}
            borderBottom={`1px solid ${BORDER_COLOR}`}
            flexWrap="wrap"
          >
            <Select
              size="sm"
              w="100px"
              value={pageSize}
              onChange={(event) =>
                setPageSize(
                  event.target.value
                )
              }
            >
              <option value="A4">
                A4
              </option>

              <option value="A3">
                A3
              </option>

              <option value="Letter">
                Letter
              </option>
            </Select>

            <Select
              size="sm"
              w="120px"
              value={orientation}
              onChange={(event) =>
                setOrientation(
                  event.target.value
                )
              }
            >
              <option value="Portrait">
                Portrait
              </option>

              <option value="Landscape">
                Landscape
              </option>
            </Select>

            <HStack
              gap={2}
              ml="auto"
            >
              <Button
                size="sm"
                variant="outline"
                borderColor={
                  PRIMARY_RED
                }
                color={PRIMARY_RED}
                onClick={
                  handleDownloadPDF
                }
                fontSize="11px"
              >
                📄 Download PDF
              </Button>

              <Button
                size="sm"
                bg={PRIMARY_RED}
                color="white"
                onClick={handlePrint}
                fontSize="11px"
                _hover={{
                  bg: DARK_RED,
                }}
              >
                🖨️ Print
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                fontSize="11px"
              >
                Close
              </Button>
            </HStack>
          </HStack>

          {/* PRINT AREA */}
          <Box
            ref={printRef}
            bg="white"
            p={8}
            border={`2px dashed ${BORDER_COLOR}`}
            borderRadius="8px"
          >
            <DeathCertificate
              death={death}
              member={member}
              tombFee={tombFee}
              getDateFormatted={
                getDateFormatted
              }
            />
          </Box>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog.Root>
  );
};

// ==========================================================
// DEATH CERTIFICATE
// ==========================================================

const DeathCertificate = ({
  death,
  member,
  tombFee,
  getDateFormatted,
}) => {
  // ==========================================================
  // AGE
  // ==========================================================

  const getMemberAge = () => {
    if (
      !member?.date_of_birth ||
      !death?.died_on
    ) {
      return "N/A";
    }

    try {
      const birthDate = new Date(
        member.date_of_birth
      );

      const deathDate = new Date(
        death.died_on
      );

      let age =
        deathDate.getFullYear() -
        birthDate.getFullYear();

      const monthDifference =
        deathDate.getMonth() -
        birthDate.getMonth();

      if (
        monthDifference < 0 ||
        (monthDifference === 0 &&
          deathDate.getDate() <
            birthDate.getDate())
      ) {
        age--;
      }

      return age >= 0 ? age : "N/A";
    } catch {
      return "N/A";
    }
  };

  // ==========================================================
  // DEATH DATE PARTS
  // ==========================================================

  const deathDate = death?.died_on
    ? new Date(death.died_on)
    : null;

  const deathDay = deathDate
    ? String(
        deathDate.getDate()
      ).padStart(2, "0")
    : "N/A";

  const deathMonth = deathDate
    ? String(
        deathDate.getMonth() + 1
      ).padStart(2, "0")
    : "N/A";

  const deathYear = deathDate
    ? deathDate.getFullYear()
    : "N/A";

  return (
    <Box
      fontFamily="serif"
      w="100%"
      mx="auto"
    >
      {/* ==================================================
          BORDER
      ================================================== */}

      <Box
        border={`3px solid ${PRIMARY_RED}`}
        borderRadius="8px"
        p={8}
        bg="white"
        position="relative"
      >
        {/* TOP LEFT */}

        <Box
          position="absolute"
          top="8px"
          left="8px"
          w="30px"
          h="30px"
          border={`2px solid ${PRIMARY_RED}`}
          borderRight="none"
          borderBottom="none"
          borderRadius="2px"
        />

        {/* TOP RIGHT */}

        <Box
          position="absolute"
          top="8px"
          right="8px"
          w="30px"
          h="30px"
          border={`2px solid ${PRIMARY_RED}`}
          borderLeft="none"
          borderBottom="none"
          borderRadius="2px"
        />

        {/* BOTTOM LEFT */}

        <Box
          position="absolute"
          bottom="8px"
          left="8px"
          w="30px"
          h="30px"
          border={`2px solid ${PRIMARY_RED}`}
          borderRight="none"
          borderTop="none"
          borderRadius="2px"
        />

        {/* BOTTOM RIGHT */}

        <Box
          position="absolute"
          bottom="8px"
          right="8px"
          w="30px"
          h="30px"
          border={`2px solid ${PRIMARY_RED}`}
          borderLeft="none"
          borderTop="none"
          borderRadius="2px"
        />

        {/* ==================================================
            HEADER
        ================================================== */}

        <VStack
          gap={2}
          mb={6}
          textAlign="center"
        >
          <Box
            w="60px"
            h="60px"
            mx="auto"
            mb={2}
            bg={GOLD}
            borderRadius="50%"
          >
            <Text
              fontSize="32px"
              textAlign="center"
              lineHeight="60px"
            >
              ✦
            </Text>
          </Box>

          <Text
            fontSize="24px"
            fontWeight="700"
            color={TEXT_COLOR}
            fontFamily="serif"
          >
            Malankara Orthodox
          </Text>

          <Text
            fontSize="24px"
            fontWeight="700"
            color={TEXT_COLOR}
            fontFamily="serif"
          >
            Spyrian Church
          </Text>

          <Box
            bg={PRIMARY_RED}
            color="white"
            px={6}
            py={2}
            borderRadius="4px"
            mt={2}
          >
            <Text
              fontSize="18px"
              fontWeight="700"
              fontFamily="serif"
            >
              Death/Funeral Certificate
            </Text>
          </Box>
        </VStack>

        {/* ==================================================
            DETAILS
        ================================================== */}

        <Box mb={6}>
          <Box
            display="grid"
            gridTemplateColumns="1fr 1fr"
            gap={2}
            mb={3}
          >
            <CertificateField
              label="Diocese"
              value={
                death?.diocese ||
                "Diocese of Sulthan Bathery"
              }
            />

            <CertificateField
              label="Reg. No"
              value={death?.reg_no}
            />
          </Box>

          <Box
            display="grid"
            gridTemplateColumns="1fr 1fr"
            gap={2}
            mb={3}
          >
            <CertificateField
              label="Parish"
              value={
                death?.parish ||
                "St. George Orthodox Church, Bathery"
              }
            />
          </Box>

          <CertificateField
            label="Name"
            value={member?.name}
            fullWidth
          />

          <Box mb={3}>
            <Box
              display="grid"
              gridTemplateColumns="repeat(5, 1fr)"
              gap={1}
            >
              <CertificateField
                label="Age"
                value={getMemberAge()}
              />

              <CertificateField
                label="Day"
                value={deathDay}
              />

              <CertificateField
                label="Month"
                value={deathMonth}
              />

              <CertificateField
                label="Year"
                value={deathYear}
              />

              <CertificateField
                label="Sex"
                value={
                  member?.gender ||
                  "N/A"
                }
              />
            </Box>
          </Box>

          <CertificateField
            label="Address"
            value={
              member?.address ||
              member?.address_line1 ||
              "N/A"
            }
            fullWidth
          />

          <CertificateField
            label="House No. in the Church Register"
            value={
              member?.house_name ||
              member?.house_no ||
              "N/A"
            }
            fullWidth
          />

          <CertificateField
            label="Date of Death"
            value={getDateFormatted(
              death?.died_on
            )}
            fullWidth
          />

          <CertificateField
            label="Date of Funeral"
            value={getDateFormatted(
              death?.funeral_on
            )}
            fullWidth
          />

          <CertificateField
            label="Tomb Type"
            value={
              tombFee?.tomb_type_name ||
              "N/A"
            }
            fullWidth
          />

          <CertificateField
            label="Tomb IDN"
            value={
              death?.tomb_idn ||
              "N/A"
            }
            fullWidth
          />

          <CertificateField
            label="Chief Celebrant"
            value={
              death?.chief_celebrant ||
              "Rev. Fr. Thomas Mathew"
            }
            fullWidth
          />
        </Box>

        {/* ==================================================
            CERTIFICATION
        ================================================== */}

        <Text
          fontSize="12px"
          textAlign="center"
          mb={6}
          fontFamily="serif"
          lineHeight="1.8"
        >
          I do hereby certify that the above is
          a true copy of an entry in the
          <br />
          Funeral Register maintained at this
          Parish.
        </Text>

        {/* ==================================================
            SIGNATURE
        ================================================== */}

        <Box
          display="grid"
          gridTemplateColumns="1fr 1fr 1fr"
          gap={4}
          mb={3}
        >
          <Box>
            <Text
              fontSize="11px"
              fontWeight="600"
              mb={8}
            >
              Place: Sulthan Bathery
            </Text>
          </Box>

          <Box textAlign="center">
            <Box
              borderTop={`1px solid ${TEXT_COLOR}`}
              h="40px"
            />

            <Text
              fontSize="10px"
              fontWeight="600"
            >
              SEAL
            </Text>
          </Box>

          <Box textAlign="right">
            <Box
              borderTop={`1px solid ${TEXT_COLOR}`}
              h="40px"
              mb={1}
            />

            <Text
              fontSize="10px"
              fontWeight="600"
            >
              Name and Signature of Vicar
            </Text>
          </Box>
        </Box>

        <Text
          fontSize="11px"
          fontWeight="600"
        >
          Date:{" "}
          {getDateFormatted(
            death?.died_on
          )}
        </Text>
      </Box>
    </Box>
  );
};

// ==========================================================
// CERTIFICATE FIELD
// ==========================================================

const CertificateField = ({
  label,
  value,
  fullWidth = false,
}) => {
  return (
    <Box
      display="grid"
      gridTemplateColumns={
        fullWidth
          ? "150px 1fr"
          : "100px 1fr"
      }
      gap={2}
      borderBottom={`1px solid ${BORDER_COLOR}`}
      py={2}
      fontSize="12px"
    >
      <Text
        fontWeight="600"
        color={TEXT_COLOR}
        minW="100px"
      >
        {label}
      </Text>

      <Text
        color={TEXT_COLOR}
        whiteSpace="pre-wrap"
      >
        {value || "N/A"}
      </Text>
    </Box>
  );
};

export default DeathRegisterPrintModal;