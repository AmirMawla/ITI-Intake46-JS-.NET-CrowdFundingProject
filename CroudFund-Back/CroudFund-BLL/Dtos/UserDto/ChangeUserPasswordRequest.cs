using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.UserDto
{
    public record ChangeUserPasswordRequest(
        string CurrentPassword,
        string NewPassword
    );
    
}
