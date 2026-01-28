using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.CampaignDto;

public class UpdateCampaignRequestValidator : AbstractValidator<UpdateCampaignRequest>
{
    public UpdateCampaignRequestValidator()
    {
        RuleFor(x => x.Title)
               .NotEmpty().WithMessage("Title is required")
               .MinimumLength(3).WithMessage("Title must be at least 3 characters")
               .MaximumLength(200).WithMessage("Title cannot exceed 200 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MinimumLength(10).WithMessage("Description must be at least 10 characters")
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");

        RuleFor(x => x.GoalAmount)
            .GreaterThan(0).WithMessage("Goal amount must be greater than 0");

        RuleFor(x => x.Deadline)
            .GreaterThan(DateTime.UtcNow).WithMessage("Deadline must be in the future");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Category is required");
    }
}
