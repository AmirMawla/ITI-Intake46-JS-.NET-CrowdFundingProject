using FluentValidation;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.UserDto;
public class UpdateVendorRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateVendorRequestValidator()
    {
        RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Full name is required")
                .MinimumLength(3).WithMessage("Full name must be at least 3 characters")
                .MaximumLength(100).WithMessage("Full name cannot exceed 100 characters");


        RuleFor(x => x.ProfilePictureUrl)
            .Must(BeValidImage!)
            .When(x => x.ProfilePictureUrl != null)
            .WithMessage("Invalid profile image format. Only .jpg, .jpeg, .png are allowed.");

    }

    private bool BeValidImage(IFormFile file)
    {
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
        var extension = Path.GetExtension(file.FileName).ToLower();
        return allowedExtensions.Contains(extension);
    }
}
