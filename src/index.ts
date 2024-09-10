import { RealtimeClient } from "@supabase/realtime-js";

const client = new RealtimeClient(process.env.SUPABASE_URL!, {
  params: {
    apikey: process.env.SUPABASE_KEY,
  },
});

const channel = client.channel("test-channel", { config: {} });

// @ts-expect-error - Because the types are wrong, the type of RealtimeClient is not resolved when using Node16/NodeNext
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
