import React from "react";
import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const HomePage = () => {
  const primaryMaroon = "var(--primary-maroon)";

  return (
    <Box bg="white" minH="100vh" display="flex" flexDirection="column">
      <Navbar />

      <Container
        maxW="container.xl"
        flex="1"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={2} textAlign="center">
          <Heading
            size="xl"
            color={primaryMaroon}
            fontWeight="700"
            letterSpacing="tight"
          >
            Home Dashboard
          </Heading>
          <Text fontSize="sm" color="gray.400">
            Use the navigation menu above to get started.
          </Text>
        </VStack>
      </Container>

      <Footer />
    </Box>
  );
};

export default HomePage;
