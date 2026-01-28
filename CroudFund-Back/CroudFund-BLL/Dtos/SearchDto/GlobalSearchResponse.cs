using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ServiceProvider_BLL.Dtos.SearchDto
{
    public record GlobalSearchResponse(
      string? Type = null, // "User", "Campaign", "Category"
      string? UserId = null,
      string? UserFullName = null,
      string? UserEmail = null,
      string? UserImageUrl = null,
      int? CampaignId = null,
      string? CampaignTitle = null,
      string? CampaignDescription = null,
      string? CampaignImageUrl = null ,
      string? CategoryName = null,
      int? CategoryId = null
    );
}
