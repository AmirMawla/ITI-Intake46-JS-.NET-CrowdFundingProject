using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.PledgeDto;

public record TopCampaign(
        int CampaignId,
        string CampaignTitle,
        string CampaignDescription,
        decimal GoalAmount,
        string CampaignImage,
        string UserId,
        string UserName,
        string CategoryName,
        decimal TotalCollected,
        int DonorCount,
        decimal CompletionPercentage,
        DateTime Deadline
    );