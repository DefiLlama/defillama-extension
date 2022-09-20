import {
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Heading,
  Select,
  HStack,
  Image,
  Box,
  Container,
  FormControl,
  FormLabel,
  Icon,
} from "@chakra-ui/react";
import { DEFAULT_SEARCH_ENGINES, SearchEngine, usePersistentState } from "../utils";

export const SettingsModal = (props: {
  settingsModal: {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onToggle: () => void;
    isControlled: boolean;
    getButtonProps: (props?: any) => any;
    getDisclosureProps: (props?: any) => any;
  };
}) => {
  const { settingsModal } = props;
  const [searchEngine, setSearchEngine] = usePersistentState<SearchEngine>("searchEngine", DEFAULT_SEARCH_ENGINES[0]);

  return (
    <Modal onClose={settingsModal.onClose} isOpen={settingsModal.isOpen} isCentered>
      <ModalOverlay />
      <ModalContent px="2" py="4">
        <ModalCloseButton />
        <ModalBody>
          {/* <FormControl> */}
          <Heading as="h2" fontSize="lg" fontWeight="semibold">
            Search Engine
          </Heading>
          <Select
            name="SearchEngine"
            colorScheme="blue"
            value={searchEngine.name}
            mt="4"
            onChange={(event) => {
              setSearchEngine(
                DEFAULT_SEARCH_ENGINES.find((engine) => engine.name === event.target.value) ||
                  DEFAULT_SEARCH_ENGINES[0],
              );
            }}
          >
            {DEFAULT_SEARCH_ENGINES.map((x) => (
              <option value={x.name} key={x.name}>
                {x.name}
              </option>
            ))}
          </Select>
          {/* </FormControl> */}
        </ModalBody>
        <ModalFooter>
          <Button onClick={settingsModal.onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
