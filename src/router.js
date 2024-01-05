import {
  createBrowserRouter,
  createRoutesFromElements,
  redirect,
  Route,
} from "react-router-dom";
import Loading from "./Loading";
import ErrorPage from "./ErrorPage";
import Scan from "./Page/Test/Scan";

const rootLoader = async () => {
  return false;
};

const testLoader = async ({ params }) => {
  return false;
};

const root = createRoutesFromElements(
  <Route path="/" loader={rootLoader} errorElement={<ErrorPage />}>
    <Route path="" element={<Scan />} />
  </Route>
);

const router = createBrowserRouter([
  ...root,
  {
    path: "/loading",
    element: <Loading />,
  },
  // {
  //   path: "/test",
  //   loader: testLoader,
  //   element: <Scanner />,
  // },
]);

export default router;
