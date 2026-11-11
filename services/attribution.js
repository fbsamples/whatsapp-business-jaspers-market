/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const constants = require("./constants");

const SOURCE_BY_MESSAGE = Object.freeze({
  [constants.USER_START_MESSAGE]: "developer_docs",
  [constants.USER_TRY_OUT_MESSAGE]: "simplified_devx_onboarding",
});

function classifySource(textBody) {
  if (typeof textBody !== "string") {
    return null;
  }

  const normalizedText = textBody.trim();
  if (!Object.prototype.hasOwnProperty.call(SOURCE_BY_MESSAGE, normalizedText)) {
    return null;
  }

  return {
    sourceSurface: SOURCE_BY_MESSAGE[normalizedText],
  };
}

function buildAttributionEvent(message, receiverPhoneNumberId) {
  if (typeof message?.id !== "string" || message.id.length === 0) {
    return null;
  }

  const source = classifySource(message.textBody);
  if (source === null) {
    return null;
  }

  return {
    event_name: "entry_source_attributed",
    schema_version: 1,
    source_surface: source.sourceSurface,
    inbound_message_id: message.id,
    receiver_phone_number_id:
      typeof receiverPhoneNumberId === "string" ? receiverPhoneNumberId : null,
    event_timestamp: message.timestamp ?? null,
  };
}

function logAttributionEvent(
  message,
  receiverPhoneNumberId,
  writer = console.log,
) {
  try {
    const event = buildAttributionEvent(message, receiverPhoneNumberId);
    if (event === null) {
      return false;
    }

    writer(JSON.stringify(event));
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  buildAttributionEvent,
  classifySource,
  logAttributionEvent,
};
