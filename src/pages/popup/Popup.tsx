import cute from "@assets/img/memes/cute.gif";
import cuteStatic from "@assets/img/memes/cute-128.png";
import { Box, HStack, Icon, Image, Switch, Text, useColorModeValue, VStack, Link } from "@chakra-ui/react";
import { useBrowserStorage } from "../libs/hooks";
import { FaDiscord, FaGithub, FaTwitter } from "react-icons/fa";
import Browser from "webextension-polyfill";
import packageJson from "../../../public/manifest.json";

const Popup = () => {
  const [priceInjector, setPriceInjector] = useBrowserStorage("local", "settings:priceInjector", true);
  const [tagsInjector, setTagsInjector] = useBrowserStorage("local", "settings:tagsInjector", true);
  const [phishingDetector, setPhishingDetector] = useBrowserStorage("local", "settings:phishingDetector", true);
  const [phishingHandleDetector, setPhishingHandleDetector] = useBrowserStorage(
    "local",
    "settings:phishingHandleDetector",
    true,
  );

  return (
    <Box w="xs" py="4" px="4" userSelect="none">
      <VStack>
        <Link href="https://defillama.com/" isExternal>
          <Image src={cute} alt="Cute Llama" w="14" />
        </Link>
        <Text fontSize="xl" fontWeight="bold">
          DefiLlama
        </Text>
      </VStack>
      <VStack my="5" p="2" w="full" spacing="1.5" borderRadius="lg" bg={useColorModeValue("gray.100", "gray.900")}>
        <HStack justify="space-between" w="full">
          <Text fontSize="sm">Enable address tags on explorers</Text>
          <Switch
            size="sm"
            isChecked={tagsInjector}
            onChange={(e) => {
              setTagsInjector(e.target.checked);
            }}
          />
        </HStack>
        <HStack justify="space-between" w="full">
          <Text fontSize="sm">Enable token prices on explorers</Text>
          <Switch
            size="sm"
            isChecked={priceInjector}
            onChange={(e) => {
              setPriceInjector(e.target.checked);
            }}
          />
        </HStack>
        <HStack justify="space-between" w="full">
          <Text fontSize="sm">Detect phishing websites</Text>
          <Switch
            size="sm"
            isChecked={phishingDetector}
            onChange={(e) => {
              setPhishingDetector(e.target.checked);
              if (!e.target.checked) {
                Browser.action.setIcon({ path: cuteStatic });
              }
            }}
          />
        </HStack>
        <HStack justify="space-between" w="full">
          <Text fontSize="sm">Twitter: Mitigate phishing scams</Text>
          <Switch
            size="sm"
            isChecked={phishingHandleDetector}
            onChange={(e) => {
              setPhishingHandleDetector(e.target.checked);
              if (!e.target.checked) {
                Browser.action.setIcon({ path: cuteStatic });
              }
            }}
          />
        </HStack>
      </VStack>
      <VStack m="4">
        <Link href="https://github.com/DefiLlama/url-directory" isExternal>
          <Text fontSize="xs" color="gray.700">
            Submit a whitelist domain
          </Text>
        </Link>
      </VStack>
      <HStack w="full" spacing="2" justify="center">
        <Link href="https://discord.defillama.com" isExternal>
          <Icon as={FaDiscord} w="6" h="6" />
        </Link>
        <Link href="https://twitter.com/defillama" isExternal>
          <Icon as={FaTwitter} w="6" h="6" />
        </Link>
        <Link href="https://github.com/defillama/defillama-extension" isExternal>
          <Icon as={FaGithub} w="6" h="6" />
        </Link>
      </HStack>
      <VStack mt="2" w="full" spacing="2" justify="center">
        <Text fontSize="xs">v{packageJson.version}</Text>
      </VStack>
    </Box>
  );
};

export default Popup;
