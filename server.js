const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require("multer");
const XLSX = require("xlsx");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const API_URL = "https://indusind.biz.juspay.in/ardra/vt/fetchStatus";

const headers = {
  Authorization: "Basic VEFNTVRLS1FBWVlLREJBSkhYQktCOg==",
  "X-MerchantId": "tripjack",
  KeyId: "key_tU6dtf5dh9ivoCzV",
  "Content-Type": "application/json",
};

app.post("/payout-status", async (req, res) => {
  try {
    const { payoutId } = req.body;

    if (!payoutId) {
      return res.status(400).json({ error: "payoutId is required" });
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

// 🚀 Excel Upload Endpoint
app.post("/upload", upload.single("excel"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Excel file is required" });
  }

  try {
    console.log("File received:", req.file.originalname);

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Read sheet as array of arrays
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("Raw Excel Data:", rows.slice(0, 10));

    // Extract payoutIds from first column (skip header)
    const payoutIds = rows
      .slice(1)
      .map((row) => row[0])
      .filter((id) => id && id.toString().trim() !== "")
      .map((id) => id.toString().trim());

    console.log("Payout IDs:", payoutIds);

    if (payoutIds.length === 0) {
      return res.status(400).json({
        error: "No payout IDs found in file",
      });
    }

    // Fetch status for each payout
    const requests = payoutIds.map((id) =>
      axios({
        method: "POST",
        url: API_URL,
        headers: headers,
        data: { payoutId: id },
        timeout: 10000,
      })
        .then((r) => ({
          payoutId: id,
          result: r.data,
        }))
        .catch((err) => ({
          payoutId: id,
          error: err.response?.data || "API Error",
        })),
    );

    const results = await Promise.all(requests);

    res.json({
      total: payoutIds.length,
      results: results,
    });
  } catch (err) {
    console.log("UPLOAD ERROR:", err.message);

    res.status(500).json({
      error: err.message,
    });
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
