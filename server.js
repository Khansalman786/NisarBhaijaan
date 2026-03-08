const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const API_URL = "https://indusind.biz.juspay.in/ardra/vt/fetchStatus";

const headers = {
  Authorization: "Basic VEFNTVRLS1FBWVlLREJBSkhYQktCOg==",
  "X-MerchantId": "tripjack", // corrected casing
  KeyId: "key_tU6dtf5dh9ivoCzV",
  "Content-Type": "application/json",
};

app.post("/payout-status", async (req, res) => {
  try {
    const { payoutId } = req.body;

    if (!payoutId) {
      return res.status(400).json({
        error: "payoutId is required",
      });
    }

    console.log("Fetching payout:", payoutId);

    const response = await axios({
      method: "POST",
      url: API_URL,
      headers: headers,
      data: { payoutId: payoutId },
      timeout: 10000,
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      console.log("API ERROR:", error.response.status);
      console.log("API MESSAGE:", error.response.data);

      return res.status(error.response.status).json({
        error: error.response.data,
      });
    } else {
      console.log("SERVER ERROR:", error.message);

      return res.status(500).json({
        error: error.message,
      });
    }
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
