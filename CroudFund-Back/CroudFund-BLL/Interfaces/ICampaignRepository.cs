using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.CampaignDto;
using CroudFund_BLL.Dtos.Common;
using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Interfaces;

public interface ICampaignRepository : IBaseRepository<Campaign>
{
    Task<Result<PaginatedList<CampaignResponse>>> GetAllCampaigns(RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<CampaignResponse>>> GetAllApprovedCampaigns(RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<CampaignResponse>>> GetCampaignsByCategory(int categoryId, RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<CampaignResponse>>> GetCampaignsByUser(string userId, RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<CampaignResponse>>> GetMyCampaigns(string userId, RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<List<CampaignResponse>>> GetFeaturedCampaigns(CancellationToken cancellationToken = default);
    Task<Result> UpdateCampaign(int campaignId, UpdateCampaignRequest request, string currentUserId, bool isAdmin, CancellationToken cancellationToken = default);

    Task<Result<CampaignResponse>> CreateCampaign(UpdateCampaignRequest request, string userId, CancellationToken cancellationToken = default);

     Task<Result> UpdateCampaignApproval(int campaignId, bool? isApproved = null, CancellationToken cancellationToken = default);

    Task<Result> DeleteCampaign(int campaignId, string currentUserId, bool isAdmin, CancellationToken cancellationToken = default);

    Task<Result<CampaignResponse>> GetCampaignById(int campaignId, CancellationToken cancellationToken = default);


}
