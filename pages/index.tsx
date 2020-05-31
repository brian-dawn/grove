import { GetStaticProps, GetStaticPaths, GetServerSideProps } from "next";
import Head from "next/head";
import fetch from "../libs/fetch";
import useSWR from "swr";
import { Data } from "./api/note";
import { Note } from "../libs/model";
import { useState } from "react";
import { useRouter } from "next/router";
import Markdown from "markdown-to-jsx";
import Link from "next/link";
import "../styles.css";

import dynamic from "next/dynamic";
const CodeWithCodemirror = dynamic(
  import("../components/code-with-codemirror"),
  { ssr: false }
);

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

function renderContent(body: string, notesById: Map<string, Note>) {
  const frags = splitContent(body);
  return frags.map((frag) => {
    switch (frag.kind) {
      case "text":
        return <Markdown>{frag.content}</Markdown>;

      case "noteLink":
        return (
          <div className="frag">
            [[<a href={"#" + frag.id}>{renderLink(frag.id, notesById)}</a>]]
          </div>
        );

      case "tag":
        return (
          <Link href={`/?tag=${frag.tag}`}>
            <a>{frag.tag}</a>
          </Link>
        );
    }
  });
}

function renderCardLinks(body: string, notesById: Map<string, Note>) {
  const re = /\[\[(.*?)\]\]/gi;

  return body.replace(
    re,
    (match: string, p1: string, offset: number, s: string) => {
      return `[[<a href="#${p1}"}>${renderLink(p1, notesById)}</a>]]`;
    }
  );
}

function renderTags(body: string) {
  const re = /\@([a-zA-Z0-9]+)/gi;

  return body.replace(
    re,
    (match: string, p1: string, offset: number, s: string) => {
      return `@<a class="nav" 
                href="/?tag=@${p1}"}>${p1}</a>`;
      //return `@<Link href="/?tag=10><a>${p1}</a></Link>`;
    }
  );
}

function renderLink(id: string, notesById: Map<string, Note>) {
  // TODO: render based on title first.
  // Then summary.
  // Then id/date or something.
  const content = notesById.get(id)?.content;
  if (content) {
    const summary = content.replace(/\#|<|>|\[|\]/g, "").trim();
    if (summary.length > 20) {
      return summary.substr(0, 20) + "...";
    } else {
      return summary;
    }
  }
  return id;
}

export default function Home() {
  const [content, setContent] = useState("");
  const [hashCompletion, setHashCompletion] = useState("");
  const [cardCompletion, setCardCompletion] = useState("");
  const router = useRouter();

  console.log(router);
  // We want to read the path fragment (url/#foo) because this is how
  // we filter by hashtags. Maybe we should be using nextjs Link instead :P
  const tag = router.query["tag"];

  var { data, error, isValidating, mutate } = useSWR<Note[]>(
    "/api/note",
    fetch
  );

  const handleSubmit = async (content: string) => {
    const resp = await fetch("/api/note", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });
    mutate(resp.body);
    //setContent("");
  };

  const deleteNote = async (noteId: string) => {
    const resp = await fetch(`/api/note?id=${noteId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });
    mutate(resp.body);
  };
  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  // We're searching by a tag.
  if (tag) {
    data = data.filter((note) => {
      return note.content.includes(tag);
    });
  }

  const notesById: Map<string, Note> = data.reduce(function (map, obj) {
    map.set(obj.id, obj);
    return map;
  }, new Map<string, Note>());

  data.sort((a: Note, b: Note) => {
    return b.timestamp - a.timestamp;
  });

  return (
    <div>
      <div className={"topNavBar"}>Top Nav Bar Stuff</div>
      <div className={"codeMirrorContainer"}>
        <CodeWithCodemirror
          value={content.toUpperCase()}
          // @ts-ignore
          onBeforeChange={(editor, data, value) => {
            // We're in hash completion
            if (hashCompletion !== "") {
              const validHashTagCharacters = /^[0-9a-zA-Z]+$/;
              if (data.text.join("").match(validHashTagCharacters)) {
                setHashCompletion(hashCompletion + data.text.join(""));
                console.log("continuing hashtag completion " + hashCompletion);
              } else {
                // Finish completion.
                console.log("finishing hashtag completion " + hashCompletion);
                setHashCompletion("");
              }
            } else if (data.text[0] === "@") {
              console.log("starting hashtag completion");
              // We have a hashtag so start hash completion.
              setHashCompletion(data.text.join(""));
            }
            setContent(value);
          }}
          // @ts-ignore
          onChange={(editor, data, value) => {}}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(content);
          }}
        >
          <label>New Note:</label>
          <input type="submit" value="Submit" />
        </form>
        <Markdown>{content}</Markdown>
      </div>
      <Link href="/">
        <a>all</a>
      </Link>
      {data
        .filter((note) => {
          return !note.deleted;
        })
        .map((note) => {
          const date = new Date(note.timestamp);
          return (
            <div>
              <div id={note.id} key={"top" + note.id} className={"noteTopBar"}>
                <div className={"idViewer"}>{note.id}</div>
                <div className={"spacer"} />
                <div>
                  {note.linkedFrom.length !== 0 && (
                    <div className={"fromLink"}>from</div>
                  )}
                  {note.linkedFrom.map((id) => {
                    return (
                      <a href={`#${id}`} className={"fromLink"}>
                        {renderLink(id, notesById)}
                      </a>
                    );
                  })}
                </div>
                <div className={"spacer"} />
                <div>{date.toLocaleString()}</div>
                <div className={"spacer"} />
                <button
                  className={"deleteButton"}
                  onClick={() => deleteNote(note.id)}
                >
                  Delete
                </button>
              </div>
              <div key={note.id} className={"note"}>
                {renderContent(note.content, notesById)}
              </div>
            </div>
          );
        })}
    </div>
  );
}
