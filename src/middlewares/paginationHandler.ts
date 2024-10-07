import { Request } from "express";
import { URLSearchParams } from "url";

export interface PaginationHandlerResponse<T = any> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  nextPage: string | null;
  previousPage: string | null;
}

export const paginationHandler = async (
  req: Request,
  getMethod: () => Promise<any>,
): Promise<any> => {
  const url = req.originalUrl.split("?")[0];
  const page: number = Number(req.query.page) || 1;
  const limit: number = Number(req.query.limit) || 10;

  const response = await getMethod();
  const [items, totalItems] = response.response;

  const totalPages = Math.ceil(totalItems / limit);

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const queryParameters = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (req.query.status) {
    queryParameters.set("status", req.query.status as string);
  }

  const queryParamsNext = new URLSearchParams({
    page: (page + 1).toString(),
    limit: limit.toString(),
  });

  const nextPage = hasNextPage
    ? `${url}?${queryParamsNext}${
        req.query.status ? `&status=${req.query.status}` : ""
      }`
    : null;

  queryParameters.set("page", (page - 1).toString());

  const previousPage = hasPreviousPage ? `${url}?${queryParameters}` : null;

  return {
    data: {
      items: items,
      currentPage: page,
      totalPages,
      totalItems,
      nextPage,
      previousPage,
    },
    status: response.status,
    success: response.success,
    message: response.message,
  };
};
