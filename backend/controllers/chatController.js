const axios = require("axios");
const ChatMessage = require("../models/ChatMessage");

const HF_API_KEY = process.env.HF_API_KEY;
/* const HF_MODEL = process.env.HF_MODEL || "facebook/bart-large-cnn2"; */
//const HF_MODEL = process.env.HF_MODEL || "gpt2";

const { InferenceClient } = require("@huggingface/inference");

const client = new InferenceClient(process.env.HF_TOKEN);

const HF_TOKEN =
  process.env.HF_TOKEN ;
const HF_MODEL = process.env.HF_MODEL || "meta-llama/Meta-Llama-3-8B-Instruct";

async function callHFModel(prompt) {
  //const url = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

  const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  console.log("Calling HF model at URL:", url);
  console.log("Using HF_MODEL:", HF_MODEL);
  console.log("Using HF_API_KEY exists?", !!HF_API_KEY);

  try {
    const resp = await axios.post(
      url,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 200000,
      }
    );

    /* if (Array.isArray(resp.data)) {
  const item = resp.data[0];
  if (item.generated_text) return item.generated_text;
  if (item.text) return item.text;
  return JSON.stringify(item);
}

if (typeof resp.data === "object") {
  if (resp.data.generated_text) return resp.data.generated_text;
  if (resp.data.text) return resp.data.text;
}

return JSON.stringify(resp.data);
 */

    // The HF API returns an array of objects for text-generation models
    if (Array.isArray(resp.data)) {
      // Some models return [{generated_text: '...'}]
      if (resp.data[0] && resp.data[0].generated_text)
        return resp.data[0].generated_text;
      // Others return plain text or alternative shape - fallback
      return JSON.stringify(resp.data);
    }
    if (resp.data.generated_text) return resp.data.generated_text;
    return JSON.stringify(resp.data);
  } catch (err) {
    console.error("HF API error:", err?.response?.data || err.message);
    throw new Error("AI API error");
  }
}

async function callHFRouterModel(prompt) {
  const url = "https://router.huggingface.co/v1/chat/completions";

  console.log("Calling HF model at URL:", url);
  console.log("Using HF_MODEL:", HF_MODEL);
  console.log("Using HF_API_KEY exists?", !!HF_TOKEN);
  try {
    const resp = await axios.post(
      url,
      {
        model: HF_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 200000,
      }
    );

    // Hugging Face router API returns choices array
    const aiMessage = resp.data?.choices?.[0]?.message?.content;
    return aiMessage || "No response from AI";
  } catch (err) {
    console.error("HF Router API error:", err?.response?.data || err.message);
    throw new Error("AI API error");
  }
}

// helper function (NO req/res here)
async function callHFRouterModel2(message) {
  const url = "https://router.huggingface.co/v1/chat/completions";

  console.log("Calling HF model at URL:", url);
  console.log("Using HF_MODEL:", process.env.HF_MODEL);
  console.log("Using HF_TOKEN exists?", !!process.env.HF_TOKEN);

  let out = "";

  try {
    const stream = client.chatCompletionStream({
      provider: "novita",
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: [{ role: "user", content: message }],
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta?.content || "";
        out += newContent;
      }
    }

    /*  Save to MongoDB
    const chat = new ChatMessage({ sessionId, userMessage: message, botMessage: out });
    await chat.save();
    res.json(chat); */

    return out; // ✅ return only AI text
  } catch (err) {
    console.error("HF API Error:", err.message);
    throw new Error("AI response failed");
  }
}

// controller

exports.chatStream = async (req, res) => {
  const { sessionId, message } = req.body;

  console.log("SessionId:", sessionId, "message:", message);

  if (!sessionId || !message)
    return res.status(400).json({ error: "sessionId and message required" });

  // Set headers for streaming
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // 1️⃣ Save user message to DB
    const userMsg = {
      sessionId,
      role: "user",
      text: message,
      createdAt: new Date(),
    };
    await ChatMessage.create(userMsg); // ✅ Correct

    // 2️⃣ Get AI response
    const aiText = await callHFRouterModel2(message);

    // 3️⃣ Save AI message to DB
    const aiMsg = {
      sessionId,
      role: "ai",
      text: aiText,
      createdAt: new Date(),
    };
    //await ChatMessage.create(aiMsg); // ✅ Correct
    await ChatMessage.create(aiMsg).catch((err) => console.error(err));

    // 4️⃣ Stream AI message line-by-line
    aiText.split("\n").forEach((line) => res.write(line + "\n"));
    res.end();
  } catch (err) {
    console.error("AI streaming error:", err);
    res.status(500).send("AI response failed");
  }
};

exports.chatStream2 = async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message)
    return res.status(400).json({ error: "sessionId and message required" });

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // 1️⃣ Save user message
    await ChatMessage.create({
      sessionId,
      role: "user",
      text: message,
      createdAt: new Date(),
    });

    // 2️⃣ Call HuggingFace model (stream mode)
    const stream = await callHFRouterModel2(message);

    let fullResponse = "";

    // 3️⃣ Read stream chunk by chunk
    for await (const chunk of stream) {
      const text = chunk?.choices?.[0]?.delta?.content || "";
      if (text) {
        fullResponse += text;
        res.write(text); // send chunk to client
      }
    }

    res.end();

    // 4️⃣ After stream finished, save AI response
    if (fullResponse.trim().length > 0) {
      await ChatMessage.create({
        sessionId,
        role: "ai",
        text: fullResponse,
        createdAt: new Date(),
      });
    }
  } catch (err) {
    console.error("AI streaming error:", err);
    res.status(500).send("AI response failed");
  }
};

exports.sendMessage = async (req, res) => {
  /*
Expected body: { sessionId, prompt }
*/

  const { sessionId, prompt } = req.body;
  console.log("SessionId:", sessionId, "Prompt:", prompt);
  console.log("HF_API_KEY exists?", HF_API_KEY);
  console.log("HF_MODEL:", HF_MODEL);

  if (!sessionId || !prompt)
    return res.status(400).json({ error: "sessionId and prompt required" });

  try {
    // Save user message
    const userMsg = await ChatMessage.create({
      sessionId,
      role: "user",
      text: prompt,
      createdAt: new Date(),
    });

    // Call the AI API
    // const aiText = await callHFModel(prompt);

    const aiText = await callHFRouterModel2(prompt);
    // Save AI response
    const aiMsg = await ChatMessage.create({
      sessionId,
      role: "ai",
      text: aiText,
      createdAt: new Date(),
    });

    return res.json({ ai: aiText, userMessage: userMsg, aiMessage: aiMsg });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getHistory = async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  try {
    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();
    return res.json({ messages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* const axios = require("axios");
const ChatMessage = require("../models/ChatMessage");

// Env variables
const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL ="google/flan-t5-base"


// Hugging Face API call
async function callHFModel(prompt) {
  const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  try {
    const resp = await axios.post(
      url,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 307000, // increased timeout for slow responses
      }
    );

    console.log("HF raw response:", JSON.stringify(resp.data, null, 2));

    const data = resp.data;

    // Case: Array response
    if (Array.isArray(data)) {
      const item = data[0];
      if (item.generated_text) return item.generated_text;
      if (item.text) return item.text;
      return JSON.stringify(item);
    }

    // Case: Object response
    if (typeof data === "object") {
      if (data.generated_text) return data.generated_text;
      if (data.text) return data.text;
      if (data.error) throw new Error(data.error);
    }

    // Fallback
    return JSON.stringify(data);
  } catch (err) {
    if (err.response) {
      console.error(
        "HF API error response:",
        err.response.status,
        err.response.data
      );
      throw new Error(
        `HF API error: ${err.response.status} - ${JSON.stringify(
          err.response.data
        )}`
      );
    } else {
      console.error("HF API error:", err.message);
      throw new Error("HF API error: " + err.message);
    }
  }
}

// --------------------
// Controllers
// --------------------
exports.sendMessage = async (req, res) => {
  const { sessionId, prompt } = req.body;

  if (!sessionId || !prompt)
    return res.status(400).json({ error: "sessionId and prompt required" });

  try {
    // Save user message
    const userMsg = await ChatMessage.create({
      sessionId,
      role: "user",
      text: prompt,
    });

    // Call AI
    const aiText = await callHFModel(prompt);

    // Save AI response
    const aiMsg = await ChatMessage.create({
      sessionId,
      role: "ai",
      text: aiText,
    });

    return res.json({ ai: aiText, userMessage: userMsg, aiMessage: aiMsg });
  } catch (err) {
    console.error("sendMessage error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId)
    return res.status(400).json({ error: "sessionId required" });

  try {
    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ messages });
  } catch (err) {
    console.error("getHistory error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
};


 */
