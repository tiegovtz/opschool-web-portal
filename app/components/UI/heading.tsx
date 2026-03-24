import React from "react";

export default function Heading({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-bold text-picton-blue-700">{children}</h1>;
}
