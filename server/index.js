const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const Groq = require("groq-sdk");

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;  

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://nearnest-eta.vercel.app'
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json());

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.anon_key;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

app.get("/api/restaurants", async (req, res) => {
  try {
    const ownerEmail = req.query?.email ? String(req.query.email).trim() : "";
    let query = supabase.from("restaurants").select("*");

    if (ownerEmail) {
      query = query.eq("owner_email", ownerEmail).order("created_at", { ascending: false });
    } else {
      query = query.eq("status", "approved").order("id", { ascending: true });
    }

    const { data, error } = await query;

    console.log("Supabase error:", error);
    console.log("Total returned:", data ? data.length : 0);
    console.log("Statuses:", data ? data.map(r => r.status) : []);

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch restaurants",
        details: error.message,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.get("/api/admin/restaurants", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch restaurants",
        details: error.message,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.post("/api/owners/signup", async (req, res) => {
  try {
    const { name, email, phone } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: "email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existingOwner, error: existingError } = await supabase
      .from("owners")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({
        error: "Failed to validate owner",
        details: existingError.message,
      });
    }

    if (existingOwner) {
      return res.status(400).json({ error: "Already registered" });
    }

    const { data, error } = await supabase
      .from("owners")
      .insert({
        name: String(name).trim(),
        email: normalizedEmail,
        phone: phone ? String(phone).trim() : null,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({
        error: "Failed to create owner",
        details: error.message,
      });
    }

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.get("/api/owners/pending", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("owners")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch pending owners",
        details: error.message,
      });
    }

    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.get("/api/owners/all", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("owners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch owners",
        details: error.message,
      });
    }

    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.patch("/api/owners/:id/approve", async (req, res) => {
  try {
    const ownerId = req.params.id;

    const { data, error } = await supabase
      .from("owners")
      .update({ status: "approved" })
      .eq("id", ownerId)
      .select("*")
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        error: "Failed to approve owner",
        details: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Owner not found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.patch("/api/owners/:id/reject", async (req, res) => {
  try {
    const ownerId = req.params.id;

    const { data, error } = await supabase
      .from("owners")
      .update({ status: "rejected" })
      .eq("id", ownerId)
      .select("*")
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        error: "Failed to reject owner",
        details: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Owner not found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.get("/api/owners/status/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email || "").trim().toLowerCase();

    const { data, error } = await supabase
      .from("owners")
      .select("status")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch owner status",
        details: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Owner not found" });
    }

    return res.status(200).json({ status: data.status });
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.get("/api/test-gemini", async (_req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Say hello in one word" }],
    });
    const text = completion?.choices?.[0]?.message?.content || "";

    return res.status(200).json({ response: text });
  } catch (err) {
    console.log("AI test route error:", err);
    return res.status(500).json({
      error: err.message,
    });
  }
});

app.post("/api/ai/search", async (req, res) => {
  try {
    const query = String(req.body?.query || "").trim();

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
    }

    const { data: allRestaurants, error: fetchError } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      return res.status(500).json({
        error: "Failed to fetch restaurants",
        details: fetchError.message,
      });
    }

    const prompt = `You are a restaurant finder assistant for Kozhikode city.
Based on the user query, return ONLY a JSON array of 
restaurant IDs that match.
User query: ${query}
Available restaurants: ${JSON.stringify(allRestaurants || [])}
Return only a raw JSON array of matching UUIDs. 
No explanation, no markdown, just the array.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });
    const result = completion?.choices?.[0]?.message?.content || "[]";
    const rawText = result;
    const cleanedText = rawText.replace(/```json|```/g, "").trim();

    let matchedIds = [];
    try {
      const parsed = JSON.parse(cleanedText);
      matchedIds = Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      matchedIds = [];
    }

    const idSet = new Set(matchedIds.map((id) => String(id)));
    const matchedRestaurants = (allRestaurants || []).filter((restaurant) =>
      idSet.has(String(restaurant.id))
    );

    return res.status(200).json(matchedRestaurants);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.get("/api/ai/reviews/:id/summary", async (req, res) => {
  try {
    const restaurantId = req.params.id;

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch reviews",
        details: error.message,
      });
    }

    if (!reviews || reviews.length < 2) {
      return res.status(200).json({ summary: null });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
    }

    const prompt = `Summarize these restaurant reviews in exactly 
3 bullet points. Be concise and helpful for 
someone deciding whether to visit.
Reviews: ${JSON.stringify(reviews)}
Return only 3 bullet points, nothing else.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });
    const summary = completion?.choices?.[0]?.message?.content || null;

    return res.status(200).json({ summary });
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.post("/api/restaurants", async (req, res) => {
  try {
    const {
      name,
      cuisine_type,
      area,
      owner_email,
      address,
      phone,
      whatsapp_number,
      whatsapp,
      description,
      opening_time,
      closing_time,
      price_range,
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    if (!cuisine_type || !String(cuisine_type).trim()) {
      return res.status(400).json({ error: "cuisine_type is required" });
    }

    if (!area || !String(area).trim()) {
      return res.status(400).json({ error: "area is required" });
    }

    const numericPrice = Number(price_range);
    const normalizedPrice =
      Number.isInteger(numericPrice) && numericPrice >= 1 && numericPrice <= 3
        ? numericPrice
        : null;

    const restaurantPayload = {
      name: String(name).trim(),
      cuisine_type: String(cuisine_type).trim(),
      area: String(area).trim(),
      owner_email: owner_email ? String(owner_email).trim() : null,
      address: address ? String(address).trim() : null,
      phone: phone ? String(phone).trim() : null,
      whatsapp: whatsapp_number
        ? String(whatsapp_number).trim()
        : whatsapp
        ? String(whatsapp).trim()
        : null,
      description: description ? String(description).trim() : null,
      opening_time: opening_time || null,
      closing_time: closing_time || null,
      price_range: normalizedPrice,
      status: "pending"
    };

    const { data, error } = await supabase
      .from("restaurants")
      .insert(restaurantPayload)
      
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({
        error: "Failed to create restaurant",
        details: error.message,
      });
    }

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.patch("/api/restaurants/:id", async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const {
      name,
      cuisine_type,
      area,
      address,
      phone,
      whatsapp_number,
      whatsapp,
      description,
      opening_time,
      closing_time,
      price_range,
    } = req.body || {};

    const numericPrice = Number(price_range);
    const normalizedPrice =
      Number.isInteger(numericPrice) && numericPrice >= 1 && numericPrice <= 3
        ? numericPrice
        : null;

    const updatePayload = {
      name: name ? String(name).trim() : null,
      cuisine_type: cuisine_type ? String(cuisine_type).trim() : null,
      area: area ? String(area).trim() : null,
      address: address ? String(address).trim() : null,
      phone: phone ? String(phone).trim() : null,
      whatsapp: whatsapp_number
        ? String(whatsapp_number).trim()
        : whatsapp
        ? String(whatsapp).trim()
        : null,
      description: description ? String(description).trim() : null,
      opening_time: opening_time || null,
      closing_time: closing_time || null,
      price_range: normalizedPrice,
      status: "pending",
    };

    const { data, error } = await supabase
      .from("restaurants")
      .update(updatePayload)
      .eq("id", restaurantId)
      .select("*")
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        error: "Failed to update restaurant",
        details: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.get("/api/restaurants/:id", async (req, res) => {
  try {
    const restaurantId = req.params.id;

    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch restaurant",
        details: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",  
      details: err.message,
    });
  }
});

app.get("/api/restaurants/:id/reviews", async (req, res) => {
  try {
    const restaurantId = req.params.id;

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch reviews",
        details: error.message,
      });
    }

    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.post("/api/restaurants/:id/reviews", async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const { reviewer_name, rating, comment } = req.body || {};

    if (!reviewer_name || !String(reviewer_name).trim()) {
      return res.status(400).json({ error: "reviewer_name is required" });
    }

    const ratingNumber = Number(rating);
    if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return res.status(400).json({ error: "rating must be an integer from 1 to 5" });
    }

    const reviewPayload = {
      restaurant_id: restaurantId,
      reviewer_name: String(reviewer_name).trim(),
      rating: ratingNumber,
      comment: comment ? String(comment).trim() : "",
    };

    const { data, error } = await supabase
      .from("reviews")
      .insert(reviewPayload)
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({
        error: "Failed to add review",
        details: error.message,
      });
    }

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.patch("/api/restaurants/:id/status", async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const { status } = req.body || {};
    const allowedStatuses = ["approved", "rejected", "pending"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'status must be one of: "approved", "rejected", "pending"',
      });
    }

    const { data, error } = await supabase
      .from("restaurants")
      .update({ status })
      .eq("id", restaurantId)
      .select("*")
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        error: "Failed to update restaurant status",
        details: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.delete("/api/restaurants/:id", async (req, res) => {
  try {
    const restaurantId = req.params.id;

    const { error } = await supabase
  .from("restaurants")
  .delete()
  .eq("id", restaurantId);


    if (error) {
      return res.status(500).json({
        error: "Failed to delete restaurant",
        details: error.message,
      });
    }
    if (error) {
      return res.status(500).json({
        error: "Failed to delete restaurant",
        details: error.message,
      });
    }
    
    return res.status(200).json({ message: "Restaurant deleted" });

  
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});