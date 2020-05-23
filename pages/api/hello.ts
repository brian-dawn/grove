
import { NextApiRequest, NextApiResponse } from 'next'


export type Data = {
  name: string
}

export default (req: NextApiRequest, res: NextApiResponse<Data>) => {
  res.status(200).json({ name: `Hello${req.url}` })
}
