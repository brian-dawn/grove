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
import { NoteComponent } from "../components/NoteComponent";
import { NoteEditorComponent } from "../components/NoteEditorComponent";

const colorThemes = [
  "#afd76b",
  "#716799",
  "#f676e1",
  "#76b8f6",
  "#f6dc76",
  "#f69476",
  "#f6769d",
];

export default function Home() {
  const [content, setContent] = useState("");
  const [hashCompletion, setHashCompletion] = useState("");
  const [cardCompletion, setCardCompletion] = useState("");
  const [colorTheme, setColorTheme] = useState(colorThemes[0]);
  const router = useRouter();

  // We want to read the path fragment (url/#foo) because this is how
  // we filter by hashtags. Maybe we should be using nextjs Link instead :P
  const tag = router.query["tag"];
  const id = router.query["id"];

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

  const selectNewColorTheme = async () => {
    const currentThemeIndex = colorThemes.findIndex((theme) => {
      return theme === colorTheme;
    });
    setColorTheme(colorThemes[(currentThemeIndex + 1) % colorThemes.length]);
  };

  const deleteNote = async (noteId: string) => {
    const resp = await fetch(`/api/note/${noteId}`, {
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

  const notesById: Map<string, Note> = data.reduce(function (map, obj) {
    map.set(obj.id, obj);
    return map;
  }, new Map<string, Note>());

  let visibleNotes = data;
  if (id) {
    // We want to view a specific note.
    // TODO: In this view we might want to view other notes that are similar in context.
    visibleNotes = data.filter((note) => {
      return note.id === id;
    });
  } else if (tag) {
    // We're searching by a tag.
    visibleNotes = data.filter((note) => {
      if (typeof tag === "string") {
        return note.content.includes(tag);
      } else {
        return (
          tag.map((t) => note.content.includes(t)).filter((t) => !t).length ===
          0
        );
      }
    });
  }

  visibleNotes.sort((a: Note, b: Note) => {
    return b.timestamp - a.timestamp;
  });

  const allTags = Array.from(
    new Set(
      data
        .filter((note) => {
          return !note.deleted;
        })
        .flatMap((note) => {
          const tagReg = /\@[a-zA-Z0-9]+/gi;

          const found = note.content.matchAll(tagReg);
          return Array.from(found);
        })
        .map((n) => {
          return n[0].substr(1, n[0].length);
        })
    )
  );

  const allTitles = data
    .filter((note) => {
      return !note.deleted;
    })
    .map((note) => {
      // TODO: there is a title flag but it's not supplied yet.
      return {
        title: note.content.trim().split("\n")[0].trim(),
        id: note.id,
      };
    })
    .filter((title) => {
      // Titles are notes that start with any heading.
      return title.title.startsWith("#");
    })
    .map((title) => {
      return {
        title: title.title.replace("#", "").trim(),
        id: title.id,
      };
    });

  return (
    <div>
      <style jsx global>{`
        body {
          background-color: ${colorTheme};
        }
      `}</style>
      <div className={"topNavBar"}>
        Top Nav Bar Stuff
        <button onClick={selectNewColorTheme}>Change Theme</button>
      </div>
      <div className={"codeMirrorContainer"}>
        <NoteEditorComponent
          initialContent={content}
          allTags={allTags}
          setContent={setContent}
          allTitles={allTitles}
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
        <Link href="/">
          <a>all</a>
        </Link>
      </div>
      {visibleNotes
        .filter((note) => {
          return !note.deleted;
        })
        .map((note) => {
          return (
            <NoteComponent
              note={note}
              notesById={notesById}
              deleteNoteFn={() => {
                deleteNote(note.id);
              }}
              allTags={allTags}
              allTitles={allTitles}
            />
          );
        })}
      <br />
    </div>
  );
}
