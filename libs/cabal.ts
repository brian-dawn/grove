const Client = require("cabal-client");
import { parseBaseMessage, encodeBaseMessage, BaseMessage } from "./messages";
import { DB, applyMessageToDB } from "./model";


// The in memory database of things assembled from our history/new messages.
// TODO: eventually this should not live entirely in memory.
const db: DB = {
  notes: {},
};

var cabalDetails: CabalDetails | undefined = undefined;

export async function setupCabal() {
  // Can be generated with Client.generateKey()
  const key =
    "f0b6527c91a78bf72bcb81de6196603c1043fdfbf266a4ff5f0cc821f6675d6b";

  const client: Client = new Client({
    config: {
      dbdir: "/tmp/cabaldb-web" + Math.floor(Math.random() * 100000), 
    },
  });

  cabalDetails = await client.addCabal(key, () => {
    console.log("done");
  });

  cabalDetails.joinChannel("default");
  const channels = cabalDetails.getChannels();
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

    applyMessageToDB(db, parsedBaseMessage);
  });

  cabalDetails.on("new-message", (info: CabalMessage) => {
    const parsedBaseMessage = parseBaseMessage(info.message.value.content.text);
    if (!parsedBaseMessage) {
      return;
    }

    applyMessageToDB(db, parsedBaseMessage);
  });
}


export function getNotes() {
  return db.notes
}

Promise.all([setupCabal()]);