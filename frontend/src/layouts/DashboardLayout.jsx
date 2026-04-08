import { Outlet, Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Flex,
  VStack,
  Heading,
  Link as ChakraLink,
  Divider,
} from "@chakra-ui/react";

function DashboardLayout() {
  const location = useLocation();

  const navItems = [
    { to: "/evaluate", label: "📋 Evaluate Trainee" },
    { to: "/archive", label: "📊 Trainees" },
    { to: "/admin", label: "⚙️ Manage Positions" },
  ];

  return (
    <Flex minH="100vh" bg="gray.50">
      <Box
        as="aside"
        w={{ base: "100%", md: "260px" }}
        bg="white"
        borderRight="1px"
        borderColor="gray.200"
        boxShadow="sm"
        py="6"
      >
        <Box px="6" mb="6">
          <Heading size="md">TrainerHub</Heading>
        </Box>

        <VStack as="nav" align="stretch" spacing="2" px="4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <ChakraLink
                as={RouterLink}
                to={item.to}
                key={item.to}
                px="4"
                py="3"
                rounded="lg"
                fontWeight="medium"
                bg={isActive ? "blue.50" : "transparent"}
                color={isActive ? "blue.700" : "gray.700"}
                border={isActive ? "1px solid" : "1px solid transparent"}
                borderColor={isActive ? "blue.200" : "transparent"}
                _hover={{ bg: "blue.50", textDecoration: "none" }}
              >
                {item.label}
              </ChakraLink>
            );
          })}
        </VStack>

        <Divider my="6" />
      </Box>

      <Box as="main" flex="1" p={{ base: 4, md: 8 }}>
        <Outlet />
      </Box>
    </Flex>
  );
}

export default DashboardLayout; // <--- This makes it visible to App.jsx