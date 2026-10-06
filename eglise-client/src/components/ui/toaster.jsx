'use client'

import {
  Toaster as ChakraToaster,
  Portal,
  Box,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from '@chakra-ui/react'

import {
  LuCircleCheck,
  LuCircleX,
  LuTriangleAlert,
  LuInfo,
} from 'react-icons/lu'

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
  max: 4,
})

// ------------------------------------------------------------
// Visual style per toast type
// ------------------------------------------------------------
const VARIANTS = {
  success: { color: '#15803D', soft: '#F0FDF4', Icon: LuCircleCheck },
  error:   { color: '#DC2626', soft: '#FEF2F2', Icon: LuCircleX },
  warning: { color: '#D97706', soft: '#FFFBEB', Icon: LuTriangleAlert },
  info:    { color: '#2864B0', soft: '#F5F9FF', Icon: LuInfo },
  loading: { color: '#60708C', soft: '#F4F6F9', Icon: null },
}

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
        {(toast) => {
          const v = VARIANTS[toast.type] || VARIANTS.info
          const Icon = v.Icon

          return (
            <Toast.Root
              width={{ md: '380px' }}
              bg='white'
              color='#182338'
              border='1px solid #E6EAF0'
              borderLeft={`4px solid ${v.color}`}
              borderRadius='10px'
              boxShadow='0 10px 30px rgba(24, 35, 56, 0.14)'
              px={4}
              py={3.5}
              alignItems='flex-start'
              gap={3}
            >
              {/* ICON */}
              <Box
                flexShrink={0}
                w='34px'
                h='34px'
                borderRadius='full'
                bg={v.soft}
                color={v.color}
                display='flex'
                alignItems='center'
                justifyContent='center'
              >
                {toast.type === 'loading' ? (
                  <Spinner size='sm' color={v.color} />
                ) : (
                  <Icon size={19} />
                )}
              </Box>

              {/* TEXT */}
              <Stack gap={0.5} flex='1' minW={0} pr={5}>
                {toast.title && (
                  <Toast.Title
                    fontSize='14px'
                    fontWeight='700'
                    color='#182338'
                  >
                    {toast.title}
                  </Toast.Title>
                )}

                {toast.description && (
                  <Toast.Description
                    fontSize='13px'
                    color='#60708C'
                    lineHeight='1.45'
                    whiteSpace='pre-line'
                  >
                    {toast.description}
                  </Toast.Description>
                )}

                {toast.action && (
                  <Toast.ActionTrigger
                    mt={1.5}
                    alignSelf='flex-start'
                    fontSize='12px'
                    fontWeight='600'
                    color='var(--primary-maroon)'
                  >
                    {toast.action.label}
                  </Toast.ActionTrigger>
                )}
              </Stack>

              {/* CLOSE */}
              {toast.closable && (
                <Toast.CloseTrigger
                  color='#8491A5'
                  _hover={{ color: '#182338', bg: '#F4F6F9' }}
                />
              )}
            </Toast.Root>
          )
        }}
      </ChakraToaster>
    </Portal>
  )
}