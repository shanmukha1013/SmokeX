import { ImageResponse } from "next/og";
import { dataUri, wordmarkSvg } from "./og-art";

export const alt = "SMOKE X — Turning ideas into products.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const wm = wordmarkSvg("#F3EFE4");
  const width = 820;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(70% 60% at 50% 0%, #00614C 0%, #01130F 70%)",
          color: "#F3EFE4",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 48, left: 60, fontSize: 18, letterSpacing: 6, color: "#5CC9A7", display: "flex" }}>
          A PERSONAL TECHNOLOGY ECOSYSTEM
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri(wm.svg)} width={width} height={(width * wm.h) / wm.w} alt="" />
        <div style={{ marginTop: 44, fontSize: 44, fontStyle: "italic", color: "#E9E3D3", display: "flex" }}>Turning ideas into products.</div>
        <div style={{ position: "absolute", bottom: 48, left: 60, right: 60, display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 4, color: "#9FE0CA" }}>
          <span>MARELLA SHANMUKHA REDDY · MSR</span>
          <span style={{ color: "#E34234" }}>●</span>
        </div>
      </div>
    ),
    size,
  );
}
