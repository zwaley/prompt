/**
 * 数据验证中间件
 * 使用Joi进行请求数据验证
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Prompt验证规则
const promptSchema = Joi.object({
  title: Joi.string().required().min(1).max(255).messages({
    'string.empty': '标题不能为空',
    'string.min': '标题至少需要1个字符',
    'string.max': '标题不能超过255个字符',
    'any.required': '标题是必填项'
  }),
  content: Joi.string().required().min(1).messages({
    'string.empty': '内容不能为空',
    'string.min': '内容至少需要1个字符',
    'any.required': '内容是必填项'
  }),
  description: Joi.string().allow('').max(1000).messages({
    'string.max': '描述不能超过1000个字符'
  }),
  categoryId: Joi.number().integer().positive().allow(null).messages({
    'number.base': '分类ID必须是数字',
    'number.integer': '分类ID必须是整数',
    'number.positive': '分类ID必须是正数'
  }),
  tags: Joi.array().items(Joi.string().min(1).max(50)).max(20).messages({
    'array.max': '标签数量不能超过20个',
    'string.min': '标签名至少需要1个字符',
    'string.max': '标签名不能超过50个字符'
  }),
  priority: Joi.number().integer().min(0).max(10).messages({
    'number.base': '优先级必须是数字',
    'number.integer': '优先级必须是整数',
    'number.min': '优先级不能小于0',
    'number.max': '优先级不能大于10'
  })
});

// Prompt更新验证规则（所有字段都是可选的）
const promptUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(255).messages({
    'string.empty': '标题不能为空',
    'string.min': '标题至少需要1个字符',
    'string.max': '标题不能超过255个字符'
  }),
  content: Joi.string().min(1).messages({
    'string.empty': '内容不能为空',
    'string.min': '内容至少需要1个字符'
  }),
  description: Joi.string().allow('').max(1000).messages({
    'string.max': '描述不能超过1000个字符'
  }),
  categoryId: Joi.number().integer().positive().allow(null).messages({
    'number.base': '分类ID必须是数字',
    'number.integer': '分类ID必须是整数',
    'number.positive': '分类ID必须是正数'
  }),
  tags: Joi.array().items(Joi.string().min(1).max(50)).max(20).messages({
    'array.max': '标签数量不能超过20个',
    'string.min': '标签名至少需要1个字符',
    'string.max': '标签名不能超过50个字符'
  }),
  priority: Joi.number().integer().min(0).max(10).messages({
    'number.base': '优先级必须是数字',
    'number.integer': '优先级必须是整数',
    'number.min': '优先级不能小于0',
    'number.max': '优先级不能大于10'
  })
});

// 分类验证规则
const categorySchema = Joi.object({
  name: Joi.string().required().min(1).max(100).messages({
    'string.empty': '分类名不能为空',
    'string.min': '分类名至少需要1个字符',
    'string.max': '分类名不能超过100个字符',
    'any.required': '分类名是必填项'
  }),
  description: Joi.string().allow('').max(500).messages({
    'string.max': '描述不能超过500个字符'
  }),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).messages({
    'string.pattern.base': '颜色必须是有效的十六进制颜色代码（如：#1890ff）'
  })
});

// 标签验证规则
const tagSchema = Joi.object({
  name: Joi.string().required().min(1).max(50).messages({
    'string.empty': '标签名不能为空',
    'string.min': '标签名至少需要1个字符',
    'string.max': '标签名不能超过50个字符',
    'any.required': '标签名是必填项'
  }),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).messages({
    'string.pattern.base': '颜色必须是有效的十六进制颜色代码（如：#87d068）'
  })
});

/**
 * 创建验证中间件
 */
function createValidationMiddleware(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // 返回所有错误，而不是第一个错误
      stripUnknown: true // 移除未知字段
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      res.status(400).json({
        error: '数据验证失败',
        details: errors
      });
      return;
    }

    // 将验证后的数据替换原始数据
    req.body = value;
    next();
  };
}

// 导出验证中间件
export const validatePrompt = createValidationMiddleware(promptSchema);
export const validatePromptUpdate = createValidationMiddleware(promptUpdateSchema);
export const validateCategory = createValidationMiddleware(categorySchema);
export const validateTag = createValidationMiddleware(tagSchema);

// 分页参数验证
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  });

  const { error, value } = paginationSchema.validate(req.query, {
    allowUnknown: true
  });

  if (error) {
    res.status(400).json({
      error: '分页参数无效',
      details: error.details.map(detail => detail.message)
    });
    return;
  }

  // 更新查询参数
  req.query = { ...req.query, ...value };
  next();
};

// ID参数验证
export const validateId = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;
  
  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    res.status(400).json({
      error: 'ID参数无效',
      message: 'ID必须是有效的数字'
    });
    return;
  }

  next();
};

// 评分验证
export const validateRating = (req: Request, res: Response, next: NextFunction): void => {
  const ratingSchema = Joi.object({
    rating: Joi.number().min(0).max(5).required().messages({
      'number.base': '评分必须是数字',
      'number.min': '评分不能小于0',
      'number.max': '评分不能大于5',
      'any.required': '评分是必填项'
    })
  });

  const { error, value } = ratingSchema.validate(req.body);

  if (error) {
    res.status(400).json({
      error: '评分参数无效',
      details: error.details.map(detail => detail.message)
    });
    return;
  }

  req.body = value;
  next();
};

// 搜索参数验证
export const validateSearch = (req: Request, res: Response, next: NextFunction): void => {
  const searchSchema = Joi.object({
    q: Joi.string().min(1).max(200).messages({
      'string.empty': '搜索关键词不能为空',
      'string.min': '搜索关键词至少需要1个字符',
      'string.max': '搜索关键词不能超过200个字符'
    }),
    category: Joi.number().integer().positive(),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'useCount', 'rating', 'title').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  });

  const { error, value } = searchSchema.validate(req.query, {
    allowUnknown: true
  });

  if (error) {
    res.status(400).json({
      error: '搜索参数无效',
      details: error.details.map(detail => detail.message)
    });
    return;
  }

  req.query = { ...req.query, ...value };
  next();
};