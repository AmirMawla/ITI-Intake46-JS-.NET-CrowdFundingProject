using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.ReviewDto
{
    public record ReviewResponse(
        int Id,
        string Comment,
        Reaction? Reaction,
        DateTime CreatedAt,
        string UserId,
        string UserName,
        string? UserImageUrl,
        int CampaignId,
        string CampaignTitle
        );
}
