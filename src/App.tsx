import { useMemo, useRef, useState } from "react";
import {
  Center,
  IconButton,
  Image,
  Link,
  Tooltip,
  VStack,
  HStack,
  SimpleGrid,
  useColorMode,
  useDisclosure,
  useEventListener,
} from "@chakra-ui/react";
import { FiSettings, FiSun, FiMoon } from "react-icons/fi";
import logo from "./assets/defillama-logo.png";
import { DEFAULT_SEARCH_ENGINES, getIsMac, SearchEngine, usePersistentState, useTopSites } from "./utils";
import { SearchBox } from "./SearchBox";
import { TopSiteBlock } from "./TopSiteBlock";
import { SettingsModal } from "./SettingsModal";

function App() {
  const isMac = useMemo(() => getIsMac(), []);

  const { colorMode, toggleColorMode } = useColorMode();
  const topSites = useTopSites();
  const searchBar = useRef<HTMLInputElement>(null);
  const [searchBarFocused, setSearchBarFocused] = useState(false);

  const settingsModal = useDisclosure();

  useEventListener("keydown", (event) => {
    const hotkey = isMac ? "metaKey" : "ctrlKey";
    if (event?.key?.toLowerCase() === "k" && event[hotkey]) {
      event.preventDefault();
      searchBar.current?.focus();
    }
  });

  const [searchInput, setSearchInput] = useState("");

  return (
    <>
      <VStack h="100vh" justifyContent="space-between">
        <HStack p="4" w="full" justifyContent="flex-end">
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
            colorScheme="gray"
            variant="ghost"
            size="md"
          />
        </HStack>
        <Center px="8">
          <VStack w={["sm", "md", "lg", "xl"]} gap="4" pb="24">
            <Tooltip label="Visit DefiLlama" placement="right" hasArrow openDelay={500}>
              <Link href="https://defillama.com/">
                <Image src={logo} boxSize="24" alt="DefiLlama Logo" mb="8" />
              </Link>
            </Tooltip>
            <SearchBox
              searchBar={searchBar}
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              searchBarFocused={searchBarFocused}
              setSearchBarFocused={setSearchBarFocused}
            />
            <SimpleGrid columns={[3, 4, 5]} spacing="1">
              {topSites.slice(0, 10).map(({ title, url }, i) => (
                <TopSiteBlock title={title} url={url} key={title + url + i} />
              ))}
            </SimpleGrid>
          </VStack>
        </Center>
        <HStack p="4" w="full" justifyContent="flex-end">
          <IconButton
            aria-label="Settings"
            icon={<FiSettings />}
            colorScheme="gray"
            variant="ghost"
            size="md"
            onClick={settingsModal.onOpen}
          />
        </HStack>
      </VStack>
      <SettingsModal settingsModal={settingsModal} />
    </>
  );
}

export default App;
