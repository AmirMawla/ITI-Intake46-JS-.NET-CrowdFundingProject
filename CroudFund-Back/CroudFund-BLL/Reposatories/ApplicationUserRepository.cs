using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.Common;
using CroudFund_BLL.Dtos.UserDto;
using CroudFund_BLL.Errors;
using CroudFund_BLL.Interfaces;
using CroudFund_BLL.Reposatories;
using CroudFund_DAL.Data;
using CroudFund_DAL.Entities;
using CroudFund_DAL.Entities;
using Mapster;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceProvider_BLL.Reposatories;
using System;
using System.Collections.Generic;
using System.Linq.Dynamic.Core;
using System.Numerics;
using System.Text;

namespace CroudFund_BLL.Reposatories;

public class ApplicationUserRepository : BaseRepository<ApplicationUser> , IApplicationUserRepository
{
    private readonly AppDbContext _appDbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IWebHostEnvironment _env;
    public ApplicationUserRepository(AppDbContext appDbContext , UserManager<ApplicationUser> userManager , IWebHostEnvironment env) : base(appDbContext)
    {
        _appDbContext = appDbContext;
        _userManager = userManager;
        _env = env;
    }

    public async Task<Result> DeleteUser(string userId, string currentUserId, CancellationToken cancellationToken = default)
    {
        // Check if trying to delete self
        if (userId == currentUserId)
            return Result.Failure(UserErrors.CannotDeleteSelf);

        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
            return Result.Failure(UserErrors.NotFound);

        if (await _userManager.IsInRoleAsync(user, "Admin"))
            return Result.Failure(UserErrors.AdminCannotBeDeleted);

        var result = await _userManager.DeleteAsync(user);

        if (!result.Succeeded)
            return Result.Failure(UserErrors.DeleteFailed);

        await _appDbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result<PaginatedList<UserResponse>>> GetAllActiveUsers( string userId  ,RequestFilter request, CancellationToken cancellationToken = default)
    {
        var adminRoleId = await _appDbContext.Roles
                .Where(r => r.Name == "Admin")
                .Select(r => r.Id)
                .FirstOrDefaultAsync(cancellationToken);

        var adminUserIds = adminRoleId != null
            ? await _appDbContext.UserRoles
                .Where(ur => ur.RoleId == adminRoleId)
                .Select(ur => ur.UserId)
                .ToListAsync(cancellationToken)
            : new List<string>();

        var query = _appDbContext.Users
            .Where(u => u.IsActive && !adminUserIds.Contains(u.Id) && u.Id != userId) // Exclude admin users
            .AsNoTracking();

        if (!query.Any())
            return Result.Failure<PaginatedList<UserResponse>>(UserErrors.NotFound);

        if (request.Status.HasValue)
        {
            query = query.Where(u => u.IsActive == request.Status.Value);
        }

        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(x =>
                EF.Functions.Like(x.FullName.ToLower(), searchTerm) ||
                    EF.Functions.Like(x.Email.ToLower(), searchTerm)
            );
        }


        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.CreatedAt.HasValue && x.CreatedAt.Value.Date == filterDate.Date);
        }


        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection}");
        }

        var source = query.Select(u => new UserResponse(
               u.Id,
               u.FullName,
               u.Email,
               u.ProfileImage,
               _appDbContext.Pledges!
           .Where(r => r.UserId == u.Id && r.Payment.Status == PaymentStatus.Success)
           .Sum(r => r.Amount),
        _appDbContext.Pledges!
           .Where(r => r.UserId == u.Id && r.Payment.Status == PaymentStatus.Success)
           .Count(),
            _appDbContext.Pledges!
           .Where(r => r.Campaign.UserId == u.Id && r.Payment.Status == PaymentStatus.Success)
           .Sum(r => r.Amount),
               _appDbContext.Pledges!
           .Where(r => r.Campaign.UserId == u.Id && r.Payment.Status == PaymentStatus.Success)
                   .Count(),
               u.IsActive
           ));



        var users = await PaginatedList<UserResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        return Result.Success(users);
    }

    public async Task<Result<PaginatedList<UserResponse>>> GetAllUsers(RequestFilter request, CancellationToken cancellationToken = default)
    {
        var adminRoleId = await _appDbContext.Roles
                .Where(r => r.Name == "Admin")
                .Select(r => r.Id)
                .FirstOrDefaultAsync(cancellationToken);

        var adminUserIds = adminRoleId != null
            ? await _appDbContext.UserRoles
                .Where(ur => ur.RoleId == adminRoleId)
                .Select(ur => ur.UserId)
                .ToListAsync(cancellationToken)
            : new List<string>();

        var query = _appDbContext.Users
            .Where(u => !adminUserIds.Contains(u.Id)) // Exclude admin users
            .AsNoTracking();

        if (!query.Any())
            return Result.Failure<PaginatedList<UserResponse>>(UserErrors.NotFound);

        if (request.Status.HasValue)
        {
            query = query.Where(u => u.IsActive == request.Status.Value);
        }

        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(x =>
                EF.Functions.Like(x.FullName.ToLower(), searchTerm) ||
                    EF.Functions.Like(x.Email.ToLower(), searchTerm)
            );
        }


        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.CreatedAt.HasValue && x.CreatedAt.Value.Date == filterDate.Date);
        }


        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection}");
        }

        var source = query.Select(u => new UserResponse(
               u.Id,
               u.FullName,
               u.Email,
               u.ProfileImage,
               _appDbContext.Pledges!
           .Where(r => r.UserId == u.Id && r.Payment.Status == PaymentStatus.Success)
           .Sum(r => r.Amount),
        _appDbContext.Pledges!
           .Where(r => r.UserId == u.Id && r.Payment.Status == PaymentStatus.Success)
           .Count(),
            _appDbContext.Pledges!
           .Where(r => r.Campaign.UserId == u.Id && r.Payment.Status == PaymentStatus.Success)
           .Sum(r => r.Amount),
               _appDbContext.Pledges!
           .Where(r => r.Campaign.UserId == u.Id && r.Payment.Status == PaymentStatus.Success)
                   .Count(),
               u.IsActive
           ));



        var users = await PaginatedList<UserResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        return Result.Success(users);
    }

    public async Task<Result<UserResponse>> GetUserDetails(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _appDbContext.Users.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);

        if (user == null)
            return Result.Failure<UserResponse>(UserErrors.NotFound);

        var HowMuchDonete = _appDbContext.Pledges!
           .Where(r => r.UserId == userId && r.Payment.Status == PaymentStatus.Success)
           .Sum(r => r.Amount);

        var HowManyDonete = _appDbContext.Pledges!
           .Where(r => r.UserId == userId && r.Payment.Status == PaymentStatus.Success)
           .Count();

        var HowMuchheDonated = _appDbContext.Pledges!
           .Where(r => r.Campaign.UserId == userId && r.Payment.Status == PaymentStatus.Success)
           .Sum(r => r.Amount);

        var HowManyheDonated = _appDbContext.Pledges!
           .Where(r => r.Campaign.UserId == userId && r.Payment.Status == PaymentStatus.Success)
           .Count();

        var UserDetails = new UserResponse(
            userId,
            user.FullName,
            user.Email!,
            user.ProfileImage,
            HowMuchDonete,
            HowManyDonete,
            HowMuchheDonated,
            HowManyheDonated,
            user.IsActive
        );

        return Result.Success(UserDetails);
    }

    public async Task<Result> UpdateUser(string userId, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
            return Result.Failure(UserErrors.NotFound);

        if (await _userManager.IsInRoleAsync(user, "Admin"))
            return Result.Failure(UserErrors.AdminCannotBeUpdated);

        if (!string.IsNullOrWhiteSpace(request.FullName))
            user.FullName = request.FullName;


        string? ProfileimagePath = null;
        if (request.ProfilePictureUrl != null)
        {
            var uploadsFolder = Path.Combine(_env.WebRootPath, "images/users");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{request.ProfilePictureUrl.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await request.ProfilePictureUrl.CopyToAsync(stream);

            ProfileimagePath = $"/images/users/{uniqueFileName}";
            user.ProfileImage = ProfileimagePath;
        }

        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
            return Result.Failure(UserErrors.UpdateFailed);

        await _appDbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result> UpdateUserActivity(string userId, string currentUserId, CancellationToken cancellationToken = default)
    {
        // Check if trying to deactivate self
        if (userId == currentUserId)
            return Result.Failure(UserErrors.CannotDeactivateSelf);

        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
            return Result.Failure(UserErrors.NotFound);


        if (await _userManager.IsInRoleAsync(user, "Admin"))
            return Result.Failure(UserErrors.AdminCannotBeUpdated);

        // Check if user is admin
        var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
        if (isAdmin)
            return Result.Failure(UserErrors.AdminCannotBeDeactivated);

        user.IsActive = !user.IsActive;

        var result = await _userManager.UpdateAsync(user);


        if (!result.Succeeded)
            return Result.Failure(UserErrors.UpdateFailed);

        await _appDbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }


    public async Task<Result> ChangePasswordAsync(string userId, ChangeUserPasswordRequest request)
    {

        var user = await _userManager.FindByIdAsync(userId);
        var result = await _userManager.ChangePasswordAsync(user!, request.CurrentPassword, request.NewPassword);
        if (result.Succeeded)
            return Result.Success();

        var error = result.Errors.First();

        return Result.Failure(new Error(error.Code, error.Description, StatusCodes.Status400BadRequest));
    }
}
