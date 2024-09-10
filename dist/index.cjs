"use strict";

// src/index.ts
var import_realtime_js = require("@supabase/realtime-js");
var client = new import_realtime_js.RealtimeClient(process.env.SUPABASE_URL, {
  params: {
    apikey: process.env.SUPABASE_KEY
  }
});
var channel = client.channel("test-channel", { config: {} });
channel.subscribe((status, err) => {
  if (status === "SUBSCRIBED") {
    console.log("Connected!");
  }
  if (status === "CHANNEL_ERROR") {
    console.log(`There was an error subscribing to channel: ${err?.message}`);
  }
  if (status === "TIMED_OUT") {
    console.log("Realtime server did not respond in time.");
  }
  if (status === "CLOSED") {
    console.log("Realtime channel was unexpectedly closed.");
  }
});
//# sourceMappingURL=index.cjs.map
