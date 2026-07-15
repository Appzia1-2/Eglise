import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  HStack,
  Image,
  Text,
  Icon,
  SimpleGrid,
  VStack,
  Heading,
} from "@chakra-ui/react";
import { LuChevronDown, LuMenu } from "react-icons/lu";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import EgliseLogo from "../assets/logo.png";
import authService from "../auth/authService";
import UserDropdown from "./UserDropdown";

// ─── Route map: item label → path (only items with a real page) ───────────────
const ROUTE_MAP = {
  "Church Info": "/church-info",
  Family: "/family",
  Ward: "/ward",
  Grade: "/grade",
  Relationship: "/relationship",
  "Member Info": "/members",
  "Baptism Register": "/baptism",
  "Marriage Register": "/marriage",
  "Pre-Announcement": "/pre-announcement",
  "Tomb Type": "/tomb-type",
  "Tomb Fees": "/tomb-fees",
  Designation: "/designation",
  "Priest Master": "/priest-master",
  "Priest Change": "/priest-change",
  "Death Register": "/death-register",
  Events: "/events",
  Diocese: "/dioceses",
  "Member Offers": "/offerings",
  "Visitor Management": "/visitors",
  Subscriptions: "/subscriptions",
  "Ledger Group": "/account-groups",
  "Account Ledger": "/account-ledgers",
  Payments: "/payments",
  "Qurbana Receipts": "/qurbana-receipts",
  Committee: "/committees",
  "Committee Members": "/committee-members",
  "List of Committee": "/committee-list-report",
};

// ─── Menu data ────────────────────────────────────────────────────────────────
const MENU_DATA = {
  Masters: [
    {
      title: "Church Configuration",
      items: ["Church Info", "Priest Master", "Diocese"],
    },
    {
      title: "Members",
      items: ["Family", "Relationship", "Ward", "Grade"],
    },
    {
      title: "Miscellaneous",
      items: [
        "Member Offers",
        "Tomb Type",
        "Designation",
        "Subscriptions",
        "Tomb Fees",
        "Events",
      ],
    },
    {
      title: "Accounts",
      items: ["Account Ledger", "Ledger Group"],
      subSections: [
        {
          title: "Sunday School",
          items: ["Class", "Division", "Set Academic Year"],
        },
      ],
    },
    {
      title: "Users & Roles",
      items: ["Users", "User Roles", "User Permissions"],
    },
  ],
  Activities: [
    {
      title: "Members",
      items: [
        "Member Info",
        "Baptism Register",
        "Marriage Register",
        "Pre-Announcement",
        "Death Register",
      ],
    },
    {
      title: "Accounts",
      items: ["Receipts", "Payments", "Qurbana Receipts"],
    },
    {
      title: "Miscellaneous",
      items: ["Priest Change", "Visitor Management", "Committee"],
    },
    {
      title: "Sunday School",
      items: ["Student Activity", "Student Attendance", "Student Registration"],
    },
  ],
  Reports: [
    {
      title: "Members",
      items: ["Member List", "Age Wise List", "Phone Directory"],
      subSections: [
        {
          title: "Registers",
          items: [
            "Baptism Register",
            "Marriage Register",
            "Pre-Announcement",
            "Death Register",
          ],
        },
      ],
    },
    {
      title: "Accounts",
      items: [
        "Day Book",
        "Cash Book",
        "Bank Book",
        "General Ledger",
        "Member Ledger",
        "Income Expenditure",
        "Subscription Due List",
        "Donations Register",
        "Subscription Receipts",
      ],
    },
    {
      title: "Committee",
      items: ["List of Committee", "Committee Members"],
    },
    {
      title: "Sunday School",
      items: ["Student Activity", "Student List", "Student Attendance"],
    },
  ],
};

// ─── A single menu link ────────────────────────────────────────────────────────
const MenuLink = ({ label, onClose, primaryMaroon }) => {
  const route = ROUTE_MAP[label];
  const sharedStyle = {
    fontSize: "sm",
    color: "gray.700",
    cursor: "pointer",
    display: "block",
    py: "1px",
    _hover: { color: primaryMaroon, textDecoration: "underline" },
  };

  if (route) {
    return (
      <Box as={RouterLink} to={route} onClick={onClose} {...sharedStyle}>
        {label}
      </Box>
    );
  }
  return (
    <Box as="a" href="#" onClick={(e) => e.preventDefault()} {...sharedStyle}>
      {label}
    </Box>
  );
};

// ─── A category column ────────────────────────────────────────────────────────
const CategoryColumn = ({ section, onClose, primaryMaroon }) => (
  <VStack align="start" spacing={1.5}>
    <Heading
      as="h4"
      fontSize="xs"
      fontWeight="700"
      color={primaryMaroon}
      textTransform="uppercase"
      letterSpacing="wider"
      mb={1}
    >
      {section.title}
    </Heading>
    {section.items.map((item) => (
      <MenuLink
        key={item}
        label={item}
        onClose={onClose}
        primaryMaroon={primaryMaroon}
      />
    ))}
    {section.subSections?.map((sub) => (
      <VStack key={sub.title} align="start" spacing={1} pt={2} w="full">
        <Heading
          as="h5"
          fontSize="xs"
          fontWeight="700"
          color={primaryMaroon}
          textTransform="uppercase"
          letterSpacing="wider"
          mb={1}
        >
          {sub.title}
        </Heading>
        {sub.items.map((item) => (
          <MenuLink
            key={item}
            label={item}
            onClose={onClose}
            primaryMaroon={primaryMaroon}
          />
        ))}
      </VStack>
    ))}
  </VStack>
);

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const primaryMaroon = "var(--primary-maroon)";
  const navigate = useNavigate();
  const isLoggedIn = authService.isAuthenticated();

  const [activeMenu, setActiveMenu] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navbarRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (navbarRef.current && !navbarRef.current.contains(e.target)) {
        setActiveMenu(null);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (label) =>
    setActiveMenu((prev) => (prev === label ? null : label));

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const activeSections = activeMenu
    ? MENU_DATA[activeMenu]
    : Object.values(MENU_DATA)[0];

  return (
    <Box
      ref={navbarRef}
      position="sticky"
      top={0}
      zIndex={50}
      bg="white"
      boxShadow="0 1px 0 0 rgba(0,0,0,0.08), 0 2px 8px 0 rgba(0,0,0,0.04)"
      _before={{
        content: '""',
        display: "block",
        h: "3px",
        bg: "linear-gradient(90deg, #7b0d1e 0%, #c0392b 50%, #7b0d1e 100%)",
      }}
    >
      {/* ── Main bar ─────────────────────────────────────────────────────── */}
      <Flex
        align="center"
        justify={isLoggedIn ? "space-between" : "center"}
        py={2}
        px={8}
        gap={6}
      >
        {/* Logo */}
        <Box flexShrink={0} as={RouterLink} to="/">
          <Image
            src={EgliseLogo}
            alt="Eglise Logo"
            maxH="36px"
            cursor="pointer"
          />
        </Box>

        {isLoggedIn && (
          <>
            {/* Center: Nav triggers */}
            <HStack spacing={1} display={{ base: "none", md: "flex" }}>
              {Object.keys(MENU_DATA).map((label) => {
                const isOpen = activeMenu === label;
                return (
                  <Box
                    key={label}
                    position="relative"
                    onClick={() => toggle(label)}
                    cursor="pointer"
                    userSelect="none"
                    px={4}
                    py={2}
                    borderRadius="md"
                    transition="background 0.18s"
                    bg={isOpen ? "rgba(123,13,30,0.07)" : "transparent"}
                    _hover={{ bg: "rgba(123,13,30,0.06)" }}
                    role="group"
                  >
                    <HStack spacing={1.5}>
                      <Text
                        fontWeight="600"
                        fontSize="sm"
                        color={isOpen ? "#7b0d1e" : "gray.700"}
                        transition="color 0.18s"
                        _groupHover={{ color: "#7b0d1e" }}
                        letterSpacing="0.01em"
                      >
                        {label}
                      </Text>
                      <Icon
                        as={LuChevronDown}
                        boxSize={3.5}
                        color={isOpen ? "#7b0d1e" : "gray.400"}
                        transition="transform 0.3s, color 0.18s"
                        transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
                        _groupHover={{ color: "#7b0d1e" }}
                      />
                    </HStack>

                    {/* Active underline indicator */}
                    <Box
                      position="absolute"
                      bottom="0"
                      left="50%"
                      transform={
                        isOpen
                          ? "translateX(-50%) scaleX(1)"
                          : "translateX(-50%) scaleX(0)"
                      }
                      transformOrigin="center"
                      h="2px"
                      w="60%"
                      bg="linear-gradient(90deg, #7b0d1e, #c0392b)"
                      borderRadius="full"
                      transition="transform 0.25s ease"
                    />
                  </Box>
                );
              })}
            </HStack>

            {/* Right: Hamburger + logout dropdown */}
            <Box position="relative" flexShrink={0}>
              <Flex
                align="center"
                justify="center"
                w="34px"
                h="34px"
                borderRadius="md"
                border="1px solid"
                borderColor="rgba(123,13,30,0.25)"
                cursor="pointer"
                color={primaryMaroon}
                transition="all 0.18s"
                _hover={{ bg: "rgba(123,13,30,0.07)" }}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <Icon as={LuMenu} boxSize={4} />
              </Flex>

              <UserDropdown
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                onLogout={handleLogout}
                primaryMaroon={primaryMaroon}
              />
            </Box>
          </>
        )}
      </Flex>

      {/* ── Full-width dropdown panel ─────────────────────────────────────── */}
      <Box
        position="absolute"
        top="100%"
        left={0}
        right={0}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.100"
        boxShadow="0 8px 24px rgba(0,0,0,0.08)"
        px={8}
        py={5}
        zIndex={49}
        style={{
          opacity: activeMenu ? 1 : 0,
          transform: activeMenu ? "translateY(0)" : "translateY(-10px)",
          pointerEvents: activeMenu ? "auto" : "none",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
      >
        <SimpleGrid
          columns={{ base: 2, md: activeSections.length }}
          spacing={8}
          alignItems="start"
        >
          {activeSections.map((section) => (
            <CategoryColumn
              key={section.title}
              section={section}
              onClose={() => setActiveMenu(null)}
              primaryMaroon={primaryMaroon}
            />
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
};

export default Navbar;
