import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const locationSearchSource = readFileSync(
  join(process.cwd(), "components/location/location-search.tsx"),
  "utf8",
);
const hookSource = readFileSync(join(process.cwd(), "hooks/use-location-search.ts"), "utf8");

describe("LocationSearch UX implementation", () => {
  it("uses type=text to avoid duplicate native clear buttons", () => {
    assert.match(locationSearchSource, /type="text"/);
    assert.doesNotMatch(locationSearchSource, /type="search"/);
  });

  it("shows one clear button only when input has a value", () => {
    assert.match(locationSearchSource, /showClearButton = inputValue\.trim\(\)\.length > 0/);
    assert.equal((locationSearchSource.match(/aria-label="Clear location search"/g) ?? []).length, 1);
  });

  it("keeps suggestions hidden for a preselected location until editing", () => {
    assert.match(locationSearchSource, /const \[isEditing, setIsEditing\]/);
    assert.match(locationSearchSource, /isEditing &&/);
    assert.match(locationSearchSource, /setInputValueSilent/);
  });

  it("anchors the dropdown directly below the input", () => {
    assert.match(locationSearchSource, /top-full/);
    assert.match(locationSearchSource, /left-0 right-0/);
  });

  it("prefers opening the planner dropdown above the bottom dock", () => {
    assert.match(locationSearchSource, /variant === "planner"/);
    assert.match(locationSearchSource, /setDropdownPlacement\("above"\)/);
  });

  it("clears selection state in the search hook", () => {
    assert.match(hookSource, /setInputValueSilent/);
    assert.match(hookSource, /clearSelection/);
    assert.match(hookSource, /setResults\(\[\]\)/);
    assert.match(hookSource, /setIsOpen\(false\)/);
  });
});
