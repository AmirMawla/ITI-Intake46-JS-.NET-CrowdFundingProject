using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.AuthenticationDto;
using CroudFund_BLL.Dtos.UserDto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Interfaces
{
    public interface IAuthRepositry
    {
        Task<Result<AuthResponse>> GetTokenAsync(string email, string password, CancellationToken cancellation);
        Task<Result<AuthResponse>> GetRefreshTokenAsync(string token, string refreshToken, CancellationToken cancellation = default);
        Task<Result> RevokeRefreshTokenAsync(string token, string refreshToken, CancellationToken cancellation = default);
        Task<Result> RegisterAsync(RegisterationRequest request, CancellationToken cancellationToken = default);

    }
}
