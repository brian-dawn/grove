import { GetStaticProps, GetStaticPaths, GetServerSideProps } from "next";
import Head from "next/head";
import fetch from "../libs/fetch";
import useSWR from "swr";
import { useState } from "react";
import { useRouter } from "next/router";
import Markdown from "markdown-to-jsx";
import Link from "next/link";
import "../styles.css";

import { Note } from "../libs/model";

interface NoteComponentProps {
  note: Note;
  notesById: Map<string, Note>;
}

interface Text {
  kind: "text";
  content: string;
}
interface NoteLink {
  kind: "noteLink";
  id: string;
}
interface Tag {
  kind: "tag";
  tag: string;
}
type ContentFragment = Text | NoteLink | Tag;

// Take some content, find the special components within it and return a list
// of all the sub components. We have text, noteLink, and tag.
function splitContent(body: string): ContentFragment[] {
  const noteLinkReg = /^\[\[(.*?)\]\]$/;
  const tagReg = /^(\@[a-zA-Z0-9]+)$/;

  const parts = body.split(/(\@[a-zA-Z0-9]+)|(\[\[.*?\]\])/gi);
  return parts
    .filter((part) => part)
    .map((part) => {
      if (tagReg.test(part)) {
        return { kind: "tag", tag: part } as Tag;
      } else if (noteLinkReg.test(part)) {
        return {
          kind: "noteLink",
          id: part.substr(2, part.length - 4),
        } as NoteLink;
      } else {
        return { kind: "text", content: part } as Text;
      }
    });
}

function renderLink(id: string, notesById: Map<string, Note>) {
  // TODO: render based on title first.
  // Then summary.
  // Then id/date or something.
  const content = notesById.get(id)?.content;
  const previewSize = 40;
  if (content) {
    const summary = content.replace(/\#|<|>|\[|\]/g, "").trim();
    if (summary.length > previewSize) {
      return summary.substr(0, previewSize - 3) + "...";
    } else {
      return summary;
    }
  }
  return id;
}

function renderContent(body: string, notesById: Map<string, Note>) {
  const frags = splitContent(body);
  return frags.map((frag) => {
    switch (frag.kind) {
      case "text":
        return <Markdown>{frag.content}</Markdown>;

      case "noteLink":
        if (notesById.get(frag.id)) {
          return (
            <div className="frag">
              [[<a href={"#" + frag.id}>{renderLink(frag.id, notesById)}</a>]]
            </div>
          );
        } else {
          return <div className="frag">[[{frag.id}]]</div>;
        }

      case "tag":
        return (
          <Link href={`/?tag=${frag.tag}`}>
            <a>{frag.tag}</a>
          </Link>
        );
    }
  });
}
export const NoteComponent = (props: NoteComponentProps) => {
  const note = props.note;
  const notesById = props.notesById;

  const date = new Date(note.timestamp);
  return (
    <div>
      <div id={note.id} key={"top" + note.id} className={"noteTopBar"}>
        <div className={"idViewer"}>{note.id}</div>
        <div className={"spacer"} />
        <div className={"spacer"} />
        <div>{date.toLocaleString()}</div>
        <div className={"spacer"} />
        <button className={"deleteButton"} onClick={() => deleteNote(note.id)}>
          Delete
        </button>
      </div>
      {note.linkedFrom.length !== 0 && (
        <div className={"fromHeader"}>
          {note.linkedFrom.map((id) => {
            return (
              <a href={`#${id}`} className={"fromLink"}>
                {renderLink(id, notesById)}
              </a>
            );
          })}
        </div>
      )}
      <div key={note.id} className={"note"}>
        {renderContent(note.content, notesById)}
      </div>
    </div>
  );
};
