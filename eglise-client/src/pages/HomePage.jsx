// src/pages/HomePage.jsx

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  SimpleGrid,
  Icon,
  Button,
  HStack,
  VStack,
  Circle,
  Spinner,
  Menu,
  Portal,
} from "@chakra-ui/react";
import {
  LuUsers,
  LuIndianRupee,
  LuWallet,
  LuArrowUp,
  LuArrowDown,
  LuCalendarDays,
  LuMapPin,
  LuClock,
  LuDroplet,
  LuHeart,
  LuFileText,
  LuSettings,
  LuUserPlus,
  LuChevronDown,
  LuUser,
  LuAward,
  LuBookOpen,
  LuHouse,
} from "react-icons/lu";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getDashboardMetrics } from "../api/registryServices";

const PRIMARY_MAROON = "#ae2050";
const PINK_SOFT = "#FDF2F5";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#E2E8F0";
const BG_COLOR = "#F8FAFC";

const COLORS = ["#ae2050", "#c2416b", "#d4738a", "#e5a6b8"];

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fromISODate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const QUICK_LINKS = [
  { icon: LuUserPlus, label: "Add Member", path: "/family-heads/create" },
  { icon: LuFileText, label: "Add Receipt", path: "/receipts/add" },
  { icon: LuWallet, label: "Add Payment", path: "/payments/add" },
  { icon: LuAward, label: "Qurbana Entry", path: "/qurbana-receipts" },
  { icon: LuDroplet, label: "Baptism Register", path: "/baptism" },
  { icon: LuHeart, label: "Marriage Register", path: "/marriage" },
  { icon: LuBookOpen, label: "Death Register", path: "/death-register" },
  { icon: LuUsers, label: "Student Attendance", path: "/member-directory" },
  { icon: LuFileText, label: "Reports", path: "/reports/day-book" },
  { icon: LuUser, label: "Visitor Management", path: "/visitors" },
  { icon: LuUsers, label: "Committee", path: "/committees" },
  { icon: LuSettings, label: "Settings", path: "/register-settings" },
];

const formatK = (v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`);

/* ---------- Small reusable pieces ---------- */

const Panel = ({ title, action, children, ...rest }) => (
  <Box
    bg="white"
    p={5}
    borderRadius="xl"
    border="1px solid"
    borderColor={BORDER}
    boxShadow="sm"
    {...rest}
  >
    <Flex justify="space-between" align="center" mb={4} minH="32px">
      <Text fontWeight="600" color={PRIMARY_MAROON} fontSize="lg">
        {title}
      </Text>
      {action}
    </Flex>
    {children}
  </Box>
);

// Static "This Month" pill (visual only, same as the mockup)
const PillSelect = ({ options = ["This Month"] }) => (
  <select
    style={{
      border: `1px solid ${BORDER}`,
      borderRadius: "6px",
      padding: "6px 10px",
      fontSize: "12px",
      outline: "none",
      color: DARK,
      background: "white",
    }}
  >
    {options.map((o) => (
      <option key={o}>{o}</option>
    ))}
  </select>
);

const ViewAll = ({ onClick }) => (
  <Text
    fontSize="xs"
    color={PRIMARY_MAROON}
    cursor="pointer"
    fontWeight="600"
    onClick={onClick}
  >
    View All
  </Text>
);

// Growth line: arrow + % + "vs last month". Hidden if the API sends no value.
const Growth = ({ value, label }) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  const neg = n < 0;
  return (
    <HStack
      gap={1}
      color={neg ? "red.500" : "green.500"}
      fontSize="xs"
      fontWeight="600"
    >
      <Icon as={neg ? LuArrowDown : LuArrowUp} boxSize={3.5} />
      <Text>{Math.abs(n)}%</Text>
      <Text color={MUTED} fontWeight="400" ml={1}>
        {label}
      </Text>
    </HStack>
  );
};

const StatCard = ({ icon, title, value, growth, growthLabel }) => (
  <Box
    bg="white"
    p={5}
    borderRadius="xl"
    border="1px solid"
    borderColor={BORDER}
    boxShadow="sm"
  >
    <HStack gap={4} align="center">
      <Circle size="64px" bg="rgba(174,32,80,0.08)" color={PRIMARY_MAROON} flexShrink={0}>
        <Icon as={icon} boxSize={7} />
      </Circle>
      <VStack align="start" gap={0}>
        <Text fontSize="sm" color={MUTED} fontWeight="500">
          {title}
        </Text>
        <Heading fontSize="24px" color={DARK} fontWeight="700">
          {value}
        </Heading>
      </VStack>
    </HStack>
    <Flex justify="center" mt={3} minH="18px">
      <Growth value={growth} label={growthLabel} />
    </Flex>
  </Box>
);

const QuickLinkBtn = ({ icon, label, path, navigate }) => (
  <VStack
    bg="white"
    py={3}
    px={2}
    gap={2}
    borderRadius="lg"
    border="1px solid"
    borderColor={BORDER}
    cursor="pointer"
    _hover={{ borderColor: PRIMARY_MAROON, shadow: "md" }}
    transition="all 0.2s"
    justify="center"
    minH="78px"
    onClick={() => navigate(path)}
  >
    <Icon as={icon} boxSize={6} color={PRIMARY_MAROON} />
    <Text fontSize="11px" fontWeight="500" color={DARK} textAlign="center" lineHeight="1.2">
      {label}
    </Text>
  </VStack>
);

const EmptyState = ({ text }) => (
  <Flex justify="center" align="center" py={8} color={MUTED} fontSize="sm">
    {text}
  </Flex>
);

const getActivityIcon = (type) => {
  switch (type) {
    case "MEMBER":
      return LuUserPlus;
    case "BAPTISM":
      return LuDroplet;
    case "MARRIAGE":
      return LuHeart;
    case "QURBANA":
      return LuAward;
    case "RECEIPT":
      return LuIndianRupee;
    default:
      return LuFileText;
  }
};

/* ---------- Page ---------- */

const HomePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const dateInputRef = useRef(null);
  const navigate = useNavigate();

  // Refetch whenever the selected date changes
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setRefreshing(true);
      try {
        const res = await getDashboardMetrics({ date: selectedDate });
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch (e) {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  };

  const pickedDate = fromISODate(selectedDate);
  const today = new Date();
  const isCurrentMonth =
    pickedDate.getMonth() === today.getMonth() &&
    pickedDate.getFullYear() === today.getFullYear();
  const periodLabel = isCurrentMonth
    ? "This Month"
    : pickedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (loading || !data) {
    return (
      <Box minH="100vh" bg={BG_COLOR}>
        <Navbar />
        <Flex justify="center" align="center" h="80vh">
          <Spinner size="xl" color={PRIMARY_MAROON} borderWidth="4px" />
        </Flex>
      </Box>
    );
  }

  const m = data?.metrics || {};

  // Safe parsing
  let memberChartData = Array.isArray(data?.chart_data?.member_chart)
    ? data.chart_data.member_chart
    : [];

  // Fallback: if no chart data but members exist, generate a visual curve
  if (memberChartData.length === 0 && (m.total_members || 0) > 0) {
    const total = m.total_members;
    memberChartData = [
      { name: "Week 1", members: Math.max(1, Math.floor(total * 0.2)) },
      { name: "Week 2", members: Math.max(2, Math.floor(total * 0.4)) },
      { name: "Week 3", members: Math.max(3, Math.floor(total * 0.6)) },
      { name: "Week 4", members: Math.max(4, Math.floor(total * 0.8)) },
      { name: "Week 5", members: total },
    ];
  }

  const financialChartData = Array.isArray(data?.chart_data?.financial_chart)
    ? data.chart_data.financial_chart
    : [];

  const upcomingEvents = Array.isArray(data?.events) ? data.events : [];
  const recentActivities = Array.isArray(data?.activities) ? data.activities : [];

  const sacraments = [
    { label: "Baptism", key: "baptism" },
    { label: "Holy Qurbana", key: "qurbana" },
    { label: "Marriage", key: "marriage" },
    { label: "Death", key: "death" },
  ].map((s) => ({
    ...s,
    value: data?.sacraments?.[s.key] || 0,
  }));
  const sacramentTotal = data?.sacraments?.total || 0;

  const summaryRows = [
    { icon: LuWallet, label: "Total Payments", value: formatCurrency(m.monthly_payments) },
    { icon: LuIndianRupee, label: "Net Balance", value: formatCurrency(m.net_balance) },
    { icon: LuFileText, label: "Pending Receipts", value: formatCurrency(m.pending_receipts || 0) },
  ];

  return (
    <Box bg={BG_COLOR} minH="100vh" display="flex" flexDirection="column">
      <Navbar />

      <Box
        flex="1"
        w="100%"
        px={{ base: 4, md: 8 }}
        py={6}
        opacity={refreshing ? 0.55 : 1}
        transition="opacity 0.2s"
      >
        {/* HEADER */}
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
          <HStack gap={3} align="center">
            <Circle
              size="46px"
              bg="white"
              border="1px solid"
              borderColor={BORDER}
              color={PRIMARY_MAROON}
              borderRadius="lg"
            >
              <Icon as={LuHouse} boxSize={5} />
            </Circle>
            <Box>
              <Heading size="lg" color={PRIMARY_MAROON} fontWeight="600">
                Dashboard
              </Heading>
              <Text fontSize="sm" color={MUTED}>
                Welcome back, Admin! Here's what's happening in your church.
              </Text>
            </Box>
          </HStack>

          <HStack gap={3}>
            {/* Date picker: opens the native calendar, data reloads for the chosen date */}
            <Box position="relative">
              <Button
                variant="outline"
                bg="white"
                size="md"
                borderRadius="md"
                fontWeight="500"
                color={DARK}
                borderColor={BORDER}
                minW="180px"
                justifyContent="space-between"
                onClick={openDatePicker}
              >
                <HStack gap={3}>
                  <Icon as={LuCalendarDays} boxSize={5} color={PRIMARY_MAROON} />
                  <span>
                    {pickedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </HStack>
                <Icon as={LuChevronDown} boxSize={4} />
              </Button>
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                tabIndex={-1}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  width: "100%",
                  height: 0,
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
            </Box>

            {/* Quick Actions dropdown */}
            <Menu.Root positioning={{ placement: "bottom-end" }}>
              <Menu.Trigger asChild>
                <Button
                  bg={PRIMARY_MAROON}
                  color="white"
                  size="md"
                  borderRadius="md"
                  minW="160px"
                  justifyContent="space-between"
                  _hover={{ bg: "#8a1a3e" }}
                >
                  Quick Actions
                  <Icon as={LuChevronDown} boxSize={4} />
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content
                    minW="230px"
                    maxH="380px"
                    overflowY="auto"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={BORDER}
                    p={1}
                  >
                    {QUICK_LINKS.map((q) => (
                      <Menu.Item
                        key={q.label}
                        value={q.label}
                        onSelect={() => navigate(q.path)}
                        cursor="pointer"
                        gap={3}
                        px={3}
                        py={2}
                        borderRadius="md"
                        _highlighted={{ bg: PINK_SOFT }}
                      >
                        <Icon as={q.icon} color={PRIMARY_MAROON} boxSize={4} />
                        <Text fontSize="sm" color={DARK}>
                          {q.label}
                        </Text>
                      </Menu.Item>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </HStack>
        </Flex>

        {/* TOP STATS ROW */}
        <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} gap={4} mb={6}>
          <StatCard
            icon={LuUsers}
            title="Total Members"
            value={(m.total_members || 0).toLocaleString()}
            growth={m.member_growth_pct}
            growthLabel="vs last month"
          />
          <StatCard
            icon={LuIndianRupee}
            title="Monthly Receipts"
            value={formatCurrency(m.monthly_receipts)}
            growth={m.monthly_receipts_growth_pct}
            growthLabel="vs last month"
          />
          <StatCard
            icon={LuIndianRupee}
            title="Total Receipts (Yearly)"
            value={formatCurrency(m.yearly_receipts)}
            growth={m.yearly_receipts_growth_pct}
            growthLabel="vs last year"
          />
          <StatCard
            icon={LuWallet}
            title="Total Payments (Monthly)"
            value={formatCurrency(m.monthly_payments)}
            growth={m.monthly_payments_growth_pct}
            growthLabel="vs last month"
          />
          <StatCard
            icon={LuWallet}
            title="Total Payments (Yearly)"
            value={formatCurrency(m.yearly_payments)}
            growth={m.yearly_payments_growth_pct}
            growthLabel="vs last year"
          />
        </SimpleGrid>

        {/* MIDDLE ROW: CHARTS & EVENTS */}
        <Grid templateColumns={{ base: "1fr", lg: "1.25fr 1fr 1.1fr" }} gap={4} mb={6}>
          {/* MEMBER OVERVIEW */}
          <Panel title="Member Overview" action={<PillSelect options={[periodLabel]} />}>
            <Box h="250px">
              {memberChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={memberChartData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PRIMARY_MAROON} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={PRIMARY_MAROON} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: DARK }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: DARK }}
                    />
                    <RechartsTooltip
                      formatter={(v) => [Number(v).toLocaleString(), "Members"]}
                      contentStyle={{
                        borderRadius: 8,
                        border: `1px solid ${BORDER}`,
                        fontSize: 12,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="members"
                      stroke={PRIMARY_MAROON}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMem)"
                      activeDot={{ r: 6, fill: "white", stroke: PRIMARY_MAROON, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState text="No chart data available" />
              )}
            </Box>
          </Panel>

          {/* SACRAMENTS */}
          <Panel title="Sacraments Overview">
            <Flex align="center" gap={4} h="250px">
              <Box h="200px" w="52%" position="relative" flexShrink={0}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sacraments}
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {sacraments.map((s, index) => (
                        <Cell key={s.key} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <Flex
                  position="absolute"
                  inset="0"
                  direction="column"
                  align="center"
                  justify="center"
                  pointerEvents="none"
                >
                  <Heading fontSize="2xl" color={DARK} lineHeight="1.1">
                    {sacramentTotal}
                  </Heading>
                  <Text fontSize="xs" color={MUTED}>
                    Total
                  </Text>
                </Flex>
              </Box>

              <VStack align="stretch" gap={4} flex="1" minW={0}>
                {sacraments.map((item, i) => {
                  const pct = sacramentTotal ? Math.round((item.value / sacramentTotal) * 100) : 0;
                  return (
                    <HStack key={item.key} justify="space-between" fontSize="xs" gap={2}>
                      <HStack gap={2}>
                        <Circle size="9px" bg={COLORS[i]} flexShrink={0} />
                        <Text color={DARK} fontWeight="500">
                          {item.label}
                        </Text>
                      </HStack>
                      <Text color={DARK} whiteSpace="nowrap">
                        {item.value} ({pct}%)
                      </Text>
                    </HStack>
                  );
                })}
              </VStack>
            </Flex>
          </Panel>

          {/* UPCOMING EVENTS */}
          <Panel title="Upcoming Events" action={<ViewAll onClick={() => navigate("/events")} />}>
            <VStack align="stretch" gap={0}>
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 4).map((ev, i, arr) => (
                  <HStack
                    key={ev.id}
                    gap={3}
                    align="center"
                    py={3}
                    borderBottom={i < arr.length - 1 ? "1px solid" : "none"}
                    borderColor={BORDER}
                  >
                    <VStack
                      bg="white"
                      border="1px solid"
                      borderColor={BORDER}
                      borderRadius="md"
                      gap={0}
                      minW="52px"
                      py={1}
                      justify="center"
                    >
                      <Text fontSize="11px" fontWeight="600" color={PRIMARY_MAROON}>
                        {ev.month}
                      </Text>
                      <Text fontSize="20px" fontWeight="700" color={DARK} lineHeight="1.1">
                        {ev.day}
                      </Text>
                    </VStack>
                    <VStack align="start" gap={1} flex="1" minW={0}>
                      <Text fontSize="sm" fontWeight="600" color={DARK} lineHeight="1.2">
                        {ev.title}
                      </Text>
                      <HStack fontSize="11px" color={MUTED} gap={1}>
                        <Icon as={LuMapPin} /> <Text>{ev.location}</Text>
                      </HStack>
                    </VStack>
                    <HStack fontSize="11px" color={MUTED} gap={1} whiteSpace="nowrap">
                      <Icon as={LuClock} /> <Text>{ev.time}</Text>
                    </HStack>
                  </HStack>
                ))
              ) : (
                <EmptyState text="No upcoming events" />
              )}
            </VStack>
          </Panel>
        </Grid>

        {/* BOTTOM ROW */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1.1fr 1fr" }} gap={4}>
          {/* RECENT ACTIVITIES */}
          <Panel
            title="Recent Activities"
            action={<ViewAll onClick={() => navigate("/reports/day-book")} />}
          >
            <VStack align="stretch" gap={0}>
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((act, i, arr) => (
                  <HStack
                    key={act.id}
                    justify="space-between"
                    align="center"
                    py={2.5}
                    borderBottom={i < arr.length - 1 ? "1px solid" : "none"}
                    borderColor={BORDER}
                  >
                    <HStack gap={3} minW={0}>
                      <Circle size="36px" bg={PINK_SOFT} color={PRIMARY_MAROON} flexShrink={0}>
                        <Icon as={getActivityIcon(act.type)} boxSize={4} />
                      </Circle>
                      <VStack align="start" gap={0} minW={0}>
                        <Text fontSize="sm" fontWeight="500" color={DARK}>
                          {act.title}
                        </Text>
                        <Text fontSize="11px" color={MUTED}>
                          {act.description}
                        </Text>
                      </VStack>
                    </HStack>
                    <Text fontSize="11px" color={MUTED} whiteSpace="nowrap">
                      {act.time}
                    </Text>
                  </HStack>
                ))
              ) : (
                <EmptyState text="No recent activities" />
              )}
            </VStack>
          </Panel>

          {/* FINANCIAL SUMMARY */}
          <Panel title="Financial Summary" action={<PillSelect options={[periodLabel]} />}>
            <Flex gap={4} align="stretch" direction={{ base: "column", md: "row" }}>
              {/* Left: totals + breakdown */}
              <VStack align="stretch" gap={5} minW="190px">
                <HStack gap={3}>
                  <Circle size="56px" bg={PINK_SOFT} color={PRIMARY_MAROON} flexShrink={0}>
                    <Icon as={LuIndianRupee} boxSize={6} />
                  </Circle>
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color={MUTED} fontWeight="500">
                      Total Receipts
                    </Text>
                    <Heading fontSize="22px" color={DARK} fontWeight="700">
                      {formatCurrency(m.monthly_receipts)}
                    </Heading>
                    <Growth value={m.monthly_receipts_growth_pct} label="vs last month" />
                  </VStack>
                </HStack>

                <VStack align="stretch" gap={0}>
                  {summaryRows.map((row, i) => (
                    <HStack
                      key={row.label}
                      justify="space-between"
                      py={2.5}
                      fontSize="xs"
                      borderTop="1px solid"
                      borderBottom={i === summaryRows.length - 1 ? "1px solid" : "none"}
                      borderColor={BORDER}
                    >
                      <HStack gap={2} color={DARK}>
                        <Icon as={row.icon} color={PRIMARY_MAROON} boxSize={4} />
                        <Text>{row.label}</Text>
                      </HStack>
                      <Text fontWeight="600" color={DARK}>
                        {row.value}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>

              {/* Right: bar chart */}
              <Box flex="1" h="220px" minW={0}>
                {financialChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialChartData} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ae2050" />
                          <stop offset="100%" stopColor="#e88aa6" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: DARK }}
                        dy={5}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: DARK }}
                        tickFormatter={formatK}
                      />
                      <RechartsTooltip
                        formatter={(v) => [formatCurrency(v), "Amount"]}
                        cursor={{ fill: "rgba(174,32,80,0.04)" }}
                      />
                      <Bar dataKey="amount" fill="url(#barGrad)" radius={[3, 3, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState text="No chart data available" />
                )}
              </Box>
            </Flex>
          </Panel>

          {/* QUICK LINKS */}
          <Panel title="Quick Links">
            <SimpleGrid columns={4} gap={3}>
              {QUICK_LINKS.map((q) => (
                <QuickLinkBtn key={q.label} {...q} navigate={navigate} />
              ))}
            </SimpleGrid>
          </Panel>
        </Grid>
      </Box>

      <Footer />
    </Box>
  );
};

export default HomePage;