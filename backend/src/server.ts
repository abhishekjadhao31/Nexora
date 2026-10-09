import { app } from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`NEXORA API listening on port ${config.port}`);
});
