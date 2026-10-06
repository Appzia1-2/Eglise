
import React, { useState } from "react";
import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  VStack,
  Text,
  Flex,
  Icon,
} from "@chakra-ui/react";
import {
  LuKey,
  LuLock,
  LuShieldCheck,
  LuX,
  LuEye,
  LuEyeOff,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { changePassword } from "../api/authServices";

const ChangePasswordPage = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 👁️ Password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const primaryMaroon = "var(--primary-maroon)";
  const white = "var(--white)";

  // 🔒 Detect if the user was forced here by the guard
  const isForced =
    localStorage.getItem("force_password_change") === "1";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      // 🔓 Clear the forced-password flag
      localStorage.removeItem("force_password_change");

      setMessage("Password changed successfully!");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirect by role
      setTimeout(() => {
        const role = localStorage.getItem("user_role");

        if (role === "CHURCH") {
          navigate("/church/dashboard", { replace: true });
        } else if (role === "USER") {
          navigate("/user/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 1500);
    } catch (err) {
      console.error("Change password failed:", err);

      const backendError = err.response?.data;

      let errorMessage =
        "Failed to change password. Please check your data.";

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
          const firstField = Object.keys(backendError)[0];
          const errorValue = backendError[firstField];

          errorMessage = `${firstField}: ${
            Array.isArray(errorValue) ? errorValue[0] : errorValue
          }`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 👁️ Reusable password input with eye button
  const PasswordInput = ({
    value,
    onChange,
    placeholder,
    showPassword,
    setShowPassword,
  }) => {
    return (
      <Box position="relative" w="full">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          size="lg"
          borderRadius="lg"
          pr="50px"
          focusRingColor={primaryMaroon}
        />

        <Button
          type="button"
          position="absolute"
          right="2px"
          top="50%"
          transform="translateY(-50%)"
          variant="ghost"
          size="sm"
          minW="42px"
          h="42px"
          color="gray.500"
          _hover={{
            color: primaryMaroon,
            bg: "transparent",
          }}
          onClick={() => setShowPassword(!showPassword)}
          aria-label={
            showPassword ? "Hide password" : "Show password"
          }
        >
          <Icon
            as={showPassword ? LuEyeOff : LuEye}
            boxSize={5}
          />
        </Button>
      </Box>
    );
  };

  return (
    <Box
      bg={white}
      minH="100vh"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Flex flex="1" align="center" justify="center">
        <Box
          maxW="450px"
          w="full"
          p={8}
          borderRadius="xl"
          boxShadow="0 10px 40px rgba(0,0,0,0.08)"
          border="1px solid"
          borderColor="gray.100"
          position="relative"
        >
          {/* Hide X button when change is forced */}
          {!isForced && (
            <Icon
              as={LuX}
              position="absolute"
              top={4}
              right={4}
              cursor="pointer"
              color="gray.400"
              _hover={{ color: primaryMaroon }}
              onClick={() => navigate("/")}
              boxSize={5}
            />
          )}

          <VStack gap={6} align="start" w="full">
            <VStack align="start" gap={1}>
              <Heading
                as="h2"
                size="lg"
                fontWeight="semibold"
              >
                {isForced
                  ? "Set Your New Password"
                  : "Change Password"}
              </Heading>

              <Text fontSize="sm" color="gray.500">
                {isForced
                  ? "Your account was created with a temporary password. Please choose a new password to continue."
                  : "Ensure your account is using a long, random password to stay secure."}
              </Text>
            </VStack>

            {/* Forced password notice */}
            {isForced && (
              <Box
                p={3}
                bg="rgba(174,32,80,0.05)"
                color={primaryMaroon}
                borderRadius="md"
                w="full"
                border="1px solid"
                borderColor="rgba(174,32,80,0.18)"
              >
                <Flex align="center" gap={2}>
                  <Icon as={LuShieldCheck} />

                  <Text
                    fontSize="sm"
                    fontWeight="600"
                  >
                    Action required — you must change your
                    password before you can use the app.
                  </Text>
                </Flex>
              </Box>
            )}

            {/* Error */}
            {error && (
              <Box
                p={3}
                bg="red.50"
                color="red.600"
                borderRadius="md"
                w="full"
                border="1px solid"
                borderColor="red.100"
              >
                <Text fontSize="sm" fontWeight="medium">
                  {error}
                </Text>
              </Box>
            )}

            {/* Success */}
            {message && (
              <Flex
                p={3}
                bg="green.50"
                color="green.700"
                borderRadius="md"
                w="full"
                border="1px solid"
                borderColor="green.100"
                align="center"
                gap={2}
              >
                <Icon as={LuShieldCheck} />

                <Text
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {message}
                </Text>
              </Flex>
            )}

            <form
              style={{ width: "100%" }}
              onSubmit={handleSubmit}
            >
              <VStack gap={5}>

                {/* Current Password */}
                <Field.Root w="full">
                  <Field.Label
                    fontWeight="600"
                    mb={1}
                    fontSize="sm"
                  >
                    Current Password

                    <Text
                      as="span"
                      color="red.500"
                      ml={1}
                    >
                      *
                    </Text>
                  </Field.Label>

                  <PasswordInput
                    value={oldPassword}
                    onChange={(e) =>
                      setOldPassword(e.target.value)
                    }
                    placeholder="Enter current password"
                    showPassword={showOldPassword}
                    setShowPassword={setShowOldPassword}
                  />
                </Field.Root>

                {/* New Password */}
                <Field.Root w="full">
                  <Field.Label
                    fontWeight="600"
                    mb={1}
                    fontSize="sm"
                  >
                    New Password

                    <Text
                      as="span"
                      color="red.500"
                      ml={1}
                    >
                      *
                    </Text>
                  </Field.Label>

                  <PasswordInput
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    placeholder="Min 6 characters"
                    showPassword={showNewPassword}
                    setShowPassword={setShowNewPassword}
                  />
                </Field.Root>

                {/* Confirm Password */}
                <Field.Root w="full">
                  <Field.Label
                    fontWeight="600"
                    mb={1}
                    fontSize="sm"
                  >
                    Confirm New Password

                    <Text
                      as="span"
                      color="red.500"
                      ml={1}
                    >
                      *
                    </Text>
                  </Field.Label>

                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Repeat new password"
                    showPassword={showConfirmPassword}
                    setShowPassword={setShowConfirmPassword}
                  />
                </Field.Root>

                {/* Submit Button */}
                <Button
                  type="submit"
                  w="full"
                  bg={primaryMaroon}
                  color={white}
                  size="lg"
                  borderRadius="lg"
                  _hover={{
                    bg: "#901a42",
                    transform: "translateY(-1px)",
                  }}
                  _active={{
                    transform: "translateY(0)",
                  }}
                  loading={isLoading}
                  fontSize="md"
                  fontWeight="600"
                  mt={2}
                  gap={2}
                >
                  <Icon
                    as={LuLock}
                    boxSize={4}
                  />

                  Update Password
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>
      </Flex>

      <Footer />
    </Box>
  );
};

export default ChangePasswordPage;
