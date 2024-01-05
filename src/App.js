import { ChakraProvider } from "@chakra-ui/react";
import "./App.css";
import router from "./router.js";
import { RouterProvider } from "react-router-dom";
import Loading from "./Loading";

function App() {
  return (
    <ChakraProvider>
      <RouterProvider router={router} fallbackElement={<Loading />} />
    </ChakraProvider>
  );
}

export default App;
