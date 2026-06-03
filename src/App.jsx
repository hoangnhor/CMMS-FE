import { RouterProvider } from "react-router-dom";
import { useBackendKeepAlive } from "./hooks/useBackendKeepAlive";
import { useSessionKeeper } from "./hooks/useSessionKeeper";
import router from "./router";

function App() {
  useSessionKeeper();
  useBackendKeepAlive();
  return <RouterProvider router={router} />;
}

export default App;
