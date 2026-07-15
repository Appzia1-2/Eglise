import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  VStack,
  Text,
  Image,
  Flex,
  Link,
  Icon,
  HStack,
} from "@chakra-ui/react";
import LoginInfo from "../components/LoginInfo";
import authService from "../auth/authService";
import {
  LuCircleUser,
  LuShieldCheck,
  LuScale,
  LuCircleHelp,
  LuEye,
  LuEyeOff,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { forgotPassword, resetPassword, checkEmail } from "../api/authServices";
import loginIllustration from "../assets/133748214_10221134.jpg";

const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Handle "Remember Me" on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";

    if (savedRememberMe) {
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleNext = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await checkEmail({ email });
      console.log("Email check response:", response.data);

      // Simple check: if the API returns a response that explicitly says it doesn't exist
      // or if it returns an error status in the body
      if (
        response.data &&
        (response.data.exists === false ||
          response.data.status === "error" ||
          response.data.error)
      ) {
        setError(
          response.data.error ||
            response.data.message ||
            "This email is not registered. Please check and try again.",
        );
        return;
      }

      // If the request succeeds and we have no reason to believe otherwise
      setStep(2);
    } catch (err) {
      console.error("Email check failed:", err);
      const backendError = err.response?.data;
      let errorMessage =
        "This email is not registered. Please check and try again.";

      if (backendError) {
        if (typeof backendError === "string") {
          errorMessage = backendError;
        } else if (backendError.detail) {
          errorMessage = backendError.detail;
        } else if (backendError.error) {
          errorMessage = backendError.error;
        } else if (backendError.message) {
          errorMessage = backendError.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await authService.login({ email, password });

      // Handle "Remember Me" storage
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
        localStorage.setItem("rememberMe", "false");
      }

      navigate("/");
    } catch (err) {
      console.error("Login failed full error:", err);
      const backendError = err.response?.data;
      let errorMessage = "Invalid email or password";

      if (backendError) {
        if (typeof backendError === "string") {
          errorMessage = backendError;
        } else if (backendError.detail) {
          errorMessage = backendError.detail;
        } else if (backendError.error) {
          errorMessage = backendError.error;
        } else if (backendError.non_field_errors) {
          errorMessage = Array.isArray(backendError.non_field_errors)
            ? backendError.non_field_errors[0]
            : backendError.non_field_errors;
        } else if (typeof backendError === "object") {
          // If it's a field-specific error, show the first one
          const firstField = Object.keys(backendError)[0];
          const errorValue = backendError[firstField];
          errorMessage = `${firstField}: ${Array.isArray(errorValue) ? errorValue[0] : errorValue}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email first.");
      return;
    }
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      await forgotPassword({ email });
      setMessage("OTP sent to your email.");
      setStep(4);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to send OTP. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await resetPassword({ email, otp, new_password: newPassword });
      setMessage("Password reset successfully. You can now log in.");
      setStep(2); // Go back to password entry step
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to reset password. Check your OTP.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const primaryMaroon = "var(--primary-maroon)";
  const white = "var(--white)";
  const lightGray = "var(--light-gray)";

  const stepVariants = {
    initial: (direction) => ({
      opacity: 0,
      x: direction > 0 ? 50 : -50,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (direction) => ({
      opacity: 0,
      x: direction > 0 ? -50 : 50,
    }),
  };

  return (
    <Box
      bg={white}
      h="100vh"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Main Content */}
      <Box
        flex="1"
        overflow="hidden"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Flex
          w="full"
          h="full"
          bg="white"
          overflow="hidden"
          boxShadow="2xl"
          direction={{ base: "column", md: "row" }}
        >
          <LoginInfo />

          {/* Right Side: Form */}
          <Box
            flex="1"
            p={{ base: 8, md: 12 }}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            bg="white"
          >
            <VStack align="start" gap={"24px"} w="full" maxW="400px" mx="auto">
              {/* Welcome Heading */}
              <Box w="full">
                {/* Step indicator chip */}
                <HStack gap={2} mb={3}>
                  <Box
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg={primaryMaroon}
                    opacity={0.8}
                  />
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    letterSpacing="0.12em"
                    textTransform="uppercase"
                    color="gray.400"
                  >
                    {step === 1
                      ? "Sign In · Step 1 of 2"
                      : step === 2
                        ? "Sign In · Step 2 of 2"
                        : step === 3
                          ? "Account Recovery"
                          : "Reset Password"}
                  </Text>
                </HStack>

                <Heading
                  as="h2"
                  fontSize="2xl"
                  fontWeight="800"
                  letterSpacing="-0.5px"
                  lineHeight="1.1"
                  mb={1.5}
                  style={{
                    background:
                      "linear-gradient(135deg, #7b0d1e 30%, #c0392b 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Welcome Back
                </Heading>
                <Text
                  fontSize="sm"
                  color="gray.400"
                  fontWeight="400"
                  lineHeight="1.5"
                >
                  Sign in to manage your parish records and member directory.
                </Text>

                {/* Thin maroon accent line */}
                <Box
                  mt={4}
                  h="2px"
                  w="40px"
                  borderRadius="full"
                  style={{
                    background:
                      "linear-gradient(to right, #7b0d1e, transparent)",
                  }}
                />
              </Box>

              {error && (
                <Box
                  p={3}
                  bg="red.50"
                  color="red.600"
                  borderRadius="lg"
                  w="full"
                  border="1px solid"
                  borderColor="red.200"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Text fontSize="xs" fontWeight="500">
                    {error}
                  </Text>
                </Box>
              )}

              {message && (
                <Box
                  p={3}
                  bg="green.50"
                  color="green.600"
                  borderRadius="lg"
                  w="full"
                  textAlign="center"
                  border="1px solid"
                  borderColor="green.200"
                >
                  <Text fontSize="xs" fontWeight="500">
                    {message}
                  </Text>
                </Box>
              )}

              <Box w="full" position="relative">
                <form
                  style={{ width: "100%" }}
                  onSubmit={
                    step === 1
                      ? handleNext
                      : step === 2
                        ? handleLogin
                        : step === 3
                          ? handleForgotPassword
                          : handleResetPassword
                  }
                >
                  <AnimatePresence mode="wait" custom={step}>
                    {step === 1 ? (
                      <motion.div
                        key="step1"
                        custom={1}
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <VStack gap={"14px"} align="start" w="full">
                          <Field.Root w="full">
                            <Field.Label
                              fontSize="xs"
                              fontWeight="700"
                              letterSpacing="0.06em"
                              textTransform="uppercase"
                              color="gray.500"
                              mb={1.5}
                            >
                              Email Address
                              <Text as="span" color="red.500" ml={1}>
                                *
                              </Text>
                            </Field.Label>
                            <Box position="relative" w="full">
                              <Box
                                position="absolute"
                                left={3.5}
                                top="50%"
                                transform="translateY(-50%)"
                                color="gray.400"
                                pointerEvents="none"
                                zIndex={1}
                              >
                                <Icon as={LuCircleUser} boxSize={4} />
                              </Box>
                              <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                size="lg"
                                pl={10}
                                borderRadius="xl"
                                borderColor="gray.200"
                                bg="gray.50"
                                fontSize="sm"
                                _placeholder={{ color: "gray.400" }}
                                _focus={{
                                  borderColor: primaryMaroon,
                                  bg: "white",
                                  boxShadow: `0 0 0 3px rgba(123,13,30,0.08)`,
                                }}
                                transition="all 0.2s"
                              />
                            </Box>
                          </Field.Root>

                          <Button
                            type="submit"
                            w="full"
                            color="white"
                            size="lg"
                            borderRadius="xl"
                            isLoading={isLoading}
                            fontSize="sm"
                            fontWeight="700"
                            letterSpacing="0.04em"
                            style={{
                              background:
                                "linear-gradient(135deg, #7b0d1e 0%, #a01d47 100%)",
                              boxShadow: "0 4px 14px rgba(123,13,30,0.25)",
                            }}
                            _hover={{
                              style: {
                                background:
                                  "linear-gradient(135deg, #6b0f1a 0%, #901a42 100%)",
                                boxShadow: "0 6px 20px rgba(123,13,30,0.35)",
                              },
                              transform: "translateY(-1px)",
                            }}
                            _active={{ transform: "translateY(0)" }}
                            transition="all 0.2s"
                          >
                            Continue →
                          </Button>
                        </VStack>
                      </motion.div>
                    ) : step === 2 ? (
                      <motion.div
                        key="step2"
                        custom={-1}
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <VStack gap={"18px"} align="start" w="full">
                          {/* Registered Email Display */}
                          <HStack gap={3} w="full" py={2}>
                            <Icon
                              as={LuCircleUser}
                              color={primaryMaroon}
                              boxSize={6}
                            />
                            <Text fontWeight="semibold" fontSize="md">
                              {email}
                            </Text>
                            <Button
                              variant="ghost"
                              size="xs"
                              color={primaryMaroon}
                              onClick={() => {
                                setStep(1);
                                setError("");
                                setMessage("");
                              }}
                              _hover={{
                                bg: "transparent",
                                textDecoration: "underline",
                              }}
                            >
                              Change
                            </Button>
                          </HStack>

                          <Text fontSize="sm" color="gray.600">
                            Please enter your registered password
                          </Text>

                          <Field.Root w="full">
                            <Field.Label fontWeight="bold" mb={1}>
                              Password
                              <Text as="span" color="red.500" ml={1}>
                                *
                              </Text>
                            </Field.Label>
                            <Box position="relative" width="full">
                              <Input
                                type={showPassword ? "text" : "password"}
                                width="full"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                                size="lg"
                                borderRadius="md"
                                borderColor="gray.400"
                                pr="40px"
                                style={{
                                  WebkitTextSecurity: showPassword
                                    ? "none"
                                    : "asterisk",
                                }}
                                letterSpacing={
                                  showPassword ? "normal" : "0.2em"
                                }
                                _focus={{
                                  borderColor: primaryMaroon,
                                  boxShadow: "none",
                                }}
                                autoFocus
                              />
                              <Box
                                position="absolute"
                                right="10px"
                                top="50%"
                                transform="translateY(-50%)"
                                cursor="pointer"
                                zIndex={2}
                                onClick={() => setShowPassword(!showPassword)}
                                color="gray.500"
                                _hover={{ color: primaryMaroon }}
                              >
                                <Icon
                                  as={showPassword ? LuEyeOff : LuEye}
                                  boxSize={5}
                                />
                              </Box>
                            </Box>
                          </Field.Root>

                          <Flex w="full" justify="space-between" align="center">
                            <HStack gap={2}>
                              <input
                                type="checkbox"
                                style={{ accentColor: primaryMaroon }}
                                checked={rememberMe}
                                onChange={(e) =>
                                  setRememberMe(e.target.checked)
                                }
                              />
                              <Text fontSize="sm" fontWeight="medium">
                                Remember me
                              </Text>
                            </HStack>
                            <Link
                              fontSize="sm"
                              fontWeight="semibold"
                              color={primaryMaroon}
                              onClick={() => {
                                setError("");
                                setMessage("");
                                setStep(3);
                              }}
                              _hover={{ textDecoration: "underline" }}
                            >
                              Forgot Password
                            </Link>
                          </Flex>

                          <Button
                            type="submit"
                            w="full"
                            bg={primaryMaroon}
                            color={white}
                            size="lg"
                            borderRadius="md"
                            _hover={{ bg: "#901a42" }}
                            isLoading={isLoading}
                            fontSize="lg"
                          >
                            Log in
                          </Button>

                          {/* Secondary Links */}
                          <HStack justify="center" w="full" gap="25px" pt={1}>
                            <HStack
                              gap={1}
                              color="gray.600"
                              cursor="pointer"
                              _hover={{ color: primaryMaroon }}
                            >
                              <Icon as={LuShieldCheck} boxSize={3} />
                              <Text fontSize="xs" fontWeight="medium">
                                Privacy
                              </Text>
                            </HStack>
                            <HStack
                              gap={1}
                              color="gray.600"
                              cursor="pointer"
                              _hover={{ color: primaryMaroon }}
                            >
                              <Icon as={LuScale} boxSize={3} />
                              <Text fontSize="xs" fontWeight="medium">
                                Terms
                              </Text>
                            </HStack>
                            <HStack
                              gap={1}
                              color="gray.600"
                              cursor="pointer"
                              _hover={{ color: primaryMaroon }}
                            >
                              <Icon as={LuCircleHelp} boxSize={3} />
                              <Text fontSize="xs" fontWeight="medium">
                                FAQ
                              </Text>
                            </HStack>
                          </HStack>
                        </VStack>
                      </motion.div>
                    ) : step === 3 ? (
                      <motion.div
                        key="step3"
                        custom={1}
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <VStack spacing={6} align="start" w="full">
                          <Heading as="h3" size="md">
                            Forgot Password
                          </Heading>
                          <Text fontSize="sm" color="gray.600">
                            Enter your email address and we'll send you an OTP
                            to reset your password.
                          </Text>
                          <Field.Root w="full">
                            <Field.Label fontWeight="medium" mb={2}>
                              Email Address
                            </Field.Label>
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              required
                              size="lg"
                              borderRadius="md"
                              borderColor="gray.400"
                              _focus={{
                                borderColor: primaryMaroon,
                                boxShadow: "none",
                              }}
                            />
                          </Field.Root>

                          <Button
                            type="submit"
                            w="full"
                            bg={primaryMaroon}
                            color={white}
                            size="lg"
                            borderRadius="md"
                            _hover={{ bg: "#901a42" }}
                            isLoading={isLoading}
                          >
                            Send OTP
                          </Button>

                          <Button
                            variant="ghost"
                            w="full"
                            onClick={() => {
                              setStep(1);
                              setError("");
                              setMessage("");
                            }}
                          >
                            Back to Login
                          </Button>
                        </VStack>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="step4"
                        custom={1}
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <VStack gap={2} align="start" w="full">
                          <Heading as="h3" size="md">
                            Reset Password
                          </Heading>
                          <Text fontSize="xs" color="gray.500">
                            Resetting password for: <b>{email}</b>
                          </Text>

                          <Field.Root w="full">
                            <Field.Label fontWeight="bold">
                              OTP
                              <Text as="span" color="red.500" ml={1}>
                                *
                              </Text>
                            </Field.Label>
                            <Input
                              type="text"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="Enter 6-digit OTP"
                              required
                              size="md"
                              borderRadius="md"
                              borderColor="gray.400"
                            />
                          </Field.Root>

                          <Field.Root w="full">
                            <Field.Label fontWeight="bold">
                              New Password
                              <Text as="span" color="red.500" ml={1}>
                                *
                              </Text>
                            </Field.Label>
                            <Box position="relative">
                              <Input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New Password"
                                required
                                size="md"
                                borderRadius="md"
                                borderColor="gray.400"
                                pr="35px"
                                letterSpacing={
                                  showNewPassword ? "normal" : "0.5em"
                                }
                                style={{
                                  WebkitTextSecurity: showNewPassword
                                    ? "none"
                                    : "asterisk",
                                }}
                              />
                              <Box
                                position="absolute"
                                right="8px"
                                top="50%"
                                transform="translateY(-50%)"
                                cursor="pointer"
                                zIndex={2}
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                                color="gray.500"
                              >
                                <Icon
                                  as={showNewPassword ? LuEyeOff : LuEye}
                                  boxSize={4}
                                />
                              </Box>
                            </Box>
                          </Field.Root>

                          <Field.Root w="full">
                            <Field.Label fontWeight="bold">
                              Confirm Password
                              <Text as="span" color="red.500" ml={1}>
                                *
                              </Text>
                            </Field.Label>
                            <Box position="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) =>
                                  setConfirmPassword(e.target.value)
                                }
                                placeholder="Confirm Password"
                                required
                                size="md"
                                borderRadius="md"
                                borderColor="gray.400"
                                pr="35px"
                                letterSpacing={
                                  showConfirmPassword ? "normal" : "0.5em"
                                }
                                style={{
                                  WebkitTextSecurity: showConfirmPassword
                                    ? "none"
                                    : "asterisk",
                                }}
                              />
                              <Box
                                position="absolute"
                                right="8px"
                                top="50%"
                                transform="translateY(-50%)"
                                cursor="pointer"
                                zIndex={2}
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                                color="gray.500"
                              >
                                <Icon
                                  as={showConfirmPassword ? LuEyeOff : LuEye}
                                  boxSize={4}
                                />
                              </Box>
                            </Box>
                          </Field.Root>

                          <Button
                            type="submit"
                            w="full"
                            bg={primaryMaroon}
                            color={white}
                            size="lg"
                            borderRadius="md"
                            _hover={{ bg: "#901a42" }}
                            isLoading={isLoading}
                            mt={2}
                          >
                            Reset Password
                          </Button>

                          <Button
                            variant="ghost"
                            w="full"
                            onClick={() => {
                              setStep(3);
                              setError("");
                              setMessage("");
                            }}
                          >
                            Back
                          </Button>
                        </VStack>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </Box>
            </VStack>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default LoginPage;
