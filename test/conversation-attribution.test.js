/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const configPath = require.resolve("../services/config");
const graphApiPath = require.resolve("../services/graph-api");
const redisPath = require.resolve("../services/redis");
const cacheInsertions = [];
const graphApiCalls = [];

function recordGraphApiCall(method, args, responseMessageId) {
  graphApiCalls.push({args, method});
  return Promise.resolve({messages: [{id: responseMessageId}]});
}

require.cache[configPath] = {
  exports: {
    groceriesMediaId: "groceries-media-id",
    saladBowlMediaId: "salad-bowl-media-id",
    sheetPanDinnerMediaId: "sheet-pan-media-id",
    strawberriesMediaId: "strawberries-media-id",
  },
};
require.cache[graphApiPath] = {
  exports: {
    messageWithInteractiveReply(...args) {
      return recordGraphApiCall("messageWithInteractiveReply", args, null);
    },
    messageWithLimitedTimeOfferTemplate(...args) {
      return recordGraphApiCall(
        "messageWithLimitedTimeOfferTemplate",
        args,
        "wamid.outbound-offer",
      );
    },
    messageWithMediaCardCarousel(...args) {
      return recordGraphApiCall(
        "messageWithMediaCardCarousel",
        args,
        "wamid.outbound-carousel",
      );
    },
    messageWithUtilityTemplate(...args) {
      return recordGraphApiCall(
        "messageWithUtilityTemplate",
        args,
        "wamid.outbound-utility",
      );
    },
  },
};
require.cache[redisPath] = {
  exports: {
    insert(messageId) {
      cacheInsertions.push(messageId);
    },
    remove() {
      throw new Error("cache removal should not run while handling a message");
    },
  },
};

const constants = require("../services/constants");
const Conversation = require("../services/conversation");

async function captureLogs(callback) {
  const logLines = [];
  const originalConsoleLog = console.log;
  console.log = value => logLines.push(value);

  try {
    await callback();
  } finally {
    console.log = originalConsoleLog;
  }

  return logLines;
}

test("phrase attribution is logged without changing the welcome response", async () => {
  graphApiCalls.length = 0;
  const logLines = await captureLogs(() =>
    Conversation.handleMessage("720611841146439", {
      id: "wamid.conversation-start",
      from: "15551234567",
      timestamp: "1770000005",
      type: "text",
      text: {
        body: "Try it out",
      },
    }),
  );

  assert.equal(logLines.length, 1);
  assert.deepEqual(JSON.parse(logLines[0]), {
    event_name: "entry_source_attributed",
    schema_version: 1,
    source_surface: "simplified_devx_onboarding",
    inbound_message_id: "wamid.conversation-start",
    receiver_phone_number_id: "720611841146439",
    event_timestamp: "1770000005",
  });
  assert.equal(graphApiCalls.length, 1);
  assert.equal(graphApiCalls[0].method, "messageWithInteractiveReply");
  assert.equal(graphApiCalls[0].args[0], "wamid.conversation-start");
  assert.equal(graphApiCalls[0].args[1], "720611841146439");
  assert.equal(graphApiCalls[0].args[2], "15551234567");
  assert.equal(graphApiCalls[0].args[3], constants.APP_DEFAULT_MESSAGE);
  assert.deepEqual(
    graphApiCalls[0].args[4].map(cta => cta.id),
    [
      constants.REPLY_INTERACTIVE_MEDIA_ID,
      constants.REPLY_MEDIA_CAROUSEL_ID,
      constants.REPLY_OFFER_ID,
    ],
  );
});

for (const [replyId, expectedMethod, expectedOutboundMessageId] of [
  [
    constants.REPLY_INTERACTIVE_MEDIA_ID,
    "messageWithUtilityTemplate",
    "wamid.outbound-utility",
  ],
  [
    constants.REPLY_MEDIA_CAROUSEL_ID,
    "messageWithMediaCardCarousel",
    "wamid.outbound-carousel",
  ],
  [
    constants.REPLY_OFFER_ID,
    "messageWithLimitedTimeOfferTemplate",
    "wamid.outbound-offer",
  ],
]) {
  test(`interactive reply ${replyId} keeps its existing route`, async () => {
    graphApiCalls.length = 0;
    cacheInsertions.length = 0;
    const logLines = await captureLogs(() =>
      Conversation.handleMessage("720611841146439", {
        id: `wamid.${replyId}`,
        from: "15551234567",
        timestamp: "1770000006",
        type: "interactive",
        interactive: {
          button_reply: {
            id: replyId,
          },
        },
      }),
    );

    assert.deepEqual(logLines, []);
    assert.equal(graphApiCalls.length, 1);
    assert.equal(graphApiCalls[0].method, expectedMethod);
    assert.equal(graphApiCalls[0].args[0], `wamid.${replyId}`);
    assert.equal(graphApiCalls[0].args[1], "720611841146439");
    assert.equal(graphApiCalls[0].args[2], "15551234567");
    assert.deepEqual(cacheInsertions, [expectedOutboundMessageId]);
  });
}
