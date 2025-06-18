/**
 * 404错误处理中间件
 * 处理未找到的路由
 */

import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`路径 ${req.originalUrl} 不存在`);
  res.status(404);
  next(error);
};