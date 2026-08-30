import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatEvalBreakdownMarkdown,
  formatEvalMarkdownTable,
  runAllEvalCases,
} from "./run-eval";

describe("eval reporting", () => {
  it("formats a markdown results table with means", () => {
    const results = runAllEvalCases();
    const table = formatEvalMarkdownTable(results);
    assert.match(table, /E01/);
    assert.match(table, /E09/);
    assert.match(table, /Mean baseline SQS/);
    assert.match(table, /Mean \+TripMate SQS/);
    assert.match(table, /Mean Δ/);
  });

  it("formats a dimension breakdown table", () => {
    const results = runAllEvalCases();
    const breakdown = formatEvalBreakdownMarkdown(results);
    assert.match(breakdown, /Realism B→I/);
    assert.match(breakdown, /E09/);
  });
});
