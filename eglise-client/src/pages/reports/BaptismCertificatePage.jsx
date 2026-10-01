// src/pages/reports/BaptismCertificatePage.jsx

import React from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { LuCross } from "react-icons/lu";

import CertificateShell from "./CertificateShell";
import { pick, formatDate } from "./reportConfig";

const BLUE = "#1F3A7D";
const GOLD = "#B8963E";
const SOFT_BG = "#F6F9FF";
const SERIF = "Georgia, 'Times New Roman', serif";

const Line = ({ children, minW }) => (
  <Box as="span" display="inline-block" minW={minW || "140px"}
       borderBottom={`1px solid ${BLUE}`} px={2} textAlign="center"
       fontWeight="700" color={BLUE}>
    {children}
  </Box>
);

const BaptismCertificatePage = () => (
  <CertificateShell type="baptism">
    {(r) => {
      const name = pick(r, ["name", "member_name", "child_name", "baptismal_name"]);
      const baptismalName = pick(r, ["baptismal_name"], "");
      const dob = formatDate(pick(r, ["dob", "date_of_birth"], null));
      const bdate = formatDate(pick(r, ["date_of_baptism", "baptism_date", "baptised_on"], null));
      const father = pick(r, ["father_name"]);
      const mother = pick(r, ["mother_name"]);
      const priest = pick(r, ["priest_name", "vicar_name", "baptised_by"]);
      const parish = pick(r, ["parish_of_baptism", "church_name"], "Parish Church");
      const regNo = pick(r, ["register_number", "reg_no"]);
      const showBaptismalName = baptismalName && baptismalName !== name;

      return (
        <Box className="cert-box" bg={SOFT_BG} p={3}
             border={`2px solid ${GOLD}`} fontFamily={SERIF}
             boxShadow="0 4px 16px rgba(24,35,56,0.08)">
          <Box border={`1px solid ${BLUE}`} p={{ base: 5, md: 10 }} textAlign="center">
            <Text fontSize="12px" letterSpacing="3px" color={GOLD} fontWeight="700">
              {String(parish).toUpperCase()}
            </Text>

            <Flex justify="center" my={2} color={GOLD}><LuCross size={34} /></Flex>

            <Heading fontFamily={SERIF} fontSize={{ base: "28px", md: "38px" }}
                     color={BLUE} fontWeight="700" letterSpacing="2px">
              Certificate of Baptism
            </Heading>
            <Box w="120px" h="2px" bg={GOLD} mx="auto" my={3} />

            <Text fontSize="13px" color="#444" mb={5} fontStyle="italic">
              Reg. No. {regNo}
            </Text>

            <Text fontSize="15px" lineHeight="2.6" color="#333" maxW="780px" mx="auto">
              This is to certify that <Line minW="220px">{name}</Line>,
              son / daughter of <Line>{father}</Line> and <Line>{mother}</Line>,
              born on <Line>{dob}</Line>, was solemnly baptised
              {showBaptismalName && (<> as <Line>{baptismalName}</Line></>)}
              {" "}in the name of the Father, and of the Son, and of the Holy Spirit
              on <Line>{bdate}</Line> by <Line>{priest}</Line> in
              {" "}<Line>{parish}</Line>, as recorded in the baptism register.
            </Text>

            <Flex justify="space-between" align="flex-end" mt={14} px={{ base: 2, md: 10 }}>
              <Box textAlign="left">
                <Text fontSize="12px" color="#444">
                  Date: {formatDate(new Date().toISOString())}
                </Text>
              </Box>
              <Box textAlign="center">
                <Box w="200px" borderTop={`1px solid ${BLUE}`} mb={1} />
                <Text fontSize="12px" fontWeight="700" color={BLUE}>
                  Vicar / Parish Priest
                </Text>
              </Box>
            </Flex>
          </Box>
        </Box>
      );
    }}
  </CertificateShell>
);

export default BaptismCertificatePage;