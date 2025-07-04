import express, { Router } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth/index.js';
import attractionRoutes from './routes/attraction/index.js';
import userRoutes from './routes/user/index.js';

const app = express();
const port = process.env.PORT || 3000;

const router = Router();

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
bodyParser.urlencoded({ extended: false })

app.use('/auth', authRoutes);
app.use('/attraction', attractionRoutes);
app.use('/user', userRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
})