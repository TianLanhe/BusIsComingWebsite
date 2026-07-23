import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export function AccessibleChartFrame({ title, summary, columns, rows, children }: {
  title: string;
  summary: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  children: ReactNode;
}) {
  const visual = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, { "aria-hidden": true })
    : <div aria-hidden="true">{children}</div>;
  return <figure className="accessible-chart-frame" aria-label={title}>
    {visual}
    <figcaption>{summary}</figcaption>
    <div className="sr-only">
      <table aria-label={title}>
        <caption>{summary}</caption>
        <thead><tr>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </figure>;
}
