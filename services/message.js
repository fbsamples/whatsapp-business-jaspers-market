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
    this.timestamp = rawMessage.timestamp;

    let type = rawMessage.type;
    if (type === 'interactive') {
      this.type = rawMessage.interactive.button_reply.id;
    } else if (type === 'text') {
      this.type = 'text';
      this.body = rawMessage.text.body;
    } else {
      this.type = 'unknown'
    }

    this.senderPhoneNumber = rawMessage.from;
  }
};
