using Microsoft.AspNetCore.Http;
using CroudFund_BLL.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Errors
{
    public static class UserErrors
    {
        public static readonly Error NotFound = new("Not Found", "no users found", StatusCodes.Status404NotFound);
        public static readonly Error UserNotFound = new("Not Found", "no users found", StatusCodes.Status404NotFound);
        public static readonly Error InvalidCredentials = new("user.InvalidCredentials", "Invalid Email/Password", StatusCodes.Status400BadRequest);
        public static readonly Error DuplicatedEmail = new("user.DuplicatedEmail", "Email already exisit", StatusCodes.Status409Conflict);
        public static readonly Error NotApproved = new("user.NotApproved", "Your account is pending admin approval.", StatusCodes.Status401Unauthorized);
        public static readonly Error EmailNotConfirmed = new("user.EmailNotConfirmed", "Your account is pending admin to confirm your email before logging in.", StatusCodes.Status401Unauthorized);
        public static readonly Error InvalidRefreshToken = new("user.InvalidRefreshToken", "Invalid Refresh Token", StatusCodes.Status400BadRequest);
        public static readonly Error UpdateFailed = new("User.UpdateFailed", "Failed to update user.", 400);
        public static readonly Error DeleteFailed = new("User.DeleteFailed", "Failed to delete user.", 400);
        public static readonly Error CannotDeleteSelf = new("User.CannotDeleteSelf", "You cannot delete your own account.", 400);
        public static readonly Error CannotDeactivateSelf = new("User.CannotDeactivateSelf", "You cannot deactivate your own account.", 400);
        public static readonly Error AdminCannotBeDeactivated = new("User.AdminCannotBeDeactivated", "Admin users cannot be deactivated.", 400);
        public static readonly Error AdminCannotBeUpdated = new("User.AdminCannotBeUpdated", "Admin users cannot be Updated.", 400);
        public static readonly Error AdminCannotBeDeleted = new("User.AdminCannotBeDeleted", "Admin users cannot be Deleted.", 400);

    }
}
