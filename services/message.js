/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

module.exports = class Message {
  constructor(rawMessage) {
    this.id = rawMessage.id;
    this.timestamp = rawMessage.timestamp ?? null;
    this.textBody =
      rawMessage.type === 'text' && typeof rawMessage.text?.body === 'string'
        ? rawMessage.text.body
        : null;

    let type = rawMessage.type;
    if (type === 'interactive') {
      this.type = rawMessage.interactive.button_reply.id;
    } else {
      this.type = 'unknown'
    }

    this.senderPhoneNumber = rawMessage.from;
  }
};
