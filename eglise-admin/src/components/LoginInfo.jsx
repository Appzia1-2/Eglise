import React from "react";
import {
  Box,
  Heading,
  VStack,
  Text,
  Icon,
  HStack,
  Badge,
} from "@chakra-ui/react";
import {
  LuUsers,
  LuCircleCheck,
  LuCalendarHeart,
  LuShieldCheck,
  LuStar,
} from "react-icons/lu";
import { motion } from "framer-motion";

const features = [
  {
    icon: LuUsers,
    title: "Member Directory",
    desc: "Detailed records for families and individuals.",
  },
  {
    icon: LuCircleCheck,
    title: "Registry Management",
    desc: "Digital registers for Baptism, Marriage, and more.",
  },
  {
    icon: LuCalendarHeart,
    title: "Parish Activities",
    desc: "Track events, meetings, and church calendar.",
  },
];

const FloatingOrb = ({ size, top, left, opacity, delay }) => (
  <motion.div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
      top,
      left,
      opacity,
      pointerEvents: "none",
    }}
    animate={{
      y: [0, -20, 0],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  />
);

const LoginInfo = () => {
  return (
    <Box
      flex={{ base: "none", md: "1.2" }}
      position="relative"
      overflow="hidden"
      display={{ base: "none", md: "flex" }}
      flexDirection="column"
      justifyContent="center"
      p={{ base: 8, md: 12 }}
      style={{
        background:
          "linear-gradient(145deg, #2d0516 0%, #6b1434 45%, #a01d47 100%)",
      }}
    >
      {/* Decorative background elements */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        pointerEvents="none"
        zIndex={0}
        _after={{
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.07) 0%, transparent 50%)",
        }}
      />
      <FloatingOrb
        size="300px"
        top="-80px"
        left="-80px"
        opacity={0.4}
        delay={0}
      />
      <FloatingOrb
        size="200px"
        top="60%"
        left="60%"
        opacity={0.25}
        delay={1.5}
      />
      <FloatingOrb
        size="150px"
        top="30%"
        left="-40px"
        opacity={0.2}
        delay={3}
      />

      {/* Decorative grid lines */}
      <Box
        position="absolute"
        inset={0}
        zIndex={0}
        pointerEvents="none"
        opacity={0.04}
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <VStack
        align="start"
        gap={8}
        position="relative"
        zIndex={1}
        color="white"
      >
        {/* Logo & Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <HStack marginLeft={-3} mb={1}>
            <img
              src="src/assets/logo.png"
              alt="Eglise Logo"
              style={{
                height: "50px",
                objectFit: "contain",
                filter: "brightness(0) invert(1)",
              }}
            />
          </HStack>
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{ width: "100%" }}
        >
          <Box
            borderLeft="4px solid"
            borderColor="whiteAlpha.400"
            pl={4}
            mb={4}
          >
            <Heading
              as="h2"
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="800"
              lineHeight="1.15"
              letterSpacing="-0.5px"
              color="white"
            >
              The smarter way to manage your{" "}
              <Text
                as="span"
                style={{
                  background: "linear-gradient(to right, #ffd6e7, #ffb3cc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Parish
              </Text>
            </Heading>
          </Box>
          <Text
            fontSize="sm"
            color="whiteAlpha.700"
            maxW="380px"
            lineHeight="1.7"
          >
            Streamline church operations, manage member registries, and track
            activities — all in one secure digital platform.
          </Text>
        </motion.div>

        {/* Feature list */}
        <VStack align="start" gap={3} w="full">
          {features.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + idx * 0.12 }}
              whileHover={{ x: 4 }}
              style={{ width: "100%" }}
            >
              <HStack
                gap={4}
                p={3}
                borderRadius="xl"
                align="center"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(6px)",
                  transition: "all 0.2s",
                }}
                _hover={{
                  background: "rgba(255,255,255,0.12)",
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <Box
                  p={2}
                  borderRadius="lg"
                  flexShrink={0}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <Icon as={item.icon} boxSize={4} color="white" />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontWeight="700" fontSize="sm" color="white">
                    {item.title}
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.600" lineHeight="1.5">
                    {item.desc}
                  </Text>
                </VStack>
              </HStack>
            </motion.div>
          ))}
        </VStack>

        {/* Footer badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <HStack
            gap={2}
            px={3}
            py={2}
            borderRadius="full"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Icon as={LuShieldCheck} boxSize={3.5} color="whiteAlpha.700" />
            <Text
              fontSize="xs"
              fontWeight="600"
              color="whiteAlpha.700"
              letterSpacing="0.05em"
            >
              SECURE CLOUD INFRASTRUCTURE
            </Text>
          </HStack>
        </motion.div>
      </VStack>
    </Box>
  );
};

export default LoginInfo;
