export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    // Zod 3 usa 'errors', Zod 4 usa 'issues'
    const issues = err.issues || err.errors || [];

    if (err.name === 'ZodError' || issues.length > 0) {
      return res.status(422).json({
        message: 'Datos inválidos',
        errors: issues.map((e) => ({
          field: e.path ? e.path.join('.') : (e.path || ''),
          message: e.message,
        })),
      });
    }

    next(err);
  }
};