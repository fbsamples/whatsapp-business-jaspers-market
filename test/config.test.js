/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const assert = require("node:assert/strict");
const {spawnSync} = require("node:child_process");
const test = require("node:test");
const path = require("node:path");

const appRoot = path.resolve(__dirname, "..");
const configPath = path.resolve(appRoot, "services/config.js");
const validEnvironment = {
  ...process.env,
  ACCESS_TOKEN: "test-access-token",
  APP_SECRET: "test-app-secret",
  VERIFY_TOKEN: "test-verify-token",
  REDIS_HOST: "localhost",
  REDIS_PORT: "6379",
  GROCERIES_MEDIA_ID: "groceries-media-id",
  STRAWBERRIES_MEDIA_ID: "strawberries-media-id",
  SHEET_PAN_DINNER_MEDIA_ID: "sheet-pan-media-id",
  SALAD_BOWL_MEDIA_ID: "salad-bowl-media-id",
};

function runConfigCheck(environment = validEnvironment) {
  return spawnSync(
    process.execPath,
    ["-e", `require(${JSON.stringify(configPath)}).checkEnvVariables()`],
    {
      cwd: __dirname,
      encoding: "utf8",
      env: environment,
    },
  );
}

test("exports normalized configured media IDs", () => {
  const environment = {
    ...validEnvironment,
    GROCERIES_MEDIA_ID: "  groceries-media-id  ",
  };
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      `const config = require(${JSON.stringify(configPath)});
       process.stdout.write(JSON.stringify({
         groceriesMediaId: config.groceriesMediaId,
         strawberriesMediaId: config.strawberriesMediaId,
         sheetPanDinnerMediaId: config.sheetPanDinnerMediaId,
         saladBowlMediaId: config.saladBowlMediaId,
       }));`,
    ],
    {
      cwd: __dirname,
      encoding: "utf8",
      env: environment,
    },
  );

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {
    groceriesMediaId: "groceries-media-id",
    strawberriesMediaId: "strawberries-media-id",
    sheetPanDinnerMediaId: "sheet-pan-media-id",
    saladBowlMediaId: "salad-bowl-media-id",
  });
});

for (const [description, value] of [
  ["missing", undefined],
  ["blank", "   "],
  ["Terraform placeholder", "1234567890"],
  ["sample environment placeholder", "ADD_GROCERIES_MEDIA_ID_HERE"],
]) {
  test(`rejects a ${description} media ID`, () => {
    const environment = {
      ...validEnvironment,
      GROCERIES_MEDIA_ID: value,
    };
    if (value === undefined) {
      delete environment.GROCERIES_MEDIA_ID;
    }

    const result = runConfigCheck(environment);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /GROCERIES_MEDIA_ID/);
    assert.doesNotMatch(result.stderr, /test-access-token/);
    assert.doesNotMatch(result.stderr, /strawberries-media-id/);
  });
}

test("accepts complete non-placeholder media configuration", () => {
  const result = runConfigCheck();

  assert.equal(result.status, 0, result.stderr);
});
