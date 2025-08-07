require('dotenv').config();
const express = require('express');
const Airtable = require('airtable');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: 'https://address-binder-f2iqdlqaz-mmarinelli-horizenlabs-projects.vercel.app'
  }));
app.use(express.json());

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = process.env.AIRTABLE_TABLE_NAME;

app.post('/add-binding', async (req, res) => {
  const { substrateAddress, evmAddress, signature, signedMessage, timestamp } = req.body;
  try {
    await base(table).create([
      {
        fields: {
          substrateAddress,
          evmAddress,
          signature,
          signedMessage,
          timestamp,
        },
      },
    ]);
    res.status(200).send('Binding saved to Airtable!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to save binding to Airtable');
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));