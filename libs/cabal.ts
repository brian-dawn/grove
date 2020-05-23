const Client = require("cabal-client");
const level = require("level");

import { parseBaseMessage, encodeBaseMessage, BaseMessage } from "./messages";
import { DB, applyMessageToDB } from "./model";
import fs from "fs";

var cabalDetails: CabalDetails | undefined = undefined;

declare global {
  namespace NodeJS {
    interface Global {
      // Did we already run setup?
      setup: boolean;
      // The global in memory database.
      db: DB;
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

  // const lockPath = `${dbPath}/${key}/views/LOCK`;
  // console.log(`lockPath ${lockPath}`);
  // if (fs.existsSync(lockPath)) {
  //   console.log(
  //     "The lock already exists, if we're in dev we can probably just delete it :P"
  //   );
  //   // TODO: Only do this in development.
  //   fs.unlinkSync(lockPath);
  // } else {
  //   console.log("not deleting the lock");
  // }

  const client: Client = new Client({
    config: {
      dbdir: dbPath,
    },
  });

  // Lock attempt is here.
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

    applyMessageToDB(global.db, parsedBaseMessage);
  });

  cabalDetails.on("new-message", (info: CabalMessage) => {
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

Promise.all([setupCabal()]);
