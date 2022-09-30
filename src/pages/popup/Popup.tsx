import cute from "@assets/img/memes/cute.gif";
import cuteStatic from "@assets/img/memes/cute-128.png";
import { Box, HStack, Icon, Image, Switch, Text, useColorModeValue, VStack, Link } from "@chakra-ui/react";
import { useBrowserStorage } from "../libs/hooks";
import { FaDiscord, FaGithub, FaTwitter } from "react-icons/fa";
import Browser from "webextension-polyfill";

const Popup = () => {
  const [priceInjector, setPriceInjector] = useBrowserStorage("local", "settings:priceInjector", true);
  const [phishingDetector, setPhishingDetector] = useBrowserStorage("local", "settings:phishingDetector", true);

  return (
    <Box w="2xs" py="4" px="4" userSelect="none">
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
          <Text fontSize="sm">Inject prices on explorers</Text>
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
      </VStack>
      <HStack w="full" spacing="2" justify="center">
        <Link href="https://discord.gg/buPFYXzDDd" isExternal>
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
        <Text fontSize="xs">v0.0.2</Text>
      </VStack>
    </Box>
  );
};

export default Popup;
