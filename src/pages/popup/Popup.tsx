import cute from "@assets/img/memes/cute.gif";
import { Box, HStack, Icon, Image, Switch, Text, useColorModeValue, VStack, Link } from "@chakra-ui/react";
import { settingsDb } from "../libs/db";
import { useSetting } from "../libs/hooks";
import { FaDiscord, FaGithub, FaTwitter } from "react-icons/fa";

const Popup = () => {
  const priceInjector = useSetting("priceInjector");
  const phishingDetector = useSetting("phishingDetector");
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
              if (priceInjector === undefined) {
                settingsDb.settings.put({ name: "priceInjector", value: e.target.checked });
              } else {
                settingsDb.settings.update("priceInjector", { value: e.target.checked });
              }
            }}
          />
        </HStack>
        <HStack justify="space-between" w="full">
          <Text fontSize="sm">Detect phishing websites</Text>
          <Switch
            size="sm"
            isChecked={phishingDetector}
            onChange={(e) => {
              if (phishingDetector === undefined) {
                settingsDb.settings.put({ name: "phishingDetector", value: e.target.checked });
              } else {
                settingsDb.settings.update("phishingDetector", { value: e.target.checked });
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
