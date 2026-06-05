import express from 'express';
import cors from 'cors';
import { RegisterRoutes } from './generated/routes';
import { supabase } from './supabase';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

RegisterRoutes(app);

// Health Check
app.get('/health', async (req, res) => {
  const { error } = await supabase.from('todo').select('id').limit(1);

  if (error) {
    return res.status(500).json({ status: 'Database Error', details: error.message });
  }

  res.status(200).json({ status: 'OK', database: 'Connected' });
});

// Swagger
if (process.env.NODE_ENV !== 'production') {
  app.use('/', swaggerUi.serve);

  app.get('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const rawSpec = fs.readFileSync(path.join(__dirname, './generated/swagger.json'), 'utf8');
      const swaggerDocument = JSON.parse(rawSpec);

      const options = {
        swaggerOptions: {
          spec: swaggerDocument,
        },
      };

      return swaggerUi.setup(undefined, options)(req, res, next);
    } catch (err) {
      return res.status(500).send('Swagger spec file not generated.');
    }
  });
} else {
  app.get('/', (req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });
}

export default app;
