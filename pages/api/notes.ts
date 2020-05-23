
import { NextApiRequest, NextApiResponse } from 'next'
import { getNotes } from '../../libs/cabal'
import {Note} from '../../libs/model'

console.log('hello this is nodejs yes? Yep wow')

export type Data = {
  name: string
}

export default (req: NextApiRequest, res: NextApiResponse<Note[]>) => {
  const notes = getNotes()
  const notesArr = Object.values(notes)
  res.status(200).json(notesArr)
}
