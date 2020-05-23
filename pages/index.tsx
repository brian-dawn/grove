import { GetStaticProps, GetStaticPaths, GetServerSideProps } from "next";
import Head from "next/head";
import fetch from "../libs/fetch";
import useSWR from "swr";
import { Data } from "./api/notes";
import { Note } from "../libs/model";
import { useState } from "react";

export default function Home() {
  const [content, setContent] = useState("");

  const { data, error, isValidating, mutate } = useSWR<Note[]>(
    "/api/notes",
    fetch
  );

  const handleSubmit = async (content: string) => {
    const resp = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });
    mutate(resp.body);
    setContent("");
  };
  const onChangeContent = (evt: { target: { value: string } }) => {
    setContent(evt.target.value);
  };
  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  data.sort((a: Note, b: Note) => {
    return b.timestamp - a.timestamp;
  });

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(content);
        }}
      >
        <label>
          New Note:
          <input
            value={content}
            type="text"
            name="content"
            onChange={onChangeContent}
          />
        </label>
        <input type="submit" value="Submit" />
      </form>

      {data.map((note) => {
        const date = new Date(note.timestamp);
        return (
          <div key={note.timestamp}>
            ####################
            <div>{date.toLocaleString()}</div>
            <div>{note.content}</div>
            ####################
          </div>
        );
      })}
    </div>
  );
}
