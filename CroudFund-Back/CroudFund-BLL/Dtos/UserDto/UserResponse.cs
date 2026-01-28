using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.UserDto
{
    public record UserResponse(
        string Id,
        string FullName,
        string Email,
        string? ProfileImage,
        decimal HowMuchHeDonate,
        int HowManyHeDonate,
        decimal HowMuchHeCollectFromDonattion,
        int HowManyHeCollectFromDonattion,
        bool IsActive
    );
}
