using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.Common;
using CroudFund_BLL.Dtos.PledgeDto;
using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Interfaces;

public interface IPledgeRepository :IBaseRepository<Pledge>
{
    Task<Result<PledgeResponse>> GetPledgeAsync(int id, string userId, bool IsAdmin , CancellationToken cancellationToken = default);
    Task<Result<PledgeResponse>> AddPledgeAsync(string userId,int CampaignId, PledgeRequest request, CancellationToken cancellationToken = default);

    // User Transaction Methods
    Task<Result<PaginatedList<PledgeResponse>>> GetMyDonations(string userId, RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<PledgeResponse>>> GetMyCollections(string userId, RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<UserTransactionSummary>> GetMyTransactionSummary(string userId, CancellationToken cancellationToken = default);

    // Admin Methods
    Task<Result<PaginatedList<PledgeResponse>>> GetAllPledges(RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<PledgeResponse>>> GetPledgesByCampaign(int campaignId, RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<PledgeResponse>>> GetPledgesByUser(string userId, RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<UserTransactionSummary>> GetUserTransactionSummary(string userId, CancellationToken cancellationToken = default);

    // Analytics & Statistics
    Task<Result<TransactionStatistics>> GetTransactionStatistics(DateTime? startDate, DateTime? endDate, CancellationToken cancellationToken = default);
    Task<Result<List<TopDonor>>> GetTopDonors(int count, CancellationToken cancellationToken = default);
    Task<Result<List<TopCampaign>>> GetTopCampaigns(int count, CancellationToken cancellationToken = default);
    Task<Result<List<CampaignTransactionSummary>>> GetCampaignTransactionSummaries(CancellationToken cancellationToken = default);
    Task<Result<DashboardStatistics>> GetDashboardStatistics(CancellationToken cancellationToken = default);

    // User dashboard statistics (for creator dashboard page)
    Task<Result<UserDashboardStatistics>> GetUserDashboardStatistics(string userId, CancellationToken cancellationToken = default);

    // User monthly financial performance (for chart)
    Task<Result<List<UserMonthlyFinancialPerformance>>> GetUserMonthlyFinancialPerformance(string userId, CancellationToken cancellationToken = default);
}
