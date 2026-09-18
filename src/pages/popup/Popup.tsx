import cute from "@assets/img/memes/cute.gif";
import cuteStatic from "@assets/img/memes/cute-128.png";
import defillamaIcon from "@assets/img/links/defillama.png";
import llamaswapIcon from "@assets/img/links/llamaswap.png";
import llamapayIcon from "@assets/img/links/llamapay.png";
import { Box, HStack, Icon, Image, Switch, Text, useColorModeValue, useColorMode, VStack, Link, Input, InputGroup, InputLeftElement, IconButton, Collapse, SimpleGrid, Avatar, Divider } from "@chakra-ui/react";
import { SearchIcon, ChevronDownIcon, ChevronUpIcon, SmallCloseIcon, StarIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useState, useMemo, useEffect } from "react";
import { SEARCH_API, SEARCH_API_KEY } from "../libs/constants";
import { debounce } from "../libs/helpers";
import { useBrowserStorage } from "../libs/hooks";
import { FaDiscord, FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Browser from "webextension-polyfill";
import packageJson from "../../../package.json";

type QuickLink = { url: string; name: string; icon?: string };
const MAX_LINKS = 9;
const NO_LINKS: QuickLink[] = []; // stable reference so the storage hook doesn't refetch every render

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wide">{children}</Text>
);

// one row per toggle so every switch sits on the same right edge and rows share height/hover
const SettingRow = ({ label, checked, onChange, disabled, hoverBg }: { label: string; checked?: boolean; onChange: (v: boolean) => void; disabled?: boolean; hoverBg: string }) => (
  <HStack justify="space-between" w="full" px="2" py="1.5" borderRadius="md" _hover={{ bg: hoverBg }} transition="background 0.15s" opacity={disabled ? 0.5 : 1}>
    <Text fontSize="sm">{label}</Text>
    <Switch size="sm" isChecked={!!checked} isDisabled={disabled} onChange={(e) => onChange(e.target.checked)} />
  </HStack>
);

const Popup = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{ name: string; logo: string; route: string }[]>([]);
  const [searched, setSearched] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [siteStatus, setSiteStatus] = useState<{ hostname: string; isBlocked: boolean; isTrusted: boolean; reason: string } | null>(null);

  const loadStatus = () =>
    Browser.runtime.sendMessage({ type: "GET_CURRENT_DOMAIN_STATUS" }).then(setSiteStatus).catch(() => {});
  useEffect(() => {
    loadStatus();
  }, []);

  const [quickLinks = NO_LINKS, setQuickLinks] = useBrowserStorage<QuickLink[]>("local", "userQuickLinks", NO_LINKS);
  const [settingsOpen, setSettingsOpen] = useBrowserStorage("local", "settings:panelOpen", false);
  const isBookmarked = (url: string) => quickLinks.some((l) => l.url === url);
  const toggleBookmark = (link: QuickLink) =>
    setQuickLinks(isBookmarked(link.url) ? quickLinks.filter((l) => l.url !== link.url) : [...quickLinks, link]);

  // Links only render/star as clickable once the background confirms the exact hostname is on the DefiLlama allowlist.
  // Guards against a tampered storage entry pointing a saved tile at a look-alike phishing domain.
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  const isVerified = (url: string) => verified[url] === true;
  // stored icon URLs are only honoured from our own CDN; anything else falls back to the letter avatar
  const safeIcon = (icon?: string) => (icon?.startsWith("https://icons.llamao.fi/") ? icon : undefined);
  useEffect(() => {
    const urls = [...quickLinks.map((l) => l.url), ...searchResults.map((r) => r.route)].filter((u) => !(u in verified));
    if (!urls.length) return;
    Browser.runtime.sendMessage({ type: "VERIFY_URLS", urls }).then((res) => setVerified((v) => ({ ...v, ...res }))).catch(() => {});
  }, [quickLinks, searchResults]);

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setSearched(false);
    setActiveIndex(-1);
  };

  const debouncedSearch = useMemo(() => {
    let seq = 0; // drop out-of-order responses so a slow "aa" reply can't overwrite the newer "aave" results
    return debounce(async (q: string) => {
      const mine = ++seq;
      let hits: { name: string; logo: string; route: string }[] = [];
      try {
        const res = await fetch(SEARCH_API, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${SEARCH_API_KEY}` },
          body: JSON.stringify({ queries: [{ indexUid: "directory", q, limit: 5 }] }),
        }).then((r) => r.json());
        hits = (res?.results?.[0]?.hits ?? []).filter((h: { route?: string }) => h.route);
      } catch (error) {
        console.error("Search failed:", error);
      }
      if (mine !== seq) return;
      setSearchResults(hits);
      setSearched(true);
      setActiveIndex(-1);
    }, 200);
  }, []);

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return clearSearch();
    if (!searchResults.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? searchResults.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      const item = searchResults[activeIndex === -1 ? 0 : activeIndex];
      window.open(item.route, "_blank", "noopener");
      clearSearch();
    }
  };

  const statusColor = siteStatus?.isBlocked ? "red.400" : siteStatus?.isTrusted ? "green.400" : "gray.400";
  const dropdownBg = useColorModeValue("white", "gray.700");
  const activeBg = useColorModeValue("gray.50", "gray.600");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const panelBg = useColorModeValue("gray.100", "gray.700"); // dark body is gray.800, so the panel needs to be lighter to show
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const tileProps = { p: "2", borderRadius: "md", _hover: { bg: hoverBg }, transition: "background 0.15s" } as const;
  const { colorMode, toggleColorMode } = useColorMode();

  const [priceInjector, setPriceInjector] = useBrowserStorage("local", "settings:priceInjector", true);
  const [tagsInjector, setTagsInjector] = useBrowserStorage("local", "settings:tagsInjector", true);
  const [explorerSpamHide, setExplorerSpamHide] = useBrowserStorage("local", "settings:explorerSpamHide", false);

  const [phishingDetector, setPhishingDetector] = useBrowserStorage("local", "settings:phishingDetector", true);
  const [phishingFuzzyMatch, setPhishingFuzzyMatch] = useBrowserStorage("local", "settings:phishingFuzzyMatch", false);
  const [twitterEnabled, setTwitterEnabled] = useBrowserStorage("local", "settings:twitterEnabled", true);
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
    <VStack align="stretch" spacing="4" w="xs" p="4" userSelect="none">
      {/* Header */}
      <HStack justify="space-between">
        <Link href="https://defillama.com/" isExternal _hover={{ textDecoration: "none" }}>
          <HStack spacing="2">
            <Image src={cute} alt="Cute Llama" w="8" />
            <Text fontSize="lg" fontWeight="bold">DefiLlama</Text>
          </HStack>
        </Link>
        <IconButton
          aria-label="Toggle light/dark mode"
          icon={colorMode === "dark" ? <SunIcon /> : <MoonIcon />}
          size="sm"
          variant="ghost"
          onClick={toggleColorMode}
        />
      </HStack>

      {/* Current site status */}
      {siteStatus?.hostname && (
        <HStack px="3" py="2" spacing="2" borderRadius="md" bg={panelBg} title={siteStatus.reason}>
          <Box w="2" h="2" borderRadius="full" bg={statusColor} flexShrink={0} />
          <Text fontSize="xs" fontWeight="semibold" noOfLines={1}>{siteStatus.hostname}</Text>
          <Text fontSize="xs" color="gray.500" noOfLines={1} ml="auto" flexShrink={0}>{siteStatus.reason}</Text>
        </HStack>
      )}

      {/* Quick Links */}
      <HStack w="full" justify="space-around" spacing={2}>
        <Link href="https://defillama.com/" isExternal _hover={{ textDecoration: "none" }}>
          <VStack spacing="1" {...tileProps}>
            <Image src={defillamaIcon} alt="DefiLlama" w="8" h="8" borderRadius="full" />
            <Text fontSize="xs">DeFiLlama</Text>
          </VStack>
        </Link>
        <Link href="https://swap.defillama.com/" isExternal _hover={{ textDecoration: "none" }}>
          <VStack spacing="1" {...tileProps}>
            <Image src={llamaswapIcon} alt="LlamaSwap" w="8" h="8" borderRadius="full" />
            <Text fontSize="xs">LlamaSwap</Text>
          </VStack>
        </Link>
        <Link href="https://llamapay.io/dashboard" isExternal _hover={{ textDecoration: "none" }}>
          <VStack spacing="1" {...tileProps}>
            <Image src={llamapayIcon} alt="LlamaPay" w="8" h="8" borderRadius="full" />
            <Text fontSize="xs">LlamaPay</Text>
          </VStack>
        </Link>
        <Link href="https://defillama.com/research" isExternal _hover={{ textDecoration: "none" }}>
          <VStack spacing="1" {...tileProps}>
            <Image src={defillamaIcon} alt="Research" w="8" h="8" borderRadius="full" />
            <Text fontSize="xs">Research</Text>
          </VStack>
                  </Link>
        </HStack>

        {/* Search Box */}
        <Box w="full">
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search defillama directory..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                if (!value.trim()) {
                  clearSearch();
                } else {
                  debouncedSearch(value.trim());
                }
              }}
              onKeyDown={onSearchKeyDown}
              borderRadius="md"
              bg={dropdownBg}
            />
          </InputGroup>

          {/* Search Results */}
          {searched && searchTerm.trim() && (
            <Box mt="2" bg={dropdownBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
              {searchResults.length === 0 && (
                <Text px="3" py="2" fontSize="sm" color="gray.500">No results for “{searchTerm.trim()}”</Text>
              )}
              {searchResults.map((item, index) => (
                <Link
                  key={item.name + item.route}
                  href={item.route}
                  isExternal
                  display="block"
                  _hover={{ textDecoration: "none" }}
                  onClick={clearSearch}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <HStack
                    px="3"
                    py="2"
                    spacing="3"
                    bg={index === activeIndex ? activeBg : undefined}
                    borderTopWidth={index > 0 ? "1px" : "0"}
                    borderColor={borderColor}
                  >
                    <Image src={item.logo} alt="" w="7" h="7" borderRadius="full" flexShrink={0} bg={activeBg} />
                    <Box minW="0" flex="1">
                      <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{item.name}</Text>
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>{new URL(item.route).hostname}</Text>
                    </Box>
                    <IconButton
                      aria-label={isBookmarked(item.route) ? "Remove from my links" : isVerified(item.route) ? "Add to my links" : "Not on the DefiLlama whitelist"}
                      title={!isBookmarked(item.route) && !isVerified(item.route) ? "Not on the DefiLlama whitelist" : undefined}
                      icon={<StarIcon />}
                      size="xs"
                      variant="ghost"
                      color={isBookmarked(item.route) ? "yellow.400" : "gray.400"}
                      isDisabled={!isBookmarked(item.route) && (quickLinks.length >= MAX_LINKS || !isVerified(item.route))}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleBookmark({ url: item.route, name: item.name, icon: item.logo });
                      }}
                    />
                  </HStack>
                </Link>
              ))}
            </Box>
          )}
        </Box>

      {/* User quick links: bookmarks shown like the DefiLlama row above */}
      {quickLinks.length > 0 && (
        <Box w="full">
          <HStack justify="space-between" mb="2">
            <SectionTitle>My links</SectionTitle>
            <Text fontSize="xs" color="gray.500">{quickLinks.length}/{MAX_LINKS}</Text>
          </HStack>
          <SimpleGrid columns={3} spacing={2}>
            {quickLinks.map((l) => (
              <Box key={l.url} role="group" position="relative">
                {/* only render as a clickable link once the background confirms the host is on the DefiLlama allowlist */}
                {isVerified(l.url) ? (
                  <Link href={l.url} isExternal _hover={{ textDecoration: "none" }}>
                    <VStack spacing="1" {...tileProps}>
                      <Avatar size="sm" name={l.name} src={safeIcon(l.icon)} />
                      <Text fontSize="xs" noOfLines={1} maxW="full">{l.name}</Text>
                    </VStack>
                  </Link>
                ) : (
                  <VStack spacing="1" p="2" opacity={0.5} title={verified[l.url] === false ? "Not on the DefiLlama whitelist. Remove this link." : "Verifying…"}>
                    <Avatar size="sm" name={l.name} src={safeIcon(l.icon)} />
                    <Text fontSize="xs" noOfLines={1} maxW="full" color={verified[l.url] === false ? "red.400" : undefined}>{l.name}</Text>
                  </VStack>
                )}
                <IconButton
                  aria-label={`Remove ${l.name}`}
                  icon={<SmallCloseIcon />}
                  size="xs"
                  variant="ghost"
                  position="absolute"
                  top="-1"
                  right="0"
                  opacity={0}
                  _groupHover={{ opacity: 1 }}
                  onClick={() => setQuickLinks(quickLinks.filter((x) => x.url !== l.url))}
                />
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}

      <Divider />

      {/* Footer */}
      <HStack justify="space-between">
        <HStack spacing="3" color="gray.500">
          <Link href="https://discord.defillama.com" isExternal p="1" borderRadius="md" _hover={{ bg: hoverBg, color: "inherit" }}><Icon as={FaDiscord} w="5" h="5" display="block" /></Link>
          <Link href="https://x.com/defillama" isExternal p="1" borderRadius="md" _hover={{ bg: hoverBg, color: "inherit" }}><Icon as={FaXTwitter} w="5" h="5" display="block" /></Link>
          <Link href="https://github.com/defillama/defillama-extension" isExternal p="1" borderRadius="md" _hover={{ bg: hoverBg, color: "inherit" }}><Icon as={FaGithub} w="5" h="5" display="block" /></Link>
        </HStack>
        <Link href="https://github.com/DefiLlama/url-directory" isExternal fontSize="xs" color="gray.500">
          Submit a whitelist domain
        </Link>
      </HStack>

      {/* Settings, collapsed by default */}
      <Box>
        <HStack as="button" w="full" justify="space-between" px="2" py="1.5" borderRadius="md" _hover={{ bg: hoverBg }} transition="background 0.15s" onClick={() => setSettingsOpen(!settingsOpen)}>
          <SectionTitle>Settings</SectionTitle>
          <Icon as={settingsOpen ? ChevronUpIcon : ChevronDownIcon} color="gray.500" />
        </HStack>
        <Collapse in={!!settingsOpen} unmountOnExit>
          <VStack align="stretch" spacing="0" mt="1">
            <Text fontSize="xs" fontWeight="bold" px="2" pt="2" pb="1">Twitter</Text>
            <SettingRow hoverBg={hoverBg} label="Enable Twitter features" checked={twitterEnabled} onChange={(v) => { setTwitterEnabled(v); if (!v) Browser.action.setIcon({ path: cuteStatic }); }} />
            <SettingRow hoverBg={hoverBg} label="Mitigate phishing scams" disabled={!twitterEnabled} checked={phishingHandleDetector} onChange={(v) => { setPhishingHandleDetector(v); if (!v) Browser.action.setIcon({ path: cuteStatic }); }} />
            <SettingRow hoverBg={hoverBg} label="Hide cash tags" disabled={!twitterEnabled} checked={twitterCashTags} onChange={setTwitterCashTags} />
            <SettingRow hoverBg={hoverBg} label="Hide hash tags" disabled={!twitterEnabled} checked={twitterHashTags} onChange={setTwitterHashTags} />
            <SettingRow hoverBg={hoverBg} label="Hide QT" disabled={!twitterEnabled} checked={twitterQT} onChange={setTwitterQT} />
            <SettingRow hoverBg={hoverBg} label="Hide bot replies" disabled={!twitterEnabled} checked={twitterBotReplies} onChange={setTwitterBotReplies} />

            <Text fontSize="xs" fontWeight="bold" px="2" pt="3" pb="1">Explorer</Text>
            <SettingRow hoverBg={hoverBg} label="Address tags" checked={tagsInjector} onChange={setTagsInjector} />
            <SettingRow hoverBg={hoverBg} label="Token prices" checked={priceInjector} onChange={setPriceInjector} />
            <SettingRow hoverBg={hoverBg} label="Hide scam transactions" checked={explorerSpamHide} onChange={setExplorerSpamHide} />

            <Text fontSize="xs" fontWeight="bold" px="2" pt="3" pb="1">Phishing protection</Text>
            <SettingRow hoverBg={hoverBg} label="Phishing detection" checked={phishingDetector} onChange={(v) => { setPhishingDetector(v); if (!v) Browser.action.setIcon({ path: cuteStatic }); }} />
            <SettingRow hoverBg={hoverBg} label="Fuzzy domain matching" checked={phishingFuzzyMatch} onChange={setPhishingFuzzyMatch} />
          </VStack>
        </Collapse>
      </Box>

      <HStack justify="space-between" fontSize="xs" color="gray.500">
        <Text>Search powered by <Link href="https://search.defillama.com/" isExternal>LlamaSearch</Link></Text>
        <Text>v{packageJson.version}</Text>
      </HStack>
    </VStack>
  );
};

export default Popup;
