export const responseInterceptor = (req: any, res: any, next: any) => {
  const oldJson = res.json;

  res.json = function (data: any) {
    return oldJson.call(this, {
      success: true,
      requestId: req.requestId,
      data,
    });
  };

  next();
};