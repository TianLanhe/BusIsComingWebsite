import type { ReactNode } from "react";

export function AccessibleChartFrame({ title, summary, columns, rows, children }: {
  title: string;
  summary: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  children: ReactNode;
}) {
  return <figure className="accessible-chart-frame" aria-label={title}>
    {children}
    <div className="sr-only">
      <table aria-label={title}>
        <caption>{summary}</caption>
        <thead><tr>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </figure>;
}
