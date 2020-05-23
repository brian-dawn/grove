
import { GetStaticProps, GetStaticPaths, GetServerSideProps } from 'next'
import Head from 'next/head'
import fetch from '../libs/fetch'
import useSWR from 'swr'
import { Data } from './api/notes'
import { Note } from '../libs/model'


export default function Home() {
  const { data, error } = useSWR<Note[]>('/api/notes', fetch)

  if (error) return <div>failed to load</div>
  if (!data) return <div>loading...</div>

  return(<div>
    hello {data.map(note => {
    return (
    <div>
      <div>{note.timestamp}</div>
      <div>{note.content}</div>
    </div>

    )
  })}!
  </div>)
}
