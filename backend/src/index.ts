import dotenv from 'dotenv';
import app from './server';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Aeternum Backend] Running on http://localhost:${PORT}`);
});
