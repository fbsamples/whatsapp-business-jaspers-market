/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const constants = require("./constants");
const config = require("./config");
const GraphApi = require('./graph-api');
const Message = require('./message');
const Status = require('./status');
const Cache = require('./redis');
const AIService = require('./ai');


function sendTryOutDemoMessage(messageId, senderPhoneNumberId, recipientPhoneNumber, messageBody) {
  return GraphApi.messageWithInteractiveReply(
    messageId,
    senderPhoneNumberId,
    recipientPhoneNumber,
    messageBody,
    [
      {
        id: constants.REPLY_INTERACTIVE_MEDIA_ID,
        title: constants.REPLY_INTERACTIVE_WITH_MEDIA_CTA,
      },
      {
        id: constants.REPLY_MEDIA_CAROUSEL_ID,
        title: constants.REPLY_MEDIA_CARD_CAROUSEL_CTA,
      },
      {
        id: constants.REPLY_OFFER_ID,
        title: constants.REPLY_OFFER_CTA,
      }
    ]
  );
}

function sendInteractiveMediaMessage(messageId, senderPhoneNumberId, recipientPhoneNumber) {
  return GraphApi.messageWithUtilityTemplate(
    messageId,
    senderPhoneNumberId,
    recipientPhoneNumber,
    {
      templateName: "grocery_delivery_utility",
      locale: "en_US",
      imageLink: "https://scontent.xx.fbcdn.net/mci_ab/uap/asset_manager/id/?ab_b=e&ab_page=AssetManagerID&ab_entry=1530053877871776",
    }
  );
}

function sendLimitedTimeOfferMessage(messageId, senderPhoneNumberId, recipientPhoneNumber) {
  return GraphApi.messageWithLimitedTimeOfferTemplate(
    messageId,
    senderPhoneNumberId,
    recipientPhoneNumber,
    {
      templateName: "strawberries_limited_offer",
      locale: "en_US",
      imageLink: "https://scontent.xx.fbcdn.net/mci_ab/uap/asset_manager/id/?ab_b=e&ab_page=AssetManagerID&ab_entry=1393969325614091",
      offerCode: "BERRIES20",
    }
  );
}

function sendMediaCarouselMessage(messageId, senderPhoneNumberId, recipientPhoneNumber) {
  return GraphApi.messageWithMediaCardCarousel(
    messageId,
    senderPhoneNumberId,
    recipientPhoneNumber,
    {
      templateName: "recipe_media_carousel",
      locale: "en_US",
      imageLinks: [
        "https://scontent.xx.fbcdn.net/mci_ab/uap/asset_manager/id/?ab_b=e&ab_page=AssetManagerID&ab_entry=1389202275965231",
        "https://scontent.xx.fbcdn.net/mci_ab/uap/asset_manager/id/?ab_b=e&ab_page=AssetManagerID&ab_entry=3255815791260974"
      ]
    }
  );
}

async function markMessageForFollowUp(messageId) {
  await Cache.insert(messageId);
}


module.exports = class Conversation {
  constructor(phoneNumberId) {
    this.phoneNumberId = phoneNumberId;
  }

  static async handleMessage(senderPhoneNumberId, rawMessage) {
    const message = new Message(rawMessage);

    switch (message.type) {
      case constants.REPLY_INTERACTIVE_MEDIA_ID:
        let interactiveMediaResponse = await sendInteractiveMediaMessage(
          message.id,
          senderPhoneNumberId,
          message.senderPhoneNumber
        );
        await markMessageForFollowUp(interactiveMediaResponse.messages[0].id);
        break;
      case constants.REPLY_MEDIA_CAROUSEL_ID:
        let mediaCarouselResponse = await sendMediaCarouselMessage(
          message.id,
          senderPhoneNumberId,
          message.senderPhoneNumber
        );
        await markMessageForFollowUp(mediaCarouselResponse.messages[0].id);
        break;
      case constants.REPLY_OFFER_ID:
        let ltoResponse = await sendLimitedTimeOfferMessage(
          message.id,
          senderPhoneNumberId,
          message.senderPhoneNumber
        );
        await markMessageForFollowUp(ltoResponse.messages[0].id);
        break;
      case 'text':
        // Use AI service to generate response for text messages
        try {
          const aiResponse = await AIService.generateResponse(message.body, {
            businessName: "Jasper's Market",
            businessContext: "a friendly online grocery store"
          });
          await GraphApi.sendMessage(
            message.id,
            senderPhoneNumberId,
            message.senderPhoneNumber,
            aiResponse
          );
        } catch (error) {
          console.error("Error in AI conversation:", error);
          sendTryOutDemoMessage(
            message.id,
            senderPhoneNumberId,
            message.senderPhoneNumber,
            constants.APP_DEFAULT_MESSAGE
          );
        }
        break;
      default:
        sendTryOutDemoMessage(
          message.id,
          senderPhoneNumberId,
          message.senderPhoneNumber,
          constants.APP_DEFAULT_MESSAGE
        );
        break;
    }
  }

  static async handleStatus(senderPhoneNumberId, rawStatus) {
    const status = new Status(rawStatus);

    // Only handle delivered and read statuses
    if (!(status.status === 'delivered' || status.status === 'read')) {
      return;
    }

    // Only send a follow up message if the current message is flagged
    // as needing one in the cache.
    if (await Cache.remove(status.messageId)) {
      await sendTryOutDemoMessage(
        undefined,
        senderPhoneNumberId,
        status.recipientPhoneNumber,
        constants.APP_TRY_ANOTHER_MESSAGE
      );
    }
  }
};
