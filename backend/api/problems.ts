import { Request, Response } from 'express';
import { pool } from '../db';

export const getRandomProblems = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM problems WHERE type = $1 ORDER BY RANDOM()',
      ['MULTIPLE_CHOICE']
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '문제 불러오기 실패' });
  }
};