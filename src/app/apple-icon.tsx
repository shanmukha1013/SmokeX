import { ImageResponse } from "next/og";
import { dataUri, markSvg } from "./og-art";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#01130F" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri(markSvg())} width={180} height={180} alt="" />
      </div>
    ),
    size,
  );
}
