import { RouterProvider } from "react-router-dom";
import { useSessionKeeper } from "./hooks/useSessionKeeper";
import router from "./router";

function App() {
  useSessionKeeper();
  return <RouterProvider router={router} />;
}

export default App;

