import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Image,
  Circle,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import {
  LuLogOut,
  LuUser,
  LuLayoutDashboard,
  LuChurch,
  LuPackage,
  LuFileText,
  LuTrendingUp,
  LuChevronDown,
  LuFolderOpen,
  LuSearch,
  LuBell,
  LuSettings,
  LuCircleHelp,
  LuCreditCard,
  LuChevronRight,
  LuIndianRupee,
  LuTicket,
  LuCheckCheck,
} from "react-icons/lu";
import { useNavigate, useLocation } from "react-router-dom";
import adminAuthService from "../auth/authService";
import adminApi from "../services/adminApi";
import logo from "../../assets/logo.png";

const primaryMaroon = "#ae2050";
const READ_KEY = "eglise_admin_read_notifs";

const timeAgo = (d) => {
  if (!d) return "";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const asList = (res) => res?.data || res?.results || (Array.isArray(res) ? res : []);

const loadReadSet = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
};
const saveReadSet = (set) => {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
};

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = adminAuthService.getCurrentUser();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [readSet, setReadSet] = useState(loadReadSet);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchBoxRef = useRef(null);
  const paymentDropdownRef = useRef(null);
  const notifRef = useRef(null);
  const churchCache = useRef(null);

  const handleLogout = () => {
    adminAuthService.logout();
    navigate("/admin");
  };

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
    { path: "/admin/dioceses", label: "Dioceses", icon: LuFolderOpen },
    { path: "/admin/churches", label: "Churches", icon: LuChurch },
    { path: "/admin/packages", label: "Packages", icon: LuPackage },
    { path: "/admin/subscriptions", label: "Subscriptions", icon: LuFileText },
  ];

  const paymentItems = [
    { path: "/admin/payments", label: "Payments" },
    { path: "/admin/tax-rates", label: "Tax Rates" },
    { path: "/admin/tax-types", label: "Tax Types" },
  ];

  const isActive = (path) => location.pathname === path;
  const isPaymentActive = () => paymentItems.some((item) => location.pathname === item.path);

  // ---------------------------------------------------------------- Notifications
  const buildNotifications = useCallback(async () => {
    // 1) Prefer a real notifications endpoint if the app has one
    try {
      if (adminApi.getNotifications) {
        const res = await adminApi.getNotifications();
        const list = asList(res);
        if (list.length) {
          return list.map((n) => ({
            id: `api-${n.id}`,
            icon: LuBell,
            color: primaryMaroon,
            title: n.title || n.message || "Notification",
            subtitle: n.description || n.body || "",
            time: n.created_at,
            read: !!n.is_read,
            link: n.link || null,
          }));
        }
      }
    } catch (e) {
      /* fall through to synthesis */
    }

    // 2) Otherwise synthesise an actionable feed from real events
    const [upReq, bills, tickets, churches] = await Promise.all([
      adminApi.getUpgradeRequests ? adminApi.getUpgradeRequests().catch(() => null) : null,
      adminApi.getBills ? adminApi.getBills().catch(() => null) : null,
      adminApi.getTickets ? adminApi.getTickets().catch(() => null) : null,
      adminApi.getChurches ? adminApi.getChurches().catch(() => null) : null,
    ]);

    const items = [];

    asList(upReq)
      .filter((r) => (r.status || "PENDING").toUpperCase() === "PENDING")
      .forEach((r) =>
        items.push({
          id: `upreq-${r.id}`,
          icon: LuTrendingUp,
          color: "#6b46c1",
          title: "Upgrade request",
          subtitle: `${r.church_name || "A church"} requested ${r.package_name || "an upgrade"}`,
          time: r.created_at,
          link: "/admin/upgrade-requests",
        })
      );

    asList(bills)
      .filter((b) => {
        const s = (b.status || "").toUpperCase();
        return s !== "PAID" && s !== "CANCELLED" && s !== "CANCELED";
      })
      .slice(0, 8)
      .forEach((b) =>
        items.push({
          id: `bill-${b.id}`,
          icon: LuIndianRupee,
          color: "#ed8936",
          title: "Payment awaiting verification",
          subtitle: `${b.church_name || "A church"} \u00b7 \u20b9${Number(
            b.total_amount || b.amount || 0
          ).toLocaleString("en-IN")}`,
          time: b.created_at || b.paid_at,
          link: "/admin/payments",
        })
      );

    asList(tickets)
      .filter((t) => (t.status || "").toUpperCase() === "OPEN")
      .slice(0, 8)
      .forEach((t) =>
        items.push({
          id: `ticket-${t.id}`,
          icon: LuTicket,
          color: "#e53e3e",
          title: "New support ticket",
          subtitle: t.subject || t.title || `Ticket #${t.id}`,
          time: t.created_at,
          link: "/admin/support",
        })
      );

    asList(churches)
      .slice()
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 4)
      .forEach((c) =>
        items.push({
          id: `church-${c.id}`,
          icon: LuChurch,
          color: primaryMaroon,
          title: "New church registered",
          subtitle: c.name,
          time: c.created_at,
          link: "/admin/churches",
        })
      );

    return items
      .filter((x) => x.time)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 12);
  }, []);

  useEffect(() => {
    let mounted = true;
    buildNotifications().then((list) => {
      if (mounted) setNotifications(list);
    });
    return () => {
      mounted = false;
    };
  }, [buildNotifications]);

  const unreadCount = notifications.filter((n) => !readSet.has(n.id) && !n.read).length;

  const markAllRead = () => {
    const next = new Set(readSet);
    notifications.forEach((n) => next.add(n.id));
    setReadSet(next);
    saveReadSet(next);
    if (adminApi.markAllNotificationsRead) {
      adminApi.markAllNotificationsRead().catch(() => {});
    }
  };

  const handleNotifClick = (n) => {
    const next = new Set(readSet);
    next.add(n.id);
    setReadSet(next);
    saveReadSet(next);
    setShowNotif(false);
    if (n.link) navigate(n.link);
  };

  // ---------------------------------------------------------------- Search
  const toggleSearch = () => {
    setShowSearch((s) => !s);
    if (!showSearch) {
      setTimeout(() => searchRef.current && searchRef.current.focus(), 100);
    } else {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setSearchLoading(true);
      try {
        if (!churchCache.current && adminApi.getChurches) {
          const res = await adminApi.getChurches();
          churchCache.current = asList(res);
        }
        const list = churchCache.current || [];
        const matches = list
          .filter(
            (c) =>
              (c.name || "").toLowerCase().includes(q) ||
              (c.code || "").toLowerCase().includes(q) ||
              (c.city || "").toLowerCase().includes(q)
          )
          .slice(0, 6);
        if (!cancelled) setSearchResults(matches);
      } catch (e) {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    };
    const t = setTimeout(run, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery]);

  const openChurch = (c) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/admin/churches/view/${c.id}`, { state: { church: c } });
  };

  const submitSearch = () => {
    if (!searchQuery.trim()) return;
    setShowSearch(false);
    navigate("/admin/churches");
  };

  // ---------------------------------------------------------------- Outside click / Esc
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setShowProfileDropdown(false);
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target))
        setShowPaymentDropdown(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotif(false);
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) setShowSearch(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setShowSearch(false);
        setSearchQuery("");
        setShowPaymentDropdown(false);
        setShowNotif(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const getInitials = (name) => (!name ? "A" : name.charAt(0).toUpperCase());

  return (
    <Box
      bg="white"
      borderBottom="1px solid"
      borderColor="#e2e8f0"
      px={{ base: 5, md: 8 }}
      py={3}
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Flex justify="space-between" align="center" maxW="1500px" mx="auto">
        {/* Left: Logo */}
        <Flex align="center" gap={3} flexShrink={0}>
          <Image
            src={logo}
            alt="Eglise Logo"
            height="48px"
            width="auto"
            cursor="pointer"
            onClick={() => navigate("/admin/dashboard")}
            objectFit="contain"
          />
        </Flex>

        {/* Center: Navigation Links */}
        <Flex align="center" gap={1} flex="1" justify="center" mx={4}>
          <Flex gap={2} display={{ base: "none", lg: "flex" }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="md"
                leftIcon={<item.icon size={18} />}
                onClick={() => navigate(item.path)}
                bg={isActive(item.path) ? "#f7fafc" : "transparent"}
                color={isActive(item.path) ? primaryMaroon : "#718096"}
                _hover={{ bg: "#f7fafc", color: primaryMaroon }}
                fontWeight={isActive(item.path) ? "600" : "400"}
                borderRadius="full"
                px={4}
                py={2}
                fontSize="md"
              >
                {item.label}
              </Button>
            ))}

            {/* Payment Dropdown */}
            <Box position="relative" ref={paymentDropdownRef}>
              <Button
                variant="ghost"
                size="md"
                leftIcon={<LuCreditCard size={18} />}
                rightIcon={<LuChevronDown size={16} />}
                onClick={() => setShowPaymentDropdown((o) => !o)}
                bg={isPaymentActive() ? "#f7fafc" : "transparent"}
                color={isPaymentActive() ? primaryMaroon : "#718096"}
                _hover={{ bg: "#f7fafc", color: primaryMaroon }}
                fontWeight={isPaymentActive() ? "600" : "400"}
                borderRadius="full"
                px={4}
                py={2}
                fontSize="md"
              >
                Payment
              </Button>

              {showPaymentDropdown && (
                <Box
                  position="absolute"
                  top="100%"
                  left={0}
                  mt={2}
                  minW="200px"
                  bg="white"
                  border="1px solid"
                  borderColor="#e2e8f0"
                  borderRadius="md"
                  boxShadow="lg"
                  zIndex={100}
                  py={1}
                >
                  {paymentItems.map((item) => (
                    <Box
                      key={item.path}
                      as="button"
                      display="flex"
                      alignItems="center"
                      width="full"
                      px={4}
                      py={2.5}
                      fontSize="sm"
                      color={isActive(item.path) ? primaryMaroon : "#2d3748"}
                      bg={isActive(item.path) ? "#f7fafc" : "transparent"}
                      fontWeight={isActive(item.path) ? "600" : "400"}
                      _hover={{ bg: "#f7fafc", color: primaryMaroon }}
                      onClick={() => {
                        setShowPaymentDropdown(false);
                        navigate(item.path);
                      }}
                    >
                      {item.label}
                      {isActive(item.path) && (
                        <Box as="span" ml="auto" color={primaryMaroon}>
                          <LuChevronRight size={16} />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Upgrade Requests */}
            <Button
              variant="ghost"
              size="md"
              leftIcon={<LuTrendingUp size={18} />}
              onClick={() => navigate("/admin/upgrade-requests")}
              bg={isActive("/admin/upgrade-requests") ? "#f7fafc" : "transparent"}
              color={isActive("/admin/upgrade-requests") ? primaryMaroon : "#718096"}
              _hover={{ bg: "#f7fafc", color: primaryMaroon }}
              fontWeight={isActive("/admin/upgrade-requests") ? "600" : "400"}
              borderRadius="full"
              px={4}
              py={2}
              fontSize="md"
            >
              Upgrade Requests
            </Button>
          </Flex>
        </Flex>

        {/* Right: Search, Notification & Profile */}
        <Flex align="center" gap={3} flexShrink={0}>
          {/* Search */}
          <Box position="relative" ref={searchBoxRef}>
            <Button
              variant="ghost"
              size="md"
              aria-label="Search"
              onClick={toggleSearch}
              color={showSearch ? primaryMaroon : "#718096"}
              minW="40px"
              p={0}
              _hover={{ color: primaryMaroon }}
            >
              <LuSearch size={20} />
            </Button>

            {showSearch && (
              <Box
                position="absolute"
                right={0}
                top="100%"
                mt={2}
                width="320px"
                bg="white"
                borderRadius="lg"
                boxShadow="xl"
                border="1px solid"
                borderColor="#e2e8f0"
                p={2}
                zIndex={200}
              >
                <Box position="relative">
                  <Input
                    ref={searchRef}
                    placeholder="Search churches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                    size="sm"
                    borderRadius="full"
                    bg="#f7fafc"
                    borderColor="#e2e8f0"
                    pl="36px"
                    _focus={{
                      borderColor: primaryMaroon,
                      boxShadow: `0 0 0 1px ${primaryMaroon}`,
                      bg: "white",
                    }}
                  />
                  <Box position="absolute" left="14px" top="50%" transform="translateY(-50%)" color="#a0aec0" pointerEvents="none">
                    <LuSearch size={14} />
                  </Box>
                </Box>

                {searchQuery.trim() && (
                  <Box mt={2} maxH="300px" overflowY="auto">
                    {searchLoading ? (
                      <Flex justify="center" py={4}>
                        <Spinner size="sm" color={primaryMaroon} />
                      </Flex>
                    ) : searchResults.length === 0 ? (
                      <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>
                        No churches found
                      </Text>
                    ) : (
                      searchResults.map((c) => (
                        <Box
                          key={c.id}
                          as="button"
                          width="full"
                          textAlign="left"
                          px={2}
                          py={2}
                          borderRadius="md"
                          _hover={{ bg: "#f7fafc" }}
                          onClick={() => openChurch(c)}
                          display="flex"
                          alignItems="center"
                          gap={2}
                        >
                          <Circle size="28px" bg="rgba(174,32,80,0.08)" color={primaryMaroon} flexShrink={0}>
                            <Icon as={LuChurch} boxSize={3.5} />
                          </Circle>
                          <Box minW={0}>
                            <Text fontSize="13px" fontWeight="600" color="#333" noOfLines={1}>
                              {c.name}
                            </Text>
                            <Text fontSize="11px" color="gray.500" noOfLines={1}>
                              {[c.city, c.state].filter(Boolean).join(", ") || c.code || ""}
                            </Text>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Notifications */}
          <Box position="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="md"
              aria-label="Notifications"
              color={showNotif ? primaryMaroon : "#718096"}
              minW="40px"
              p={0}
              _hover={{ color: primaryMaroon }}
              onClick={() => setShowNotif((o) => !o)}
            >
              <LuBell size={20} />
            </Button>
            {unreadCount > 0 && (
              <Box
                position="absolute"
                top="-1px"
                right="-1px"
                minW="18px"
                h="18px"
                px="4px"
                bg="#e53e3e"
                color="white"
                borderRadius="full"
                fontSize="10px"
                fontWeight="700"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="2px solid white"
                pointerEvents="none"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Box>
            )}

            {showNotif && (
              <Box
                position="absolute"
                right={0}
                top="100%"
                mt={2}
                width="360px"
                maxW="90vw"
                bg="white"
                border="1px solid"
                borderColor="#e2e8f0"
                borderRadius="lg"
                boxShadow="xl"
                zIndex={200}
                overflow="hidden"
              >
                <Flex justify="space-between" align="center" px={4} py={3} borderBottom="1px solid" borderColor="#edf2f7">
                  <Text fontWeight="700" fontSize="sm" color="#1a1a2e">
                    Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
                  </Text>
                  {unreadCount > 0 && (
                    <Box
                      as="button"
                      display="flex"
                      alignItems="center"
                      gap={1}
                      fontSize="12px"
                      fontWeight="600"
                      color={primaryMaroon}
                      _hover={{ textDecoration: "underline" }}
                      onClick={markAllRead}
                    >
                      <LuCheckCheck size={14} />
                      Mark all read
                    </Box>
                  )}
                </Flex>

                <Box maxH="380px" overflowY="auto">
                  {notifications.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" py={10} color="gray.400" gap={2}>
                      <LuBell size={26} />
                      <Text fontSize="sm">You're all caught up</Text>
                    </Flex>
                  ) : (
                    notifications.map((n) => {
                      const isUnread = !readSet.has(n.id) && !n.read;
                      return (
                        <Box
                          key={n.id}
                          as="button"
                          width="full"
                          textAlign="left"
                          display="flex"
                          gap={3}
                          px={4}
                          py={3}
                          borderBottom="1px solid"
                          borderColor="#f7fafc"
                          bg={isUnread ? "rgba(174,32,80,0.03)" : "white"}
                          _hover={{ bg: "#f7fafc" }}
                          onClick={() => handleNotifClick(n)}
                        >
                          <Circle size="34px" bg={`${n.color}14`} color={n.color} flexShrink={0} mt={0.5}>
                            <Icon as={n.icon} boxSize={4} />
                          </Circle>
                          <Box flex="1" minW={0}>
                            <Flex align="center" gap={2}>
                              <Text fontSize="13px" fontWeight="600" color="#1a1a2e" noOfLines={1}>
                                {n.title}
                              </Text>
                              {isUnread && <Box w="7px" h="7px" borderRadius="full" bg={primaryMaroon} flexShrink={0} />}
                            </Flex>
                            <Text fontSize="12px" color="gray.500" noOfLines={2}>
                              {n.subtitle}
                            </Text>
                            <Text fontSize="10px" color="gray.400" mt={0.5}>
                              {timeAgo(n.time)}
                            </Text>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Box>
            )}
          </Box>

          {/* Profile Dropdown */}
          <Box position="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="md"
              _hover={{ bg: "#f7fafc" }}
              onClick={() => setShowProfileDropdown((o) => !o)}
              rightIcon={<LuChevronDown size={16} />}
              px={2}
            >
              <Flex align="center" gap={2.5}>
                <Box
                  width="40px"
                  height="40px"
                  borderRadius="50%"
                  bg={primaryMaroon}
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="600"
                  fontSize="16px"
                >
                  {getInitials(user?.username || "Admin")}
                </Box>
                <Text fontSize="md" fontWeight="500" color="#333" display={{ base: "none", md: "block" }}>
                  {user?.username || "Admin"}
                </Text>
              </Flex>
            </Button>

            {showProfileDropdown && (
              <Box
                position="absolute"
                right={0}
                mt={2}
                minW="220px"
                bg="white"
                border="1px solid"
                borderColor="#e2e8f0"
                borderRadius="md"
                boxShadow="lg"
                zIndex={100}
                py={1}
              >
                <Box px={4} py={3} borderBottom="1px solid" borderColor="#e2e8f0">
                  <Text fontWeight="600" fontSize="sm" color="#333">
                    {user?.username || "Admin"}
                  </Text>
                  <Text fontSize="xs" color="#718096">
                    {user?.email || "admin@example.com"}
                  </Text>
                </Box>

                <Box as="button" display="flex" alignItems="center" width="full" px={4} py={2.5} fontSize="sm" color="#2d3748" _hover={{ bg: "#f7fafc" }} onClick={() => { setShowProfileDropdown(false); navigate("/admin/profile"); }}>
                  <Box as="span" mr={3}><LuUser size={16} /></Box>
                  Profile
                </Box>
                <Box as="button" display="flex" alignItems="center" width="full" px={4} py={2.5} fontSize="sm" color="#2d3748" _hover={{ bg: "#f7fafc" }} onClick={() => { setShowProfileDropdown(false); navigate("/admin/settings"); }}>
                  <Box as="span" mr={3}><LuSettings size={16} /></Box>
                  Settings
                </Box>
                <Box as="button" display="flex" alignItems="center" width="full" px={4} py={2.5} fontSize="sm" color="#2d3748" _hover={{ bg: "#f7fafc" }} onClick={() => { setShowProfileDropdown(false); navigate("/admin/help"); }}>
                  <Box as="span" mr={3}><LuCircleHelp size={16} /></Box>
                  Help & Support
                </Box>

                <Box borderTop="1px solid" borderColor="#e2e8f0" my={1} />

                <Box as="button" display="flex" alignItems="center" width="full" px={4} py={2.5} fontSize="sm" color="#e53e3e" fontWeight="500" _hover={{ bg: "#fff5f5" }} onClick={() => { setShowProfileDropdown(false); handleLogout(); }}>
                  <Box as="span" mr={3}><LuLogOut size={16} /></Box>
                  Logout
                </Box>
              </Box>
            )}
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};

export default AdminNavbar;