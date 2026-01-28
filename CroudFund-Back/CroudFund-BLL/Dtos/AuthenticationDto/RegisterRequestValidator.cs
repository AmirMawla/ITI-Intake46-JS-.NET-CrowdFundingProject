using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.AuthenticationDto
{
    public class RegisterRequestValidator : AbstractValidator<RegisterationRequest>
    {
        public RegisterRequestValidator() 
        {
            RuleFor(x => x.Email)
                .NotEmpty()
                .EmailAddress();

            RuleFor(x => x.Password)
               .NotEmpty()
               .Matches("(?=(.*[0-9]))(?=.*[\\!@#$%^&*()\\\\[\\]{}\\-_+=~`|:;\"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{8,}")
               .WithMessage("Password should be at least 8 digits and should contains Lowercase, NonAlphanumeric and Uppercase");

            RuleFor(x => x.FullName)
               .NotEmpty()
               .Length(3, 100);


            //RuleFor(x => x.SubCategoryIds)
            //    .Must(x => x.Distinct().Count() == x.Count)
            //    .WithMessage("You can't add duplicated subcategories ")
            //    .When(x => x.SubCategoryIds != null);
        }
    }
}
