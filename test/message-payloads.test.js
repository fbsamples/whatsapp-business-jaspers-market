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
  buildLimitedTimeOfferTemplatePayload,
  buildMediaCardCarouselPayload,
  buildUtilityTemplatePayload,
} = require("../services/message-payloads");

test("utility template uses the configured media ID", () => {
  const payload = buildUtilityTemplatePayload({
    recipientPhoneNumber: "15551234567",
    templateName: "grocery_delivery_utility",
    locale: "en_US",
    imageId: "groceries-media-id",
  });

  assert.deepEqual(
    payload.template.components[0].parameters[0].image,
    {id: "groceries-media-id"},
  );
});

test("limited-time offer uses the configured media ID", () => {
  const expirationTimeMs = 1_800_000_000_000;
  const payload = buildLimitedTimeOfferTemplatePayload({
    recipientPhoneNumber: "15551234567",
    templateName: "strawberries_limited_offer",
    locale: "en_US",
    imageId: "strawberries-media-id",
    offerCode: "BERRIES20",
    expirationTimeMs,
  });

  assert.deepEqual(
    payload.template.components[0].parameters[0].image,
    {id: "strawberries-media-id"},
  );
  assert.equal(
    payload.template.components[1].parameters[0].limited_time_offer
      .expiration_time_ms,
    expirationTimeMs,
  );
  assert.equal(
    payload.template.components[2].parameters[0].coupon_code,
    "BERRIES20",
  );
});

test("carousel preserves card order and uses both configured media IDs", () => {
  const payload = buildMediaCardCarouselPayload({
    recipientPhoneNumber: "15551234567",
    templateName: "recipe_media_carousel",
    locale: "en_US",
    imageIds: ["sheet-pan-media-id", "salad-bowl-media-id"],
  });

  const cards = payload.template.components[0].cards;
  assert.deepEqual(
    cards.map(card => card.card_index),
    [0, 1],
  );
  assert.deepEqual(
    cards.map(card => card.components[0].parameters[0].image),
    [{id: "sheet-pan-media-id"}, {id: "salad-bowl-media-id"}],
  );
});
