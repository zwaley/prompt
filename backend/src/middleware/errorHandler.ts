/**
 * 错误处理中间件
 * 统一处理应用程序中的错误
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// 自定义错误类
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 处理Prisma错误
function handlePrismaError(error: PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // 唯一约束违反
      const field = error.meta?.target as string[];
      return new AppError(`${field?.join(', ') || '字段'}已存在`, 400);
    
    case 'P2025':
      // 记录不存在
      return new AppError('请求的资源不存在', 404);
    
    case 'P2003':
      // 外键约束违反
      return new AppError('关联的资源不存在', 400);
    
    case 'P2014':
      // 关联记录冲突
      return new AppError('无法删除，存在关联数据', 400);
    
    default:
      return new AppError('数据库操作失败', 500);
  }
}

// 处理验证错误
function handleValidationError(error: any): AppError {
  const message = error.details?.map((detail: any) => detail.message).join(', ') || '数据验证失败';
  return new AppError(message, 400);
}

// 处理文件上传错误
function handleMulterError(error: any): AppError {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new AppError('文件大小超出限制', 400);
    case 'LIMIT_FILE_COUNT':
      return new AppError('文件数量超出限制', 400);
    case 'LIMIT_UNEXPECTED_FILE':
      return new AppError('不支持的文件字段', 400);
    default:
      return new AppError('文件上传失败', 400);
  }
}

// 发送错误响应
function sendErrorResponse(error: AppError, res: Response): void {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 生产环境下的错误响应
  if (!isDevelopment) {
    // 只发送操作性错误的详细信息
    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
      return;
    }

    // 对于编程错误，发送通用错误信息
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误'
    });
    return;
  }

  // 开发环境下的详细错误响应
  res.status(error.statusCode).json({
    status: 'error',
    message: error.message,
    stack: error.stack,
    error: error
  });
}

// 全局错误处理中间件
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  let appError: AppError;

  // 记录错误日志
  console.error('错误详情:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // 根据错误类型进行处理
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error.name === 'ValidationError') {
    appError = handleValidationError(error);
  } else if (error.name === 'MulterError') {
    appError = handleMulterError(error);
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AppError('无效的令牌', 401);
  } else if (error.name === 'TokenExpiredError') {
    appError = new AppError('令牌已过期', 401);
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    appError = new AppError('无效的JSON格式', 400);
  } else {
    // 未知错误
    appError = new AppError('服务器内部错误', 500);
  }

  sendErrorResponse(appError, res);
};

// 处理未捕获的异步错误
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 处理未找到的路由
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`路径 ${req.originalUrl} 不存在`, 404);
  next(error);
};

// 处理未捕获的Promise拒绝
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('未处理的Promise拒绝:', reason);
  // 优雅关闭服务器
  process.exit(1);
});

// 处理未捕获的异常
process.on('uncaughtException', (error: Error) => {
  console.error('未捕获的异常:', error);
  // 优雅关闭服务器
  process.exit(1);
});