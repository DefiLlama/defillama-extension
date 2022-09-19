import { Fragment, useMemo, useRef, useState } from "react";
import {
  IconButton,
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
  useEventListener,
} from "@chakra-ui/react";
// import { Combobox } from "@headlessui/react";
import { FiSearch } from "react-icons/fi";

import { Command } from "./libs/cmdk";

import { DEFAULT_SEARCH_ENGINES, getIsMac, Protocol, SearchEngine, usePersistentState, useProtocols } from "./utils";

export const SearchBox = () => {
  const isMac = useMemo(() => getIsMac(), []);
  const { colorMode } = useColorMode();

  const { data } = useProtocols();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef(null);
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const onSearchBarFocus = () => setSearchBarFocused(true);
  const onSearchBarBlur = () => setSearchBarFocused(false);

  const [searchEngine] = usePersistentState<SearchEngine>("searchEngine", DEFAULT_SEARCH_ENGINES[0]);

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>(null);
  const filteredProtocols = useMemo(() => {
    const _searchEngine: Protocol = {
      name: `Search for ${searchInput} on ${searchEngine.name}...`,
      url: encodeURI(searchEngine.url + searchInput),
      logo: searchEngine.logo,
      category: "FALLBACK",
    };
    if (!searchInput || !data) return [_searchEngine];
    return [
      ...data.filter((protocol) => protocol.name.toLowerCase().includes(searchInput.toLowerCase())).slice(0, 5),
      _searchEngine,
    ];
  }, [searchInput, data]);

  useEventListener("keydown", (event) => {
    const hotkey = isMac ? "metaKey" : "ctrlKey";
    if (event?.key?.toLowerCase() === "k" && event[hotkey]) {
      event.preventDefault();
      inputRef.current?.focus();
    }
  });

  return (
    <Command value={searchInput} onValueChange={(v) => setSearchInput(v)}>
      {/* <div cmdk-raycast-top-shine="" /> */}
      <InputGroup size="lg">
        <Command.Input
          ref={inputRef}
          autoFocus
          placeholder="Search..."
          onFocus={onSearchBarFocus}
          onBlur={onSearchBarBlur}
        />
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
      <Command.List ref={listRef}>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group heading="Suggestions">
          {filteredProtocols.map((protocol) => (
            <Item value={protocol.name} key={protocol.name + protocol.url}>
              <HStack
                w="full"
                cursor="pointer"
                // opacity={!active && 0.4}
              >
                <Image boxSize="6" borderRadius="sm" src={protocol.logo} />
                <Text fontWeight="medium" fontSize="md">
                  {protocol.name}
                </Text>
              </HStack>
            </Item>
          ))}
        </Command.Group>
        <Command.Group heading="Search on">
          {/* <Item value={searchEngine.name}>
            <HStack spacing="2">
              <Image src={searchEngine.logo} alt={searchEngine.name} borderRadius="sm" boxSize="6" />
              <Text>
                Search for {searchInput} on {searchEngine.name}...
              </Text>
            </HStack>
          </Item> */}
          {/* <Item isCommand value="Clipboard History">
            <Logo>
              <ClipboardIcon />
            </Logo>
            Clipboard History
          </Item>
          <Item isCommand value="Import Extension">
            <HammerIcon />
            Import Extension
          </Item>
          <Item isCommand value="Manage Extensions">
            <HammerIcon />
            Manage Extensions
          </Item> */}
        </Command.Group>
      </Command.List>

      {/* <div cmdk-raycast-footer="">
        {theme === "dark" ? <RaycastDarkIcon /> : <RaycastLightIcon />}

        <button cmdk-raycast-open-trigger="">
          Open Application
          <kbd>↵</kbd>
        </button>

        <hr />

        <SubCommand listRef={listRef} selectedValue={value} inputRef={inputRef} />
      </div> */}
    </Command>
  );

  // return (
  //   <Combobox
  //     value={selectedProtocol}
  //     onChange={(protocol: Protocol) => {
  //       setSelectedProtocol(protocol);
  //       window.location.assign(protocol.url);
  //     }}
  //   >
  //     {({ open }) => (
  //       <>
  //         <InputGroup size="lg" my="16">
  //           <Combobox.Input
  //             as={Fragment}
  //             onChange={(event) => setSearchInput(event.target.value)}
  //             displayValue={(protocol: Protocol) => protocol?.name ?? ""}
  //           >
  //             <Input
  //               placeholder="Search..."
  //               ref={searchBar}
  //               onFocus={onSearchBarFocus}
  //               onBlur={onSearchBarBlur}
  //               autoComplete="off"
  //             />
  //           </Combobox.Input>
  //           <InputRightElement w="20" justifyContent="flex-end" userSelect="none">
  //             <Fade in={!searchBarFocused}>{isMac ? <Kbd>⌘ + K</Kbd> : <Kbd>Ctrl + K</Kbd>}</Fade>
  //             <Tooltip hasArrow label="Search" openDelay={300}>
  //               <IconButton
  //                 aria-label="Search"
  //                 icon={<FiSearch />}
  //                 colorScheme="gray"
  //                 variant="ghost"
  //                 size="md"
  //                 mr="1"
  //                 ml="2"
  //               />
  //             </Tooltip>
  //           </InputRightElement>
  //         </InputGroup>
  //         {(!searchInput || !open) && <div style={{ width: "100%", marginTop: "-0.5rem" }} />}
  //         {searchInput && open && (
  //           <Combobox.Options as="div" static={true} style={{ width: "100%", marginTop: "-0.5rem" }}>
  //             <VStack
  //               w={["sm", "md", "lg", "xl"]}
  //               p="4"
  //               borderRadius="md"
  //               spacing="4"
  //               borderWidth={2}
  //               position="absolute"
  //               bgColor={colorMode === "light" ? "white" : "gray.800"}
  //             >
  //               {filteredProtocols.map((protocol, i) => (
  //                 <Combobox.Option
  //                   as="div"
  //                   key={protocol.name + protocol.url}
  //                   value={protocol}
  //                   style={{ width: "100%" }}
  //                 >
  //                   {({ active, selected }) => (
  //                     <HStack w="full" cursor="pointer" opacity={!active && 0.4}>
  //                       <Image boxSize="6" borderRadius="sm" src={protocol.logo} />
  //                       <Text fontWeight="medium" fontSize="md">
  //                         {protocol.name}
  //                       </Text>
  //                     </HStack>
  //                   )}
  //                 </Combobox.Option>
  //               ))}
  //             </VStack>
  //           </Combobox.Options>
  //         )}
  //         {/* </PopoverContent>
  //     </Popover> */}
  //       </>
  //     )}
  //   </Combobox>
  // );
};

const Item = ({
  value,
  children,
  onSelect = () => {},
}: {
  children: React.ReactNode;
  value: string;
  onSelect?: (value: string) => void;
}) => {
  return (
    <Command.Item value={value} onSelect={onSelect}>
      {children}
    </Command.Item>
  );
};
