import React from "react";
import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { LuUser, LuSettings, LuKey, LuLogOut } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

const DropdownItem = ({ icon, label, onClick, primaryMaroon, isLogout }) => (
  <Flex
    align="center"
    gap={3}
    px={4}
    py={2.5}
    cursor="pointer"
    color={isLogout ? primaryMaroon : "gray.700"}
    fontWeight={isLogout ? "600" : "500"}
    fontSize="sm"
    borderRadius="md"
    _hover={{ bg: isLogout ? "red.50" : "gray.50", color: primaryMaroon }}
    onClick={onClick}
    transition="all 0.15s"
  >
    <Icon as={icon} boxSize={3.5} />
    <Text>{label}</Text>
  </Flex>
);

const UserDropdown = ({ isOpen, onClose, onLogout, primaryMaroon }) => {
  const navigate = useNavigate();
  const menuItems = [
    // {
    //   icon: LuUser,
    //   label: "Profile",
    //   action: () => {
    //     console.log("Profile clicked");
    //     onClose();
    //   },
    // },
    {
      icon: LuSettings,
      label: "Settings",
      action: () => {
        navigate("/register-settings");
        onClose();
      },
    },
    {
      icon: LuKey,
      label: "Change Password",
      action: () => {
        navigate("/change-password");
        onClose();
      },
    },
  ];

  return (
    <Box
      position="absolute"
      top="calc(100% + 8px)"
      right={0}
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="12px"
      boxShadow="0 8px 24px rgba(0,0,0,0.12)"
      py={2}
      minW="180px"
      zIndex={200}
      style={{
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "translateY(0)" : "translateY(-8px)",
        pointerEvents: isOpen ? "auto" : "none",
        transition:
          "opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {menuItems.map((item, index) => (
        <DropdownItem
          key={index}
          icon={item.icon}
          label={item.label}
          onClick={item.action}
          primaryMaroon={primaryMaroon}
        />
      ))}

      <Box h="1px" bg="gray.100" my={1} mx={2} />

      <DropdownItem
        icon={LuLogOut}
        label="Logout"
        onClick={() => {
          onClose();
          onLogout();
        }}
        primaryMaroon={primaryMaroon}
        isLogout
      />
    </Box>
  );
};

export default UserDropdown;
