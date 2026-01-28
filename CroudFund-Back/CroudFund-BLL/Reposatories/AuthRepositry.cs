using Mapster;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Authentication;
using CroudFund_BLL.Dtos.AuthenticationDto;
using CroudFund_BLL.Dtos.UserDto;
using CroudFund_BLL.Errors;
using CroudFund_BLL.Interfaces;
using CroudFund_DAL.Data;
using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using CroudFund_BLL.Interfaces;

namespace CroudFund_BLL.Reposatories
{
    public class AuthRepositry(
        UserManager<ApplicationUser> userManager
        , IJwtProvider jwtProvider
        , SignInManager<ApplicationUser> signInManager
        , AppDbContext context) : IAuthRepositry
    {
        private readonly UserManager<ApplicationUser> _userManager = userManager;
        private readonly IJwtProvider _jwtProvider = jwtProvider;
        private readonly SignInManager<ApplicationUser> _signInManager = signInManager;
        private readonly AppDbContext _context = context;
        private readonly int _refreshTokenExpiryDays = 14;

        public async Task<Result<AuthResponse>> GetTokenAsync(string email, string password, CancellationToken cancellation)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
                return Result.Failure<AuthResponse>(UserErrors.InvalidCredentials);

            if (!user.IsActive)
                return Result.Failure<AuthResponse>(UserErrors.NotApproved);

            var isValidPassword = await _userManager.CheckPasswordAsync(user, password);

            if (!isValidPassword)
                return Result.Failure<AuthResponse>(UserErrors.InvalidCredentials);


            var roles = await _userManager.GetRolesAsync(user);

            var (token, expiresIn) = _jwtProvider.GenerateToken(user, roles);

            var refreshToken = GenerateRefreshToken();

            var refreshTokenExpirationDate = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays);

            user.RefreshTokens.Add(
                new RefreshToken
                {
                    Token = refreshToken,
                    ExpiresOn = refreshTokenExpirationDate
                }
                );

            await _userManager.UpdateAsync(user);

            var response = new AuthResponse(user.Id, user.Email,user.FullName, token, expiresIn, refreshToken, refreshTokenExpirationDate)
            {
                Roles = roles.ToList()
            };

            return Result.Success(response);
        }

        public async Task<Result<AuthResponse>> GetRefreshTokenAsync(string token, string refreshToken, CancellationToken cancellation = default)
        {
            var userId = _jwtProvider.ValidateToken(token);

            if (userId is null)
                return Result.Failure<AuthResponse>(UserErrors.InvalidCredentials);


            var user = await _userManager.FindByIdAsync(userId);

            if (user is null)
                return Result.Failure<AuthResponse>(UserErrors.InvalidCredentials);


            if (!user.IsActive)
                return Result.Failure<AuthResponse>(UserErrors.NotApproved);


            var userRefreshToken = user.RefreshTokens.SingleOrDefault(x => x.Token == refreshToken && x.IsActive);

            if (userRefreshToken is null)
                return Result.Failure<AuthResponse>(UserErrors.InvalidRefreshToken);


            userRefreshToken.RevokedOn = DateTime.UtcNow;

            var roles = await _userManager.GetRolesAsync(user);

            var (newToken, expiresIn) = _jwtProvider.GenerateToken(user, roles);

            var newRefreshToken = GenerateRefreshToken();

            var refreshTokenExpirationDate = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays);

            user.RefreshTokens.Add(
                new RefreshToken
                {
                    Token = newRefreshToken,
                    ExpiresOn = refreshTokenExpirationDate
                }
                );

            await _userManager.UpdateAsync(user);

            var response = new AuthResponse(user.Id, user.Email, user.FullName, newToken, expiresIn, newRefreshToken, refreshTokenExpirationDate)
            {
                Roles = roles.ToList()
            };

            return Result.Success(response);
        }

        public async Task<Result> RevokeRefreshTokenAsync(string token, string refreshToken, CancellationToken cancellation = default)
        {
            var userId = _jwtProvider.ValidateToken(token);

            if (userId is null)
                return Result.Failure(UserErrors.InvalidCredentials);

            var user = await _userManager.FindByIdAsync(userId);

            if (user is null)
                return Result.Failure(UserErrors.InvalidCredentials);

            var userRefreshToken = user.RefreshTokens.SingleOrDefault(x => x.Token == refreshToken && x.IsActive);

            if (userRefreshToken is null)
                return Result.Failure(UserErrors.InvalidRefreshToken);

            userRefreshToken.RevokedOn = DateTime.UtcNow;

            await _userManager.UpdateAsync(user);

            return Result.Success();
        }
        public async Task<Result> RegisterAsync(RegisterationRequest request, CancellationToken cancellationToken = default)
        {
            if (await _userManager.Users.AnyAsync(x => x.Email == request.Email, cancellationToken))
                return Result.Failure(UserErrors.DuplicatedEmail);

            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var user = new ApplicationUser
                {
                    UserName = request.Email,
                    Email = request.Email,
                    FullName = request.FullName ,
                    // Static image paths
                    ProfileImage = "wwwroot/images/users/0684456b-aa2b-4631-86f7-93ceaf33303c.jpg",
                    IsActive = true // user starts as  approved
                };
                var result = await _userManager.CreateAsync(user, request.Password);

                if (!result.Succeeded)
                {
                    var error = result.Errors.First();

                    return Result.Failure(new Error(error.Code, error.Description, StatusCodes.Status400BadRequest));
                }

                await _userManager.AddToRoleAsync(user, "User");

                await _context.SaveChangesAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return Result.Success();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result.Failure(new Error("TransactionError", ex.Message, StatusCodes.Status500InternalServerError));
            }
        }



        public async Task<Result> LogOutAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return Result.Failure(new Error("Invalid User", "User not found", StatusCodes.Status404NotFound));

            // Revoke user's refresh tokens or perform any other cleanup
            var userTokens = await _context.UserTokens
                .Where(t => t.UserId == userId)
                .ToListAsync();

            _context.UserTokens.RemoveRange(userTokens);
            await _context.SaveChangesAsync();

            return Result.Success();
        }

        private static string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        }

    }
}
