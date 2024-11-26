import _ from "lodash";
import { BarcodeDetector, DetectedBarcode, BarcodeFormat } from "barcode-detector/pure";
// import dayjs from "dayjs";
// import "dayjs/plugin/customParseFormat";
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// dayjs.extend(require("dayjs/plugin/customParseFormat"));

export async function TCSCAN(canvas, video, left, top, width) {}

const wait = (s = 3) => new Promise((resolve) => setTimeout(resolve, s * 1000));
let ctx = undefined;
let detector = undefined;

export async function drawImage(canvas, video, left, top, width, ratio) {
  if (!ctx) {
    // console.log("create ctx");
    ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true, desynchronized: true });
    ctx.scale(ratio, ratio);
  }
  if (!detector) detector = new BarcodeDetector();
  // if (!detector) detector = new BarcodeDetector({ formats: ["data_matrix", "upc_a", "ean_13", "code_128"] });

  let result = null;
  let imgData = null;
  const canvasStyleWidth = _.toNumber(_.get(canvas, "style.width", "0").replace("px", ""));
  const drawLeft = left + (width - canvasStyleWidth) / 2;
  // console.log({ left, top, width, ratio });

  for (const contrast of [1]) {
    for (const grayscale of [1]) {
      for (const invert of [100, 0]) {
        for (const imageSmoothingEnabled of [true, false]) {
          imgData = null;
          ctx.imageSmoothingEnabled = imageSmoothingEnabled;
          if (ctx.filter) ctx.filter = "none";
          ctx.drawImage(video, drawLeft, top, canvas.width, canvas.width, 0, 0, canvas.width, canvas.width);
          result = await detector.detect(canvas);
          if (result.length) {
            // console.log(result);
            return result;
          }
          await wait(0.1);
          if (ctx.filter) {
            ctx.filter = `invert(${invert}%) grayscale(${grayscale}) contrast(${contrast})`;
            ctx.drawImage(video, drawLeft, top, canvas.width, canvas.width, 0, 0, canvas.width, canvas.width);
          } else {
            imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pix = imgData.data;
            const pixLen = pix.length;
            for (let pixel = 0; pixel < pixLen; pixel += 4) {
              if (grayscale) {
                pix[pixel + 2] = pix[pixel + 1] = pix[pixel] = (pix[pixel] + pix[pixel + 1] + pix[pixel + 2]) / 3;
              }
              if (invert) {
                pix[pixel] = 255 - pix[pixel]; // red
                pix[pixel + 1] = 255 - pix[pixel + 1]; // green
                pix[pixel + 2] = 255 - pix[pixel + 2]; // blue
              }
              // contrast
              if (contrast !== 1) {
                pix[pixel] = 128 + (pix[pixel] - 128) * contrast;
                pix[pixel + 1] = 128 + (pix[pixel + 1] - 128) * contrast;
                pix[pixel + 2] = 128 + (pix[pixel + 2] - 128) * contrast;
              }
            }
            ctx.putImageData(imgData, 0, 0);
          }
          result = await detector.detect(canvas);
          if (result.length) {
            // console.log(result);
            return result;
          }
          await wait(0.1);
        }
      }
    }
  }
}
