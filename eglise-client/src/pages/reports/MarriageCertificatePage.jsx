// src/pages/reports/MarriageCertificatePage.jsx

import React from "react";
import { Box, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { LuHeart } from "react-icons/lu";

import CertificateShell from "./CertificateShell";
import { pick, formatDate } from "./reportConfig";

const MAROON = "#7A1231";
const GOLD = "#C9A24B";
const CREAM = "#FFFBF2";
const SERIF = "Georgia, 'Times New Roman', serif";

const Detail = ({ label, value }) => (
  <Box textAlign="center">
    <Text fontSize="10px" letterSpacing="1.5px" color={GOLD} fontWeight="700">
      {label.toUpperCase()}
    </Text>
    <Text fontSize="14px" color={MAROON} fontWeight="600" mt="2px">{value}</Text>
  </Box>
);

const SignLine = ({ label, name }) => (
  <Box textAlign="center" minW="170px">
    <Text fontSize="12px" color={MAROON} fontWeight="600" mb={1} minH="18px">
      {name || ""}
    </Text>
    <Box borderTop={`1px solid ${MAROON}`} mb={1} />
    <Text fontSize="11px" color={MAROON} fontWeight="600">{label}</Text>
  </Box>
);

const MarriageCertificatePage = () => (
  <CertificateShell type="marriage">
    {(r) => {
      const groom = pick(r, ["groom_name"]);
      const bride = pick(r, ["bride_name"]);
      const mdate = formatDate(
        pick(r, ["date", "marriage_date", "date_of_marriage", "married_on"], null)
      );
      const regNo = pick(r, ["register_number", "reg_no"]);
      const minister = pick(r, ["minister_of_marriage", "priest_name", "vicar_name"]);
      const groomHouse = pick(r, ["groom_house_name"]);
      const brideHouse = pick(r, ["bride_house_name"]);
      const place = pick(r, ["place", "church_name"]);
      const w1 = pick(r, ["witness1_name", "witness_1"], "");
      const w2 = pick(r, ["witness2_name", "witness_2"], "");

      // Only show details that actually have a value
      const details = [
        { label: "Date", value: mdate },
        { label: "Place", value: place },
        { label: "Groom's House", value: groomHouse },
        { label: "Bride's House", value: brideHouse },
        { label: "Officiating Minister", value: minister },
        { label: "Register No.", value: regNo },
      ].filter((d) => d.value && d.value !== "-");

      return (
        <Box className="cert-box" bg={CREAM} p={3}
             border={`6px double ${MAROON}`} fontFamily={SERIF}
             boxShadow="0 4px 16px rgba(24,35,56,0.08)">
          <Box border={`1px solid ${GOLD}`} p={{ base: 5, md: 9 }} textAlign="center">
            <Text fontSize="11px" letterSpacing="3px" color={GOLD} fontWeight="700">
              HOLY MATRIMONY
            </Text>
            <Heading fontFamily={SERIF} fontSize={{ base: "28px", md: "38px" }}
                     color={MAROON} fontWeight="700" mt={1}>
              Marriage Certificate
            </Heading>

            <Flex align="center" justify="center" gap={3} my={3} color={GOLD}>
              <Box w="70px" h="1px" bg={GOLD} />
              <LuHeart size={22} fill={GOLD} />
              <Box w="70px" h="1px" bg={GOLD} />
            </Flex>

            <Text fontSize="13px" color="#555" fontStyle="italic">
              This certifies that
            </Text>

            <Flex align="center" justify="center" gap={{ base: 3, md: 8 }}
                  my={4} direction={{ base: "column", md: "row" }}>
              <Text fontSize={{ base: "24px", md: "32px" }} color={MAROON} fontWeight="700">
                {groom}
              </Text>
              <Text fontSize="26px" color={GOLD}>&amp;</Text>
              <Text fontSize={{ base: "24px", md: "32px" }} color={MAROON} fontWeight="700">
                {bride}
              </Text>
            </Flex>

            <Text fontSize="13px" color="#555" fontStyle="italic" mb={5}>
              were united in Holy Matrimony according to the rites of the Church
            </Text>

            <SimpleGrid columns={{ base: 1, md: Math.min(details.length, 3) || 1 }}
                        gap={4} borderTop={`1px solid ${GOLD}`}
                        borderBottom={`1px solid ${GOLD}`} py={4} mb={2}>
              {details.map((d) => (
                <Detail key={d.label} label={d.label} value={d.value} />
              ))}
            </SimpleGrid>

            <Flex justify="space-around" align="flex-end" mt={12}
                  px={{ base: 0, md: 6 }} gap={4} wrap="wrap">
              {w1 && <SignLine label="Witness 1" name={w1} />}
              {w2 && <SignLine label="Witness 2" name={w2} />}
              <SignLine label="Vicar / Parish Priest" />
            </Flex>
          </Box>
        </Box>
      );
    }}
  </CertificateShell>
);

export default MarriageCertificatePage;