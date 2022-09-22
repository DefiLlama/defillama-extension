import logo from "@assets/img/logo.svg";
import { Box, Image, Text } from "@chakra-ui/react";

const Popup = () => {
  return (
    <Box w="sm">
      <Image src={logo} alt="logo" />
      <Text>hello</Text>
    </Box>
  );
};

export default Popup;
