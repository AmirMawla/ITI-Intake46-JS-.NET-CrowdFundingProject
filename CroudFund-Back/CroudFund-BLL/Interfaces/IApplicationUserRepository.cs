using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.Common;
using CroudFund_BLL.Dtos.UserDto;
using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Interfaces;

public interface IApplicationUserRepository : IBaseRepository<ApplicationUser>
{
    Task<Result<UserResponse>> GetUserDetails(string userId, CancellationToken cancellationToken = default);

    Task<Result<PaginatedList<UserResponse>>> GetAllUsers(RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<UserResponse>>> GetAllActiveUsers(string userId , RequestFilter request ,CancellationToken cancellationToken = default);

    Task<Result> UpdateUser(string userId, UpdateUserRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateUserActivity(string userId, string currentUserId, CancellationToken cancellationToken = default);
    Task<Result> DeleteUser(string userId, string currentUserId, CancellationToken cancellationToken = default);

    Task<Result> ChangePasswordAsync(string userId, ChangeUserPasswordRequest request);
}
