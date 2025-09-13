import dotenv from 'dotenv';
import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export {db,sql};
