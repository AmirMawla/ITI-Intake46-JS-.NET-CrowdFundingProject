using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Authentication
{
    public interface IJwtProvider
    {
        (string token, int expiresIn) GenerateToken(ApplicationUser applicationUser , IEnumerable<string> roles);
        string? ValidateToken(string token);
    }
}
