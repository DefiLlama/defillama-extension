import cute from "@assets/img/memes/cute.gif";
import cuteStatic from "@assets/img/memes/cute-128.png";
import { Box, HStack, Icon, Image, Switch, Text, useColorModeValue, VStack, Link, Input, InputGroup, InputLeftElement } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useState, useCallback, useEffect } from "react";
import { updateDb } from "../libs/db";
import { debounce } from "../libs/helpers";
import { useBrowserStorage } from "../libs/hooks";
import { FaDiscord, FaGithub, FaTwitter } from "react-icons/fa";
import Browser from "webextension-polyfill";
import packageJson from "../../../package.json";

const Popup = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [protocolDirectory, setProtocolDirectory] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { protocolDirectoryDb } = await updateDb();
        setProtocolDirectory(protocolDirectoryDb.data);
      } catch (error) {
        console.error("Error loading data:", error);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const debouncedSearch = useCallback(
    debounce(() => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      
      const results = protocolDirectory
        .filter(item => {
          const nameMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
          const urlMatch = item.url.toLowerCase().includes(searchTerm.toLowerCase());
          return nameMatch || urlMatch;
        })
        .slice(0, 5); // Limit to 5 results
      
      setSearchResults(results);
    }, 200),
    [searchTerm]
  );

  const [priceInjector, setPriceInjector] = useBrowserStorage("local", "settings:priceInjector", true);
  const [tagsInjector, setTagsInjector] = useBrowserStorage("local", "settings:tagsInjector", true);
  const [explorerSpamHide, setExplorerSpamHide] = useBrowserStorage("local", "settings:explorerSpamHide", false);

  const [phishingHandleDetector, setPhishingHandleDetector] = useBrowserStorage(
    "local",
    "settings:phishingHandleDetector",
    true,
  );
  const [twitterCashTags, setTwitterCashTags] = useBrowserStorage("local", "settings:twitterCashTags", false,);
  const [twitterHashTags, setTwitterHashTags] = useBrowserStorage("local", "settings:twitterHashTags", false,);
  const [twitterQT, setTwitterQT] = useBrowserStorage("local", "settings:twitterQT", false,);
  const [twitterBotReplies, setTwitterBotReplies] = useBrowserStorage("local", "settings:twitterBotReplies", false,);

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
      
      {/* Quick Links */}
      <HStack my="3" w="full" justify="space-around" spacing={2}>
        <Link href="https://defillama.com/" isExternal>
          <VStack>
            <Image 
              src="https://defillama.com/favicon-32x32.png" 
              alt="DefiLlama" 
              w="8" 
              h="8"
              borderRadius="full" 
            />
            <Text fontSize="xs">DeFiLlama</Text>
          </VStack>
        </Link>
        <Link href="https://swap.defillama.com/" isExternal>
          <VStack>
            <Image 
              src="https://swap.defillama.com/_next/static/media/loader.268d236d.png" 
              alt="LlamaSwap" 
              w="8" 
              h="8"
              borderRadius="full" 
            />
            <Text fontSize="xs">LlamaSwap</Text>
          </VStack>
        </Link>
        <Link href="https://llamapay.io/dashboard" isExternal>
          <VStack>
            <Image 
              src="https://llamapay.io/favicon-32x32.png" 
              alt="LlamaPay" 
              w="8" 
              h="8"
              borderRadius="full" 
            />
            <Text fontSize="xs">LlamaPay</Text>
          </VStack>
        </Link>
        <Link href="https://llamafeed.io/" isExternal>
          <VStack>
            <Image 
              src="https://llamafeed.io/_next/image?url=%2Flogo.webp&w=96&q=75" 
              alt="LlamaFeed" 
              w="8" 
              h="8"
              borderRadius="full" 
            />
            <Text fontSize="xs">LlamaFeed</Text>
          </VStack>
                  </Link>
        </HStack>

        {/* Search Box */}
        <Box w="full" position="relative" mt="2">
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Text position="absolute" right="2" top="1" color="gray.400" fontSize="xs">*</Text>
            <Input
              placeholder={isLoading ? "Loading protocols..." : "Search defillama directory..."}
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                if (!value.trim()) {
                  setSearchResults([]);
                } else {
                  debouncedSearch();
                }
              }}
              isDisabled={isLoading}
              borderRadius="md"
              bg={useColorModeValue("white", "gray.700")}
            />
          </InputGroup>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <Box
              position="absolute"
              top="100%"
              left="0"
              right="0"
              mt="1"
              bg={useColorModeValue("white", "gray.700")}
              borderRadius="md"
              boxShadow="sm"
              zIndex="dropdown"
              maxH="200px"
              overflowY="auto"
            >
              {searchResults.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.url}
                  isExternal
                  _hover={{ textDecoration: "none" }}
                  onClick={() => {
                    setSearchTerm("");
                    setSearchResults([]);
                  }}
                >
                  <HStack
                    px="3"
                    py="2"
                    _hover={{ bg: useColorModeValue("gray.50", "gray.600") }}
                    borderBottomWidth={index < searchResults.length - 1 ? "1px" : "0"}
                  >
                    <Image src={item.logo} alt={item.name} w="6" h="6" borderRadius="full" />
                    <Text fontSize="sm" fontWeight="medium">{item.name}</Text>
                    <Text fontSize="xs" color="gray.500" ml="auto">{new URL(item.url).hostname}</Text>
                  </HStack>
                </Link>
              ))}
            </Box>
          )}
        </Box>

      <VStack my="5" p="2" w="full" spacing="1.5" borderRadius="lg" bg={useColorModeValue("gray.100", "gray.900")}>
        <HStack w="full">
          <Text fontSize="l" fontWeight="bold">
            Twitter
          </Text>
        </HStack>

        <HStack justify="space-between" w="full" pl={7}>
          <Text fontSize="sm">Mitigate phishing scams</Text>
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
        <HStack justify="space-between" w="full" pl={7}>
          <Text fontSize="sm">Hide cash tags</Text>
          <Switch
            size="sm"
            isChecked={twitterCashTags}
            onChange={(e) => {
              setTwitterCashTags(e.target.checked);
              if (!e.target.checked) {
                Browser.action.setIcon({ path: cuteStatic });
              }
            }}
          />
        </HStack>
        <HStack justify="space-between" w="full" pl={7}>
          <Text fontSize="sm">Hide hash tags</Text>
          <Switch
            size="sm"
            isChecked={twitterHashTags}
            onChange={(e) => {
              setTwitterHashTags(e.target.checked);
              if (!e.target.checked) {
                Browser.action.setIcon({ path: cuteStatic });
              }
            }}
          />
        </HStack>
        <HStack justify="space-between" w="full" pl={7}>
          <Text fontSize="sm">Hide QT</Text>
          <Switch
            size="sm"
            isChecked={twitterQT}
            onChange={(e) => {
              setTwitterQT(e.target.checked);
              if (!e.target.checked) {
                Browser.action.setIcon({ path: cuteStatic });
              }
            }}
          />
        </HStack>
        <HStack justify="space-between" w="full" pl={7}>
          <Text fontSize="sm">Hide Bot replies</Text>
          <Switch
            size="sm"
            isChecked={twitterBotReplies}
            onChange={(e) => {
              setTwitterBotReplies(e.target.checked);
              if (!e.target.checked) {
                Browser.action.setIcon({ path: cuteStatic });
              }
            }}
          />
        </HStack>
        <HStack w="full">
          <Text fontSize="l" fontWeight="bold">
            Explorer
          </Text>
        </HStack>
        <HStack justify="space-between" w="full" pl={7}>
          <Text fontSize="sm">Enable address tags</Text>
          <Switch
            size="sm"
            isChecked={tagsInjector}
            onChange={(e) => {
              setTagsInjector(e.target.checked);
            }}
          />
        </HStack>
        <HStack justify="space-between" w="full" pl={7}>
          <Text fontSize="sm">Enable token prices</Text>
          <Switch
            size="sm"
            isChecked={priceInjector}
            onChange={(e) => {
              setPriceInjector(e.target.checked);
            }}
          />
        </HStack>
        <HStack justify="space-between" w="full" pl={7}>
          <Text fontSize="sm">Enable hide scam transactions</Text>
          <Switch
            size="sm"
            isChecked={explorerSpamHide}
            onChange={(e) => {
              setExplorerSpamHide(e.target.checked);
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
        <Text fontSize="xs" color="gray.500" textAlign="center">* Search results from <a href="https://defillama.com/directory" target="_blank" rel="noopener noreferrer">DefiLlama Directory</a></Text>
        <Text fontSize="xs">v{packageJson.version}</Text>
      </VStack>
    </Box>
  );
};

export default Popup;
