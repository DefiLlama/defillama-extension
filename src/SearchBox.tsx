import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  Input,
} from "@chakra-ui/react";
// import { Combobox } from "@headlessui/react";
import { FiSearch } from "react-icons/fi";

import { Command } from "./libs/cmdk";

import { DEFAULT_SEARCH_ENGINES, getIsMac, Protocol, SearchEngine, usePersistentState, useProtocols } from "./utils";
import fuzzyScore from "./libs/fuzzyScore";

export const SearchBox = () => {
  const isMac = useMemo(() => getIsMac(), []);
  const { colorMode } = useColorMode();

  const { data } = useProtocols();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef(null);

  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const onSearchBarFocus = () => setSearchBarFocused(true);
  const onSearchBarBlur = () => setSearchBarFocused(false);

  const [input, setInput] = useState("");
  const [selectedKey, setSelectedKey] = useState("");

  const [searchEngine] = usePersistentState<SearchEngine>("searchEngine", DEFAULT_SEARCH_ENGINES[0]);
  const [optionKeys, setOptionKeys] = useState<string[]>([]);

  const hasNoProtocols = useMemo(() => optionKeys.length === 1, [optionKeys]);

  useEffect(() => {
    if (!data) return;
    if (input.length === 0) {
      setOptionKeys([]);
      setSelectedKey("");
      return;
    }

    const scoredList = data
      .map((x) => {
        const score = fuzzyScore(x.name, input);
        return { score, ...x };
      })
      .filter((x) => x.score > 0);
    scoredList.sort((a, b) => b.score - a.score);
    const top5 = scoredList.slice(0, 5);

    if (top5.length > 0) {
      if (top5.find((x) => selectedKey === x.name) === undefined && selectedKey !== "search_engine") {
        setSelectedKey(top5[0].name);
      }
    }

    setOptionKeys([...top5.map((x) => x.name), "search_engine"]);
  }, [input, data, selectedKey]);

  useEffect(() => {
    console.log("selectedKey", selectedKey);
    console.log("optionKeys", optionKeys);
  });

  const _searchEngine = useMemo(
    () => ({
      name: `Search for ${input} on ${searchEngine.name}...`,
      url: encodeURI(searchEngine.url + input),
      logo: searchEngine.logo,
      category: "Search Engines",
    }),
    [input, searchEngine],
  );

  useEventListener("keydown", (event) => {
    const hotkey = isMac ? "metaKey" : "ctrlKey";
    if (event?.key?.toLowerCase() === "k" && event[hotkey]) {
      event.preventDefault();
      inputRef.current?.focus();
    }

    if (!searchBarFocused) {
      return;
    }

    if (event?.key?.toLowerCase() === "escape") {
      event.preventDefault();
      inputRef.current?.blur();
    }

    if (event?.key?.toLowerCase() === "arrowdown") {
      event.preventDefault();
      const currentIndex = optionKeys.indexOf(selectedKey);
      const nextIndex = currentIndex + 1;
      if (nextIndex < optionKeys.length) {
        setSelectedKey(optionKeys[nextIndex]);
      }
    }

    if (event?.key?.toLowerCase() === "arrowup") {
      event.preventDefault();
      const currentIndex = optionKeys.indexOf(selectedKey);
      const nextIndex = currentIndex - 1;
      if (nextIndex >= 0) {
        setSelectedKey(optionKeys[nextIndex]);
      }
    }

    if (event?.key?.toLowerCase() === "enter") {
      event.preventDefault();
      if (hasNoProtocols || selectedKey === "search_engine") {
        location.href = _searchEngine.url;
      } else {
        const protocol = data?.find((x) => x.name === selectedKey);
        if (protocol) {
          location.href = protocol.url;
        }
      }
    }
  });

  return (
    <>
      <InputGroup size="lg" my="16">
        <Input
          placeholder="Search..."
          ref={inputRef}
          onFocus={onSearchBarFocus}
          onBlur={onSearchBarBlur}
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
      <VStack
        w={["sm", "md", "lg", "xl"]}
        p="4"
        borderRadius="md"
        spacing="4"
        borderWidth={2}
        position="absolute"
        bgColor={colorMode === "light" ? "white" : "gray.800"}
      >
        {optionKeys.map((optionKey, i) => {
          if (optionKey === "search_engine") {
            return (
              <HStack
                key={optionKey}
                w="full"
                borderRadius="md"
                opacity={!hasNoProtocols && !(selectedKey === optionKey) && 0.4}
                onMouseEnter={() => setSelectedKey(optionKey)}
              >
                <Image boxSize="6" borderRadius="sm" src={_searchEngine.logo} />
                <Text fontWeight="medium" fontSize="md">
                  {_searchEngine.name}
                </Text>
              </HStack>
            );
          }

          const protocol = data?.find((x) => x.name === optionKey);
          return (
            <HStack
              key={optionKey}
              w="full"
              borderRadius="md"
              opacity={!(selectedKey === optionKey) && 0.4}
              onMouseEnter={() => setSelectedKey(optionKey)}
            >
              <Image boxSize="6" borderRadius="sm" src={protocol.logo} />
              <Text fontWeight="medium" fontSize="md">
                {protocol.name}
              </Text>
            </HStack>
          );
        })}
      </VStack>
    </>
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
