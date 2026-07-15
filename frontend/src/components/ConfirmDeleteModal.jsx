import React from "react";
import {
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogPositioner,
  DialogCloseTrigger,
  Button,
  Text,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { LuTriangleAlert, LuTrash2, LuX } from "react-icons/lu";

const primaryMaroon = "var(--primary-maroon)";

const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  entityName = "Record",
}) => {
  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="center"
      size="sm"
    >
      <DialogBackdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <DialogPositioner alignItems="center" >
        <DialogContent borderRadius="14px" overflow="hidden" boxShadow="2xl"  maxWidth="400px">
          {/* Maroon header — matches GenericFormModal */}
          <DialogHeader
            bg={primaryMaroon}
            color="white"
            fontSize="sm"
            py={3}
            px={5}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            position="relative"
            borderBottom="1px solid rgba(255,255,255,0.1)"
          >
            <Text fontWeight="600" letterSpacing="0.5px" fontSize="sm">
              DELETE {entityName.toUpperCase()}
            </Text>
            <DialogCloseTrigger
              position="absolute"
              right={3}
              top="50%"
              transform="translateY(-50%)"
              color="white"
              bg="whiteAlpha.200"
              borderRadius="full"
              _hover={{ bg: "whiteAlpha.400" }}
              p={1}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={LuX} fontSize="14px" />
            </DialogCloseTrigger>
          </DialogHeader>

          {/* Warning icon */}
          <Flex justify="center" align="center" pt={5} pb={2} bg="white">
            <Flex
              w="40px"
              h="40px"
              borderRadius="full"
              bg="red.50"
              align="center"
              justify="center"
            >
              <Icon as={LuTriangleAlert} fontSize="24px" color="red.500" />
            </Flex>
          </Flex>

          <DialogBody bg="white" textAlign="center" px={6} pb={4} pt={2}>
            <Text color="gray.700" fontSize="lg" fontWeight="600" mb={1}>
              Are you sure?
            </Text>
            <Text color="gray.400" fontSize="sm">
              This action cannot be undone. The {entityName.toLowerCase()}{" "}
              record will be permanently removed.
            </Text>
          </DialogBody>

          <DialogFooter
            bg="white"
            px={6}
            pb={5}
            pt={0}
            display="flex"
            gap={2}
            justifyContent="flex-end"
          >
            <Button
              variant="outline"
              borderRadius="lg"
              h="30px"
              px={4}
              fontSize="xs"
              fontWeight="600"
              borderColor="gray.200"
              color="gray.600"
              _hover={{ bg: "gray.50" }}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              borderRadius="lg"
              h="30px"
              px={4}
              fontSize="xs"
              fontWeight="700"
              bg={primaryMaroon}
              color="white"
              _hover={{
                bg: "#6b0f1a",
                transform: "translateY(-1px)",
                boxShadow: "md",
              }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s"
              loading={isLoading}
              onClick={onConfirm}
              display="flex"
              alignItems="center"
              gap={1.5}
            >
              <Icon as={LuTrash2} boxSize={4} />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default ConfirmDeleteModal;
