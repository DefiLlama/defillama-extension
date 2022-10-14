import { Box, Text } from "@chakra-ui/react";
import { useBrowserStorage } from "@src/pages/libs/hooks";
import React from "react";

type ClockFormat = "12" | "24";

export const Clock = () => {
  const [now, setNow] = React.useState<Date>();
  const [clockFormat, setClockFormat] = useBrowserStorage<ClockFormat>("local", "newtab:clockFormat", "12");

  const toggleClockFormat = () => {
    switch (clockFormat) {
      case "12":
        return setClockFormat("24");
      case "24":
        return setClockFormat("12");
    }
  };

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "numeric",
        hourCycle: clockFormat === "12" ? "h12" : clockFormat === "24" ? "h23" : undefined,
      }),
    [clockFormat],
  );

  const formattedTime = React.useMemo(() => formatter.formatToParts(now).map((t) => t.value), [formatter, now]);

  return (
    <Box px="4">
      <Text cursor="pointer" onClick={toggleClockFormat} userSelect="none" fontSize="lg" fontWeight="bold">
        {formattedTime}
      </Text>
    </Box>
  );
};
