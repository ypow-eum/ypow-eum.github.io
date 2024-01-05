import { useEffect } from "react";
import { useRouteError } from "react-router-dom";
import Loading from "./Loading";

export default function ErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);

    if (window.location.host === "ecp.misight.co.kr")
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
  }, [error]);

  return (
    <>
      <div id="error-page" style={{ position: "absolute", padding: "100px" }}>
        <br />
        <br />
        <br />
        {error.status}
        <br />
        <br />
        {error.statusText}
        <br />
        <br />
        {error.data}
        <br />
        <br />
        <br />
        <br />
      </div>
      <Loading />
    </>
  );
}
