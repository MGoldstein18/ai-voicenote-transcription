import type { NextApiRequest, NextApiResponse } from 'next';
import * as banana from '@banana-dev/banana-dev';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  console.log('Received', req.body);
  const userNumber = req.body.sender.id;
  const typeOfMedia = req.body.message.attachments[0].type;

  if (typeOfMedia !== 'audio') {
    console.log('ERROR -->> not audio');
    res.status(400).json({ error: 'Not audio' });
  }

  const audio = req.body.message.attachments[0].url;

  const {
    BANANA_API_KEY: bananaApiKey,
    BANANA_MODEL_KEY: modelKey,
    CONNECTLY_API_KEY: connectlyApiKey,
    CONNECTLY_BUSINESS_ID: businessId,
    WHATSAPP_NUMBER: aiNUmber
  } = process.env;

  if (
    !bananaApiKey ||
    !modelKey ||
    !connectlyApiKey ||
    !businessId ||
    !aiNUmber
  ) {
    console.log('ERROR -->> no env variables');
    res.status(500).json({ error: 'No env variables' });
  }

  let result: any = await axios
    .get(audio, {
      responseType: 'arraybuffer'
    })
    .then((response: any) =>
      // @ts-ignore
      new Buffer.from(response.data, 'binary').toString('base64')
    );

  const output = await banana
    .run(bananaApiKey || '', modelKey || '', { mp3BytesString: result })
    .catch((error) => console.error('Error =>', error));

  console.log('Output =>', output);

  const connectlyReponse = await axios.post(
    `https://api.connectly.ai/v1/businesses/${{ businessId }}/send/messages`,
    {
      sender: {
        id: aiNUmber,
        channelType: 'whatsapp'
      },
      recipient: {
        id: userNumber,
        channelType: 'whatsapp'
      },
      message: {
        text: 'Hello!'
      }
    }
  );
  res.status(200).json({ message: 'output', response: connectlyReponse });
}
