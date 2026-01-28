using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.PledgeDto;

public record CampaignTransactionSummary(
        int CampaignId,
        string CampaignTitle,
        decimal GoalAmount,
        decimal TotalCollected,
        int DonorCount,
        decimal CompletionPercentage,
        DateTime? LastDonationDate
    );