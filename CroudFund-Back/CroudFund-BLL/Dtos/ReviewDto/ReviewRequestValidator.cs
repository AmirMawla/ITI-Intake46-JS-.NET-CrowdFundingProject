using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.ReviewDto
{
    public class ReviewRequestValidator : AbstractValidator<ReviewRequest>
    {
        public ReviewRequestValidator()
        {

            RuleFor(x => x.Comment)
                 .NotEmpty().WithMessage("Comment is required")
                 .MinimumLength(3).WithMessage("Comment must be at least 3 characters")
                 .MaximumLength(500).WithMessage("Comment cannot exceed 500 characters");

            RuleFor(x => x.Reaction)
                .IsInEnum().When(x => x.Reaction.HasValue)
                .WithMessage("Invalid reaction type");
        }
    }
}
