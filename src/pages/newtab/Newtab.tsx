import { useEffect, useRef, useState } from "react";
import { useProtocolsQuery } from "../libs/hooks";
import {
  Box,
  Center,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Table,
  TableContainer,
  Tbody,
  Tr,
  Td,
} from "@chakra-ui/react";

const Newtab = () => {
  const searchInput = useRef<HTMLInputElement>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<number | null>(null);
  const { query, setQuery, protocols } = useProtocolsQuery();

  // ____________ Handlers ____________
  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setQuery(value);
    setSelectedProtocol(null);
  };

  return (
    <Box w="100%" h="100vh" bg="gray.600">
      <Center w="100%" h="100%">
        <Box mx="4" maxWidth="600px" width="100%">
          <Popover isOpen={true} placement="bottom">
            <PopoverTrigger>
              <Input
                value={query}
                onChange={changeHandler}
                placeholder="Search protocol..."
                focusBorderColor="pink.400"
                size="lg"
              />
            </PopoverTrigger>
            <PopoverContent>
              <PopoverBody>
                <Box maxWidth="600px" width="100%" maxHeight="400px">
                  <TableContainer>
                    <Table variant="simple">
                      <Tbody>
                        {protocols?.map((protocol) => (
                          <Tr>
                            <Td>{protocol.name}</Td>
                          </Tr>
                        )) ?? null}
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
