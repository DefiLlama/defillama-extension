import { useEffect, useMemo, useRef, useState } from "react";
import {
  InputGroup,
  InputRightElement,
  Kbd,
  Fade,
  HStack,
  Text,
  VStack,
  useColorMode,
  Image,
  useEventListener,
  Input,
  Box,
  InputLeftElement,
  Icon,
  Badge,
  Collapse,
} from "@chakra-ui/react";
import { FiSearch } from "react-icons/fi";

import fuzzyScore from "@src/pages/libs/fuzzy-score";
import { getIsMac } from "@src/pages/libs/helpers";
import { usePersistentState, useProtocols } from "@src/pages/libs/hooks";
import { DEFAULT_SEARCH_ENGINES, SearchEngine } from "@src/pages/libs/constants";

export const SearchBox = () => {
  const isMac = useMemo(() => getIsMac(), []);
  const { colorMode } = useColorMode();

  const protocols = useProtocols();
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const onSearchBarFocus = () => setSearchBarFocused(true);
  // const onSearchBarBlur = () => setTimeout(() => setSearchBarFocused(false), 100);
  const onSearchBarBlur = () => setSearchBarFocused(false);

  const [input, setInput] = useState("");
  const [selectedKey, setSelectedKey] = useState("");

  const [searchEngine] = usePersistentState<SearchEngine>("searchEngine", DEFAULT_SEARCH_ENGINES[0]);
  const [searchResultsCount] = usePersistentState<number>("searchResultsCount", 5);
  const [optionKeys, setOptionKeys] = useState<string[]>([]);

  const hasNoProtocols = useMemo(() => optionKeys.length === 1, [optionKeys]);

  useEffect(() => {
    if (!protocols) return;
    if (input.length === 0) {
      setOptionKeys([]);
      setSelectedKey("");
      return;
    }

    const scoredList = protocols
      .map((x) => {
        const score = fuzzyScore(x.name, input);
        return { score, ...x };
      })
      .filter((x) => x.score > 0);
    scoredList.sort((a, b) => b.score - a.score);
    const topOptions = scoredList.slice(0, searchResultsCount);
    topOptions.sort((a, b) => (b?.tvl ?? 0) - (a?.tvl ?? 0));

    if (topOptions.length > 0) {
      if (topOptions.find((x) => selectedKey === x.name) === undefined && selectedKey !== "search_engine") {
        setSelectedKey(topOptions[0].name);
      }
    }

    setOptionKeys([...topOptions.map((x) => x.name), "search_engine"]);
  }, [input, protocols, selectedKey]);

  const _searchEngine = useMemo(
    () => ({
      name: `Search for ${input} on ${searchEngine.name}...`,
      url: encodeURI(searchEngine.url + input),
      logo: searchEngine.logo,
      category: "Search Engines",
    }),
    [input, searchEngine],
  );

  const _instantResult = useMemo(async () => {}, [input]);

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
        const protocol = protocols?.find((x) => x.name === selectedKey);
        if (protocol) {
          location.href = protocol.url;
        }
      }
    }
  });

  return (
    <VStack w="full">
      <InputGroup size="lg" my="0.5">
        <Input
          placeholder="Search..."
          ref={inputRef}
          onFocus={onSearchBarFocus}
          onBlur={onSearchBarBlur}
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <InputRightElement w="20" justifyContent="flex-end" userSelect="none" mx="4">
          <Fade in={!searchBarFocused}>{isMac ? <Kbd>⌘ + K</Kbd> : <Kbd>Ctrl + K</Kbd>}</Fade>
        </InputRightElement>
        <InputLeftElement>
          <Icon as={FiSearch} opacity={searchBarFocused ? 0.8 : 0.4} />
        </InputLeftElement>
      </InputGroup>
      <Box w="full">
        <Collapse in={searchBarFocused && !!input} animateOpacity>
          <VStack
            w={["sm", "md", "lg", "xl"]}
            p={optionKeys.length > 0 ? 4 : 0}
            borderRadius="md"
            spacing="4"
            borderWidth={optionKeys.length > 0 ? 2 : 0}
            position="absolute"
            bgColor={colorMode === "light" ? "white" : "gray.800"}
          >
            {optionKeys.map((optionKey) => {
              if (optionKey === "search_engine") {
                return (
                  <HStack
                    key={optionKey}
                    w="full"
                    borderRadius="md"
                    opacity={!hasNoProtocols && !(selectedKey === optionKey) && 0.4}
                    onMouseEnter={() => setSelectedKey(optionKey)}
                    cursor="pointer"
                    onClick={() => (location.href = _searchEngine.url)}
                  >
                    <Image boxSize="6" borderRadius="sm" src={_searchEngine.logo} />
                    <Text fontWeight="medium" fontSize="md">
                      {_searchEngine.name}
                    </Text>
                  </HStack>
                );
              }

              const protocol = protocols?.find((x) => x.name === optionKey);
              return (
                <HStack
                  key={optionKey}
                  w="full"
                  borderRadius="md"
                  opacity={!(selectedKey === optionKey) && 0.4}
                  onMouseEnter={() => setSelectedKey(optionKey)}
                  justifyContent="space-between"
                  cursor="pointer"
                  onClick={() => (location.href = protocol?.url)}
                >
                  <HStack>
                    <Image boxSize="6" borderRadius="sm" src={protocol.logo} />
                    <Text fontWeight="medium" fontSize="md">
                      {protocol.name}
                    </Text>
                  </HStack>
                  <HStack>
                    {protocol.tvl && (
                      <Badge>
                        TVL{" "}
                        {Intl.NumberFormat("en", {
                          notation: "compact",
                          style: "currency",
                          currency: "USD",
                        }).format(protocol.tvl)}
                      </Badge>
                    )}
                    <Badge>{protocol.category}</Badge>
                  </HStack>
                </HStack>
              );
            })}
          </VStack>
        </Collapse>
      </Box>
    </VStack>
  );
};
