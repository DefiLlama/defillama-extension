import { Image, Text, VStack, useColorMode } from "@chakra-ui/react";

export const TopSiteBlock = (props: { title: string; url: string }) => {
  const { title, url } = props;
  const { colorMode } = useColorMode();

  return (
    <VStack
      as="a"
      boxSize="24"
      rounded="4"
      p="1"
      userSelect="none"
      href={url}
      title={title} // system tooltip
      _hover={{ bg: colorMode === "light" ? "gray.200" : "gray.700" }}
      justifyContent="center"
    >
      <Image src={"https://icons.duckduckgo.com/ip3/" + new URL(url).hostname + ".ico"} boxSize="12" p="1" />
      <Text
        fontSize="xs"
        fontWeight="medium"
        whiteSpace="nowrap"
        textOverflow="ellipsis"
        overflow="hidden"
        w="20"
        textAlign="center"
      >
        {title}
      </Text>
    </VStack>
  );
};
