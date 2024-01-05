import { Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { CircleLoader } from "react-spinners";
import { toast } from "react-toastify";
// import { ecpSession } from 'utils/ecpSession';

export default function Loading() {
  const [opacity, setOpacity] = useState(0.1);
  const size = 200;
  useEffect(() => {
    setTimeout(() => {
      setOpacity(0.2);
      setTimeout(() => {
        setOpacity(0.4);
        setTimeout(() => {
          setOpacity(0.6);
          setTimeout(() => {
            setOpacity(0.8);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);

    const networkCheck = async () => {
      const itv = setInterval(async () => {
        try {
          await fetch(process.env.REACT_APP_API + "/kakao");
          clearInterval(itv);
          window.location.href = "/";
        } catch (e) {
          console.error(e);
        }
      }, 5000);
    };
    if (window.location.search.indexOf("ERR") > -1) networkCheck();
    if (window.location.search.indexOf("eum") > -1) {
      console.log({ search: window.location.search });
      if (window.location.search === "?eum=showmethetest") {
        // ecpSession.development.set('1');
        window.location.href = "/test";
      }
    }
  }, []);
  const [password, setPassword] = useState("");
  return (
    <div style={{ position: "relative", height: "90vh" }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          margin: `-${size / 2}px 0 0 -${size / 2}px`,
          opacity,
        }}
      >
        <CircleLoader size={200} color={"#f58025"} speedMultiplier={0.8} />
      </div>
      {window.location.hostname !== "ecp.misight.co.kr" && (
        <Input
          style={{
            position: "absolute",
            top: "30%",
            opacity: 0.1,
          }}
          value={password}
          onChange={(e) => {
            // if (e.target.value === 'showmethetest') {
            //   ecpSession.development.set('2');
            //   window.location.href = '/test';
            // }
            // if (e.target.value === 'showmethesite') {
            //   ecpSession.development.set('1');
            //   window.location.href = '/';
            // }
            setPassword(e.target.value);
          }}
        />
      )}
    </div>
  );
}
