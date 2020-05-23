import * as t from "io-ts";

import { Option, some, none } from "fp-ts/lib/Option";
import { Either, isRight, isLeft } from "fp-ts/lib/Either";

const NewNote = t.type({
  kind: t.literal("NewNote"),
  noteId: t.number,
  content: t.string,
});
type NewNote = t.TypeOf<typeof NewNote>;

const DeleteNote = t.type({
  kind: t.literal("DeleteNote"),
  noteId: t.number,
  deleted: t.boolean,
});
type DeleteNote = t.TypeOf<typeof DeleteNote>;

const Message = t.union([NewNote, DeleteNote]);
type Message = t.TypeOf<typeof Message>;

export const BaseMessage = t.type({
  message: Message,
  messageTimestamp: t.number,
});
export type BaseMessage = t.TypeOf<typeof BaseMessage>;

export function parseBaseMessage(data: string): BaseMessage | null {
  try {
    const result = BaseMessage.decode(JSON.parse(data));
    if (isRight(result)) {
      return result.right;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export function encodeBaseMessage(data: BaseMessage): string {
  return JSON.stringify(BaseMessage.encode(data));
}