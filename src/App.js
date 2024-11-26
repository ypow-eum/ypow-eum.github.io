import { useEffect, useRef, useState } from "react";
import _ from "lodash";
import { drawImage } from "./ghddlsdl";

function App() {
  const [cams, setCams] = useState([]);
  const videoRef = useRef(null);
  const canvasRef0 = useRef(null);
  const streamRef = useRef(null);
  const [deviceId, setDeviceId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [scanCountEmiiter, setScanCountEmiiter] = useState(0);

  const visibleHeight = 300; // 비디오가 보이는 영역의 높이
  const previewTop = visibleHeight / 4; // 스캔 영역의 marginTop
  const [canvasWidth, setCanvasWidth] = useState(0); // 스캔 영역의 넓이
  // const canvasOpacity = 0;
  // const centerTop = 40;

  const [ratio, setRatio] = useState(0);
  const [width, setWidth] = useState(0);
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const [ideal, setIdeal] = useState(1024);
  const [maxIdeal, setMaxIdeal] = useState(1024);
  // const [ideals, setIdeals] = useState([640, 800, 1024, 1280, 1360, 1440, 1600, 1920, 2048]);
  const ideals = [640, 800, 1024, 1152, 1280, 1360, 1366, 1400, 1440, 1600, 1680, 1920, 2048, 2560, 3840, 5120, 7680];

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then(async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCams(
          _.chain(devices)
            .filter({ kind: "videoinput" })
            .map((d, i) => {
              return {
                name: d.label,
                deviceId: d.deviceId,
              };
            })
            .value()
        );
      });
  }, []);

  useEffect(() => {
    if (window && window.innerWidth) {
      setWidth(window.innerWidth);
      setCanvasWidth(window.innerWidth / 1.2);
      setRatio(window.devicePixelRatio);
    }

    const getUserMedia = async () => {
      // console.log("getUserMedia", { maxIdeal, ideal });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId, width: { ideal } } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      // if (maxIdeal === 1024) {
      const track = _.first(videoRef.current.srcObject.getVideoTracks());
      if (!track) return;
      // console.log("getUserMedia getCapabilities", track.getCapabilities());
      // console.log("getUserMedia videoWidth", videoRef.current.videoWidth);
      setMaxIdeal(_.get(track.getCapabilities(), "width.max", 0));
      // }
    };

    if (cams.length)
      if (!deviceId) setDeviceId(_.last(cams).deviceId);
      else {
        releaseCam("getUserMedia", 1500, getUserMedia);
      }
  }, [cams, deviceId, ideal]);

  const releaseCam = (startedAt, wait = 1000, callback) => {
    startedAt = "## releaseCam ## " + startedAt + " " + wait;
    // setScanningStart(false);

    if (videoRef.current && videoRef.current.srcObject && videoRef.current.srcObject.getVideoTracks().length) {
      videoRef.current.srcObject.getVideoTracks().forEach((track) => {
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject.removeTrack(track);
          startedAt += " track.stop() ##### ";
          track.stop();
          if (callback) startedAt += " callback() #######";
          console.log(startedAt);
          if (callback) {
            setTimeout(() => {
              callback();
            }, wait);
          }
        }
      });
    } else {
      startedAt += " Empty #####";
      if (callback) startedAt += " callback() #######";
      console.log(startedAt);
      if (callback) callback();
    }
  };

  const [scanned, setScanned] = useState([]);

  useEffect(() => {
    const onScanning = async () => {
      const result = await drawImage(canvasRef0.current, videoRef.current, -left, -top + previewTop, width, ratio);
      if (result) {
        const concat = _.concat(scanned, result);
        // console.log(concat, result);
        setScanned(concat);
      }
      setScanCountEmiiter(scanCountEmiiter + 1);
    };
    if (scanning) onScanning();
  }, [scanning, scanCount]);

  useEffect(() => {
    if (scanCount > 999) setScanning(false);
    else setScanCount(scanning ? scanCount + 1 : 0);
  }, [scanCountEmiiter]);

  return (
    <div className="App" style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <video
        style={{
          position: "relative",
          top,
          left,
          maxWidth: 99999,
          zIndex: -1,
        }}
        ref={videoRef}
        autoPlay
        playsInline={true}
        onPlay={(e) => {
          // console.log("onPlay", e.currentTarget.videoWidth, e.currentTarget.videoHeight);
          setLeft((e.currentTarget.videoWidth - width) / -2);
          const videoHeight = e.currentTarget.videoHeight;
          setTop(videoHeight / -2 + previewTop / 2 + visibleHeight / 2);
          setScanning(true);
        }}
      />
      <div
        style={{
          position: "absolute",
          top: previewTop + "px",
          right: `${(width - canvasWidth) / 2}px`,
          zIndex: 99,
          border: "solid 1px red",
          backgroundColor: scanning ? "" : "orange",
        }}
        onClick={(e) => {
          if (!scanning) {
            setScanCount(0);
            setScanning(true);
          }
        }}
      >
        {!scanning && (
          <div style={{ position: "absolute", color: "black", top: "70px", width: "100%", height: "160px", textAlign: "center", zIndex: 100 }}>SCAN</div>
        )}
        <div className="scanningLineMove scanningLineFast250" style={{ position: "absolute", width: canvasWidth + "px", height: "5px" }}></div>
        <canvas ref={canvasRef0} width={canvasWidth * ratio} height={160 * ratio} style={{ width: `${canvasWidth}px`, height: "160px", opacity: 0 }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: visibleHeight - 50 + "px",
          right: "0px",
          height: "50px",
          backgroundColor: "black",
          width: "110px",
          color: "whitesmoke",
          paddingRight: "10px",
          textAlign: "right",
        }}
      >
        <select
          value={_.get(videoRef, "current.videoWidth", ideal)}
          onChange={(e) => {
            setIdeal(e.target.value);
          }}
        >
          {_.map(
            _.filter(ideals, (i) => i <= maxIdeal),
            (v, i) => (
              <option key={i} value={v}>
                {v}
              </option>
            )
          )}
        </select>
        &nbsp;&nbsp;{scanCount}
        <br />
        {!!videoRef.current && (
          <div>
            {videoRef.current.videoWidth} x {videoRef.current.videoHeight}
          </div>
        )}
      </div>
      <div style={{ position: "absolute", top: visibleHeight + "px", height: "1000px", backgroundColor: "black", width: "100%" }}>
        <div style={{ color: "whitesmoke", margin: "10px 0px 10px 20px" }}>
          <select
            value={deviceId}
            onChange={(e) => {
              setDeviceId(e.target.value);
            }}
          >
            {_.map(cams, (cam, i) => (
              <option key={i} value={cam.deviceId}>
                {i + 1}. {cam.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ color: "whitesmoke", margin: "10px 0px 10px 20px" }}>1D 2D 바코드 스캐너 ::: brdn.cel@gmail.com :::</div>
        {_.chain(scanned)
          .groupBy("rawValue")
          .sortBy()
          .map((list, i) => {
            return (
              <div key={i} style={{ color: "white", padding: "0px 10px 10px 10px", overflow: "hidden" }}>
                <span style={{ fontSize: "15px" }}>
                  {_.first(list).format} ({list.length})
                </span>{" "}
                <span style={{ fontSize: "12px" }}>{_.first(list).rawValue}</span>
              </div>
            );
          })
          .value()}
      </div>
    </div>
  );
}

export default App;
