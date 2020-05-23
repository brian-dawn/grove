import { GetStaticProps, GetStaticPaths, GetServerSideProps } from "next";
import Head from "next/head";
import typeFetch from "../libs/fetch";
import fetch from "isomorphic-unfetch";
import useSWR from "swr";
import { Data } from "./api/notes";
import { Note } from "../libs/model";
import { useState } from "react";

export default function Home() {
  const [content, setContent] = useState("");

  const { data, error } = useSWR<Note[]>("/api/notes", typeFetch);

  const handleSubmit = async () => {
    console.log("submit " + content);
    const resp = await fetch("/api/notes", {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });
  };
  const onChangeContent = (evt: { target: { value: string } }) => {
    setContent(evt.target.value);
  };
  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          New Note:
          <input type="text" name="content" onChange={onChangeContent} />
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
