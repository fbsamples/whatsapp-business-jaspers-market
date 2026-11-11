/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildAttributionEvent,
  classifySource,
  logAttributionEvent,
} = require("../services/attribution");

test("developer docs startup text maps to its source", () => {
  assert.deepEqual(classifySource("Get started"), {
    sourceSurface: "developer_docs",
  });
});

test("simplified DevX onboarding text maps to its source", () => {
  assert.deepEqual(classifySource("Try it out"), {
    sourceSurface: "simplified_devx_onboarding",
  });
});

test("outer whitespace does not change a recognized source", () => {
  assert.deepEqual(classifySource("  Try it out\n"), {
    sourceSurface: "simplified_devx_onboarding",
  });
});

test("unrelated and tokenized messages do not produce attribution", () => {
  for (const textBody of [
    null,
    undefined,
    7,
    "Hello",
    "Try Out",
    "try it out",
    "Try it out [A7]",
    "Get started [A7]",
  ]) {
    assert.equal(classifySource(textBody), null);
  }
});

test("event builder emits only the approved fields", () => {
  const event = buildAttributionEvent(
    {
      id: "wamid.attributed-message",
      senderPhoneNumber: "15551234567",
      textBody: "Try it out",
      timestamp: "1770000000",
    },
    "720611841146439",
  );

  assert.deepEqual(event, {
    event_name: "entry_source_attributed",
    schema_version: 1,
    source_surface: "simplified_devx_onboarding",
    inbound_message_id: "wamid.attributed-message",
    receiver_phone_number_id: "720611841146439",
    event_timestamp: "1770000000",
  });
  assert.deepEqual(Object.keys(event).sort(), [
    "event_name",
    "event_timestamp",
    "inbound_message_id",
    "receiver_phone_number_id",
    "schema_version",
    "source_surface",
  ]);
  assert.doesNotMatch(JSON.stringify(event), /15551234567|Try it out/);
});

test("event builder requires an inbound WAMID and recognized entry text", () => {
  assert.equal(
    buildAttributionEvent(
      {id: null, textBody: "Try it out", timestamp: "1770000000"},
      "720611841146439",
    ),
    null,
  );
  assert.equal(
    buildAttributionEvent(
      {id: "wamid.unrelated", textBody: "Hello", timestamp: "1770000000"},
      "720611841146439",
    ),
    null,
  );
});

test("logger writes one single-line JSON event", () => {
  const writes = [];
  const logged = logAttributionEvent(
    {
      id: "wamid.logged-message",
      textBody: "Get started",
      timestamp: "1770000002",
    },
    "720611841146439",
    value => writes.push(value),
  );

  assert.equal(logged, true);
  assert.equal(writes.length, 1);
  assert.equal(typeof writes[0], "string");
  assert.doesNotMatch(writes[0], /\n/);
  assert.deepEqual(JSON.parse(writes[0]), {
    event_name: "entry_source_attributed",
    schema_version: 1,
    source_surface: "developer_docs",
    inbound_message_id: "wamid.logged-message",
    receiver_phone_number_id: "720611841146439",
    event_timestamp: "1770000002",
  });
});

test("logger is fail-open when the writer throws", () => {
  assert.doesNotThrow(() => {
    const logged = logAttributionEvent(
      {
        id: "wamid.writer-failure",
        textBody: "Try it out",
        timestamp: "1770000003",
      },
      "720611841146439",
      () => {
        throw new Error("writer unavailable");
      },
    );
    assert.equal(logged, false);
  });
});

test("logger skips unrelated messages", () => {
  const writes = [];
  const logged = logAttributionEvent(
    {
      id: "wamid.unrelated-message",
      textBody: "Hello",
      timestamp: "1770000004",
    },
    "720611841146439",
    value => writes.push(value),
  );

  assert.equal(logged, false);
  assert.deepEqual(writes, []);
});
