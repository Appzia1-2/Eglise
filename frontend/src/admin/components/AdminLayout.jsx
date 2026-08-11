// src/components/admin/AdminLayout.jsx
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import AdminNavbar from './AdminNavbar';

const AdminLayout = ({ children }) => {
  return (
    <Flex minH="100vh" bg="gray.50" direction="column">
      <AdminNavbar />
      <Box flex="1" p={6}>
        {children}
      </Box>
    </Flex>
  );
};

export default AdminLayout;