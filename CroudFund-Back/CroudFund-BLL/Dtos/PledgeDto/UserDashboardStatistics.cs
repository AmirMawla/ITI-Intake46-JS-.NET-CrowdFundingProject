using System;

namespace CroudFund_BLL.Dtos.PledgeDto;

public record UserDashboardStatistics(
        string UserId,
        string UserName,
        decimal TotalCollected,
        int TotalCollectionCount,
        decimal TotalDonated,
        int TotalDonationCount,
        int TotalCampaigns,
        int SuccessfulCampaigns,
        decimal SuccessRate,
        decimal ThisMonthCollected,
        decimal LastMonthCollected,
        decimal CollectedGrowthPercentage,
        decimal ThisMonthDonated,
        decimal LastMonthDonated,
        decimal DonatedGrowthPercentage
    );


