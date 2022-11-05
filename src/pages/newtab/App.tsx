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
  Text,
  Icon,
} from "@chakra-ui/react";
import { FiSettings, FiSun, FiMoon, FiArrowDown } from "react-icons/fi";
import logo from "@assets/defillama-logo.png";
import { useTopSites } from "@src/pages/libs/hooks";
import { SearchBox } from "./SearchBox";
import { TopSiteBlock } from "./TopSiteBlock";
import { SettingsModal } from "./SettingsModal";
import { Clock } from "./widgets/Clock";
import { News } from "./widgets/News";

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const topSites = useTopSites();
  const settingsModal = useDisclosure();

  return (
    <>
      <VStack h="100vh" w="100vw" justifyContent="space-between" pos="fixed">
        <HStack p="4" w="full" justifyContent="space-between">
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
            colorScheme="gray"
            variant="ghost"
            size="md"
          />
          <Clock />
        </HStack>
        <Center px="8">
          <VStack w={["sm", "md", "lg", "xl"]} gap="4" pb="24">
            <Tooltip label="Visit DefiLlama" placement="right" hasArrow openDelay={500}>
              <Link href="https://defillama.com/">
                <Image src={logo} boxSize="24" alt="DefiLlama Logo" mb="8" />
              </Link>
            </Tooltip>
            <SearchBox />
            <SimpleGrid columns={[3, 4, 5]} spacing="1">
              {topSites.slice(0, 10).map(({ title, url }, i) => (
                <TopSiteBlock title={title} url={url} key={title + url + i} />
              ))}
            </SimpleGrid>
          </VStack>
        </Center>
        <VStack w="full">
          <VStack mb="10">
            <Text fontSize="md" fontWeight="semibold">
              Scroll for DefiLlama Roundup
            </Text>
            <Icon as={FiArrowDown} w="6" h="6" />
          </VStack>

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
      </VStack>
      <News />
      <SettingsModal settingsModal={settingsModal} />
    </>
  );
}

export default App;
