import React from "react";
import type { RelevantMarker } from "../types";

interface ChartSummaryProps {
  markers: RelevantMarker[];
  problem: string;
}

const STATUS_COLORS = {
  abnormal:  "#ef4444",
  borderline: "#f59e0b",
  normal:    "#22c55e",
} as const;

const Marker: React.FC<{ m: RelevantMarker }> = ({ m }) => (
  <span
    style={{
      color: STATUS_COLORS[m.status],
      fontWeight: 700,
      textDecoration: "underline",
      textDecorationStyle: "dotted",
      textUnderlineOffset: "3px",
    }}
  >
    {m.name}
  </span>
);

const StatusWord: React.FC<{ status: RelevantMarker["status"]; text: string }> = ({
  status,
  text,
}) => (
  <span style={{ color: STATUS_COLORS[status], fontWeight: 600 }}>{text}</span>
);

const Problem: React.FC<{ name: string; color: string }> = ({ name, color }) => (
  <span
    style={{
      color,
      fontWeight: 600,
      textDecoration: "underline",
      textDecorationStyle: "solid",
      textUnderlineOffset: "3px",
    }}
  >
    {name}
  </span>
);

const Count: React.FC<{ n: number; color: string }> = ({ n, color }) => (
  <span style={{ fontWeight: 700, color }}>{n}</span>
);

export const ChartSummary: React.FC<ChartSummaryProps> = ({ markers, problem }) => {
  const def       = "var(--color-text-default, #111)";
  const secondary = "var(--color-text-secondary, #6b7280)";

  const abnormal   = markers.filter((m) => m.status === "abnormal");
  const borderline = markers.filter((m) => m.status === "borderline");
  const flagged    = [...abnormal, ...borderline];
  const total      = markers.length;
  const worst      = abnormal[0] ?? borderline[0];

  // Derive a single accent color for the problem underline from the overall concern
  const accentColor =
    abnormal.length >= 2   ? "#ef4444" :
    abnormal.length === 1  ? "#f59e0b" :
    borderline.length >= 1 ? "#f59e0b" :
                             "#22c55e";

  let body: React.ReactNode;

  if (flagged.length === 0) {
    body = (
      <>
        All <Count n={total} color="#22c55e" /> markers relevant to your{" "}
        <Problem name={problem} color="#22c55e" /> are within normal range.{" "}
        Nothing in your blood work stands out as a likely contributor.
      </>
    );
  } else {
    // — Count sentence —
    const countSentence =
      flagged.length === 1 ? (
        <>
          <Count n={1} color={STATUS_COLORS[flagged[0].status]} /> of{" "}
          <Count n={total} color={def} /> markers —{" "}
          <Marker m={flagged[0]} /> — is{" "}
          <StatusWord
            status={flagged[0].status}
            text={
              flagged[0].status === "abnormal"
                ? "flagged as abnormal"
                : "sitting at borderline levels"
            }
          />
          .
        </>
      ) : (
        <>
          <Count n={flagged.length} color={accentColor} /> of{" "}
          <Count n={total} color={def} /> markers are outside normal range:{" "}
          {flagged.map((m, i) => (
            <span key={m.name}>
              <Marker m={m} />
              {i < flagged.length - 1 ? ", " : ""}
            </span>
          ))}
          .
        </>
      );

    // — Impact sentence —
    const impactSentence = worst ? (
      <>
        {" "}
        <Marker m={worst} /> is the most notable — {worst.relevanceNote}
      </>
    ) : null;

    // — Shape sentence —
    const shapeSentence =
      flagged.length >= 3 ? (
        <>
          {" "}The chart shows a noticeably uneven shape, pointing to multiple
          concerns related to your <Problem name={problem} color={accentColor} />.
        </>
      ) : flagged.length === 2 ? (
        <>
          {" "}The two dips in the chart reflect these markers pulling the shape
          inward for your <Problem name={problem} color={accentColor} />.
        </>
      ) : (
        <>
          {" "}The chart is mostly balanced with a single dip at{" "}
          {worst && <Marker m={worst} />}.
        </>
      );

    body = (
      <>
        {countSentence}
        {impactSentence}
        {shapeSentence}
      </>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        gap: 10,
      }}
    >
      <p
        style={{
          fontWeight: 700,
          fontSize: 11,
          color: def,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        Summary
      </p>
      <p style={{ color: secondary, fontSize: 13, lineHeight: 1.7, margin: 0 }}>
        {body}
      </p>
    </div>
  );
};
