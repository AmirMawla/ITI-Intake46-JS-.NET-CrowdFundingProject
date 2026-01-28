using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.PledgeDto;

public record DashboardStatistics(
        decimal TotalRevenue,
        int TotalTransactions,
        int TotalCampaigns,
        int ActiveCampaigns,
        int PendingCampaigns,
        int TotalUsers,
        int ActiveDonors,
        decimal AverageDonation,
        decimal ThisMonthRevenue,
        decimal LastMonthRevenue,
        decimal RevenueGrowthPercentage,
        decimal DonorGrowthPercentage,
        decimal CampaignsGrowthPercentage
    );
