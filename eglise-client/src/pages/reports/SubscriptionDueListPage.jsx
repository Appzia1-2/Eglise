// src/pages/reports/SubscriptionDueListPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Container, Flex, Heading, HStack, Input, Text,
} from "@chakra-ui/react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChurchPrintModal from "../../components/ChurchPrintModal";
import {
  getSubscriptionDueReport,
  listWards,
  listMembers,
  getMyChurch,
} from "../../api/registryServices";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const BLUE = "#315AB5";

const ArrowLeftIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const PrinterIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><rect x="6" y="14" width="12" height="8" stroke={color} strokeWidth="1.8" fill="none" /></svg>
);
const FilePdfIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /><path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /><text x="12" y="17" textAnchor="middle" fontSize="6" fontWeight="700" fill={color}>PDF</text></svg>
);
const ChevronDownIcon = ({ size = 14, color = SECONDARY_TEXT }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const CalendarIcon = ({ size = 16, color = BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2" stroke={color} strokeWidth="1.7" /><path d="M7 3v4M17 3v4M3.5 9.5h17" stroke={color} strokeWidth="1.7" strokeLinecap="round" /></svg>
);
const HomeIcon = ({ size = 16, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" /></svg>
);

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const today = () => new Date().toISOString().split("T")[0];
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const DueTable = ({ wards, forPrint = false }) => {
  const headerBg = forPrint ? "#F4D8DE" : "#F7F9FB";
  const headerColor = forPrint ? DARK_RED : TEXT_COLOR;
  const wardBg = forPrint ? "#FBE9ED" : "#FFF5F7";
  const stripeBg = forPrint ? "#FCF2F4" : "#FAFBFC";
  const rowBorder = forPrint ? "#E8B4C0" : BORDER_COLOR;
  const wardRowBorder = forPrint ? "#DDAAB8" : "#F2C7D2";

  const grandTotal = wards.reduce((s, w) => s + (w.ward_total || 0), 0);
  const totalMembers = wards.reduce((s, w) => s + (w.member_count || 0), 0);

  return (
    <Box border={`1px solid ${rowBorder}`} borderRadius={forPrint ? "0" : "10px"} overflow="hidden">
      <Box as="table" width="100%" borderCollapse="collapse" fontSize={forPrint ? "11px" : "12px"} fontFamily={forPrint ? "Georgia, serif" : "inherit"}>
        <Box as="thead">
          <Box as="tr" bg={headerBg}>
            {["Member Name", "Family", "Monthly Subscription", "Charity Fund", "Diocese Fund", "Total Due"].map((label, i) => (
              <Box as="th" key={label} textAlign={i >= 2 ? "right" : "left"} px={3} py={3} fontSize="11px" fontWeight="700" color={headerColor} borderBottom={`1px solid ${rowBorder}`} letterSpacing="0.3px">
                {label}
              </Box>
            ))}
          </Box>
        </Box>
        <Box as="tbody">
          {wards.map((w) => (
            <React.Fragment key={w.ward}>
              <Box as="tr" bg={wardBg} borderTop={`1px solid ${wardRowBorder}`} borderBottom={`1px solid ${wardRowBorder}`}>
                <Box as="td" colSpan={4} px={3} py={2.5}>
                  <HStack gap={2}>
                    <HomeIcon size={16} color={forPrint ? DARK_RED : PRIMARY_RED} />
                    <Text fontSize={forPrint ? "12px" : "13px"} fontWeight="700" color={forPrint ? DARK_RED : TEXT_COLOR}>
                      {w.ward}
                    </Text>
                  </HStack>
                </Box>
                <Box as="td" px={3} py={2.5} textAlign="right">
                  <Text fontSize="11px" fontWeight="600" color={forPrint ? DARK_RED : SECONDARY_TEXT}>
                    {w.member_count} Member{w.member_count === 1 ? "" : "s"}
                  </Text>
                </Box>
                <Box as="td" px={3} py={2.5} textAlign="right">
                  <Text fontSize="12px" fontWeight="700" color={forPrint ? DARK_RED : PRIMARY_RED} whiteSpace="nowrap">
                    Ward Due: {fmt(w.ward_total)}
                  </Text>
                </Box>
              </Box>

              {w.members.map((m, idx) => (
                <Box as="tr" key={`${w.ward}-${m.member_id}-${idx}`} bg={idx % 2 === 1 ? stripeBg : "white"} borderBottom={`1px solid ${rowBorder}`}>
                  <Box as="td" px={3} py={2} pl={7} color={TEXT_COLOR}>{m.name}</Box>
                  <Box as="td" px={3} py={2} color={TEXT_COLOR}>{m.family_name}</Box>
                  <Box as="td" px={3} py={2} textAlign="right" color={TEXT_COLOR}>{fmt(m.monthly_subscription)}</Box>
                  <Box as="td" px={3} py={2} textAlign="right" color={TEXT_COLOR}>{fmt(m.charity_fund)}</Box>
                  <Box as="td" px={3} py={2} textAlign="right" color={TEXT_COLOR}>{fmt(m.diocese_fund)}</Box>
                  <Box as="td" px={3} py={2} textAlign="right" fontWeight="600" color={TEXT_COLOR}>{fmt(m.total_due)}</Box>
                </Box>
              ))}
            </React.Fragment>
          ))}
          <Box as="tr" bg={forPrint ? "#F5CED8" : "#F5F7FA"} borderTop={`2px solid ${rowBorder}`}>
            <Box as="td" colSpan={4} px={3} py={3} textAlign="right">
              <Text fontSize="12px" fontWeight="700" color={forPrint ? DARK_RED : BLUE} letterSpacing="0.3px">
                Grand Total{forPrint ? "" : ` (${totalMembers} members)`}
              </Text>
            </Box>
            <Box as="td" />
            <Box as="td" px={3} py={3} textAlign="right" fontWeight="700" color={forPrint ? DARK_RED : TEXT_COLOR} fontSize="12px">{fmt(grandTotal)}</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const SubscriptionDueListPage = () => {
  const navigate = useNavigate();

  const [wards, setWards] = useState([]);
  const [members, setMembers] = useState([]);
  const [church, setChurch] = useState({});

  const [selectedWard, setSelectedWard] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());

  const [data, setData] = useState({ wards: [], grand_total: 0 });
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [wRes, mRes, cRes] = await Promise.all([
          listWards(),
          listMembers(),
          getMyChurch(),
        ]);
        setWards(wRes?.data?.results ?? wRes?.data ?? []);
        setMembers(mRes?.data?.results ?? mRes?.data ?? []);
        setChurch(cRes?.data ?? {});
      } catch (err) {
        console.error("Load options error:", err);
      }
    };
    load();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setPageError("");
      const params = { from: dateFrom, to: dateTo };
      if (selectedWard) params.ward_id = selectedWard;
      if (selectedMember) params.member_id = selectedMember;
      const res = await getSubscriptionDueReport(params);
      setData({
        wards: res?.data?.wards || [],
        grand_total: res?.data?.grand_total || 0,
      });
    } catch (err) {
      console.error("Due list fetch error:", err);
      setPageError("Unable to load subscription due list.");
      setData({ wards: [], grand_total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, selectedWard, selectedMember]);

  const periodLabel = `${new Date(dateFrom + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} – ${new Date(dateTo + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;

  const totalMembers = (data.wards || []).reduce((s, w) => s + w.member_count, 0);

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />
      <Container maxW="1400px" px={{ base: 4, md: 5 }} py={4} flex="1">
        <HStack gap={2} mb={2} fontSize="12px">
          <Text color={BLUE} cursor="pointer" onClick={() => navigate("/reports")}>Reports</Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={SECONDARY_TEXT}>Subscription Due List</Text>
        </HStack>

        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={4}>
          <Box>
            <Text fontSize="11px" fontWeight="700" color={PRIMARY_RED} letterSpacing="0.4px" mb={1}>SUBSCRIPTION DUE REPORT</Text>
            <Heading color={TEXT_COLOR} fontSize={{ base: "22px", md: "26px" }} mb={1}>Subscription Due List</Heading>
            <Text color={SECONDARY_TEXT} fontSize="12px">View ward-wise member subscription dues.</Text>
          </Box>
          <HStack gap={3} flexWrap="wrap">
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={() => navigate("/reports")} _hover={{ bg: "#FFF5F7" }} leftIcon={<ArrowLeftIcon />}>Back</Button>
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={() => setPrintOpen(true)} _hover={{ bg: "#FFF5F7" }} leftIcon={<PrinterIcon />}>Print</Button>
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={() => setPrintOpen(true)} _hover={{ bg: "#FFF5F7" }} leftIcon={<FilePdfIcon />}>Generate PDF</Button>
          </HStack>
        </Flex>

        <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" px={{ base: 4, md: 5 }} py={4} mb={4} bg="white">
          <Flex gap={4} direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "flex-end" }} wrap="wrap">
            <Box flex="1" minW="180px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Member</Text>
              <Box position="relative">
                <Box as="select" value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} width="100%" height="40px" fontSize="12px" color={TEXT_COLOR} border={`1px solid ${BORDER_COLOR}`} borderRadius="6px" bg="white" appearance="none" px="11px" outline="none" cursor="pointer">
                  <option value="">All Members</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Box>
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none"><ChevronDownIcon /></Box>
              </Box>
            </Box>

            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Ward</Text>
              <Box position="relative">
                <Box as="select" value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} width="100%" height="40px" fontSize="12px" color={TEXT_COLOR} border={`1px solid ${BORDER_COLOR}`} borderRadius="6px" bg="white" appearance="none" px="11px" outline="none" cursor="pointer">
                  <option value="">All Wards</option>
                  {wards.map((w) => <option key={w.id} value={w.id}>{w.ward_name}</option>)}
                </Box>
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none"><ChevronDownIcon /></Box>
              </Box>
            </Box>

            <Box flex="1" minW="150px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Date From</Text>
              <Box position="relative">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} h="40px" fontSize="12px" borderColor={BORDER_COLOR} borderRadius="6px" color={TEXT_COLOR} />
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none"><CalendarIcon /></Box>
              </Box>
            </Box>

            <Box flex="1" minW="150px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Date To</Text>
              <Box position="relative">
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} h="40px" fontSize="12px" borderColor={BORDER_COLOR} borderRadius="6px" color={TEXT_COLOR} />
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none"><CalendarIcon /></Box>
              </Box>
            </Box>

            <Box flexShrink={0}>
              <Button h="40px" px={10} bg="white" border={`1px solid ${PRIMARY_RED}`} color={PRIMARY_RED} fontSize="12px" fontWeight="600" borderRadius="6px" onClick={fetchData} _hover={{ bg: "#FFF5F7" }}>Filter</Button>
            </Box>
          </Flex>
        </Box>

        {pageError && (
          <Box mb={4} p={3} borderRadius="6px" bg="#FFF5F5" border="1px solid #FED7D7">
            <Text color="red.600" fontSize="12px">{pageError}</Text>
          </Box>
        )}

        {loading ? (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" py={14} textAlign="center">
            <Text color={SECONDARY_TEXT} fontSize="12px">Loading…</Text>
          </Box>
        ) : (data.wards || []).length === 0 ? (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" py={14} textAlign="center">
            <Text color={TEXT_COLOR} fontSize="15px" fontWeight="600">No dues found</Text>
            <Text color={SECONDARY_TEXT} fontSize="12px" mt={1}>All members are fully paid for this period.</Text>
          </Box>
        ) : (
          <DueTable wards={data.wards} />
        )}

        <Flex mt={4} justify="space-between" align="center" direction={{ base: "column", md: "row" }} gap={2}>
          <Text color={SECONDARY_TEXT} fontSize="12px">Showing 1–{totalMembers} of {totalMembers} due members</Text>
        </Flex>
      </Container>
      <Footer />

      <ChurchPrintModal isOpen={printOpen} onClose={() => setPrintOpen(false)} title="SUBSCRIPTION DUE LIST" church={church} subtitle={<><Text as="span" fontWeight="700">Period:</Text> {periodLabel}</>}>
        <DueTable wards={data.wards || []} forPrint />
      </ChurchPrintModal>
    </Box>
  );
};

export default SubscriptionDueListPage;