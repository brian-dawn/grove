const Client = require("cabal-client");
const crypto = require("crypto");
const bs58 = require("bs58");
import { parseBaseMessage, encodeBaseMessage, BaseMessage } from "./messages";
import { DB, applyMessageToDB } from "./model";

declare global {
  namespace NodeJS {
    interface Global {
      // Did we already run setup?
      setup: boolean;
      // The global in memory database.
      db: DB;
      cabalDetails: CabalDetails | undefined;
    }
  }
}
export async function setupCabal() {
  // We don't want this code to run more than once.
  if (global.setup) {
    console.log("we already ran setupCabal");
    return;
  }
  global.setup = true;

  // Initialize our in memory database.
  global.db = {
    notes: {},
  };

  console.log("setting up cabal");
  // Can be generated with Client.generateKey()
  const key =
    "f0b6527c91a78bf72bcb81de6196603c1043fdfbf266a4ff5f0cc821f6675d6b";

  const dbPath = "/tmp/cabaldb-web";
  //const dbPath = "/tmp/cabaldb-web" + process.pid;
  console.log(`dbPath=${dbPath}`);

  const client: Client = new Client({
    config: {
      dbdir: dbPath,
    },
  });

  // Lock attempt is here.
  global.cabalDetails = await client.addCabal(key, () => {
    console.log("done");
  });

  global.cabalDetails.joinChannel("default");
  const channels = global.cabalDetails.getChannels();
  console.log(channels);

  const messages = await client.getMessages({
    newerThan: 0,
    amount: 10000,
  });

  const parsedOldMessages = messages.forEach((message) => {
    if (message.value.type !== "chat/text") {
      return;
    }
    const parsedBaseMessage = parseBaseMessage(message.value.content.text);
    if (!parsedBaseMessage) {
      return;
    }

    applyMessageToDB(global.db, parsedBaseMessage);
  });

  global.cabalDetails.on("new-message", (info: CabalMessage) => {
    console.log("received: " + info.message.value.content.text);
    const parsedBaseMessage = parseBaseMessage(info.message.value.content.text);
    if (!parsedBaseMessage) {
      return;
    }

    applyMessageToDB(global.db, parsedBaseMessage);
  });
}

export function getNotes() {
  return global.db.notes;
}

export function shareMessage(baseMessage: BaseMessage) {
  if (!global.cabalDetails) {
    // TODO: Don't let the user submit if we don't have this yet.
    console.log(
      "oh no we don't have any cabal details, this message is probs gone"
    );
  }
  global.cabalDetails?.publishMessage({
    type: "chat/text",
    content: {
      text: encodeBaseMessage(baseMessage),
      channel: "default",
    },
  });
  applyMessageToDB(global.db, baseMessage);
}

// We use 32 bits of entropy for generating a new note ID. We check against all past notes in which
// case we need to figure out what the odds of a collision are ala the birthday problem. 32 bits
// should be enough, no one is going to go offline and then create 65000 notes or something.
export function generateRandomNoteId() {
  var id = undefined;
  do {
    id = bs58.encode(crypto.randomBytes(4));
  } while (global.db.notes[id]);

  return id;
}

Promise.all([setupCabal()]);
