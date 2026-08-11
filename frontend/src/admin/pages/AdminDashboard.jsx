// src/admin/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Grid,
  GridItem,
  Circle,
  Icon,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import {
  LuChurch,
  LuUsers,
  LuBox,
  LuIndianRupee,
  LuTrendingUp,
  LuClock,
  LuTicket,
  LuCalendar,
  LuChevronDown,
  LuArrowUp,
  LuCircleCheck,
  LuTimer,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

// Shared palette used across the donut, legend and top-packages bars
const chartPalette = ["#ae2050", "#d6567f", "#e59ab5", "#d69e2e", "#6b46c1", "#2b6cb0", "#38a169"];

// ---- helpers ---------------------------------------------------------------

const normStatus = (s) => {
  const v = (s || "").toUpperCase();
  if (v === "PAID") return "paid";
  if (v === "CANCELLED" || v === "CANCELED") return "cancelled";
  return "pending";
};

const asList = (res) =>
  res?.data || res?.results || (Array.isArray(res) ? res : []);

const smartINR = (v) => {
  const n = Number(v) || 0;
  const strip = (x) => x.toFixed(2).replace(/\.?0+$/, "");
  if (n >= 1e7) return `₹${strip(n / 1e7)}Cr`;
  if (n >= 1e5) return `₹${strip(n / 1e5)}L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

const timeAgo = (d) => {
  if (!d) return "";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ---- tiny dependency-free charts ------------------------------------------

const LineChart = ({ points }) => {
  const w = 540;
  const h = 210;
  const padL = 46;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const values = points.map((p) => p.value);
  const rawMax = Math.max(...values, 1);
  // round the max up to a "nice" number for the axis
  const pow = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const niceMax = Math.ceil(rawMax / pow) * pow || 1;
  const n = points.length;
  const xStep = n > 1 ? (w - padL - padR) / (n - 1) : 0;
  const scaleY = (v) => padT + (h - padT - padB) * (1 - v / niceMax);
  const coords = points.map((p, i) => [padL + i * xStep, scaleY(p.value)]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area =
    coords.length > 0
      ? `${line} L${coords[coords.length - 1][0]},${h - padB} L${coords[0][0]},${h - padB} Z`
      : "";
  const ticks = 4;

  return (
    <Box as="svg" width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="revfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primaryMaroon} stopOpacity="0.18" />
          <stop offset="100%" stopColor={primaryMaroon} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const val = (niceMax / ticks) * (ticks - i);
        const y = scaleY(val);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#edf0f3" strokeWidth="1" />
            <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#a0aec0">
              {smartINR(val)}
            </text>
          </g>
        );
      })}
      {area && <path d={area} fill="url(#revfill)" />}
      {line && <path d={line} fill="none" stroke={primaryMaroon} strokeWidth="2" />}
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke={primaryMaroon} strokeWidth="2" />
      ))}
      {points.map((p, i) => (
        <text
          key={i}
          x={padL + i * xStep}
          y={h - 8}
          textAnchor="middle"
          fontSize="9"
          fill="#a0aec0"
        >
          {p.label}
        </text>
      ))}
    </Box>
  );
};

const DonutChart = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const cx = 70;
  const cy = 70;
  const r = 52;
  const stroke = 22;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <Box as="svg" width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f2f4" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const frac = s.value / total;
        const len = frac * circ;
        const rot = acc * 360 - 90;
        acc += frac;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${circ - len}`}
            transform={`rotate(${rot} ${cx} ${cy})`}
          />
        );
      })}
    </Box>
  );
};

const Sparkline = ({ values, color = primaryMaroon }) => {
  const w = 96;
  const h = 30;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1 || 1)) * w},${h - ((v - min) / span) * h}`)
    .join(" ");
  return (
    <Box as="svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </Box>
  );
};

// ---- reusable pieces -------------------------------------------------------

const Card = ({ children, ...props }) => (
  <Box
    bg="white"
    borderRadius="2xl"
    border="1px solid"
    borderColor="gray.100"
    boxShadow="0 4px 20px -8px rgba(0,0,0,0.06)"
    p={5}
    {...props}
  >
    {children}
  </Box>
);

const StatCard = ({ icon, label, value, color, delta }) => (
  <Card>
    <HStack spacing={3} align="center">
      <Circle size="44px" bg={`${color || primaryMaroon}14`} color={color || primaryMaroon} flexShrink={0}>
        <Icon as={icon} boxSize={5} />
      </Circle>
      <Box minW={0} flex="1">
        <Text fontSize="12px" color="gray.500" fontWeight="500" lineHeight="1.25" noOfLines={2}>
          {label}
        </Text>
        <Heading fontSize="2xl" fontWeight="800" color="#1a1a2e" noOfLines={1}>
          {value}
        </Heading>
        {delta && (
          <Text fontSize="11px" fontWeight="700" color={delta.tone === "down" ? "#c53030" : "#2f855a"}>
            {delta.value}
          </Text>
        )}
      </Box>
    </HStack>
  </Card>
);

const statusPill = (active) => (
  <Badge
    bg={active ? "rgba(56,161,105,0.10)" : "gray.100"}
    color={active ? "#2f855a" : "gray.500"}
    borderRadius="full"
    px={2.5}
    py={0.5}
    fontSize="11px"
    fontWeight="700"
  >
    {active ? "Active" : "Inactive"}
  </Badge>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [churches, setChurches] = useState([]);
  const [packages, setPackages] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [revenueMode, setRevenueMode] = useState("monthly"); // monthly | yearly
  const [period, setPeriod] = useState("this_year"); // window for the revenue chart

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [churchesRes, packagesRes, subsRes, billsRes] = await Promise.all([
        adminApi.getChurches().catch(() => ({ data: [] })),
        adminApi.getPackages().catch(() => ({ data: [] })),
        adminApi.getSubscriptions().catch(() => ({ data: [] })),
        adminApi.getBills().catch(() => ({ data: [] })),
      ]);
      setChurches(asList(churchesRes));
      setPackages(asList(packagesRes));
      setSubscriptions(asList(subsRes));
      setBills(asList(billsRes));

      // optional endpoints — only if the method exists on adminApi
      try {
        const t = await adminApi.getTickets?.();
        if (t) setTickets(asList(t));
      } catch (e) {
        /* tickets endpoint not available */
      }
      try {
        const u = await adminApi.getUpgradeRequests?.();
        if (u) setUpgradeRequests(asList(u));
      } catch (e) {
        /* upgrade-requests endpoint not available */
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load dashboard data.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---- derived metrics -----------------------------------------------------
  const now = new Date();
  const paidBills = bills.filter((b) => normStatus(b.status) === "paid");
  const billDate = (b) => new Date(b.paid_at || b.created_at || Date.now());
  const isThisMonth = (d) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const lastMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const isLastMonth = (d) =>
    d.getFullYear() === lastMonthRef.getFullYear() && d.getMonth() === lastMonthRef.getMonth();

  const pctDelta = (cur, prev) => {
    if (!prev) return cur > 0 ? { value: "+100%", tone: "up" } : null;
    const p = ((cur - prev) / prev) * 100;
    return { value: `${p >= 0 ? "+" : ""}${p.toFixed(1)}%`, tone: p >= 0 ? "up" : "down" };
  };

  const totalChurches = churches.length;
  const activeChurches = churches.filter((c) => c.is_active).length;
  const activePackages = packages.filter((p) => p.is_active !== false).length;

  const revThisMonth = paidBills
    .filter((b) => isThisMonth(billDate(b)))
    .reduce((s, b) => s + (parseFloat(b.total_amount) || parseFloat(b.amount) || 0), 0);
  const revLastMonth = paidBills
    .filter((b) => isLastMonth(billDate(b)))
    .reduce((s, b) => s + (parseFloat(b.total_amount) || parseFloat(b.amount) || 0), 0);
  const revThisYear = paidBills
    .filter((b) => billDate(b).getFullYear() === now.getFullYear())
    .reduce((s, b) => s + (parseFloat(b.total_amount) || parseFloat(b.amount) || 0), 0);

  const monthlyRevenueDelta = pctDelta(revThisMonth, revLastMonth);

  // new-church growth (proxy for the Active-Churches delta in the mockup)
  const newThisMonth = churches.filter((c) => c.created_at && isThisMonth(new Date(c.created_at))).length;
  const newLastMonth = churches.filter((c) => c.created_at && isLastMonth(new Date(c.created_at))).length;
  const activeChurchesDelta = pctDelta(newThisMonth, newLastMonth);

  const pendingRequests =
    upgradeRequests.length ||
    bills.filter((b) => normStatus(b.status) === "pending").length;

  const openTickets = tickets.filter(
    (t) => (t.status || "").toUpperCase() === "OPEN"
  ).length;

  // Revenue Overview chart data (window + granularity)
  const buildRevenuePoints = () => {
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (revenueMode === "yearly") {
      const years = {};
      paidBills.forEach((b) => {
        const y = billDate(b).getFullYear();
        years[y] = (years[y] || 0) + (parseFloat(b.total_amount) || parseFloat(b.amount) || 0);
      });
      const sortedYears = Object.keys(years).sort();
      const last = sortedYears.slice(-6);
      if (last.length === 0) return [{ label: String(now.getFullYear()), value: 0 }];
      return last.map((y) => ({ label: y, value: years[y] }));
    }
    // monthly — current year Jan..Dec (or last 30 days when period=this_month)
    if (period === "this_month") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const buckets = Array.from({ length: daysInMonth }, () => 0);
      paidBills.forEach((b) => {
        const d = billDate(b);
        if (isThisMonth(d)) buckets[d.getDate() - 1] += parseFloat(b.total_amount) || parseFloat(b.amount) || 0;
      });
      return buckets.map((v, i) => ({ label: i % 5 === 0 ? String(i + 1) : "", value: v }));
    }
    const year = now.getFullYear();
    const buckets = Array.from({ length: 12 }, () => 0);
    paidBills.forEach((b) => {
      const d = billDate(b);
      if (d.getFullYear() === year) buckets[d.getMonth()] += parseFloat(b.total_amount) || parseFloat(b.amount) || 0;
    });
    return buckets.map((v, i) => ({ label: monthLabels[i], value: v }));
  };
  const revenuePoints = buildRevenuePoints();

  // Package distribution (from subscriptions, falling back to churches)
  const distributionSource = subscriptions.length ? subscriptions : churches;
  const pkgCounts = {};
  distributionSource.forEach((x) => {
    const name = x.package_name;
    if (name) pkgCounts[name] = (pkgCounts[name] || 0) + 1;
  });
  const pkgTotal = Object.values(pkgCounts).reduce((s, x) => s + x, 0) || 1;
  const distribution = Object.entries(pkgCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({
      name,
      value: count,
      pct: Math.round((count / pkgTotal) * 100),
      color: chartPalette[i % chartPalette.length],
    }));

  // Top packages (ranked)
  const topPackages = distribution.slice(0, 5);

  // Renewals overview (from subscription end dates)
  const withEnd = subscriptions.filter((s) => s.end_date);
  const dayDiff = (d) => (new Date(d) - now) / (1000 * 60 * 60 * 24);
  const renewals = {
    upcoming: withEnd.filter((s) => dayDiff(s.end_date) > 7).length,
    dueThisWeek: withEnd.filter((s) => dayDiff(s.end_date) >= 0 && dayDiff(s.end_date) <= 7).length,
    overdue: withEnd.filter((s) => dayDiff(s.end_date) < 0).length,
  };
  const renewalsMax = Math.max(renewals.upcoming, renewals.dueThisWeek, renewals.overdue, 1);

  // Recent church registrations
  const recentChurches = [...churches]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 4);

  // Revenue snapshot
  const sumBetween = (fromDaysAgo) => {
    const from = new Date();
    from.setDate(from.getDate() - fromDaysAgo);
    return paidBills
      .filter((b) => billDate(b) >= from)
      .reduce((s, b) => s + (parseFloat(b.total_amount) || parseFloat(b.amount) || 0), 0);
  };
  const revToday = paidBills
    .filter((b) => {
      const d = billDate(b);
      return d.toDateString() === now.toDateString();
    })
    .reduce((s, b) => s + (parseFloat(b.total_amount) || parseFloat(b.amount) || 0), 0);
  const revWeek = sumBetween(7);

  const dailySeries = (days) => {
    const arr = Array.from({ length: days }, () => 0);
    paidBills.forEach((b) => {
      const diff = Math.floor((now - billDate(b)) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < days) arr[days - 1 - diff] += parseFloat(b.total_amount) || parseFloat(b.amount) || 0;
    });
    return arr;
  };

  // Recent activities (synthesised from real events)
  const activities = [];
  paidBills
    .slice()
    .sort((a, b) => billDate(b) - billDate(a))
    .slice(0, 4)
    .forEach((b) =>
      activities.push({
        icon: LuIndianRupee,
        color: "#2f855a",
        title: "Payment received",
        subtitle: `${smartINR(b.total_amount || b.amount)} received from ${b.church_name || "a church"}`,
        ts: billDate(b),
      })
    );
  [...churches]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 3)
    .forEach((c) =>
      activities.push({
        icon: LuChurch,
        color: primaryMaroon,
        title: "New church registered",
        subtitle: `${c.name} registered`,
        ts: new Date(c.created_at || 0),
      })
    );
  const recentActivities = activities
    .filter((a) => a.ts && !isNaN(a.ts))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);

  // Support overview
  const ticketCount = (st) => tickets.filter((t) => (t.status || "").toUpperCase() === st).length;
  const support = {
    open: ticketCount("OPEN"),
    inProgress: ticketCount("IN_PROGRESS") + ticketCount("IN PROGRESS"),
    resolved: ticketCount("RESOLVED") + ticketCount("CLOSED"),
  };
  // Average response time — only if tickets expose a numeric field
  const respMinutes = tickets
    .map((t) => t.response_time_minutes ?? t.avg_response_minutes)
    .filter((v) => typeof v === "number");
  let avgResponse = "—";
  if (respMinutes.length) {
    const m = Math.round(respMinutes.reduce((s, x) => s + x, 0) / respMinutes.length);
    avgResponse = m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" color={primaryMaroon} />
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  const selectStyle = {
    padding: "0 34px 0 40px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: "14px",
    height: "42px",
    outline: "none",
    minWidth: "170px",
    cursor: "pointer",
    color: "#4a5568",
    fontWeight: "500",
    appearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
  };

  const Toggle = ({ value, options, onChange }) => (
    <HStack spacing={0} bg="gray.100" borderRadius="lg" p="3px">
      {options.map((opt) => (
        <Box
          as="button"
          key={opt.value}
          px={3}
          py={1}
          borderRadius="md"
          fontSize="13px"
          fontWeight="600"
          bg={value === opt.value ? "white" : "transparent"}
          color={value === opt.value ? primaryMaroon : "gray.500"}
          boxShadow={value === opt.value ? "sm" : "none"}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Box>
      ))}
    </HStack>
  );

  const RenewalRow = ({ label, value, color }) => (
    <Box>
      <Flex justify="space-between" align="center" mb={1.5}>
        <Text fontSize="sm" color="gray.600">
          {label}
        </Text>
        <Text fontSize="lg" fontWeight="800" color="#1a1a2e">
          {value}
        </Text>
      </Flex>
      <Box h="7px" bg="gray.100" borderRadius="full" overflow="hidden">
        <Box h="full" bg={color} borderRadius="full" w={`${(value / renewalsMax) * 100}%`} />
      </Box>
    </Box>
  );

  const SupportStat = ({ icon, value, label, color }) => (
    <VStack spacing={1} flex="1">
      <Circle size="42px" bg={`${color}14`} color={color}>
        <Icon as={icon} boxSize={5} />
      </Circle>
      <Heading fontSize="2xl" fontWeight="800" color="#1a1a2e">
        {value}
      </Heading>
      <Text fontSize="xs" color="gray.500" textAlign="center">
        {label}
      </Text>
      <Box w="24px" h="2px" borderRadius="full" bg={color} />
    </VStack>
  );

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={6}>
        {/* Header */}
        <Flex justify="space-between" align="start" mb={6} flexWrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" fontWeight="700" color={primaryMaroon} textTransform="uppercase" letterSpacing="0.08em">
              Overview
            </Text>
            <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
              Admin Dashboard
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Monitor churches, subscriptions, revenue and support operations.
            </Text>
          </VStack>

          <Box position="relative">
            <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.500" zIndex={1} pointerEvents="none">
              <LuCalendar size={16} />
            </Box>
            <Box
              as="select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={selectStyle}
              onFocus={(e) => (e.target.style.borderColor = primaryMaroon)}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            >
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="all">All Time</option>
            </Box>
          </Box>
        </Flex>

        {/* Top stat cards */}
        <Grid
          templateColumns={{
            base: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
            "2xl": "repeat(7, 1fr)",
          }}
          gap={4}
          mb={6}
        >
          <StatCard icon={LuChurch} label="Total Churches" value={totalChurches} color="#ae2050" />
          <StatCard icon={LuUsers} label="Active Churches" value={activeChurches} color="#ae2050" delta={activeChurchesDelta} />
          <StatCard icon={LuBox} label="Active Packages" value={activePackages} color="#ae2050" />
          <StatCard icon={LuIndianRupee} label="Monthly Revenue" value={smartINR(revThisMonth)} color="#ae2050" delta={monthlyRevenueDelta} />
          <StatCard icon={LuTrendingUp} label="Yearly Revenue" value={smartINR(revThisYear)} color="#ae2050" />
          <StatCard icon={LuClock} label="Pending Requests" value={pendingRequests} color="#ed8936" />
          <StatCard icon={LuTicket} label="Open Tickets" value={openTickets} color="#e53e3e" />
        </Grid>

        {/* Row 1 */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", "2xl": "1.4fr 1fr 1fr 1.2fr" }} gap={5} mb={5}>
          {/* Revenue Overview */}
          <GridItem>
            <Card h="full">
              <Flex justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
                <Heading fontSize="md" fontWeight="700" color="#1a1a2e">
                  Revenue Overview
                </Heading>
                <Toggle
                  value={revenueMode}
                  onChange={setRevenueMode}
                  options={[
                    { value: "monthly", label: "Monthly" },
                    { value: "yearly", label: "Yearly" },
                  ]}
                />
              </Flex>
              <LineChart points={revenuePoints} />
            </Card>
          </GridItem>

          {/* Package Distribution */}
          <GridItem>
            <Card h="full">
              <Heading fontSize="md" fontWeight="700" color="#1a1a2e" mb={3}>
                Package Distribution
              </Heading>
              {distribution.length === 0 ? (
                <Text fontSize="sm" color="gray.400">
                  No subscription data yet.
                </Text>
              ) : (
                <Flex align="center" gap={3} flexWrap="wrap">
                  <DonutChart segments={distribution} />
                  <VStack align="stretch" spacing={2} flex="1" minW="120px">
                    {distribution.map((d) => (
                      <Flex key={d.name} justify="space-between" align="center">
                        <HStack spacing={2}>
                          <Box w="10px" h="10px" borderRadius="full" bg={d.color} />
                          <Text fontSize="13px" color="gray.700">
                            {d.name}
                          </Text>
                        </HStack>
                        <Text fontSize="13px" fontWeight="700" color="#1a1a2e">
                          {d.pct}%
                        </Text>
                      </Flex>
                    ))}
                  </VStack>
                </Flex>
              )}
            </Card>
          </GridItem>

          {/* Renewals Overview */}
          <GridItem>
            <Card h="full">
              <Heading fontSize="md" fontWeight="700" color="#1a1a2e" mb={4}>
                Renewals Overview
              </Heading>
              <VStack align="stretch" spacing={4}>
                <RenewalRow label="Upcoming" value={renewals.upcoming} color={primaryMaroon} />
                <RenewalRow label="Due This Week" value={renewals.dueThisWeek} color="#d69e2e" />
                <RenewalRow label="Overdue" value={renewals.overdue} color="#e53e3e" />
              </VStack>
            </Card>
          </GridItem>

          {/* Recent Church Registrations */}
          <GridItem>
            <Card h="full">
              <Heading fontSize="md" fontWeight="700" color="#1a1a2e" mb={3}>
                Recent Church Registrations
              </Heading>
              {recentChurches.length === 0 ? (
                <Text fontSize="sm" color="gray.400">
                  No churches yet.
                </Text>
              ) : (
                <VStack align="stretch" spacing={0}>
                  <Flex fontSize="10px" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="0.5px" pb={2} borderBottom="1px solid" borderColor="gray.100">
                    <Text flex="2">Church</Text>
                    <Text flex="1.4">Location</Text>
                    <Text flex="1.2">Package</Text>
                    <Text flex="1" textAlign="right">Status</Text>
                  </Flex>
                  {recentChurches.map((c) => (
                    <Flex key={c.id} align="center" py={2.5} borderBottom="1px solid" borderColor="gray.50" fontSize="12px">
                      <HStack flex="2" spacing={2} minW={0}>
                        <Circle size="26px" bg="rgba(174,32,80,0.08)" color={primaryMaroon} flexShrink={0}>
                          <Icon as={LuChurch} boxSize={3} />
                        </Circle>
                        <Text fontWeight="600" color="#333" noOfLines={1}>
                          {c.name}
                        </Text>
                      </HStack>
                      <Text flex="1.4" color="gray.500" noOfLines={1}>
                        {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                      </Text>
                      <Text flex="1.2" color="gray.500" noOfLines={1}>
                        {c.package_name || "—"}
                      </Text>
                      <Box flex="1" textAlign="right">
                        {statusPill(c.is_active)}
                      </Box>
                    </Flex>
                  ))}
                </VStack>
              )}
            </Card>
          </GridItem>
        </Grid>

        {/* Row 2 */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", "2xl": "repeat(4, 1fr)" }} gap={5}>
          {/* Top Packages */}
          <GridItem>
            <Card h="full">
              <Heading fontSize="md" fontWeight="700" color="#1a1a2e" mb={4}>
                Top Packages
              </Heading>
              {topPackages.length === 0 ? (
                <Text fontSize="sm" color="gray.400">
                  No package data.
                </Text>
              ) : (
                <VStack align="stretch" spacing={3.5}>
                  {topPackages.map((p, i) => (
                    <Box key={p.name}>
                      <Flex align="center" gap={2} mb={1.5}>
                        <Circle size="20px" bg="gray.100" color="gray.500" fontSize="10px" fontWeight="700">
                          {i + 1}
                        </Circle>
                        <Text fontSize="13px" fontWeight="600" color="#333" flex="1" noOfLines={1}>
                          {p.name}
                        </Text>
                        <Text fontSize="13px" fontWeight="700" color="#1a1a2e">
                          {p.pct}%
                        </Text>
                      </Flex>
                      <Box h="6px" bg="gray.100" borderRadius="full" overflow="hidden" ml="28px">
                        <Box h="full" bg={p.color} borderRadius="full" w={`${p.pct}%`} />
                      </Box>
                    </Box>
                  ))}
                </VStack>
              )}
            </Card>
          </GridItem>

          {/* Revenue Snapshot */}
          <GridItem>
            <Card h="full">
              <Heading fontSize="md" fontWeight="700" color="#1a1a2e" mb={4}>
                Revenue Snapshot
              </Heading>
              <VStack align="stretch" spacing={4}>
                {[
                  { label: "Today", value: revToday, series: dailySeries(7), color: primaryMaroon },
                  { label: "This Week", value: revWeek, series: dailySeries(7), color: primaryMaroon },
                  { label: "This Month", value: revThisMonth, series: dailySeries(30), color: primaryMaroon },
                ].map((row) => (
                  <Flex key={row.label} align="center" gap={3}>
                    <Circle size="34px" bg="rgba(174,32,80,0.08)" color={primaryMaroon} flexShrink={0}>
                      <Icon as={LuCalendar} boxSize={4} />
                    </Circle>
                    <Text fontSize="13px" color="gray.600" flex="1">
                      {row.label}
                    </Text>
                    <Sparkline values={row.series} color={row.color} />
                    <Text fontSize="14px" fontWeight="800" color="#1a1a2e" minW="72px" textAlign="right">
                      {smartINR(row.value)}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            </Card>
          </GridItem>

          {/* Recent Activities */}
          <GridItem>
            <Card h="full">
              <Heading fontSize="md" fontWeight="700" color="#1a1a2e" mb={4}>
                Recent Activities
              </Heading>
              {recentActivities.length === 0 ? (
                <Text fontSize="sm" color="gray.400">
                  No recent activity.
                </Text>
              ) : (
                <VStack align="stretch" spacing={3.5}>
                  {recentActivities.map((a, i) => (
                    <HStack key={i} align="start" spacing={3}>
                      <Circle size="30px" bg={`${a.color}14`} color={a.color} flexShrink={0} mt={0.5}>
                        <Icon as={a.icon} boxSize={3.5} />
                      </Circle>
                      <Box flex="1" minW={0}>
                        <Text fontSize="13px" fontWeight="600" color="#333">
                          {a.title}
                        </Text>
                        <Text fontSize="11px" color="gray.500" noOfLines={1}>
                          {a.subtitle}
                        </Text>
                      </Box>
                      <Text fontSize="10px" color="gray.400" flexShrink={0}>
                        {timeAgo(a.ts)}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Card>
          </GridItem>

          {/* Support Overview */}
          <GridItem>
            <Card h="full">
              <Heading fontSize="md" fontWeight="700" color="#1a1a2e" mb={4}>
                Support Overview
              </Heading>
              <Flex gap={2}>
                <SupportStat icon={LuTicket} value={support.open} label="Open" color="#e53e3e" />
                <SupportStat icon={LuClock} value={support.inProgress} label="In Progress" color="#ed8936" />
                <SupportStat icon={LuCircleCheck} value={support.resolved} label="Resolved" color="#38a169" />
                <SupportStat icon={LuTimer} value={avgResponse} label="Avg Response" color="#6b46c1" />
              </Flex>
            </Card>
          </GridItem>
        </Grid>
      </Container>
    </AdminLayout>
  );
};

export default AdminDashboard;