"use strict";

require("dotenv").config();

module.exports = Object.freeze({
  accessToken: process.env.ACCESS_TOKEN,
  phoneNumberId: process.env.PHONE_NUMBER_ID,
  wabaId: process.env.WABA_ID,
  verifyToken: process.env.VERIFY_TOKEN || "jaspers_test_2024",
  port: process.env.PORT || 8080,

  checkEnvVariables() {
    ["ACCESS_TOKEN", "PHONE_NUMBER_ID", "VERIFY_TOKEN"].forEach(key => {
      if (!process.env[key]) console.warn(`WARNING: Missing env var ${key}`);
    });
  }
});
