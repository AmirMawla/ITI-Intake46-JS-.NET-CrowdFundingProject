using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.AuthenticationDto
{
    public record RefreshTokenRequest(
        string Token,
        string RefreshToken
    );
}
