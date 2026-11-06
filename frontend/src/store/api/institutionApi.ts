import { baseApi } from "./baseApi";
import {
  InstitutionResponseDto,
  CreateInstitutionDto,
  UpdateInstitutionDto,
  InstitutionStatus,
  InstitutionType,
} from "@/types";

export interface CreateAdminInput {
  institutionId: string;
  name: string;
  email: string;
  password: string;
  profileImage?: string;
}

export const institutionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInstitutions: builder.query<
      InstitutionResponseDto[],
      { status?: InstitutionStatus | string; type?: InstitutionType | string; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.status && params.status !== "ALL") {
          queryParams.append("status", params.status);
        }
        if (params?.type && params.type !== "ALL") {
          queryParams.append("type", params.type);
        }
        if (params?.search && params.search.trim()) {
          queryParams.append("search", params.search.trim());
        }
        const qs = queryParams.toString();
        return `/institutions${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Institution"],
    }),

    getInstitutionById: builder.query<InstitutionResponseDto, string>({
      query: (id) => `/institutions/${id}`,
      providesTags: (result, error, id) => [{ type: "Institution", id }],
    }),

    createInstitution: builder.mutation<
      InstitutionResponseDto,
      Record<string, any>
    >({
      query: (data) => ({
        url: "/institutions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Institution"],
    }),

    updateInstitution: builder.mutation<
      InstitutionResponseDto,
      { id: string; data: Record<string, any> }
    >({
      query: ({ id, data }) => ({
        url: `/institutions/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Institution",
        { type: "Institution", id },
      ],
    }),

    updateInstitutionStatus: builder.mutation<
      InstitutionResponseDto,
      { id: string; status: InstitutionStatus | string }
    >({
      query: ({ id, status }) => ({
        url: `/institutions/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        "Institution",
        { type: "Institution", id },
      ],
    }),

    createInstitutionAdmin: builder.mutation<any, CreateAdminInput>({
      query: ({ institutionId, ...data }) => ({
        url: `/institutions/${institutionId}/admins`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User", "Institution"],
    }),
  }),
});

export const {
  useGetInstitutionsQuery,
  useGetInstitutionByIdQuery,
  useCreateInstitutionMutation,
  useUpdateInstitutionMutation,
  useUpdateInstitutionStatusMutation,
  useCreateInstitutionAdminMutation,
} = institutionApi;

