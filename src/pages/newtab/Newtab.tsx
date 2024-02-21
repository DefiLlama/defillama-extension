import { useEffect, useRef, useState } from "react";
import { useProtocolsQuery } from "../libs/hooks";
import {
  Box,
  Center,
  Image,
  Input,
  LinkOverlay,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Table,
  TableContainer,
  Tbody,
  Tr,
  Td,
  Text,
  useColorMode,
} from "@chakra-ui/react";

const Newtab = () => {
  const { colorMode } = useColorMode();
  const searchInput = useRef<HTMLInputElement>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<number | null>(null);
  const { query, setQuery, protocols } = useProtocolsQuery();

  // ____________ Handlers ____________
  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setQuery(value);
    setSelectedProtocol(null);
  };

  const keyDownHandler = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!protocols || protocols.length === 0) {
      return;
    }
    switch (e.key) {
      case "ArrowUp":
        if (!selectedProtocol) {
          setSelectedProtocol(protocols.length - 1);
          return;
        }
        setSelectedProtocol(selectedProtocol - 1);
        break;
      case "ArrowDown":
        if (selectedProtocol === null || selectedProtocol === protocols.length - 1) {
          setSelectedProtocol(0);
          return;
        }
        setSelectedProtocol(selectedProtocol + 1);
        break;
      case "Enter":
        if (selectedProtocol !== null && protocols) {
          const protocol = protocols[selectedProtocol];
          window.location.href = protocol.url;
          return;
        } else if (protocols) {
          window.location.href = protocols[0].url;
        }
    }
  };

  return (
    <Box w="100%" h="100vh">
      <Center w="100%" h="100%">
        <Box mx="4" maxWidth="600px" width="100%" onKeyDown={keyDownHandler}>
          <Popover isOpen={true} placement="bottom" matchWidth={true}>
            <PopoverTrigger>
              <Input tabIndex={1} value={query} onChange={changeHandler} placeholder="Search protocol..." size="lg" />
            </PopoverTrigger>
            <PopoverContent
              width="100%"
              sx={{
                "&:focus-visible": {
                  boxShadow: "none",
                },
              }}
            >
              <PopoverBody
                width="100%"
                p="0"
                sx={{
                  "&:focus-visible": {
                    boxShadow: "none",
                  },
                }}
              >
                <Box width="100%" maxHeight="calc(50vh - 40px)" overflow="scroll">
                  <TableContainer width="100%">
                    <Table variant="simple">
                      <Tbody>
                        {protocols && protocols.length > 0 ? (
                          protocols.map((protocol, index) => (
                            <Tr
                              sx={{
                                cursor: "pointer",
                                backgroundColor:
                                  index === selectedProtocol
                                    ? colorMode === "light"
                                      ? "blackAlpha.100"
                                      : "whiteAlpha.300"
                                    : null,
                                "&:hover": {
                                  backgroundColor: colorMode === "light" ? "blackAlpha.100" : "whiteAlpha.300",
                                },
                                "&:focus-visible": {
                                  boxShadow: "none",
                                  outline: "none",
                                },
                              }}
                              onFocus={() => setSelectedProtocol(index)}
                              onClick={() => {
                                window.location.href = protocol.url;
                              }}
                              tabIndex={index + 2}
                            >
                              <Td p="0">
                                <Box px="4" py="2" display="flex" flexDirection="row" gap="3" alignItems="center">
                                  <Box w="8" h="8" flexGrow="0" borderRadius="16px" overflow="hidden">
                                    {protocol.logo ? <Image src={protocol.logo} /> : null}
                                  </Box>
                                  <Box alignItems="center">
                                    <Text fontSize="md">{protocol.name}</Text>
                                  </Box>
                                </Box>
                              </Td>
                            </Tr>
                          ))
                        ) : (
                          <Tr>
                            <Td p="0">
                              <Box
                                px="4"
                                py="2"
                                display="flex"
                                flexDirection="row"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Text fontSize="md">No results found</Text>
                              </Box>
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Box>
      </Center>
    </Box>
  );
};
export default Newtab;
