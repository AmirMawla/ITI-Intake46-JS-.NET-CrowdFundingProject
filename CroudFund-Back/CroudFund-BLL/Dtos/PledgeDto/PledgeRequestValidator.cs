using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.PledgeDto;

public class PledgeRequestValidator :AbstractValidator<PledgeRequest>
{
    public PledgeRequestValidator()
    {
        RuleFor(x => x.Amount)
            .NotEmpty().WithMessage("Pledge amount is required")
           .GreaterThan(0).WithMessage("Pledge amount must be greater than zero");
        RuleFor(x => x.PaymentMethodId)
           .NotEmpty().WithMessage("Payment method is required");
    }
}
