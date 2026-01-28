using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.AuthenticationDto
{
    public record AuthResponse(
        string Id,
        string Email,
        string FullName,
        string Token,
        int ExpiresIn,
        string RefreshToken,
        DateTime RefreshTokenExpiration
    )
    {
        /// <summary>
        /// Roles assigned to the authenticated user (e.g. Admin, User)
        /// </summary>
        public IReadOnlyList<string> Roles { get; init; } = Array.Empty<string>();
    }
}
