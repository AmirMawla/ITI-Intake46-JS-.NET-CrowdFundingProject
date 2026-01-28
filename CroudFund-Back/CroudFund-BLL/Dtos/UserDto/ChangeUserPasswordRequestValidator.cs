using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.UserDto
{
    public class ChangeUserPasswordRequestValidator : AbstractValidator<ChangeUserPasswordRequest>
    {
        public ChangeUserPasswordRequestValidator()
        {
            RuleFor(x => x.CurrentPassword).NotEmpty();

            RuleFor(x => x.NewPassword)
                .NotEmpty()
               .Matches("(?=(.*[0-9]))(?=.*[\\!@#$%^&*()\\\\[\\]{}\\-_+=~`|:;\"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{8,}")
               .WithMessage("Password should be at least 8 digits and should contains Lowercase, NonAlphanumeric and Uppercase")
               .NotEqual(x => x.CurrentPassword)
               .WithMessage("New Password cannot be the same as current password");
        }
    }
}
