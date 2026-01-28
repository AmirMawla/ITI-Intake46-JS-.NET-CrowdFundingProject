using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.CategoryDto
{
    public record CategoryResponse(
        int Id,
        string Name,
        DateTime CreatedAt,
        int CampaignCount
        );

}
