// src/pages/reports/CertificateShell.jsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Box, Button, Container, Flex, Text } from "@chakra-ui/react";
import { LuArrowLeft, LuPrinter } from "react-icons/lu";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getReportConfig, getSourceFromPath } from "./reportConfig";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#650A18";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";

/**
 * Shared wrapper: works out live vs legacy from the URL, fetches the
 * record, shows Back/Print bar, and hides everything except the
 * certificate when printing.
 * children = (record) => JSX of the certificate
 */
const CertificateShell = ({ type, children }) => {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const source = getSourceFromPath(pathname);
  const cfg = getReportConfig(type, source);

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        setRecord(null);
        const res = await cfg.getFn(id);
        setRecord(res?.data ?? null);
      } catch (err) {
        console.error("Error loading certificate:", err);
        setError(err?.response?.data?.detail || "Unable to load record.");
      } finally {
        setLoading(false);
      }
    })();
  }, [type, source, id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <style>{`
        @page { size: A4 landscape; margin: 8mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .cert-wrap { padding: 0 !important; max-width: 100% !important; }
          .cert-box {
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <Box className="no-print"><Navbar /></Box>

      <Container maxW="1050px" px={4} pt={3} pb={5} flex="1" className="cert-wrap">
        <Flex className="no-print" justify="space-between" align="center" mb={3}>
          <Button variant="outline" h="34px" fontSize="11px"
                  borderColor={BORDER_COLOR} color={SECONDARY_TEXT}
                  onClick={() => navigate(cfg.basePath)}>
            <LuArrowLeft size={14} style={{ marginRight: "6px" }} />
            Back to {cfg.title}
          </Button>
          <Button bg={PRIMARY_RED} color="white" h="34px" px={4}
                  fontSize="11px" fontWeight="600"
                  onClick={() => window.print()}
                  disabled={loading || !record}
                  _hover={{ bg: DARK_RED }}>
            <LuPrinter size={14} style={{ marginRight: "6px" }} />
            Print Certificate
          </Button>
        </Flex>

        {loading && <Text fontSize="11px" color={SECONDARY_TEXT}>Loading...</Text>}
        {error && <Text fontSize="11px" color="red.600">{error}</Text>}
        {!loading && record && children(record)}
      </Container>

      <Box className="no-print"><Footer /></Box>
    </Box>
  );
};

export default CertificateShell;