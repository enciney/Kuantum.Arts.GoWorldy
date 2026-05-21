// SRC-TPC-002: Arama sonuçlarında query match'lerini sarı arka planla vurgular.
import React from "react";
import { Text, TextStyle } from "react-native";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlight(
  text: string,
  query: string,
  baseStyle?: TextStyle,
  highlightStyle: TextStyle = { backgroundColor: "#FEF08A", color: "#854D0E" }
): React.ReactNode {
  const q = query.trim();
  if (q.length < 2) return text;
  const parts = text.split(new RegExp(`(${escapeRegex(q)})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase()
      ? <Text key={i} style={[baseStyle, highlightStyle]}>{p}</Text>
      : <Text key={i} style={baseStyle}>{p}</Text>
  );
}
