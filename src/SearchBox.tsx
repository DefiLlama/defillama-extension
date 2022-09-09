import { Fragment, useMemo, useState } from "react";
import {
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Tooltip,
  Kbd,
  Fade,
  HStack,
  Text,
  VStack,
  useColorMode,
  Image,
} from "@chakra-ui/react";
import { Combobox } from "@headlessui/react";
import { FiSearch } from "react-icons/fi";

import { DEFAULT_SEARCH_ENGINES, getIsMac, Protocol, SearchEngine, useLocalStorage, useProtocols } from "./utils";

export const SearchBox = (props: {
  searchBar: React.MutableRefObject<HTMLInputElement>;
  searchInput: string;
  setSearchInput: React.Dispatch<React.SetStateAction<string>>;
  searchBarFocused: boolean;
  setSearchBarFocused: React.Dispatch<React.SetStateAction<boolean>>;
  searchEngine: SearchEngine;
  setSearchEngine: React.Dispatch<React.SetStateAction<SearchEngine>>;
}) => {
  const { data } = useProtocols();
  const isMac = useMemo(() => getIsMac(), []);
  const { colorMode } = useColorMode();

  const { searchBar, searchInput, setSearchInput, searchBarFocused, setSearchBarFocused } = props;
  const onSearchBarFocus = () => setSearchBarFocused(true);
  const onSearchBarBlur = () => setSearchBarFocused(false);

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>(null);
  const filteredProtocols = useMemo(() => {
    const _searchEngine: Protocol = {
      name: `Search for ${searchInput} on ${props.searchEngine.name}...`,
      url: encodeURI(props.searchEngine.url + searchInput),
      logo: props.searchEngine.logo,
      category: "FALLBACK",
    };
    if (!searchInput || !data) return [_searchEngine];
    return [
      ...data.filter((protocol) => protocol.name.toLowerCase().includes(searchInput.toLowerCase())).slice(0, 5),
      _searchEngine,
    ];
  }, [searchInput, data]);

  return (
    <Combobox
      value={selectedProtocol}
      onChange={(protocol: Protocol) => {
        setSelectedProtocol(protocol);
        window.location.assign(protocol.url);
      }}
    >
      {({ open }) => (
        <>
          <InputGroup size="lg" my="16">
            <Combobox.Input
              as={Fragment}
              onChange={(event) => setSearchInput(event.target.value)}
              displayValue={(protocol: Protocol) => protocol?.name ?? ""}
            >
              <Input
                placeholder="Search..."
                ref={searchBar}
                onFocus={onSearchBarFocus}
                onBlur={onSearchBarBlur}
                autoComplete="off"
              />
            </Combobox.Input>
            <InputRightElement w="20" justifyContent="flex-end" userSelect="none">
              <Fade in={!searchBarFocused}>{isMac ? <Kbd>⌘ + K</Kbd> : <Kbd>Ctrl + K</Kbd>}</Fade>
              <Tooltip hasArrow label="Search" openDelay={300}>
                <IconButton
                  aria-label="Search"
                  icon={<FiSearch />}
                  colorScheme="gray"
                  variant="ghost"
                  size="md"
                  mr="1"
                  ml="2"
                />
              </Tooltip>
            </InputRightElement>
          </InputGroup>
          {(!searchInput || !open) && <div style={{ width: "100%", marginTop: "-0.5rem" }} />}
          {searchInput && open && (
            <Combobox.Options as="div" static={true} style={{ width: "100%", marginTop: "-0.5rem" }}>
              <VStack
                w={["sm", "md", "lg", "xl"]}
                p="4"
                borderRadius="md"
                spacing="4"
                borderWidth={2}
                position="absolute"
                bgColor={colorMode === "light" ? "white" : "gray.800"}
              >
                {filteredProtocols.map((protocol, i) => (
                  <Combobox.Option
                    as="div"
                    key={protocol.name + protocol.url}
                    value={protocol}
                    style={{ width: "100%" }}
                  >
                    {({ active, selected }) => (
                      <HStack w="full" cursor="pointer" opacity={!active && 0.4}>
                        <Image boxSize="6" borderRadius="sm" src={protocol.logo} />
                        <Text fontWeight="medium" fontSize="md">
                          {protocol.name}
                        </Text>
                      </HStack>
                    )}
                  </Combobox.Option>
                ))}
              </VStack>
            </Combobox.Options>
          )}
          {/* </PopoverContent>
      </Popover> */}
        </>
      )}
    </Combobox>
  );
};
