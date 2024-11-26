import { useEffect, useRef, useState } from "react";
import _ from "lodash";
import { TCSCAN, TSOCR } from "./ghdfyddl";
import ClipLoader from "react-spinners/ClipLoader";

function App() {
  const [localStream, setLocalStream] = useState();
  const [cams, setCams] = useState();
  const videoRef = useRef(null);
  const canvasRef0 = useRef(null);
  // const canvasRef1 = useRef(null);
  const [deviceId, setDeviceId] = useState("");
  const [result, setResult] = useState("");
  const [format, setFormat] = useState("code_128");
  const [scannedFormat, setScannedFormat] = useState("");
  const [scanning, setScanning] = useState(false);

  const [tryCount, setTryCount] = useState(0);
  const [hasFilter, setHasFilter] = useState();

  const [height, setHeight] = useState(200);
  const [width, setWidth] = useState(0);
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);

  const [ocrString, setOcrString] = useState("");
  const [lot, setLot] = useState("");
  const [june, setJune] = useState("");
  const [token, setToken] = useState("");
  useEffect(() => {
    // 1. check permission.
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(async (p) => {
        if (p.active) {
          const devices = _.map(
            _.filter(await navigator.mediaDevices.enumerateDevices(), (d) => d.kind === "videoinput"),
            (d, i) => {
              return {
                name: `${d.label} (${i})`,
                enable: true,
                deviceId: d.deviceId,
              };
            }
          );
          // console.log({ devices });
          if (devices.length === 1) devices.push(devices[0]);

          // 망원 카메라 제거
          const rejected = _.reject(devices, (d) => d.name.indexOf("망원") > -1);
          setCams(rejected);
          setDeviceId(_.get(_.last(rejected), "deviceId", ""));
        }
      })
      .catch((e) => {
        console.error({ e });
      });
    return () => {
      if (videoRef?.current) {
        videoRef.current.srcObject = null;
      }
      if (localStream) {
        localStream.getVideoTracks().forEach((track) => {
          localStream.removeTrack(track);
          track.stop();
        });
      }
    };
  }, []);

  useEffect(() => {
    if (deviceId && cams.length)
      navigator.mediaDevices
        .getUserMedia({ video: { deviceId } })
        .then((stream) => {
          console.log(_.get(_.find(cams, { deviceId }), "name"), "is streaming.");
          setCams(
            _.chain(cams)
              .map((cam) => {
                if (cam.deviceId === deviceId) {
                  cam.enable = true;
                }
                return cam;
              })
              .value()
          );
          setLocalStream(stream);
        })
        .catch((e) => {
          setCams(
            _.chain(cams)
              .map((cam) => {
                if (cam.deviceId === deviceId) {
                  cam.enable = false;
                }
                return cam;
              })
              .value()
          );
        });
  }, [deviceId]);

  useEffect(() => {
    if (videoRef?.current && localStream) videoRef.current.srcObject = localStream;
    setOcrString("");
  }, [localStream]);

  useEffect(() => {
    if (!ocrString) return;
    let lots = [];
    let beforeEqLOT = false;
    console.log({ ocrString }, _.split(ocrString, ","));
    _.forEach(_.split(ocrString, ","), (s) => {
      console.log(beforeEqLOT, s);
      if (!beforeEqLOT && s === "LOT") beforeEqLOT = true;
      else if (beforeEqLOT) {
        lots.push(s);
        beforeEqLOT = false;
      }
    });

    setLot(_.uniq(lots).join("\n"));
  }, [ocrString]);

  return (
    <div className="App" style={{ height: "100vh", overflow: "hidden" }}>
      <video
        style={{ position: "relative", left, top, zIndex: -1, overflow: "hidden" }}
        ref={videoRef}
        autoPlay
        playsInline={true}
        onPlay={(e) => {
          if (!left) setLeft((e.currentTarget.videoWidth - document.body.clientWidth) / -2);
          if (!top) setTop(e.currentTarget.videoHeight / -2 + 100);
          if (!width) setWidth(document.body.clientWidth);
        }}
      />
      {/* target 160px = width/2 + border */}
      <div style={{ position: "absolute", height, width, top: 0 }}></div>
      {/* preview */}
      <div style={{ position: "absolute", height, width, top: height }}>
        <canvas ref={canvasRef0} width={width} height={height} />
      </div>

      <div style={{ position: "absolute", backgroundColor: "#ffffff", width, top: height }}>
        <button
          disabled={scanning}
          style={{ width, height: "100px", opacity: scanning ? 0.8 : 0.9 }}
          onClick={async (e) => {
            if (!scanning) {
              console.time("TCSCANTCSCAN");
              setScanning(true);
              const scan = await TCSCAN(canvasRef0.current, videoRef.current, format, -left, -top, width, height);
              let line = result;
              const d = new Date();
              if (scan.format) line = scan.format + " : " + scan.code + "\n" + line;
              else line = d.toLocaleTimeString() + ` - not Found ${format}\n` + line;
              setResult(line);
              setScannedFormat(scan.format);
              setTryCount(scan.tryCount);
              setHasFilter(scan.hasFilter);
              setScanning(false);
              console.timeEnd("TCSCANTCSCAN");
            }
          }}
        >
          {!scanning && (
            <div>
              SCAN : {tryCount} {hasFilter === false ? "(ios safari)" : ""}
            </div>
          )}
          {scanning && "스캔 중...................."}
        </button>
        <textarea readOnly={true} rows={10} value={result} style={{ width: "98%" }}></textarea>
        <div>
          <select
            value={format}
            onChange={(e) => {
              setFormat(e.target.value);
            }}
          >
            <option value="all"> - all - </option>
            <option value="ean_13">ean_13</option>
            <option value="ean_13">ean_13</option>
            <option value="code_128">code_128</option>
            <option value="data_matrix">data_matrix</option>
            <option value="qr_code">qr_code</option>
            <option value="upc_a">upc_a</option>
            <option value="upc_e">upc_e</option>
          </select>
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
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <input
            type="text"
            value={june}
            onChange={(e) => {
              setJune(e.target.value);
            }}
          />
          <input
            type="text"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
            }}
          />
          &nbsp;&nbsp;
          <span
            onClick={() => {
              setToken("");
            }}
          >
            X
          </span>
        </div>
        {/* OCR */}
        {june === "june" && (
          <div style={{ marginTop: "10px", textAlign: "center" }}>
            <button disabled={scanning} style={{ height: "30px", opacity: scanning ? 0.8 : 0.9 }}>
              <label htmlFor="capture">OCR</label>
            </button>
            <input
              type="file"
              id="capture"
              // accept="image/*;capture=camera"
              style={{ display: "none" }}
              accept="image/*"
              capture="environment"
              onChange={async (e) => {
                if (e.currentTarget.files) {
                  setScanning(true);
                  setOcrString((await TSOCR(e.currentTarget.files[0], token)) || "");
                  setScanning(false);
                  e.target.value = null;
                }
              }}
            />
            <br />
            <br />
            <div style={{ maxWidth: "100vw" }}>
              <span style={{ wordWrap: "break-word" }}>{ocrString}</span>
            </div>
            <br />
            <br />
            <textarea readOnly={true} rows={3} value={lot} style={{ width: "98%" }}></textarea>
          </div>
        )}
      </div>
      <div style={{ position: "absolute", height: "80px", width, bottom: 0, textAlign: "center" }}>
        <span style={{ fontSize: "small" }}>
          Powered by lunch or billiards.
          {/* Powered by <span style={{ fontWeight: 900 }}>D</span>is<span style={{ fontWeight: 900 }}>M</span>ega<span style={{ fontWeight: 900 }}>W</span>orks */}
        </span>
      </div>

      {scanning && (
        <div style={{ position: "absolute", height: "80px", width, bottom: "50vh", textAlign: "center" }}>
          <ClipLoader color={"#ffee00"} loading={scanning} size={150} aria-label="Loading Spinner" data-testid="loader" />
        </div>
      )}
    </div>
  );
}

export default App;
