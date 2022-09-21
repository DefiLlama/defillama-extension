import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    console.log("extension content view loaded");
  }, []);

  return (
    <div className="content-view">dont mind me, im juss here letting u know ze extenshun hassa access to dis page</div>
  );
}
