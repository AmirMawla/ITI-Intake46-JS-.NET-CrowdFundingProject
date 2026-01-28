using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.CampaignDto;

public record CampaignResponse
(
        int Id,
        string Title,
        string Description,
        decimal GoalAmount,
        DateTime Deadline,
        string? Image,
        bool IsApproved,
        DateTime CreatedAt,
        string UserId,
        string UserName,
        int CategoryId,
        string CategoryName,
        decimal TotalAmountPaid,
        int TotalDonorsCount
);