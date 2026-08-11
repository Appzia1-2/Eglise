// src/admin/pages/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Heading,
  Input,
  Button,
  HStack,
  VStack,
  Circle,
  Icon,
  Image,
} from "@chakra-ui/react";
import {
  LuShieldCheck,
  LuEye,
  LuEyeOff,
  LuArrowRight,
  LuLock,
  LuHeadphones,
  LuCheck,
  LuBox,
  LuIndianRupee,
  LuHeadset,
  LuSmartphone,
  LuActivity,
} from "react-icons/lu";
import adminAuthService from "../auth/authService";
import { toaster } from "../../components/ui/toaster";
import logo from "../../assets/logo.png";

const primaryMaroon = "#ae2050";
const deepMaroon = "#7d1538";

// Detailed line-drawn church for the centre of the illustration
const ChurchDrawing = ({ size = 96 }) => (
  <Box
    as="svg"
    width={`${size}px`}
    height={`${size}px`}
    viewBox="0 0 120 120"
    fill="none"
    stroke={primaryMaroon}
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* cross */}
    <line x1="60" y1="10" x2="60" y2="26" />
    <line x1="53" y1="18" x2="67" y2="18" />
    {/* roof */}
    <path d="M32 52 L60 27 L88 52" />
    {/* body */}
    <path d="M37 52 L37 98 L83 98 L83 52" />
    {/* side wings */}
    <path d="M25 98 L25 74 L37 66" />
    <path d="M95 98 L95 74 L83 66" />
    {/* arched door */}
    <path d="M53 98 L53 80 Q53 72 60 72 Q67 72 67 80 L67 98" />
    {/* windows */}
    <path d="M44 68 Q44 62 47 62 Q50 62 50 68 L50 76 L44 76 Z" />
    <path d="M70 68 Q70 62 73 62 Q76 62 76 68 L76 76 L70 76 Z" />
    {/* base */}
    <line x1="22" y1="98" x2="98" y2="98" />
  </Box>
);

// ---- brand-side orbital illustration --------------------------------------
const OrbitIllustration = () => {
  const cx = 200;
  const cy = 200;
  const satellites = [
    { icon: LuBox, x: 70, y: 125, filled: false },
    { icon: LuHeadset, x: 70, y: 275, filled: false },
    { icon: LuSmartphone, x: 200, y: 350, filled: false },
    { icon: LuActivity, x: 330, y: 275, filled: true },
    { icon: LuIndianRupee, x: 330, y: 125, filled: false, ring: true },
  ];

  return (
    <Box position="relative" w="100%" maxW="360px" style={{ aspectRatio: "1 / 1" }} mx="auto">
      <Box as="svg" viewBox="0 0 400 400" position="absolute" inset={0} width="100%" height="100%">
        <circle cx={cx} cy={cy} r="150" fill="none" stroke="#e9b9c9" strokeWidth="1" strokeDasharray="3 5" opacity="0.7" />
        <circle cx={cx} cy={cy} r="108" fill="none" stroke="#eec6d3" strokeWidth="1" strokeDasharray="3 5" opacity="0.6" />
        {/* top church building satellite (drawn in svg so it matches the outline style) */}
        <line x1={cx} y1={cy} x2="200" y2="50" stroke="#e9b9c9" strokeWidth="1.5" opacity="0.6" />
        {satellites.map((s, i) => (
          <line key={i} x1={cx} y1={cy} x2={s.x} y2={s.y} stroke="#e9b9c9" strokeWidth="1.5" opacity="0.6" />
        ))}
        {[45, 135, 225, 315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return <circle key={i} cx={cx + 150 * Math.cos(rad)} cy={cy - 150 * Math.sin(rad)} r="3.5" fill={primaryMaroon} opacity="0.5" />;
        })}
        <g stroke="#e39ab2" strokeWidth="1.5" opacity="0.7">
          <line x1="150" y1="150" x2="150" y2="160" />
          <line x1="145" y1="155" x2="155" y2="155" />
          <line x1="300" y1="235" x2="300" y2="245" />
          <line x1="295" y1="240" x2="305" y2="240" />
        </g>
        <circle cx="120" cy="255" r="26" fill="#f6d3de" opacity="0.5" />
        <circle cx="285" cy="150" r="20" fill="#f6d3de" opacity="0.4" />
      </Box>

      {/* centre church */}
      <Circle size="132px" bg="rgba(174,32,80,0.06)" position="absolute" left="50%" top="50%" transform="translate(-50%, -50%)">
        <ChurchDrawing size={96} />
      </Circle>

      {/* top church-building satellite */}
      <Circle size="60px" bg="white" border="1.5px solid" borderColor="#f0c4d2" color={primaryMaroon} boxShadow="0 8px 20px -10px rgba(174,32,80,0.4)" position="absolute" left="50%" top="12.5%" transform="translate(-50%, -50%)">
        <ChurchDrawing size={30} />
      </Circle>

      {/* the rest */}
      {satellites.map((s, i) => (
        <Circle
          key={i}
          size="56px"
          bg={s.filled ? "#f6d3de" : "white"}
          border={s.filled ? "none" : "1.5px solid"}
          borderColor="#f0c4d2"
          color={primaryMaroon}
          boxShadow={s.filled ? "none" : "0 8px 20px -10px rgba(174,32,80,0.4)"}
          position="absolute"
          left={`${(s.x / 400) * 100}%`}
          top={`${(s.y / 400) * 100}%`}
          transform="translate(-50%, -50%)"
          outline={s.ring ? "6px solid rgba(174,32,80,0.06)" : "none"}
        >
          <Icon as={s.icon} boxSize="24px" strokeWidth={1.6} />
        </Circle>
      ))}
    </Box>
  );
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toaster.create({ title: "Missing details", description: "Please enter your email/username and password.", type: "error", duration: 3500 });
      return;
    }
    setLoading(true);
    try {
      // The field accepts either a username or an email. It's sent under both
      // keys so the backend can read whichever one it expects. Trim to the
      // single key your API uses if it rejects unknown fields.
      const login = identifier.trim();
      await adminAuthService.login({ email: login, username: login, password, remember });
      toaster.create({ title: "Welcome back", description: "Signed in successfully.", type: "success", duration: 2500 });
      navigate("/admin/dashboard");
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error || err?.message || "Invalid email or password.";
      toaster.create({ title: "Sign in failed", description: msg, type: "error", duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex h="100vh" w="100vw" overflow="hidden">
      {/* Left brand panel */}
      <Flex
        display={{ base: "none", lg: "flex" }}
        w="50%"
        h="100vh"
        direction="column"
        justify="space-between"
        position="relative"
        overflow="hidden"
        px={14}
        py={10}
        style={{ background: "linear-gradient(180deg,#fdf6f9 0%,#faecf1 100%)" }}
      >
        <Box as="svg" position="absolute" bottom={0} left={0} width="100%" height="210px" viewBox="0 0 600 210" preserveAspectRatio="none" opacity="0.55" pointerEvents="none">
          <path d="M0,120 C150,60 300,175 600,85 L600,210 L0,210 Z" fill="none" stroke="#f0c4d2" strokeWidth="1.5" />
          <path d="M0,155 C180,105 320,205 600,135 L600,210 L0,210 Z" fill="none" stroke="#f4d2de" strokeWidth="1.5" />
        </Box>

        <Box position="relative" zIndex={1} flexShrink={0}>
          <Image src={logo} alt="Eglise" height="58px" width="auto" objectFit="contain" />
        </Box>

        <Flex position="relative" zIndex={1} flex="1" align="center" justify="center" minH={0} py={4}>
          <OrbitIllustration />
        </Flex>

        <Box position="relative" zIndex={1} flexShrink={0}>
          <Heading fontSize={{ lg: "38px", xl: "44px" }} fontWeight="800" color={deepMaroon} lineHeight="1.08" mb={2}>
            Parish Management System
          </Heading>
          <Text fontSize="xl" fontWeight="700" color="#7a2a44" mb={3}>
            One platform for every parish.
          </Text>
          <Box w="48px" h="3px" bg="#c9647f" borderRadius="full" mb={3} />
          <Text fontSize="md" color="#9a6070" maxW="440px" lineHeight="1.6">
            Manage dioceses, churches, subscriptions, payments and support with clarity.
          </Text>
          <Text fontSize="sm" color={primaryMaroon} fontWeight="600" mt={6}>
            v2.0.0
          </Text>
        </Box>
      </Flex>

      {/* Right form panel */}
      <Flex
        w={{ base: "100%", lg: "50%" }}
        h="100vh"
        direction="column"
        align="center"
        justify="center"
        position="relative"
        px={{ base: 5, md: 10 }}
        py={6}
        bg="#fdfafb"
      >
        <Box
          as="form"
          onSubmit={handleSubmit}
          w="full"
          maxW="440px"
          bg="white"
          borderRadius="3xl"
          border="1px solid"
          borderColor="gray.100"
          boxShadow="0 24px 60px -28px rgba(174,32,80,0.28)"
          px={{ base: 6, md: 10 }}
          py={9}
        >
          <VStack spacing={1} mb={7}>
            <Icon as={LuShieldCheck} boxSize="48px" color={primaryMaroon} mb={2} strokeWidth={1.7} />
            <Heading fontSize="30px" fontWeight="800" color="#1a1a2e">
              Welcome back
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Sign in to the Super Admin Portal
            </Text>
          </VStack>

          <Box mb={4}>
            <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
              Email or username
            </Text>
            <Input
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@eglise.com or username"
              h="52px"
              fontSize="sm"
              borderRadius="xl"
              borderWidth="1.5px"
              borderColor="gray.200"
              _hover={{ borderColor: "gray.300" }}
              _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
            />
          </Box>

          <Box mb={4}>
            <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
              Password
            </Text>
            <Box position="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                h="52px"
                fontSize="sm"
                borderRadius="xl"
                borderWidth="1.5px"
                borderColor="gray.200"
                pr="48px"
                _hover={{ borderColor: "gray.300" }}
                _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
              />
              <Box
                as="button"
                type="button"
                position="absolute"
                right="14px"
                top="50%"
                transform="translateY(-50%)"
                color="gray.400"
                _hover={{ color: primaryMaroon }}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon as={showPassword ? LuEyeOff : LuEye} boxSize={5} />
              </Box>
            </Box>
          </Box>

          <Flex justify="space-between" align="center" mb={6}>
            <HStack as="button" type="button" spacing={2} onClick={() => setRemember((r) => !r)}>
              <Flex
                w="18px"
                h="18px"
                borderRadius="5px"
                border="1.5px solid"
                borderColor={remember ? primaryMaroon : "gray.300"}
                bg={remember ? primaryMaroon : "white"}
                align="center"
                justify="center"
                transition="all 0.15s"
              >
                {remember && <Icon as={LuCheck} boxSize={3} color="white" />}
              </Flex>
              <Text fontSize="sm" color="gray.600">
                Remember me
              </Text>
            </HStack>
            <Text
              as="button"
              type="button"
              fontSize="sm"
              fontWeight="600"
              color={primaryMaroon}
              _hover={{ textDecoration: "underline" }}
              onClick={() => navigate("/admin/forgot-password")}
            >
              Forgot password?
            </Text>
          </Flex>

          <Button
            type="submit"
            w="full"
            h="54px"
            borderRadius="xl"
            color="white"
            fontSize="md"
            fontWeight="700"
            style={{ background: "linear-gradient(100deg,#c11a4c 0%,#7a1236 100%)" }}
            _hover={{ filter: "brightness(0.95)" }}
            _active={{ transform: "translateY(1px)" }}
            rightIcon={<LuArrowRight size={18} />}
            isLoading={loading}
            loadingText="Signing in..."
          >
            Sign in
          </Button>

          <HStack justify="center" spacing={2} mt={5} color="gray.500">
            <Circle size="24px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
              <Icon as={LuLock} boxSize={3} />
            </Circle>
            <Text fontSize="13px">Secure administrator access</Text>
          </HStack>
        </Box>

        <HStack
          as="button"
          type="button"
          spacing={2}
          mt={6}
          color={primaryMaroon}
          _hover={{ textDecoration: "underline" }}
          onClick={() => navigate("/admin/support")}
        >
          <Icon as={LuHeadphones} boxSize={4} />
          <Text fontSize="sm" fontWeight="600">
            Need help? Contact Support
          </Text>
        </HStack>

        <Text position="absolute" bottom={5} right={{ base: 5, md: 10 }} fontSize="xs" color="gray.400">
          Copyright © 2026 Appzia Tec Solutions. All rights reserved.
        </Text>
      </Flex>
    </Flex>
  );
};

export default AdminLogin;