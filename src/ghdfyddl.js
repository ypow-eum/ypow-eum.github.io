import _ from "lodash";
import axios from "axios";
import { BarcodeDetector } from "barcode-detector/pure";

const url = "https://dev-api.cvpro.co.kr";
// const url = "http://localhost:3000";

// const isSafari = () => _.has(window, "safari") || navigator.userAgent.indexOf("iPhone") > 0;

// const blur = [0, 0.5, 1, 1.5, 2]; //, 3];
// const contrast = [1, 1.5, 2, 2.5]; //, 5];
const wait = (s = 3) => new Promise((resolve) => setTimeout(resolve, s * 1000));

// export declare const BARCODE_FORMATS: ("aztec" | "code_128" | "code_39" | "code_93" | "codabar" | "databar" | "databar_expanded" | "data_matrix" | "dx_film_edge" | "ean_13" | "ean_8" | "itf" | "maxi_code" | "micro_qr_code" | "pdf417" | "qr_code" | "rm_qr_code" | "upc_a" | "upc_e" | "linear_codes" | "matrix_codes" | "unknown")[];

export async function TCSCAN(canvas, video, format, left, top, width, height) {
  let result;
  for (const whileCount of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    console.log({ whileCount });
    console.time("getCodeFromVideo");
    result = await getCodeFromVideo(canvas, video, format, left, top, width, height);
    console.timeEnd("getCodeFromVideo");
    if (result.format) break;
    // await wait(0.1);
  }
  return result;
}

export async function getCodeFromVideo(canvas, video, format, left, top, width, height) {
  if (!canvas || !video) return null;

  // const videoWidth = video.videoWidth;
  // const videoHeight = video.videoHeight;
  const barcodeDetector = format === "all" ? new BarcodeDetector() : new BarcodeDetector({ formats: [format] });

  const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });

  // const bodyWidth = _.get(document, "body.clientWidth");
  // const x = videoWidth / 4 + (bodyWidth - 300) / 2; // 300: boxWidth
  // const y = videoHeight / 2 + 10; // 10: border

  const hasFilter = !!ctx.filter; // safari has no filter.
  let detected = [];
  let tryCount = 0;
  for (const five of [1, 2, 3, 4, 5]) {
    // ctx.drawImage(video, x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, left, top, width, height, 0, 0, canvas.width, canvas.height);
    detected = await barcodeDetector.detect(canvas);
    tryCount = five;
    if (detected.length) break;
    await wait(0.07);
  }
  if (!detected.length)
    if (hasFilter) {
      for (const contrast of [1.5, 1.2, 1]) {
        for (const blur of [1, 0.5, 0]) {
          for (const grayscale of [1, 0]) {
            for (const invert of format === "data_matrix" ? [100, 0] : [0, 0]) {
              for (const imageSmoothingEnabled of [true, false]) {
                ctx.imageSmoothingEnabled = imageSmoothingEnabled;
                const filter = `invert(${invert}%) grayscale(${grayscale}) blur(${blur}px) contrast(${contrast})`;
                ctx.filter = filter;
                // ctx.drawImage(video, x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, left, top, width, height, 0, 0, canvas.width, canvas.height);
                detected = await barcodeDetector.detect(canvas);
                tryCount++;
                if (detected.length) {
                  console.log(tryCount, filter, "imageSmoothingEnabled:", imageSmoothingEnabled);
                  if (detected.length > 1) console.log({ detected });
                  break;
                }
              }
              if (detected.length) break;
            }
            if (detected.length) break;
          }
          if (detected.length) break;
        }
        if (detected.length) break;
      }
    } else {
      for (const contrast of [1.5, 1.2, 1]) {
        for (const grayscale of [true, false]) {
          for (const invert of format === "data_matrix" ? [true, false] : [false, false]) {
            for (const imageSmoothingEnabled of [false, true]) {
              ctx.imageSmoothingEnabled = imageSmoothingEnabled;
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
                if (contrast > 1) {
                  pix[pixel] = 128 + (pix[pixel] - 128) * contrast;
                  pix[pixel + 1] = 128 + (pix[pixel + 1] - 128) * contrast;
                  pix[pixel + 2] = 128 + (pix[pixel + 2] - 128) * contrast;
                }

                // no blur
              }
              ctx.putImageData(imgData, 0, 0);
              detected = await barcodeDetector.detect(canvas);

              tryCount++;
              if (detected.length) {
                console.log(tryCount, imageSmoothingEnabled, invert, grayscale, contrast);
                if (detected.length > 1) console.log({ detected });
                break;
              }
            }
            if (detected.length) break;
          }
          if (detected.length) break;
        }
        if (detected.length) break;
      }
    }

  if (!detected.length)
    for (const five of [1000, 1000, 1000, 1000, 1000]) {
      ctx.filter = "";
      ctx.drawImage(video, left, top, width, height, 0, 0, canvas.width, canvas.height);
      detected = await barcodeDetector.detect(canvas);
      tryCount = five + tryCount;
      if (detected.length) break;
      await wait(0.06);
    }

  // console.log({ tryCount });

  const detected_format = _.get(detected, "[0].format", "");
  const code = _.get(detected, "[0].rawValue", "");

  return { format: detected_format, code, tryCount, hasFilter };
}

export async function TSOCR(attachedFile, token) {
  const { name: fileName, size, type: contentType } = attachedFile;
  try {
    // 업로드용 s3 url
    const putUrlData = await axios({
      method: "get",
      url: url + "/product/OCR/getPutURL",
      headers: {
        Authorization: "Bearer " + token,
      },
      params: { fileName, contentType },
    });

    const Key = _.get(putUrlData, "data.Key");
    const putUrl = _.get(putUrlData, "data.putUrl");

    if (!Key || !putUrl) return;

    // upload
    const uploadRes = await fetch(putUrl, {
      method: "PUT",
      body: attachedFile,
      headers: { "Content-type": contentType },
    });
    if (!uploadRes.ok) {
      console.error("upload error.");
      return;
    }

    const result = await axios({
      method: "get",
      url: url + "/product/OCR/product",
      headers: {
        Authorization: "Bearer " + token,
      },
      params: { Key, userSeq: 58200904010 },
    });
    console.log({ result });
    return (
      _.get(result, "data.EXP", "") +
      _.get(result, "data.GTIN", "") +
      _.get(result, "data.LOT", "") +
      _.get(result, "data.UPC", "") +
      _.get(result, "data.dataMatrix", "") +
      _.get(result, "data.message", "")
    );
  } catch (e) {
    return "토큰이 만료되거나 틀림.";
  }
}
