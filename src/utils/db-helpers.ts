import type { Request } from "express";
import type { Model, PipelineStage } from "mongoose";
import { ActorTypeEnum } from "@/enum/actor-type-enum";
import type { AdminRequest } from "@/types/admin-type";
import type { AgencyRequest } from "@/types/agency-type";
import type { UserRequest } from "@/types/user-type";
import { FileHelper } from "./file-helpers";

type TableDataResult<T> = {
  items: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  nextPage: number | null;
};

type BuildPipelineParams = {
  searchTerm?: string;
  searchFields: string[];
  filters?: Record<string, unknown>;
  page: number;
  pageSize: number;
  projection?: Record<string, 0 | 1 | boolean | Record<string, unknown> | string>;
  lookups?: PipelineStage[];
  sortBy?: Record<string, 1 | -1>;
  noPagination?: boolean;
};

type FetchTableDataParams<T> = {
  model: Model<T>;
  req: Request;
  searchFields?: string[];
  filters?: Record<string, unknown>;
  projection?: Record<string, 0 | 1 | boolean | Record<string, unknown> | string>;
  lookups?: PipelineStage[];
  sortBy?: Record<string, 1 | -1>;
  noPagination?: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: Willing to accept any for mapper
  mapper?: (data: any[]) => any[];
};

class DBHelperClass {
  /**
   * Extracts pagination and search parameters from request query
   */
  private extractTableParams(req: Request) {
    const page = Math.abs(Number.parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.abs(Number.parseInt(req.query.pageSize as string, 10) || 15);
    const searchTerm = (req.query.q as string | undefined)?.trim();

    return { page, pageSize, searchTerm };
  }

  /**
   * Builds MongoDB aggregation pipeline for paginated table data
   */
  private buildTablePipeline({ searchTerm, searchFields, filters = {}, page, pageSize, projection, lookups, sortBy, noPagination }: BuildPipelineParams): PipelineStage[] {
    // Ensure deletedAt: null is always in the base filter
    const baseFilter = { deletedAt: null, ...filters };

    const pipeline: PipelineStage[] = [];
    // Add search match if search term is provided
    if (searchTerm && searchFields.length > 0) {
      const orConditions = searchFields
        .map((field) => {
          const fieldName = field;

          if (fieldName.includes(".phoneNumber")) {
            const phoneFieldPrefix = fieldName.split(".phoneNumber")[0];
            const normalizedSearch = searchTerm.replace(/\D/g, "");

            if (normalizedSearch.trim().length === 0) {
              return null;
            }

            return {
              $expr: {
                $regexMatch: {
                  input: {
                    $replaceAll: {
                      input: {
                        $concat: [`$${phoneFieldPrefix}.phoneCode`, `$${phoneFieldPrefix}.phoneNumber`],
                      },
                      find: "+",
                      replacement: "",
                    },
                  },
                  regex: normalizedSearch,
                },
              },
            };
          }

          return {
            [fieldName]: {
              $regex: searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              $options: "i",
            },
          };
        })
        .filter(Boolean) as object[];

      pipeline.push({
        $match: {
          $and: [baseFilter, { $or: orConditions }],
        },
      });
    } else {
      pipeline.push({
        $match: baseFilter,
      });
    }

    // Add lookups if provided
    if (lookups) {
      pipeline.push(...lookups);
    }

    // Add projection if provided
    if (projection) {
      pipeline.push({
        $project: projection,
      });
    }

    // Add sorting
    const sortStage = sortBy || { createdAt: -1 };
    pipeline.push({
      $sort: sortStage,
    });

    // Add pagination or return all results
    if (!noPagination) {
      pipeline.push({
        $facet: {
          paginatedResults: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          totalCount: [
            {
              $count: "count",
            },
          ],
        },
      });
    }

    return pipeline;
  }

  /**
   * Fetches paginated table data from a MongoDB model
   */
  async fetch<T>({ model, req, searchFields = [], filters = {}, projection, lookups, sortBy, noPagination, mapper }: FetchTableDataParams<T>): Promise<TableDataResult<T>> {
    const { page, pageSize, searchTerm } = this.extractTableParams(req);

    const pipeline = this.buildTablePipeline({
      searchTerm,
      searchFields,
      filters,
      page,
      pageSize,
      projection,
      lookups,
      sortBy,
      noPagination,
    });

    if (noPagination) {
      const result = (await model.aggregate(pipeline)) as T[];
      const mappedData = mapper ? mapper(result) : result;

      return {
        items: mappedData,
        totalCount: mappedData.length,
        currentPage: 1,
        pageSize: mappedData.length,
        totalPages: 1,
        nextPage: null,
      };
    }

    const result = (await model.aggregate(pipeline)) as Array<{
      paginatedResults: T[];
      totalCount: Array<{ count: number }>;
    }>;

    if (!result.length) {
      return {
        items: [],
        totalCount: 0,
        currentPage: page,
        pageSize,
        totalPages: 0,
        nextPage: null,
      };
    }

    const [data] = result;
    const mappedData = mapper ? mapper(data.paginatedResults) : data.paginatedResults;

    return {
      items: mappedData,
      totalCount: data.totalCount[0]?.count ?? 0,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil((data.totalCount[0]?.count ?? 0) / pageSize),
      nextPage: page * pageSize < (data.totalCount[0]?.count ?? 0) ? page + 1 : null,
    };
  }

  file(key: string): { $cond: unknown[] } {
    return {
      $cond: [{ $ne: [key, null] }, { $concat: [FileHelper.getUrl("/") ?? "", key] }, null],
    };
  }

  locale(req: Request, key: string): string {
    // only allow "en" and "ar" for now
    const locale = (req.query.locale as string) || "en";
    if (locale !== "en" && locale !== "ar") {
      return `${key}.en`;
    }

    return `${key}.${locale}`;
  }

  actor(req: AgencyRequest | UserRequest | AdminRequest) {
    if ("agency" in req && req.agency?.agencyTeamId) {
      return {
        actorType: ActorTypeEnum.AGENCY_MEMBER,
        actorId: req.agency.agencyTeamId,
      };
    }

    if ("user" in req && req.user?.userId) {
      return {
        actorType: ActorTypeEnum.USER,
        actorId: req.user.userId,
      };
    }

    if ("admin" in req && req.admin?.adminId) {
      return {
        actorType: ActorTypeEnum.ADMIN,
        actorId: req.admin.adminId,
      };
    }

    throw new Error("Actor not found on request");
  }
}

export const DBHelper = new DBHelperClass();
