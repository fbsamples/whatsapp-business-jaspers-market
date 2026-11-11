/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const Message = require("../services/message");

test("text messages expose attribution metadata without changing routing type", () => {
  const message = new Message({
    id: "wamid.text-message",
    from: "15551234567",
    timestamp: "1770000000",
    type: "text",
    text: {
      body: "Get started [A7]",
    },
  });

  assert.equal(message.id, "wamid.text-message");
  assert.equal(message.senderPhoneNumber, "15551234567");
  assert.equal(message.timestamp, "1770000000");
  assert.equal(message.textBody, "Get started [A7]");
  assert.equal(message.type, "unknown");
});

test("interactive replies preserve their routing type and have no text body", () => {
  const message = new Message({
    id: "wamid.interactive-message",
    from: "15551234567",
    timestamp: "1770000001",
    type: "interactive",
    interactive: {
      button_reply: {
        id: "reply-offer",
      },
    },
  });

  assert.equal(message.timestamp, "1770000001");
  assert.equal(message.textBody, null);
  assert.equal(message.type, "reply-offer");
});

test("messages with incomplete optional metadata use null values", () => {
  const message = new Message({
    id: "wamid.incomplete-message",
    from: "15551234567",
    type: "text",
    text: {},
  });

  assert.equal(message.timestamp, null);
  assert.equal(message.textBody, null);
  assert.equal(message.type, "unknown");
});
